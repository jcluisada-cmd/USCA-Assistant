-- ══════════════════════════════════════════════════════════
-- Migration v24 — Consultations personnelles (agenda privé soignant)
-- Date : 2026-04-23
-- Ajoute le type 'personnel' aux événements + RLS stricte :
-- un événement 'personnel' n'est visible/modifiable que par son créateur.
-- Les autres types (entretien, réunion, staff, labo, etc.) gardent leur
-- visibilité équipe inchangée.
-- À exécuter dans Supabase → SQL Editor → New query.
-- ══════════════════════════════════════════════════════════

-- 1) Ajouter 'personnel' au CHECK constraint
ALTER TABLE evenements DROP CONSTRAINT IF EXISTS evenements_type_check;
ALTER TABLE evenements ADD CONSTRAINT evenements_type_check
  CHECK (type IN ('entretien', 'consultation', 'familial', 'rdv_externe', 'autre',
                  'reunion', 'staff', 'labo', 'supervision', 'personnel'));

-- 2) RLS SELECT : masquer les événements 'personnel' aux autres utilisateurs
DROP POLICY IF EXISTS "evenements_select_all" ON evenements;
DROP POLICY IF EXISTS "evenements_select_visible" ON evenements;
CREATE POLICY "evenements_select_visible" ON evenements
  FOR SELECT USING (
    type <> 'personnel' OR cree_par = auth.uid()
  );

-- 3) RLS UPDATE : personne ne peut modifier l'événement 'personnel' d'un autre
DROP POLICY IF EXISTS "evenements_update_auth" ON evenements;
DROP POLICY IF EXISTS "evenements_update_visible" ON evenements;
CREATE POLICY "evenements_update_visible" ON evenements
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND (type <> 'personnel' OR cree_par = auth.uid())
  );

-- 4) RLS DELETE : personne ne peut supprimer l'événement 'personnel' d'un autre
DROP POLICY IF EXISTS "evenements_delete_auth" ON evenements;
DROP POLICY IF EXISTS "evenements_delete_visible" ON evenements;
CREATE POLICY "evenements_delete_visible" ON evenements
  FOR DELETE USING (
    auth.role() = 'authenticated'
    AND (type <> 'personnel' OR cree_par = auth.uid())
  );

-- 5) INSERT : tout utilisateur authentifié peut créer. Policy existante inchangée
--    (evenements_insert_auth : WITH CHECK auth.role() = 'authenticated').
--    Côté application : forcer cree_par = auth.uid() à l'insertion d'un 'personnel'.

-- 6) Index sur cree_par pour accélérer le filtre personnel
CREATE INDEX IF NOT EXISTS idx_evenements_cree_par ON evenements(cree_par);
