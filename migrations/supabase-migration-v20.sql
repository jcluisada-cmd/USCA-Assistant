-- Migration v20 : Questions extern → tuteur + checklist personnelle
-- Dépend de : v18 (RLS extern sessions/flags), v19 (sessions persistantes)

-- ══════════════════════════════════════════════════
-- 1. Checklist personnelle dans profiles (JSONB)
-- ══════════════════════════════════════════════════
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS checklist_items JSONB DEFAULT '[]'::jsonb;

-- ══════════════════════════════════════════════════
-- 2. Table extern_questions : questions extern → tuteur
-- ══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS extern_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message     TEXT NOT NULL,
  reponse     TEXT,
  statut      TEXT NOT NULL DEFAULT 'ouvert' CHECK (statut IN ('ouvert', 'traite')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE extern_questions ENABLE ROW LEVEL SECURITY;

-- L'externe gère ses propres questions
CREATE POLICY "extern_questions_own" ON extern_questions
  FOR ALL USING (auth.uid() = user_id);

-- Les médecins et admins peuvent lire toutes les questions
CREATE POLICY "extern_questions_medecin_read" ON extern_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND (profiles.role = 'medecin' OR profiles.is_admin = true)
    )
  );

-- Les médecins et admins peuvent répondre / marquer traité
CREATE POLICY "extern_questions_medecin_update" ON extern_questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND (profiles.role = 'medecin' OR profiles.is_admin = true)
    )
  );

CREATE INDEX IF NOT EXISTS idx_extern_questions_user ON extern_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_extern_questions_statut ON extern_questions(statut);
