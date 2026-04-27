-- ══════════════════════════════════════════════════════════
-- Migration v32 -- P5 Personnalisation modules soignant
-- Date : 2026-04-27
--
-- Objectif : permettre à l'admin de masquer certains éléments
-- d'UI soignant par rôle métier (médecin / IDE / psy /
-- pharmacien / secrétaire). Modèle "absence = visible" : la
-- table ne stocke QUE les masquages.
--
-- 1. Table role_modules_hidden (PK composite role+module_id)
-- 2. RLS : SELECT ouverte aux authenticated (nécessaire pour
--    appliquer le filtrage côté client) ; INSERT/UPDATE/DELETE
--    réservés aux admins (is_admin=true)
--
-- À exécuter dans Supabase -> SQL Editor -> New query.
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.role_modules_hidden (
  role       TEXT NOT NULL
             CHECK (role IN ('medecin','ide','psychologue','pharmacien','secretaire')),
  module_id  TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  PRIMARY KEY (role, module_id)
);

ALTER TABLE public.role_modules_hidden ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rmh_read" ON public.role_modules_hidden;
CREATE POLICY "rmh_read"
  ON public.role_modules_hidden
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "rmh_write" ON public.role_modules_hidden;
CREATE POLICY "rmh_write"
  ON public.role_modules_hidden
  FOR ALL
  TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true);

-- ──────────────────────────────────────────────────────────
-- Vérification (à exécuter après le RUN)
-- ──────────────────────────────────────────────────────────
-- SELECT polname, polcmd, pg_get_expr(polqual, polrelid) AS using_expr
-- FROM pg_policy
-- WHERE polrelid = 'public.role_modules_hidden'::regclass
-- ORDER BY polname;
-- -> rmh_read   (cmd r, using_expr 'true')
-- -> rmh_write  (cmd *, using_expr testant is_admin)
