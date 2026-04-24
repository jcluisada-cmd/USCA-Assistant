// ══════════════════════════════════════════════════════════
// Supabase Edge Function : send-push
// Envoie une notification Web Push aux appareils d'un destinataire.
//
// Payload (POST JSON) — 3 modes mutuellement exclusifs :
//   V1 patient :
//     { patient_id: string, title, body?, url?, tag? }
//   V2 soignant unique :
//     { profile_id: string, title, body?, url?, tag? }
//   V2 broadcast soignants (ex: message patient → médecins abonnés) :
//     { profile_ids: string[], title, body?, url?, tag? }
//
// Pour profile_ids, le même body+title est envoyé à tous. Le dernier message
// est stocké dans push_last_message_staff (1 ligne / profile_id) pour que le
// SW puisse le fetcher au moment du push event.
//
// Secrets requis (Supabase → Edge Functions → Secrets) :
//   VAPID_PRIVATE_KEY  — scalar ECDSA P-256 en base64url (32 bytes)
//   VAPID_PUBLIC_KEY   — point P-256 uncompressed en base64url (65 bytes)
//   VAPID_SUBJECT      — ex: "mailto:jc.luisada@gmail.com"
//
// Headers :
//   Soit le JWT anon de l'app (pour les appels depuis le navigateur)
//   Soit la service_role key (pour l'appel cron interne).
// ══════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ══════════════════════════════════════════════════════════
// "Silence soignant" : on bloque les notifs staff hors heures
// ouvrées (en semaine après 16h, weekend, jours fériés).
// Les notifs patients ne sont JAMAIS bloquées par ces règles.
// ══════════════════════════════════════════════════════════

// Jours fériés France (à maintenir année par année).
// Pâques/Ascension/Pentecôte sont variables — calcul non implémenté, on liste.
const FERIES_FR = new Set([
  // 2026
  '2026-01-01', '2026-04-06', '2026-05-01', '2026-05-08', '2026-05-14', '2026-05-25',
  '2026-07-14', '2026-08-15', '2026-11-01', '2026-11-11', '2026-12-25',
  // 2027
  '2027-01-01', '2027-03-29', '2027-05-01', '2027-05-06', '2027-05-08', '2027-05-17',
  '2027-07-14', '2027-08-15', '2027-11-01', '2027-11-11', '2027-12-25',
]);

function isStaffQuietHours(now: Date = new Date()): { quiet: boolean; reason?: string } {
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(now);
  const timeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(now);
  const [hh, mm] = timeStr.split(':').map(Number);
  const minutesSinceMidnight = hh * 60 + mm;
  const wdStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris', weekday: 'short'
  }).format(now);
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const wd = dayMap[wdStr] ?? 1;

  if (wd === 0 || wd === 6) return { quiet: true, reason: 'weekend' };
  if (FERIES_FR.has(dateStr)) return { quiet: true, reason: 'ferie' };
  // Plage ouverte : 8h30 ≤ heure < 16h00 (Paris)
  if (minutesSinceMidnight < 8 * 60 + 30) return { quiet: true, reason: 'before_830' };
  if (minutesSinceMidnight >= 16 * 60) return { quiet: true, reason: 'after_16h' };
  return { quiet: false };
}

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
    const payload = await req.json();
    const { patient_id, profile_id, title, body, url, tag } = payload;
    const profile_ids: string[] | undefined = Array.isArray(payload.profile_ids) ? payload.profile_ids : undefined;

    if (!title) {
      return new Response(JSON.stringify({ error: 'title requis' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }
    // Exactement un des trois doit être fourni
    const modes = [!!patient_id, !!profile_id, !!(profile_ids && profile_ids.length)].filter(Boolean).length;
    if (modes !== 1) {
      return new Response(JSON.stringify({ error: 'fournir exactement un de : patient_id | profile_id | profile_ids' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') || '';
    const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY') || '';
    const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:noreply@usca-connect.fr';
    if (!VAPID_PRIVATE || !VAPID_PUBLIC) {
      return new Response(JSON.stringify({ error: 'VAPID keys manquantes dans les secrets' }), { status: 500 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // ── Silence soignant : bloque les push staff hors heures ouvrables ──
    // Les push patient ne sont jamais bloqués.
    if (!patient_id) {
      const quiet = isStaffQuietHours();
      if (quiet.quiet) {
        return new Response(JSON.stringify({ sent: 0, reason: 'staff_quiet_hours', detail: quiet.reason }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // ── Résolution des subscriptions + écriture du last_message ──
    let subs: any[] = [];
    const defaultUrl = patient_id ? '/patient/' : '/admin/';

    // Pour le mode staff, on filtre en amont les profiles en pause vacances
    // (push_pause_until ≥ today_paris → skip). Cette vérif est portée par
    // l'Edge Function — aucune action serveur n'est nécessaire à la reprise.
    let activeStaffIds: string[] | null = null;
    if (!patient_id) {
      const requestedIds: string[] = profile_ids && profile_ids.length ? profile_ids : [profile_id];
      const { data: profRows, error: profErr } = await supabase
        .from('profiles').select('id, push_pause_until').in('id', requestedIds);
      if (profErr) throw profErr;
      const todayParis = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(new Date());
      activeStaffIds = (profRows || [])
        .filter(p => !p.push_pause_until || String(p.push_pause_until) < todayParis)
        .map(p => p.id);
      if (!activeStaffIds.length) {
        return new Response(JSON.stringify({ sent: 0, reason: 'all_on_vacation' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    if (patient_id) {
      const { data, error } = await supabase
        .from('push_subscriptions').select('*').eq('patient_id', patient_id);
      if (error) throw error;
      subs = data || [];
      if (subs.length) {
        await supabase.from('push_last_message').upsert({
          patient_id, title, body: body || '', url: url || defaultUrl,
          tag: tag || 'default', sent_at: new Date().toISOString()
        }, { onConflict: 'patient_id' });
      }
    } else {
      const targetIds = activeStaffIds!; // déjà filtrés plus haut (non vide)
      const { data, error } = await supabase
        .from('push_subscriptions').select('*').in('profile_id', targetIds);
      if (error) throw error;
      subs = data || [];
      if (subs.length) {
        // Une ligne last_message_staff par profile_id destinataire (upsert par profile_id)
        const rows = targetIds.map(pid => ({
          profile_id: pid, title, body: body || '', url: url || defaultUrl,
          tag: tag || 'default', sent_at: new Date().toISOString()
        }));
        await supabase.from('push_last_message_staff').upsert(rows, { onConflict: 'profile_id' });
      }
    }

    if (!subs.length) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no_subscriptions' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // ── Envoi push à chaque endpoint ──
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
