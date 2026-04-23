-- ══════════════════════════════════════════════════════════
-- Migration v27 — Cron de rappel 5 min avant (pg_cron + pg_net)
-- Date : 2026-04-23
-- Active les extensions pg_cron et pg_net puis planifie un job qui
-- appelle l'Edge Function cron-reminders toutes les minutes.
--
-- PRÉREQUIS :
--   1. Edge Function `cron-reminders` déployée (dossier supabase/functions/)
--   2. Edge Function `send-push` déployée avec secrets VAPID_* configurés
--   3. Secret CRON_SECRET configuré sur cron-reminders
--
-- AVANT D'EXÉCUTER CE SCRIPT : remplacer les 2 placeholders ci-dessous :
--   <PROJECT_REF>    → ex: pydxfoqxgvbmknzjzecn
--   <CRON_SECRET>    → la même chaîne que dans les secrets Edge Function
--
-- Pour désactiver/supprimer le cron :
--   SELECT cron.unschedule('usca-push-reminders');
-- ══════════════════════════════════════════════════════════

-- Active les extensions (no-op si déjà activées)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Supprime un schedule existant si re-migration
SELECT cron.unschedule('usca-push-reminders')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'usca-push-reminders');

-- Planifie le job toutes les minutes
SELECT cron.schedule(
  'usca-push-reminders',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/cron-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Cron-Secret', '<CRON_SECRET>'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
  $$
);

-- Vérification :
--   SELECT * FROM cron.job WHERE jobname = 'usca-push-reminders';
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
