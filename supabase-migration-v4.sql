-- ══════════════════════════════════════════════════════════
-- USCA Connect — Migration V4
-- Permissions, événements/RDV, contenus partagés
-- À exécuter dans Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════

-- ──────────────────────────────────────────
-- 1. TABLE : permissions (demandes de sortie)
-- ──────────────────────────────────────────
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  date_debut TIMESTAMPTZ NOT NULL,
  date_retour TIMESTAMPTZ NOT NULL,
  motif TEXT,
  statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'validee', 'refusee', 'annulee')),
  cree_par UUID REFERENCES profiles(id),
  validee_par UUID REFERENCES profiles(id),
  validee_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_permissions_patient ON permissions(patient_id);
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permissions_select_all" ON permissions FOR SELECT USING (true);
CREATE POLICY "permissions_insert_all" ON permissions FOR INSERT WITH CHECK (true);
CREATE POLICY "permissions_update_auth" ON permissions FOR UPDATE USING (auth.role() = 'authenticated');

-- ──────────────────────────────────────────
-- 2. TABLE : evenements (RDV, entretiens, consultations...)
-- Remplace la table rendez_vous prévue initialement
-- ──────────────────────────────────────────
CREATE TABLE evenements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  cree_par UUID REFERENCES profiles(id),
  titre TEXT NOT NULL,
  description TEXT,
  date_heure TIMESTAMPTZ NOT NULL,
  duree_minutes INTEGER DEFAULT 30,
  lieu TEXT,
  type TEXT DEFAULT 'entretien' CHECK (type IN ('entretien', 'consultation', 'familial', 'rdv_externe', 'autre')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_evenements_patient ON evenements(patient_id);
CREATE INDEX idx_evenements_date ON evenements(date_heure);
ALTER TABLE evenements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evenements_select_all" ON evenements FOR SELECT USING (true);
CREATE POLICY "evenements_insert_auth" ON evenements FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "evenements_update_auth" ON evenements FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "evenements_delete_auth" ON evenements FOR DELETE USING (auth.role() = 'authenticated');

-- ──────────────────────────────────────────
-- 3. TABLE : contenus_partages (messages, liens, notes du soignant)
-- ──────────────────────────────────────────
CREATE TABLE contenus_partages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  cree_par UUID REFERENCES profiles(id),
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  type TEXT DEFAULT 'note' CHECK (type IN ('note', 'lien', 'consigne', 'document')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contenus_patient ON contenus_partages(patient_id);
ALTER TABLE contenus_partages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contenus_select_all" ON contenus_partages FOR SELECT USING (true);
CREATE POLICY "contenus_insert_auth" ON contenus_partages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "contenus_delete_auth" ON contenus_partages FOR DELETE USING (auth.role() = 'authenticated');
