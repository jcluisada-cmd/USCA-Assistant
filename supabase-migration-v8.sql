-- ══════════════════════════════════════════════════════════
-- Migration v8 — Appareils de confiance (auto-login soignant)
-- Table : device_tokens
-- À exécuter dans Supabase → SQL Editor → New query
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  appareil TEXT DEFAULT 'Appareil inconnu',
  derniere_utilisation TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '90 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_device_tokens_token ON device_tokens(token);
CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Chaque soignant ne voit/modifie que ses propres appareils
CREATE POLICY "device_tokens_own" ON device_tokens
  FOR ALL USING (auth.uid() = user_id);
