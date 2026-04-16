-- ═══ USCA Connect — Migration v14 : Statut post-cure ═══
-- Workflow uniquement (pas de données patient) — stocke qui a envoyé quoi et quand

ALTER TABLE patients ADD COLUMN IF NOT EXISTS postcure_statut JSONB DEFAULT '{}'::jsonb;
