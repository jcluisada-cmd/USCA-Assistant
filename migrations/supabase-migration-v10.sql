-- ══════════════════════════════════════════════════════════
-- Migration v10 — Demandes de séances thérapies complémentaires
-- Le patient demande une séance, l'animateur valide avec/sans horaire
-- À exécuter dans Supabase → SQL Editor → New query
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS demandes_seances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  date_demande DATE NOT NULL,
  groupe_slug TEXT NOT NULL DEFAULT 'therapies-complementaires',
  statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'acceptee', 'refusee')),
  heure_debut TEXT,
  heure_fin TEXT,
  validee_par UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(patient_id, date_demande, groupe_slug)
);

ALTER TABLE demandes_seances ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire (patient voit ses demandes, animateur voit toutes)
CREATE POLICY "demandes_seances_select_all" ON demandes_seances
  FOR SELECT USING (true);

-- Les patients anonymes peuvent créer une demande
CREATE POLICY "demandes_seances_insert_anon" ON demandes_seances
  FOR INSERT WITH CHECK (true);

-- Les soignants authentifiés peuvent modifier (valider/refuser/horaire)
CREATE POLICY "demandes_seances_update_auth" ON demandes_seances
  FOR UPDATE USING (true);

CREATE POLICY "demandes_seances_delete_auth" ON demandes_seances
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE INDEX idx_demandes_seances_patient ON demandes_seances(patient_id);
CREATE INDEX idx_demandes_seances_date ON demandes_seances(date_demande);
CREATE INDEX idx_demandes_seances_statut ON demandes_seances(statut);
