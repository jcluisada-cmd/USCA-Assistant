-- ═══ USCA Connect — Migration v12 : Liste d'attente ═══
-- Patients en attente d'admission (non nominatif)

CREATE TABLE IF NOT EXISTS liste_attente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  age INTEGER NOT NULL,
  addressage TEXT NOT NULL DEFAULT 'Médecin Traitant',
  date_entree_prevue DATE,
  commentaire TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE liste_attente ENABLE ROW LEVEL SECURITY;

-- Tous les soignants authentifiés peuvent lire et modifier
CREATE POLICY "liste_attente_read" ON liste_attente FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "liste_attente_insert" ON liste_attente FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "liste_attente_update" ON liste_attente FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "liste_attente_delete" ON liste_attente FOR DELETE USING (auth.role() = 'authenticated');
