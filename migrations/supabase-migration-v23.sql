-- ══════════════════════════════════════════════════════════
-- Migration v23 — Robustification animateurs de groupes
-- Contexte : bug constaté 2026-04-21 — deux profils homonymes
-- (Thomas Bergman / Thomas Bergmann) coexistaient comme
-- animateurs du même groupe, et la policy DELETE empêchait
-- l'admin de faire le ménage.
--
-- 1. FK groupe_animateurs.user_id → profiles(id) ON DELETE CASCADE
--    (au lieu de auth.users) pour aligner la cascade sur le flow
--    admin (admin/index.html:2483) qui supprime profiles en premier
-- 2. Policy DELETE étendue : admin OU soi-même
-- 3. Nettoyage préventif des orphelins éventuels
-- ══════════════════════════════════════════════════════════

-- ── 1. Nettoyage préventif ──
DELETE FROM groupe_animateurs
WHERE user_id NOT IN (SELECT id FROM profiles);

-- ── 2. Remplacement de la FK ──
ALTER TABLE groupe_animateurs
  DROP CONSTRAINT IF EXISTS groupe_animateurs_user_id_fkey;

ALTER TABLE groupe_animateurs
  ADD CONSTRAINT groupe_animateurs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ── 3. Remplacement de la policy DELETE ──
DROP POLICY IF EXISTS groupe_animateurs_delete_own ON groupe_animateurs;

CREATE POLICY groupe_animateurs_delete_own_or_admin ON groupe_animateurs
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
