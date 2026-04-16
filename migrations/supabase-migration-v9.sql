-- ══════════════════════════════════════════════════════════
-- Migration v9 — Participations aux groupes thérapeutiques
-- Permet au patient ET à l'animateur de cocher présent/absent
-- À exécuter dans Supabase → SQL Editor → New query
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  groupe_slug TEXT NOT NULL,
  groupe_nom TEXT NOT NULL,
  date_groupe DATE NOT NULL,
  present BOOLEAN DEFAULT true,
  coche_par TEXT DEFAULT 'patient',  -- 'patient' ou 'animateur'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(patient_id, groupe_slug, date_groupe)
);

ALTER TABLE participations ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire (patient voit ses participations, animateur voit la liste)
CREATE POLICY "participations_select_all" ON participations
  FOR SELECT USING (true);

-- Les patients anonymes (anon) peuvent insérer/modifier leur propre participation
CREATE POLICY "participations_insert_anon" ON participations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "participations_update_anon" ON participations
  FOR UPDATE USING (true);

-- Les soignants authentifiés peuvent tout modifier
CREATE POLICY "participations_delete_auth" ON participations
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE INDEX idx_participations_patient ON participations(patient_id);
CREATE INDEX idx_participations_date ON participations(date_groupe);
CREATE INDEX idx_participations_slug_date ON participations(groupe_slug, date_groupe);
