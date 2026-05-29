-- ════════════════════════════════════════════════════════════
-- Migration v40 — Modifier / supprimer ses propres messages
-- Table : contenus_partages (conversation patient <-> soignants)
-- Date : 2026-05-29
--
-- Objectif :
--   - Permettre la MODIFICATION de ses propres messages (policy UPDATE
--     inexistante jusqu'ici).
--   - Resserrer la SUPPRESSION : la policy v4 "contenus_delete_auth"
--     autorisait TOUT utilisateur authentifié a supprimer N'IMPORTE
--     quel message. On la restreint a "ses propres messages".
--   - Ajouter une colonne `modifie_le` pour afficher "(modifie)".
--
-- Semantique des predicats :
--   auth.uid() = cree_par                  -> soignant : ses messages
--   auth.uid() IS NULL AND cree_par IS NULL -> patient anonyme : msg patient
--
-- Risque connu (inchange) : un patient anonyme ne peut pas etre distingue
-- d'un autre au niveau RLS (meme modele que l'INSERT ouvert v21).
-- ════════════════════════════════════════════════════════════

-- a) Colonne pour l'indicateur "(modifie)"
ALTER TABLE contenus_partages ADD COLUMN IF NOT EXISTS modifie_le TIMESTAMPTZ;

-- b) Policy UPDATE (n'existait pas)
DROP POLICY IF EXISTS "contenus_update_own" ON contenus_partages;
CREATE POLICY "contenus_update_own" ON contenus_partages FOR UPDATE
  USING      ( (auth.uid() = cree_par) OR (auth.uid() IS NULL AND cree_par IS NULL) )
  WITH CHECK ( (auth.uid() = cree_par) OR (auth.uid() IS NULL AND cree_par IS NULL) );

-- c) Resserrer DELETE : "authenticated" (trop large) -> uniquement ses messages
DROP POLICY IF EXISTS "contenus_delete_auth" ON contenus_partages;
DROP POLICY IF EXISTS "contenus_delete_own" ON contenus_partages;
CREATE POLICY "contenus_delete_own" ON contenus_partages FOR DELETE
  USING ( (auth.uid() = cree_par) OR (auth.uid() IS NULL AND cree_par IS NULL) );
