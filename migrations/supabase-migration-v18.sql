-- Migration v18 — Vue tuteur QCM EDN (médecins + admin)
-- Date : 2026-04-19
-- Ajoute des policies RLS permettant aux médecins/admins de voir et répondre
-- aux sessions et signalements des externes.

-- ── Médecins peuvent lire les sessions des externes ──
DROP POLICY IF EXISTS "medecin_read_externe_sessions" ON public.qcm_sessions;
CREATE POLICY "medecin_read_externe_sessions" ON public.qcm_sessions
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.profiles WHERE role = 'externe')
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role IN ('medecin', 'ide') OR is_admin = true)
    )
  );

-- ── Médecins peuvent lire les signalements des externes ──
DROP POLICY IF EXISTS "medecin_read_externe_flags" ON public.qcm_flags;
CREATE POLICY "medecin_read_externe_flags" ON public.qcm_flags
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.profiles WHERE role = 'externe')
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role IN ('medecin', 'ide') OR is_admin = true)
    )
  );

-- ── Médecins peuvent répondre aux signalements (UPDATE tuteur_reponse + statut) ──
DROP POLICY IF EXISTS "medecin_update_externe_flags" ON public.qcm_flags;
CREATE POLICY "medecin_update_externe_flags" ON public.qcm_flags
  FOR UPDATE USING (
    user_id IN (SELECT id FROM public.profiles WHERE role = 'externe')
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role IN ('medecin', 'ide') OR is_admin = true)
    )
  );
