-- ══════════════════════════════════════════════════════════
-- Migration v28 — Sexe du patient (label inclusif Patient·e)
-- Date : 2026-04-24
-- Ajoute une colonne optionnelle pour afficher "Patient / Patiente / Patient·e"
-- à la place de "Chambre N" dans l'UI soignant. Pas de valeur par défaut :
-- les patients existants restent NULL (→ label "Patient·e").
-- À exécuter dans Supabase → SQL Editor → New query.
-- ══════════════════════════════════════════════════════════

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS sexe TEXT
  CHECK (sexe IS NULL OR sexe IN ('F', 'M'));

COMMENT ON COLUMN public.patients.sexe IS
  'Sexe déclaré pour accord grammatical : F=Patiente, M=Patient, NULL=Patient·e.';
