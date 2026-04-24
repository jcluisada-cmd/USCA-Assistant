-- ══════════════════════════════════════════════════════════
-- Migration v31 — Fix RLS push_subscriptions : lecture ouverte
-- Date : 2026-04-24
--
-- Bug corrigé :
--   Le patient (anon, pas de session Supabase) ne peut pas activer
--   les notifications push — erreur "row violates row-level security
--   policy for table push_subscriptions".
--
--   Le client appelle .upsert(...).select().single(), ce qui génère
--   INSERT ... ON CONFLICT ... RETURNING *. Le RETURNING est
--   ré-évalué contre la policy SELECT. Or push_subs_read_staff
--   exigeait auth.role() IN ('authenticated','service_role') — donc
--   refus en anon, et PostgREST propage l'échec sous forme d'erreur
--   "row violates RLS" (faux-ami, c'est bien la SELECT qui bloque).
--
--   Effet secondaire du même bug : patient/index.html appelle
--   getSubscribedMedecinIds() (SELECT direct) pour notifier les
--   médecins après un message — retournait [] silencieusement,
--   donc les médecins ne recevaient jamais le push.
--
-- Correctif : aligner la policy SELECT sur les autres (INSERT/UPDATE/
-- DELETE déjà `true`). Les endpoints Web Push et clés p256dh/auth
-- ne sont pas des secrets — seule la clé privée VAPID (côté Edge
-- Function, jamais exposée) permet d'envoyer une notif.
--
-- À exécuter dans Supabase → SQL Editor → New query.
-- ══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "push_subs_read_staff" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subs_read_public" ON public.push_subscriptions;

CREATE POLICY "push_subs_read_public" ON public.push_subscriptions
  FOR SELECT USING (true);

-- ──────────────────────────────────────────────────────────
-- Vérification (à exécuter après le RUN)
-- ──────────────────────────────────────────────────────────
-- SELECT polname, polcmd, pg_get_expr(polqual, polrelid) AS using_expr
-- FROM pg_policy
-- WHERE polrelid = 'public.push_subscriptions'::regclass
-- ORDER BY polname;
-- → push_subs_read_public doit apparaître avec using_expr = 'true'.
