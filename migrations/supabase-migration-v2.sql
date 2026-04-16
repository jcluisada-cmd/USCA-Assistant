-- ══════════════════════════════════════════════════════════
-- USCA Connect — Migration V2 : stratégies + alertes enrichies
-- À exécuter dans Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════

-- ──────────────────────────────────────────
-- 1. TABLE : strategies (construites par le patient)
-- ──────────────────────────────────────────
CREATE TABLE strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) NOT NULL,
  texte TEXT NOT NULL,
  categorie TEXT DEFAULT 'general' CHECK (categorie IN ('general', 'situation', 'emotion', 'pensee', 'action', 'contact')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_strategies_patient ON strategies(patient_id);

-- RLS : patients anon peuvent lire/écrire leurs propres stratégies
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;

-- Lecture et écriture publiques (le patient n'est pas authentifié Supabase)
CREATE POLICY "strategies_select_all" ON strategies FOR SELECT USING (true);
CREATE POLICY "strategies_insert_all" ON strategies FOR INSERT WITH CHECK (true);
CREATE POLICY "strategies_delete_all" ON strategies FOR DELETE USING (true);
-- Les soignants authentifiés peuvent aussi les voir/modifier
CREATE POLICY "strategies_update_auth" ON strategies FOR UPDATE USING (true);

-- ──────────────────────────────────────────
-- 2. ENRICHIR la table alertes : déclencheur + durée
-- ──────────────────────────────────────────
ALTER TABLE alertes ADD COLUMN IF NOT EXISTS declencheur TEXT;
ALTER TABLE alertes ADD COLUMN IF NOT EXISTS duree TEXT;
