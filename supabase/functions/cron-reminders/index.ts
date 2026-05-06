// ══════════════════════════════════════════════════════════
// Supabase Edge Function : cron-reminders (V2)
// Invoqué toutes les 1 minute par pg_cron (via pg_net HTTP POST).
//
// 3 scans :
//   1. PATIENTS (V1) : events avec patient_id NOT NULL commençant dans 9-10 min
//      → push au patient concerné.
//   2. CONSULTATIONS PERSO (V2) : events avec patient_id IS NULL ET cree_par IS NOT NULL
//      commençant dans 9-10 min → push au créateur (profile_id = cree_par).
//   3. GROUPES A/B (V2) : créneaux du planning thérapeutique commençant dans 9-10 min
//      (en heure Europe/Paris) → push à chaque animateur désigné dans groupe_animateurs
//      ET à tous les patients hospitalisés abonnés aux push (sauf exclusions du jour).
//      Skipped si le groupe est annulé dans groupe_modifications pour la date du jour.
//
// Anti-doublon :
//   • Scans 1 et 2 : table push_reminders_sent (clé evenement_id).
//   • Scan 3 : table push_reminders_sent_groupe — clé XOR (slug+date+heure+profile_id)
//     ou (slug+date+heure+patient_id). Migration v36 (CHECK + 2 UNIQUE partiels).
//
// Planning A/B dupliqué en TS ci-dessous (copie de shared/planning-groupes.js).
// TODO priorité basse (CLAUDE.md) : migrer le planning vers une table Supabase.
//
// Secrets requis :
//   CRON_SECRET — chaîne aléatoire partagée avec pg_cron pour sécuriser l'invocation.
// ══════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Planning A/B (copie minimale côté Edge Function) ──
interface GroupeAB {
  jour: number;    // 0=dim, 1=lun, ..., 5=ven
  slug: string;
  nom: string;
  debut: string | null;  // "HH:MM" en heure locale Europe/Paris
}

const PLANNING_A: GroupeAB[] = [
  { jour: 1, slug: 'psychoeducation-a', nom: 'Atelier Psychoéducation', debut: '14:00' },
  { jour: 2, slug: 'craving-rrd', nom: 'Craving et réduction des risques et dommages', debut: '14:30' },
  { jour: 3, slug: 'tabac-pick-klop', nom: 'Tabac Pick-Klop', debut: '11:30' },
  { jour: 3, slug: 'gestion-emotions-a', nom: 'Gestion des émotions', debut: '15:00' },
  { jour: 4, slug: 'therapies-complementaires', nom: 'Séances Thérapies Complémentaires', debut: null },
  { jour: 5, slug: 'strategies-comportementales', nom: 'Stratégies comportementales', debut: '11:30' },
  { jour: 5, slug: 'prevention-rechute', nom: 'Prévention de la rechute', debut: '15:30' },
];

const PLANNING_B: GroupeAB[] = [
  { jour: 1, slug: 'psychoeducation-b', nom: 'Psychoéducation / Stratégies cognitives', debut: '14:00' },
  { jour: 2, slug: 'craving-rrd', nom: 'Craving et réduction des risques et dommages', debut: '14:30' },
  { jour: 3, slug: 'tabac-jeu-oie', nom: 'Tabac Jeu de l\'Oie', debut: '11:30' },
  { jour: 3, slug: 'gestion-emotions-b', nom: 'Gestion des émotions – ACARA', debut: '15:00' },
  { jour: 4, slug: 'therapies-complementaires', nom: 'Séances Thérapies Complémentaires', debut: null },
  { jour: 5, slug: 'relaxation-sophrologie', nom: 'Séances Relaxation Sophrologie', debut: '11:30' },
  { jour: 5, slug: 'prevention-rechute', nom: 'Prévention de la rechute', debut: '15:30' },
];

// ── Helpers TZ Europe/Paris ──
function parisNowParts(): { dateStr: string; minutes: number; dayOfWeek: number } {
  const d = new Date();
  // "YYYY-MM-DD" en Paris
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(d);
  // "HH:MM" en Paris (format 24h)
  const timeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(d);
  const [h, m] = timeStr.split(':').map(Number);
  // Jour de semaine en Paris (Sun=0, Mon=1, ...)
  const wd = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris', weekday: 'short'
  }).format(d);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { dateStr, minutes: h * 60 + m, dayOfWeek: map[wd] ?? 1 };
}

function getWeekTypeFromStr(dateStr: string): 'A' | 'B' {
  const [y, m, d] = dateStr.split('-').map(Number);
  // ISO 8601 : le jeudi de la semaine détermine son numéro
  const tmp = new Date(Date.UTC(y, m - 1, d));
  const dayISO = ((tmp.getUTCDay() + 6) % 7) + 1; // 1=lun … 7=dim
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayISO);
  const week1 = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4));
  const w1DayISO = ((week1.getUTCDay() + 6) % 7) + 1;
  week1.setUTCDate(week1.getUTCDate() + 4 - w1DayISO);
  const weekNum = 1 + Math.round((tmp.getTime() - week1.getTime()) / (7 * 86400000));
  return (weekNum % 2 === 0) ? 'A' : 'B';
}

function parseHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// ── Handler ──
Deno.serve(async (req) => {
  const expected = Deno.env.get('CRON_SECRET') || '';
  const got = req.headers.get('X-Cron-Secret') || '';
  if (!expected || got !== expected) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  const sendPushUrl = (Deno.env.get('SUPABASE_URL') || '') + '/functions/v1/send-push';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  const stats = { patients: 0, perso: 0, groupes: 0, failed: 0 };

  const now = new Date();
  const in9 = new Date(now.getTime() + 9 * 60_000).toISOString();
  const in10 = new Date(now.getTime() + 10 * 60_000).toISOString();

  // ─── SCAN 1 + 2 : événements patients et consultations perso ───
  // On scanne tous les events dans la fenêtre [now+4min, now+5min], puis on tri
  // entre "patient" (patient_id non null) et "perso" (patient_id null + cree_par).
  try {
    const { data: events, error } = await supabase
      .from('evenements')
      .select('id, patient_id, cree_par, titre, description, type, date_heure, lieu')
      .gte('date_heure', in9)
      .lte('date_heure', in10);
    if (error) throw error;

    if (events && events.length) {
      const eventIds = events.map(e => e.id);
      const { data: alreadySent } = await supabase
        .from('push_reminders_sent')
        .select('evenement_id')
        .in('evenement_id', eventIds);
      const sentIds = new Set((alreadySent || []).map(r => r.evenement_id));

      for (const evt of events.filter(e => !sentIds.has(e.id))) {
        const heure = new Date(evt.date_heure).toLocaleTimeString('fr-FR', {
          hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris'
        });
        let body: any;
        if (evt.patient_id) {
          body = {
            patient_id: evt.patient_id,
            title: '⏰ Rappel : ' + evt.titre,
            body: 'Dans 10 min (' + heure + ')' + (evt.lieu ? ' — ' + evt.lieu : ''),
            url: '/patient/',
            tag: 'reminder-' + evt.id
          };
        } else if (evt.cree_par) {
          body = {
            profile_id: evt.cree_par,
            title: '⏰ ' + evt.titre,
            body: 'Dans 10 min (' + heure + ')' + (evt.lieu ? ' — ' + evt.lieu : ''),
            url: '/admin/',
            tag: 'reminder-' + evt.id
          };
        } else {
          continue; // Event orphelin, on skip
        }

        try {
          const resp = await fetch(sendPushUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
            body: JSON.stringify(body)
          });
          if (resp.ok) {
            await supabase.from('push_reminders_sent').insert({ evenement_id: evt.id });
            if (evt.patient_id) stats.patients++; else stats.perso++;
          } else {
            stats.failed++;
          }
        } catch (e) {
          console.error('Event reminder error:', e);
          stats.failed++;
        }
      }
    }
  } catch (e) {
    console.error('Scan events error:', e);
  }

  // ─── SCAN 3 : groupes A/B (aux animateurs) ───
  try {
    const paris = parisNowParts();
    const week = getWeekTypeFromStr(paris.dateStr);
    const planning = week === 'A' ? PLANNING_A : PLANNING_B;

    // Candidats : groupes d'aujourd'hui avec début dans [now+9, now+10] minutes
    const targetMin = paris.minutes + 9; // on déclenche entre +9 et +10 min (inclusif à +10)
    const targetMax = paris.minutes + 10;

    const candidates = planning.filter(g => {
      if (g.jour !== paris.dayOfWeek) return false;
      if (!g.debut) return false;
      // On prend en compte d'éventuelles nouvelles_heure depuis groupe_modifications (fait plus bas)
      const mins = parseHHMM(g.debut);
      return mins >= targetMin && mins <= targetMax;
    });

    if (candidates.length) {
      // Charge les modifs du jour pour les slugs candidats
      const slugs = candidates.map(c => c.slug);
      const { data: mods } = await supabase
        .from('groupe_modifications')
        .select('groupe_slug, annule, nouvelle_heure')
        .eq('date_effet', paris.dateStr)
        .in('groupe_slug', slugs);
      const modMap = new Map<string, { annule: boolean; nouvelle_heure: string | null }>();
      (mods || []).forEach(m => modMap.set(m.groupe_slug, { annule: !!m.annule, nouvelle_heure: m.nouvelle_heure }));

      // Pour chaque candidat non annulé dont l'heure effective est toujours dans la fenêtre
      const effective = candidates.filter(g => {
        const mod = modMap.get(g.slug);
        if (mod?.annule) return false;
        const effHeure = mod?.nouvelle_heure || g.debut!;
        const mins = parseHHMM(effHeure);
        return mins >= targetMin && mins <= targetMax;
      });

      if (effective.length) {
        // ── 3a. Animateurs ──
        // Charge les animateurs pour ces slugs
        const { data: anims } = await supabase
          .from('groupe_animateurs')
          .select('groupe_slug, user_id')
          .in('groupe_slug', effective.map(e => e.slug));

        // Charge la map exclusions (patient IDs) par slug pour ce jour
        const exclusionsBySlug = new Map<string, Set<string>>();
        {
          const { data: modsExcl } = await supabase
            .from('groupe_modifications')
            .select('groupe_slug, exclusions')
            .eq('date_effet', paris.dateStr)
            .in('groupe_slug', effective.map(e => e.slug));
          (modsExcl || []).forEach(m => {
            const arr: string[] = Array.isArray(m.exclusions) ? m.exclusions : [];
            exclusionsBySlug.set(m.groupe_slug, new Set(arr));
          });
        }

        // Anti-doublon : on skip (slug, date, heure, profile_id) déjà envoyés
        const keys = new Set<string>();
        for (const g of effective) {
          const mod = modMap.get(g.slug);
          const effHeure = mod?.nouvelle_heure || g.debut!;
          const slugAnims = (anims || []).filter(a => a.groupe_slug === g.slug);
          for (const a of slugAnims) keys.add(`${g.slug}|${paris.dateStr}|${effHeure}|${a.user_id}`);
        }
        if (keys.size) {
          // Vérif en BDD : qu'est-ce qui a déjà été envoyé ?
          // On prend large puis on filtre côté JS pour éviter un .or() complexe.
          const { data: sentRows } = await supabase
            .from('push_reminders_sent_groupe')
            .select('groupe_slug, date_groupe, heure, profile_id')
            .eq('date_groupe', paris.dateStr)
            .in('groupe_slug', effective.map(e => e.slug));
          const sentKeys = new Set((sentRows || []).map(
            r => `${r.groupe_slug}|${r.date_groupe}|${r.heure}|${r.profile_id}`
          ));

          for (const g of effective) {
            const mod = modMap.get(g.slug);
            const effHeure = mod?.nouvelle_heure || g.debut!;
            const slugAnims = (anims || []).filter(a => a.groupe_slug === g.slug);
            for (const a of slugAnims) {
              const key = `${g.slug}|${paris.dateStr}|${effHeure}|${a.user_id}`;
              if (sentKeys.has(key)) continue;
              try {
                const resp = await fetch(sendPushUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
                  body: JSON.stringify({
                    profile_id: a.user_id,
                    title: '⏰ Groupe : ' + g.nom,
                    body: 'Dans 10 min (' + effHeure + ')',
                    url: '/admin/',
                    tag: 'groupe-' + g.slug + '-' + paris.dateStr
                  })
                });
                if (resp.ok) {
                  await supabase.from('push_reminders_sent_groupe').insert({
                    groupe_slug: g.slug,
                    date_groupe: paris.dateStr,
                    heure: effHeure,
                    profile_id: a.user_id
                  });
                  stats.groupes++;
                } else {
                  stats.failed++;
                }
              } catch (e) {
                console.error('Groupe reminder error:', e);
                stats.failed++;
              }
            }
          }
        }

        // ── 3b. Patients hospitalisés (abonnés aux push) ──
        // On récupère les patient_ids distincts qui ont une subscription active
        const { data: subPatients } = await supabase
          .from('push_subscriptions')
          .select('patient_id')
          .not('patient_id', 'is', null);
        const patientIds = Array.from(new Set((subPatients || []).map(r => r.patient_id))) as string[];

        if (patientIds.length) {
          // Charge les push déjà envoyés aux patients pour ces slugs/aujourd'hui
          const { data: sentPatRows } = await supabase
            .from('push_reminders_sent_groupe')
            .select('groupe_slug, date_groupe, heure, patient_id')
            .eq('date_groupe', paris.dateStr)
            .not('patient_id', 'is', null)
            .in('groupe_slug', effective.map(e => e.slug));
          const sentPatKeys = new Set((sentPatRows || []).map(
            r => `${r.groupe_slug}|${r.date_groupe}|${r.heure}|${r.patient_id}`
          ));

          for (const g of effective) {
            const mod = modMap.get(g.slug);
            const effHeure = mod?.nouvelle_heure || g.debut!;
            const exclus = exclusionsBySlug.get(g.slug) || new Set<string>();
            for (const pid of patientIds) {
              if (exclus.has(pid)) continue; // patient explicitement exclu de ce groupe ce jour
              const key = `${g.slug}|${paris.dateStr}|${effHeure}|${pid}`;
              if (sentPatKeys.has(key)) continue;
              try {
                const resp = await fetch(sendPushUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
                  body: JSON.stringify({
                    patient_id: pid,
                    title: '⏰ Atelier : ' + g.nom,
                    body: 'Dans 10 min (' + effHeure + ')',
                    url: '/patient/',
                    tag: 'atelier-' + g.slug + '-' + paris.dateStr
                  })
                });
                if (resp.ok) {
                  await supabase.from('push_reminders_sent_groupe').insert({
                    groupe_slug: g.slug,
                    date_groupe: paris.dateStr,
                    heure: effHeure,
                    patient_id: pid
                  });
                  stats.groupes++;
                } else {
                  stats.failed++;
                }
              } catch (e) {
                console.error('Patient atelier reminder error:', e);
                stats.failed++;
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Scan groupes error:', e);
  }

  return new Response(JSON.stringify(stats), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});
