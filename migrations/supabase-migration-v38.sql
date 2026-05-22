-- ══════════════════════════════════════════════════════════
-- Migration v38 — Dashboard PdS (Poste de Soins)
-- Date : 2026-05-22
--
-- Crée deux tables nécessaires au dashboard PdS :
--   - cushman_scores : scores Cushman (sevrage alcoolique, CIWA-Ar FR)
--   - transmissions : transmissions médicales / paramédicales
--     partagées entre PdS et médecins
--
-- Spec : docs/superpowers/specs/2026-05-21-role-pds-dashboard-design.md
-- Plan : docs/superpowers/plans/2026-05-22-role-pds-dashboard.md
--
-- À exécuter dans Supabase → SQL Editor → New query.
-- Note : le rôle 'pds' ne nécessite aucune migration car
-- profiles.role est de type TEXT (accepte n'importe quelle valeur).
-- ══════════════════════════════════════════════════════════

-- ============================================================
-- 1. cushman_scores
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cushman_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL
    REFERENCES public.patients(id) ON DELETE CASCADE,
  saisi_le TIMESTAMPTZ NOT NULL DEFAULT now(),
  items JSONB NOT NULL,
    -- Structure : {fc:0..3, pa:0..3, fr:0..3, tremblements:0..3,
    --              sueurs:0..3, agitation:0..3, sensoriels:0..3}
    -- Référentiel identique à la Toolbox V1 (staff/toolbox.html:333-345)
  score_total INT NOT NULL CHECK (score_total >= 0 AND score_total <= 21),
  commentaire TEXT,
  rappel_intervalle_h INT  -- NULL si pas de rappel programmé
);

CREATE INDEX IF NOT EXISTS idx_cushman_patient_time
  ON public.cushman_scores(patient_id, saisi_le DESC);

ALTER TABLE public.cushman_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cushman_select_soignants" ON public.cushman_scores;
CREATE POLICY "cushman_select_soignants" ON public.cushman_scores
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "cushman_insert_pds_ide_medecin" ON public.cushman_scores;
CREATE POLICY "cushman_insert_pds_ide_medecin" ON public.cushman_scores
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('pds','ide','medecin')
    )
  );

-- ============================================================
-- 2. transmissions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.transmissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL
    REFERENCES public.patients(id) ON DELETE CASCADE,
  auteur_id UUID NOT NULL
    REFERENCES public.profiles(id),
  type TEXT NOT NULL CHECK (type IN ('medical','paramedical')),
  contenu TEXT NOT NULL CHECK (length(contenu) > 0),
  cree_le TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transmissions_patient_time
  ON public.transmissions(patient_id, cree_le DESC);

ALTER TABLE public.transmissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transmissions_select_soignants" ON public.transmissions;
CREATE POLICY "transmissions_select_soignants" ON public.transmissions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "transmissions_insert_para" ON public.transmissions;
CREATE POLICY "transmissions_insert_para" ON public.transmissions
  FOR INSERT TO authenticated WITH CHECK (
    type = 'paramedical' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('pds','ide')
    )
  );

DROP POLICY IF EXISTS "transmissions_insert_med" ON public.transmissions;
CREATE POLICY "transmissions_insert_med" ON public.transmissions
  FOR INSERT TO authenticated WITH CHECK (
    type = 'medical' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'medecin'
    )
  );
