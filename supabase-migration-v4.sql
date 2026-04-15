-- ══════════════════════════════════════════════════════════
-- USCA Connect — Migration V4 : permissions + rendez-vous
-- À exécuter dans Supabase → SQL Editor LORS DE LA PROCHAINE SESSION
-- ══════════════════════════════════════════════════════════

-- ──────────────────────────────────────────
-- 1. TABLE : permissions (demandes de sortie patient)
-- ──────────────────────────────────────────
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  date_debut TIMESTAMPTZ NOT NULL,
  date_retour TIMESTAMPTZ NOT NULL,
  motif TEXT,
  statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'validee', 'refusee', 'annulee')),
  validee_par UUID REFERENCES profiles(id),
  validee_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_permissions_patient ON permissions(patient_id);
CREATE INDEX idx_permissions_statut ON permissions(statut);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Patients anon peuvent lire leurs propres permissions et en créer
CREATE POLICY "permissions_select_all" ON permissions FOR SELECT USING (true);
CREATE POLICY "permissions_insert_all" ON permissions FOR INSERT WITH CHECK (true);
-- Soignants authentifiés peuvent modifier (valider/refuser)
CREATE POLICY "permissions_update_auth" ON permissions FOR UPDATE USING (auth.role() = 'authenticated');

-- ──────────────────────────────────────────
-- 2. TABLE : rendez_vous (poussés par les soignants)
-- ──────────────────────────────────────────
CREATE TABLE rendez_vous (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  soignant_id UUID REFERENCES profiles(id),
  titre TEXT NOT NULL,
  description TEXT,
  date_heure TIMESTAMPTZ NOT NULL,
  duree_minutes INTEGER DEFAULT 30,
  lieu TEXT,
  type TEXT DEFAULT 'entretien' CHECK (type IN ('entretien', 'medical', 'ide', 'social', 'autre')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rdv_patient ON rendez_vous(patient_id);
CREATE INDEX idx_rdv_date ON rendez_vous(date_heure);

ALTER TABLE rendez_vous ENABLE ROW LEVEL SECURITY;

-- Lecture publique (patients voient leurs RDV)
CREATE POLICY "rdv_select_all" ON rendez_vous FOR SELECT USING (true);
-- Création/modification par les soignants
CREATE POLICY "rdv_insert_auth" ON rendez_vous FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "rdv_update_auth" ON rendez_vous FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "rdv_delete_auth" ON rendez_vous FOR DELETE USING (auth.role() = 'authenticated');
