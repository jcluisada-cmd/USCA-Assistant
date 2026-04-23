// ══════════════════════════════════════════════════════════
// Supabase Edge Function : cron-reminders
// Invoqué toutes les 1 minute par pg_cron (via pg_net HTTP POST).
// Scanne les événements à venir dans 4-5 min et envoie un rappel Push
// au patient concerné.
//
// Anti-doublon : table push_reminders_sent (UNIQUE evenement_id).
//
// Secrets requis (Supabase → Edge Functions → Secrets) :
//   CRON_SECRET  — chaîne aléatoire partagée avec pg_cron pour sécuriser
//                  l'invocation (évite que n'importe qui appelle ce endpoint).
// ══════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Vérification du secret partagé
  const expected = Deno.env.get('CRON_SECRET') || '';
  const got = req.headers.get('X-Cron-Secret') || '';
  if (!expected || got !== expected) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  const now = new Date();
  const in4 = new Date(now.getTime() + 4 * 60_000).toISOString();
  const in5 = new Date(now.getTime() + 5 * 60_000).toISOString();

  // Récupère les événements patients qui commencent dans 4-5 min
  const { data: events, error } = await supabase
    .from('evenements')
    .select('id, patient_id, titre, description, type, date_heure, lieu')
    .not('patient_id', 'is', null)
    .gte('date_heure', in4)
    .lte('date_heure', in5);

  if (error) {
    console.error('Query events error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }

  if (!events || !events.length) {
    return new Response(JSON.stringify({ scanned: 0 }), { status: 200 });
  }

  // Filtre les événements déjà notifiés
  const eventIds = events.map(e => e.id);
  const { data: alreadySent } = await supabase
    .from('push_reminders_sent')
    .select('evenement_id')
    .in('evenement_id', eventIds);

  const sentIds = new Set((alreadySent || []).map(r => r.evenement_id));
  const toNotify = events.filter(e => !sentIds.has(e.id));

  const sendPushUrl = (Deno.env.get('SUPABASE_URL') || '') + '/functions/v1/send-push';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  let sent = 0;
  let failed = 0;
  for (const evt of toNotify) {
    try {
      const heure = new Date(evt.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const resp = await fetch(sendPushUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`
        },
        body: JSON.stringify({
          patient_id: evt.patient_id,
          title: '⏰ Rappel : ' + evt.titre,
          body: 'Dans 5 min (' + heure + ')' + (evt.lieu ? ' — ' + evt.lieu : ''),
          url: '/patient/',
          tag: 'reminder-' + evt.id
        })
      });
      if (resp.ok) {
        await supabase.from('push_reminders_sent').insert({ evenement_id: evt.id });
        sent++;
      } else {
        failed++;
      }
    } catch (e) {
      console.error('Reminder error:', e);
      failed++;
    }
  }

  return new Response(JSON.stringify({ scanned: events.length, sent, failed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});
