-- ══════════════════════════════════════════════════════════
-- Migration v35 — Policy DELETE sur permissions
-- Date : 2026-05-06
--
-- Fix v4.10 : depuis l'ajout du bouton 🗑 Supprimer côté admin,
-- la suppression silencieuse échouait. La table permissions avait
-- INSERT/SELECT/UPDATE en RLS mais AUCUNE policy DELETE → tout DELETE
-- était bloqué silencieusement par RLS (0 ligne supprimée, sans erreur
-- HTTP — comportement standard de Postgres avec RLS sans policy DELETE).
--
-- On ajoute une policy symétrique à UPDATE : DELETE autorisé pour les
-- soignants connectés (auth.role() = 'authenticated'). Les patients
-- (anon) ne peuvent pas supprimer leurs propres permissions.
--
-- À exécuter dans Supabase → SQL Editor → New query.
-- ══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS permissions_delete_auth ON public.permissions;

CREATE POLICY permissions_delete_auth ON public.permissions
  FOR DELETE
  USING (auth.role() = 'authenticated');
