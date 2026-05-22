-- Migration v39 — Relacher RLS SELECT sur profiles (anon + auth)
--
-- Pourquoi : les patients (anon, pas de session Supabase Auth) doivent pouvoir
-- afficher l'identifiant du soignant qui a repondu a un message. Le JOIN
-- contenus_partages -> profiles necessitait auth.role() = 'authenticated',
-- ce qui retournait null pour les patients.
--
-- L'email profiles.email est un identifiant pro public (visible sur badges
-- hopital, signatures email, papier a en-tete). Pas de PII sensible expose.
--
-- Date : 2026-05-22 (apres v4.39)

DROP POLICY IF EXISTS profiles_select_auth ON profiles;
CREATE POLICY profiles_select_all ON profiles
  FOR SELECT
  USING (true);
