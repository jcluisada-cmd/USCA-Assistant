-- ══════════════════════════════════════════════════════════
-- Migration v6 — Gestion des groupes thérapeutiques
-- Tables : groupe_animateurs + groupe_modifications
-- À exécuter dans Supabase → SQL Editor → New query
-- ══════════════════════════════════════════════════════════

-- ── 1. Table animateurs ──
CREATE TABLE IF NOT EXISTS groupe_animateurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  groupe_slug TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_affiche TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(groupe_slug, user_id)
);

ALTER TABLE groupe_animateurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groupe_animateurs_select_all" ON groupe_animateurs
  FOR SELECT USING (true);

CREATE POLICY "groupe_animateurs_insert_auth" ON groupe_animateurs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "groupe_animateurs_delete_own" ON groupe_animateurs
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_groupe_animateurs_slug ON groupe_animateurs(groupe_slug);

-- ── 2. Table modifications de groupes (par date) ──
-- Permet à l'animateur de modifier heure, annuler, exclure un patient pour une date donnée
CREATE TABLE IF NOT EXISTS groupe_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  groupe_slug TEXT NOT NULL,
  date_effet DATE NOT NULL,
  annule BOOLEAN DEFAULT false,
  nouvelle_heure TEXT,
  nouvelle_fin TEXT,
  message TEXT,
  exclusions UUID[] DEFAULT '{}',
  modifie_par UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(groupe_slug, date_effet)
);

ALTER TABLE groupe_modifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groupe_modifications_select_all" ON groupe_modifications
  FOR SELECT USING (true);

CREATE POLICY "groupe_modifications_insert_auth" ON groupe_modifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "groupe_modifications_update_auth" ON groupe_modifications
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "groupe_modifications_delete_auth" ON groupe_modifications
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE INDEX idx_groupe_modifications_date ON groupe_modifications(date_effet);

-- ── 3. Table rappels de groupe (notifications push-like) ──
CREATE TABLE IF NOT EXISTS groupe_rappels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  groupe_slug TEXT NOT NULL,
  date_effet DATE NOT NULL,
  message TEXT NOT NULL,
  envoye_par UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE groupe_rappels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groupe_rappels_select_all" ON groupe_rappels
  FOR SELECT USING (true);

CREATE POLICY "groupe_rappels_insert_auth" ON groupe_rappels
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX idx_groupe_rappels_date ON groupe_rappels(date_effet);
