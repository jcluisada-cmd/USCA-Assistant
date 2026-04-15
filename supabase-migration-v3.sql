-- ══════════════════════════════════════════════════════════
-- USCA Connect — Migration V3 : prescriptions (fiches traitements)
-- À exécuter dans Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════

CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  fiche_slug TEXT NOT NULL,
  prescrit_par UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(patient_id, fiche_slug)
);

CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Lecture publique (le patient anon doit voir ses fiches)
CREATE POLICY "prescriptions_select_all" ON prescriptions FOR SELECT USING (true);
-- Insertion/suppression par les soignants authentifiés
CREATE POLICY "prescriptions_insert_auth" ON prescriptions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "prescriptions_delete_auth" ON prescriptions FOR DELETE USING (auth.role() = 'authenticated');
