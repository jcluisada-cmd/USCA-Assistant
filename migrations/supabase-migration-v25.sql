-- ══════════════════════════════════════════════════════════
-- Migration v25 — Vue tuteur : réponses détaillées des sessions externe
-- Date : 2026-04-23
-- Complète la migration v18 qui avait donné accès aux sessions et flags
-- mais pas aux réponses individuelles. Sans cette migration, le tuteur
-- ne peut pas voir quelle réponse l'externe a choisie à chaque question.
-- À exécuter dans Supabase → SQL Editor → New query.
-- ══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "medecin_read_externe_reponses" ON public.qcm_reponses;
CREATE POLICY "medecin_read_externe_reponses" ON public.qcm_reponses
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM public.qcm_sessions
      WHERE user_id IN (SELECT id FROM public.profiles WHERE role = 'externe')
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role IN ('medecin', 'ide') OR is_admin = true)
    )
  );
