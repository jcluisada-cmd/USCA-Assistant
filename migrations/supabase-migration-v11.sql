-- ══════════════════════════════════════════════════════════
-- Migration v11 — Événements d'équipe (réunions, staff, labo...)
-- Rend patient_id nullable + ajoute types staff
-- À exécuter dans Supabase → SQL Editor → New query
-- ══════════════════════════════════════════════════════════

-- Rendre patient_id nullable (événements d'équipe sans patient)
ALTER TABLE evenements ALTER COLUMN patient_id DROP NOT NULL;

-- Élargir les types d'événements
ALTER TABLE evenements DROP CONSTRAINT IF EXISTS evenements_type_check;
ALTER TABLE evenements ADD CONSTRAINT evenements_type_check
  CHECK (type IN ('entretien', 'consultation', 'familial', 'rdv_externe', 'autre', 'reunion', 'staff', 'labo', 'supervision'));

-- Table présences aux réunions staff (médecins)
CREATE TABLE IF NOT EXISTS presences_reunions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reunion_slug TEXT NOT NULL,
  date_reunion DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  present BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(reunion_slug, date_reunion, user_id)
);

ALTER TABLE presences_reunions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "presences_reunions_select_all" ON presences_reunions
  FOR SELECT USING (true);

CREATE POLICY "presences_reunions_upsert_auth" ON presences_reunions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "presences_reunions_update_auth" ON presences_reunions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE INDEX idx_presences_reunions_date ON presences_reunions(date_reunion);
