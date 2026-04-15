-- ══════════════════════════════════════════════════════════
-- USCA Connect — Migration V5 : CASCADE sur alertes + strategies
-- À exécuter dans Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════

-- Ajouter ON DELETE CASCADE sur alertes.patient_id
ALTER TABLE alertes DROP CONSTRAINT IF EXISTS alertes_patient_id_fkey;
ALTER TABLE alertes ADD CONSTRAINT alertes_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

-- Ajouter ON DELETE CASCADE sur strategies.patient_id
ALTER TABLE strategies DROP CONSTRAINT IF EXISTS strategies_patient_id_fkey;
ALTER TABLE strategies ADD CONSTRAINT strategies_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
