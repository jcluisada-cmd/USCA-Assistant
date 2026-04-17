-- ═══ USCA Connect — Migration v16 : Livret IFSI (étudiantes IDE en stage) ═══
-- Tables + RLS pour le module livret étudiante
-- Rôle utilisé : 'etudiant.ide' (déjà créé côté auth par JC)

-- ── Table des stages ──
CREATE TABLE IF NOT EXISTS etudiants_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ifsi_origine TEXT,
  promo TEXT,
  annee_formation INT CHECK (annee_formation BETWEEN 1 AND 3),
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  tuteur_id UUID REFERENCES profiles(id),
  statut TEXT DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'abandonne')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Table progression (une ligne par question répondue) ──
CREATE TABLE IF NOT EXISTS etudiant_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID REFERENCES etudiants_stages(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  chapitre_id TEXT NOT NULL,
  reponse_etudiant TEXT,
  reponse_json JSONB,
  vu_tuteur BOOLEAN DEFAULT false,
  vu_par UUID REFERENCES profiles(id),
  vu_le TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(stage_id, question_id)
);

-- ── RLS ──
ALTER TABLE etudiants_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE etudiant_progression ENABLE ROW LEVEL SECURITY;

CREATE POLICY "etudiant_voit_son_stage" ON etudiants_stages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "soignants_voient_stages" ON etudiants_stages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role IN ('ide','medecin') OR is_admin = true))
  );

CREATE POLICY "admin_gere_stages" ON etudiants_stages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "etudiant_gere_sa_progression" ON etudiant_progression
  FOR ALL USING (
    EXISTS (SELECT 1 FROM etudiants_stages WHERE id = stage_id AND user_id = auth.uid())
  );

CREATE POLICY "soignants_voient_progression" ON etudiant_progression
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ide','medecin'))
  );

CREATE POLICY "ide_valide_progression" ON etudiant_progression
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ide')
  );

CREATE POLICY "admin_gere_progression" ON etudiant_progression
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── Index ──
CREATE INDEX IF NOT EXISTS idx_progression_stage ON etudiant_progression(stage_id);
CREATE INDEX IF NOT EXISTS idx_progression_chapitre ON etudiant_progression(stage_id, chapitre_id);
CREATE INDEX IF NOT EXISTS idx_stages_tuteur ON etudiants_stages(tuteur_id);
CREATE INDEX IF NOT EXISTS idx_stages_statut ON etudiants_stages(statut);
CREATE INDEX IF NOT EXISTS idx_stages_user ON etudiants_stages(user_id);

COMMENT ON TABLE etudiants_stages IS 'Stages IFSI : un par étudiante. Réinit = DELETE progression WHERE stage_id = X (cascade si on supprime le stage).';
COMMENT ON TABLE etudiant_progression IS 'Progression livret IFSI : une ligne par question répondue. UNIQUE(stage_id, question_id) pour upsert.';
