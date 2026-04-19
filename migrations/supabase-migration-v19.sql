-- Migration v19 : Sessions QCM persistantes (reprise)
-- Ajoute statut (en_cours/terminee) et questions_json pour reprendre une session interrompue

ALTER TABLE public.qcm_sessions
  ADD COLUMN IF NOT EXISTS statut TEXT NOT NULL DEFAULT 'terminee',
  ADD COLUMN IF NOT EXISTS questions_json JSONB;

-- Index pour retrouver rapidement les sessions en cours d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_qcm_sessions_user_statut
  ON public.qcm_sessions(user_id, statut);
