-- Migration v15 — Module QCM EDN + dashboard externe
-- Date : 2026-04-19
-- Crée 4 tables : tuteur_etudiant, qcm_sessions, qcm_reponses, qcm_flags
-- Appliquée via MCP Supabase le 2026-04-19 sur projet pydxfoqxgvbmknzjzecn

-- ── Lien tuteur / apprenant (externe ou étudiant IDE) ──
CREATE TABLE IF NOT EXISTS public.tuteur_etudiant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tuteur_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  etudiant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('externe', 'etudiant_ide')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tuteur_id, etudiant_id)
);
CREATE INDEX IF NOT EXISTS idx_tuteur_etudiant_tuteur ON public.tuteur_etudiant(tuteur_id);
CREATE INDEX IF NOT EXISTS idx_tuteur_etudiant_etudiant ON public.tuteur_etudiant(etudiant_id);

-- ── Sessions QCM (une session = une série jouée) ──
CREATE TABLE IF NOT EXISTS public.qcm_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('entrainement', 'examen')),
  nb_questions INTEGER NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qcm_sessions_user ON public.qcm_sessions(user_id, created_at DESC);

-- ── Réponses individuelles ──
CREATE TABLE IF NOT EXISTS public.qcm_reponses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.qcm_sessions(id) ON DELETE CASCADE NOT NULL,
  question_source TEXT NOT NULL,
  reponse_choisie TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  temps_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qcm_reponses_session ON public.qcm_reponses(session_id);

-- ── Signalements de questions ──
CREATE TABLE IF NOT EXISTS public.qcm_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_source TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('erreur_question', 'demande_explication')),
  message TEXT,
  statut TEXT NOT NULL DEFAULT 'ouvert' CHECK (statut IN ('ouvert', 'traite')),
  tuteur_reponse TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  traite_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_qcm_flags_user ON public.qcm_flags(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qcm_flags_statut ON public.qcm_flags(statut) WHERE statut = 'ouvert';

-- ── RLS ──
ALTER TABLE public.tuteur_etudiant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qcm_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qcm_reponses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qcm_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_tutor" ON public.tuteur_etudiant;
CREATE POLICY "own_tutor" ON public.tuteur_etudiant
  FOR ALL USING (auth.uid() = tuteur_id OR auth.uid() = etudiant_id);

DROP POLICY IF EXISTS "own_sessions" ON public.qcm_sessions;
CREATE POLICY "own_sessions" ON public.qcm_sessions
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_reponses" ON public.qcm_reponses;
CREATE POLICY "own_reponses" ON public.qcm_reponses
  FOR ALL USING (
    session_id IN (SELECT id FROM public.qcm_sessions WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "own_flags" ON public.qcm_flags;
CREATE POLICY "own_flags" ON public.qcm_flags
  FOR ALL USING (auth.uid() = user_id);
