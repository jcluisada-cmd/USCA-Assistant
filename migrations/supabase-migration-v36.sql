-- ══════════════════════════════════════════════════════════
-- Migration v36 — Push ateliers aux patients hospitalisés
-- Date : 2026-05-06
--
-- Étend la table push_reminders_sent_groupe pour permettre l'anti-doublon
-- côté patient (en plus des animateurs déjà gérés via profile_id).
--
-- Avant : (groupe_slug, date_groupe, heure, profile_id) — uniquement animateurs.
-- Après : profile_id OU patient_id (XOR) → mêmes scans gèrent les deux cibles.
--
-- À exécuter dans Supabase → SQL Editor → New query.
-- ══════════════════════════════════════════════════════════

-- 1. Ajout colonne patient_id (nullable, FK CASCADE)
ALTER TABLE public.push_reminders_sent_groupe
  ADD COLUMN IF NOT EXISTS patient_id UUID NULL
    REFERENCES public.patients(id) ON DELETE CASCADE;

-- 2. profile_id devient nullable (XOR avec patient_id)
ALTER TABLE public.push_reminders_sent_groupe
  ALTER COLUMN profile_id DROP NOT NULL;

-- 3. Drop l'ancien UNIQUE qui ne couvrait que profile_id
ALTER TABLE public.push_reminders_sent_groupe
  DROP CONSTRAINT IF EXISTS push_reminders_sent_groupe_groupe_slug_date_groupe_heure_pr_key;

-- 4. CHECK XOR : exactement un des deux NOT NULL
ALTER TABLE public.push_reminders_sent_groupe
  DROP CONSTRAINT IF EXISTS push_reminders_sent_groupe_xor_target;
ALTER TABLE public.push_reminders_sent_groupe
  ADD CONSTRAINT push_reminders_sent_groupe_xor_target
    CHECK (
      (profile_id IS NOT NULL AND patient_id IS NULL)
      OR (profile_id IS NULL AND patient_id IS NOT NULL)
    );

-- 5. Deux UNIQUE partiels (un par cible)
DROP INDEX IF EXISTS public.push_reminders_sent_groupe_unique_profile;
CREATE UNIQUE INDEX push_reminders_sent_groupe_unique_profile
  ON public.push_reminders_sent_groupe (groupe_slug, date_groupe, heure, profile_id)
  WHERE profile_id IS NOT NULL;

DROP INDEX IF EXISTS public.push_reminders_sent_groupe_unique_patient;
CREATE UNIQUE INDEX push_reminders_sent_groupe_unique_patient
  ON public.push_reminders_sent_groupe (groupe_slug, date_groupe, heure, patient_id)
  WHERE patient_id IS NOT NULL;
