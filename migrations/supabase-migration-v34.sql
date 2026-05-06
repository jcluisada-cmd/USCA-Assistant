-- ══════════════════════════════════════════════════════════
-- Migration v34 — Préférences push personnalisées par soignant
-- Date : 2026-05-06
--
-- Ajoute une colonne push_preferences (JSONB) sur profiles pour
-- permettre à chaque soignant de personnaliser :
--   - quels types d'événements il souhaite recevoir
--   - ses propres heures de silence (au-delà des règles globales)
--
-- Sémantique :
--   NULL = utilise les défauts système (= comportement actuel).
--   Schéma attendu :
--     {
--       "events": {
--         "message_patient": true,
--         "permission_demande": true,
--         "alerte_craving": true,
--         "groupe_rappel": true,
--         "rdv_perso": true
--       },
--       "quiet_hours": {
--         "evening_after": 18,   -- heure (Paris) à partir de laquelle silence
--         "weekend": true,       -- silence weekend on/off
--         "ferie": true          -- silence jours fériés on/off
--       }
--     }
--
-- Les règles globales de l'Edge Function send-push (silence semaine
-- 8h30→18h Paris, weekend, fériés) restent appliquées. Les prefs
-- personnelles peuvent durcir mais pas assouplir le silence weekend
-- ou férié (= sécurité par défaut).
--
-- À exécuter dans Supabase → SQL Editor → New query.
-- ══════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_preferences JSONB;

COMMENT ON COLUMN public.profiles.push_preferences IS
  'Préférences push personnalisées (JSONB). NULL = défauts système. Schéma : { events: {...}, quiet_hours: {...} }';
