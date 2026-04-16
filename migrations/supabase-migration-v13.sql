-- ═══ USCA Connect — Migration v13 : Dossiers post-cure ═══
-- Stocke les volets patient et médecin en JSONB (un dossier par patient)

CREATE TABLE IF NOT EXISTS dossiers_postcure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  structure_key TEXT DEFAULT '',
  volet_patient JSONB DEFAULT NULL,
  volet_medecin JSONB DEFAULT NULL,
  volet_patient_date TIMESTAMPTZ DEFAULT NULL,
  volet_medecin_date TIMESTAMPTZ DEFAULT NULL,
  volet_medecin_par TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(patient_id)
);

ALTER TABLE dossiers_postcure ENABLE ROW LEVEL SECURITY;

-- Soignants authentifiés : accès complet
CREATE POLICY "postcure_auth_all" ON dossiers_postcure
  FOR ALL USING (auth.role() = 'authenticated');

-- Fonction RPC pour que le patient (anon) puisse sauvegarder son volet
-- SECURITY DEFINER = s'exécute avec les droits du créateur (bypass RLS)
CREATE OR REPLACE FUNCTION save_volet_patient(
  p_patient_id UUID,
  p_structure_key TEXT,
  p_data JSONB
) RETURNS void AS $$
BEGIN
  -- Vérifier que le patient existe
  IF NOT EXISTS (SELECT 1 FROM patients WHERE id = p_patient_id) THEN
    RAISE EXCEPTION 'Patient introuvable';
  END IF;

  -- Upsert : créer ou mettre à jour le volet patient uniquement
  INSERT INTO dossiers_postcure (patient_id, structure_key, volet_patient, volet_patient_date, updated_at)
  VALUES (p_patient_id, p_structure_key, p_data, now(), now())
  ON CONFLICT (patient_id)
  DO UPDATE SET
    volet_patient = p_data,
    volet_patient_date = now(),
    structure_key = COALESCE(NULLIF(p_structure_key, ''), dossiers_postcure.structure_key),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Autoriser l'appel RPC pour les utilisateurs anon
GRANT EXECUTE ON FUNCTION save_volet_patient(UUID, TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION save_volet_patient(UUID, TEXT, JSONB) TO authenticated;

-- ═══ Jours de présence soignants (optionnel) ═══
-- Array d'entiers : [1,2,3,4,5] = lun-ven, [4] = jeudi seulement, etc.
-- NULL = présent tous les jours (défaut)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS jours_presence INTEGER[] DEFAULT NULL;
