-- ══════════════════════════════════════════════════════════
-- Migration v33 -- Fiches substances poussées au patient
-- Date : 2026-05-04
--
-- Objectif : permettre à l'équipe de pousser au patient des
-- fiches d'information sur les substances (16 fiches HTML
-- dans /fiches-substances/), sur le même modèle que les
-- prescriptions de fiches traitements (table `prescriptions`,
-- migration v3) — mais avec une table dédiée pour ne pas
-- mélanger les sémantiques (un traitement = ce qu'on prescrit
-- pour aller mieux ; une substance = ce qui motive la prise
-- en charge addicto).
--
-- 1. Table substances_patient (PK id, UNIQUE patient_id+slug)
-- 2. Index sur patient_id (lecture côté patient)
-- 3. RLS calquée sur prescriptions :
--    - SELECT public (le patient anon doit voir ses fiches)
--    - INSERT/DELETE réservés authenticated (soignants)
--
-- À exécuter dans Supabase -> SQL Editor -> New query.
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.substances_patient (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  fiche_slug TEXT NOT NULL,
  partage_par UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(patient_id, fiche_slug)
);

CREATE INDEX IF NOT EXISTS idx_substances_patient_patient
  ON public.substances_patient(patient_id);

ALTER TABLE public.substances_patient ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "substances_patient_select_all" ON public.substances_patient;
CREATE POLICY "substances_patient_select_all"
  ON public.substances_patient
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "substances_patient_insert_auth" ON public.substances_patient;
CREATE POLICY "substances_patient_insert_auth"
  ON public.substances_patient
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "substances_patient_delete_auth" ON public.substances_patient;
CREATE POLICY "substances_patient_delete_auth"
  ON public.substances_patient
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ──────────────────────────────────────────────────────────
-- Vérification (à exécuter après le RUN)
-- ──────────────────────────────────────────────────────────
-- SELECT polname, polcmd FROM pg_policy
-- WHERE polrelid = 'public.substances_patient'::regclass
-- ORDER BY polname;
