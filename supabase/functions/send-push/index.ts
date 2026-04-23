// ══════════════════════════════════════════════════════════
// Supabase Edge Function : send-push
// Envoie une notification Web Push à TOUS les appareils d'un patient.
//
// Payload attendu (POST JSON) :
//   { patient_id: string, title: string, body: string, url?: string, tag?: string }
//
// Secrets requis (Supabase → Edge Functions → Secrets) :
//   VAPID_PRIVATE_KEY  — scalar ECDSA P-256 en base64url (32 bytes)
//   VAPID_PUBLIC_KEY   — point P-256 uncompressed en base64url (65 bytes)
//   VAPID_SUBJECT      — ex: "mailto:jc.luisada@gmail.com"
//
// Headers :
//   Soit le JWT anon de l'app (pour les appels admin depuis le navigateur)
//   Soit la service_role key (pour l'appel cron interne).
// ══════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Helpers base64url ──
function b64urlToUint8Array(b64url: string): Uint8Array {
  const pad = '='.repeat((4 - (b64url.length % 4)) % 4);
  const b64 = (b64url + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function uint8ToB64url(arr: Uint8Array): string {
  let bin = '';
  arr.forEach(b => bin += String.fromCharCode(b));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ── JWT VAPID (ES256) ──
async function signVapidJwt(audience: string, subject: string, privateKeyB64url: string, publicKeyB64url: string): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: subject
  };
  const encoder = new TextEncoder();
  const unsigned = uint8ToB64url(encoder.encode(JSON.stringify(header))) + '.' +
                   uint8ToB64url(encoder.encode(JSON.stringify(payload)));

  // Import clé privée depuis le JWK
  const publicKeyBytes = b64urlToUint8Array(publicKeyB64url);
  // La clé publique raw est 65 bytes : 0x04 | X(32) | Y(32)
  const x = uint8ToB64url(publicKeyBytes.slice(1, 33));
  const y = uint8ToB64url(publicKeyBytes.slice(33, 65));
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x, y,
    d: privateKeyB64url,
    ext: true
  };
  const key = await crypto.subtle.importKey(
    'jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    encoder.encode(unsigned)
  );
  return unsigned + '.' + uint8ToB64url(new Uint8Array(sig));
}

// ── Payload encryption (RFC 8291 aes128gcm) ──
// On n'envoie PAS de payload chiffré : on utilise un push "tickle" sans body,
// et le service worker ouvre un fetch vers Supabase pour récupérer les détails.
// C'est plus simple (pas d'ECDH, pas de HKDF) mais moins informatif hors ligne.
//
// Ici on envoie simplement un push vide, et le SW affiche la notif depuis des
// données stockées localement ou via un fetch. Pour un MVP, on envoie le
// payload en clair (non recommandé en prod mais OK pour un POC interne).
//
// Version améliorée : on encode le payload JSON en clair dans le body POST
// sans chiffrement (navigateurs Chrome/Firefox/Safari l'acceptent sans
// headers d'encryption si Content-Length=0 et le SW déclenche showNotification
// via Push event sans data).
//
// Pour simplicité et compatibilité : on va utiliser la lib web-push via ESM.
// Sinon on fait un push minimal "empty" et le SW fetch les dernières données.

// On utilise l'approche "empty push" + fetch dans le SW pour éviter la crypto.

async function sendEmptyPush(endpoint: string, jwt: string, vapidPublicB64url: string): Promise<Response> {
  return await fetch(endpoint, {
    method: 'POST',
    headers: {
      'TTL': '86400',
      'Urgency': 'high',
      'Authorization': `vapid t=${jwt}, k=${vapidPublicB64url}`
    },
    body: null
  });
}

// ── Handler principal ──
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { patient_id, title, body, url, tag } = await req.json();
    if (!patient_id || !title) {
      return new Response(JSON.stringify({ error: 'patient_id + title requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') || '';
    const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY') || '';
    const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:noreply@usca-connect.fr';
    if (!VAPID_PRIVATE || !VAPID_PUBLIC) {
      return new Response(JSON.stringify({ error: 'VAPID keys manquantes dans les secrets' }), { status: 500 });
    }

    // Client Supabase (service_role via env dans Edge Functions)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Récupère toutes les subs du patient
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('patient_id', patient_id);

    if (error) throw error;
    if (!subs || !subs.length) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no_subscriptions' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Stocke le dernier message dans la table pour que le SW puisse le fetcher
    await supabase.from('push_last_message').upsert({
      patient_id,
      title,
      body: body || '',
      url: url || '/patient/',
      tag: tag || 'default',
      sent_at: new Date().toISOString()
    }, { onConflict: 'patient_id' });

    let sent = 0;
    let failed = 0;
    const deadEndpoints: string[] = [];

    for (const sub of subs) {
      try {
        const endpointUrl = new URL(sub.endpoint);
        const audience = endpointUrl.origin;
        const jwt = await signVapidJwt(audience, VAPID_SUBJECT, VAPID_PRIVATE, VAPID_PUBLIC);
        const resp = await sendEmptyPush(sub.endpoint, jwt, VAPID_PUBLIC);
        if (resp.status === 201 || resp.status === 200 || resp.status === 204) {
          sent++;
        } else if (resp.status === 404 || resp.status === 410) {
          // Subscription expirée → suppression
          deadEndpoints.push(sub.endpoint);
          failed++;
        } else {
          failed++;
          console.warn('Push failed', resp.status, await resp.text());
        }
      } catch (e) {
        console.error('Send push error:', e);
        failed++;
      }
    }

    // Nettoyage des subscriptions mortes
    if (deadEndpoints.length) {
      await supabase.from('push_subscriptions').delete().in('endpoint', deadEndpoints);
    }

    return new Response(JSON.stringify({ sent, failed, total: subs.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    console.error('send-push error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});
