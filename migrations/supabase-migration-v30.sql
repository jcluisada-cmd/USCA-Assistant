-- ══════════════════════════════════════════════════════════
-- Migration v30 — Pause notifs push soignant ("vacances")
-- Date : 2026-04-24
--
-- Ajoute une colonne push_pause_until sur profiles pour bloquer
-- temporairement l'envoi de push staff sans désinscrire la sub.
--
-- Sémantique :
--   push_pause_until = '2026-08-10' signifie "en pause jusqu'au
--   10 août inclus, reprise le 11 août". Check côté Edge Function :
--   si today_paris ≤ push_pause_until → skip push pour ce soignant.
--
-- Reprise automatique : aucune action serveur nécessaire, le check
-- se fait à chaque appel de send-push.
--
-- À exécuter dans Supabase → SQL Editor → New query.
-- ══════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_pause_until DATE;

COMMENT ON COLUMN public.profiles.push_pause_until IS
  'Date de fin de pause des notifications push (incluse). NULL = pas de pause. Reprise le lendemain.';
