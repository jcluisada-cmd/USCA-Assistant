-- ═══════════════════════════════════════════════════════════════════
-- Migration v21 — Messages patient → équipe (bidirectionnels)
-- ═══════════════════════════════════════════════════════════════════
-- Date : 2026-04-20
-- Objet : autoriser le patient (anon) à insérer des messages dans
--         contenus_partages. Le patient n'est pas authentifié via
--         Supabase Auth (session localStorage basée sur chambre + DDN),
--         donc la policy INSERT actuelle (auth.role() = 'authenticated')
--         bloque ses envois.
--
-- Convention d'identification de l'auteur :
--   cree_par IS NULL   → message envoyé par le patient
--   cree_par = <uuid>  → message envoyé par un soignant (profil Supabase)
--
-- Pas de changement de schéma ni de CHECK sur `type` : les messages
-- patient utilisent simplement type='note'.
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "contenus_insert_auth" ON contenus_partages;

CREATE POLICY "contenus_insert_all" ON contenus_partages
  FOR INSERT WITH CHECK (true);

-- Vérification : les policies SELECT (USING true) et DELETE (auth)
-- restent inchangées. Le patient peut lire ses propres messages via
-- le filtrage côté client par patient_id (déjà en place).
