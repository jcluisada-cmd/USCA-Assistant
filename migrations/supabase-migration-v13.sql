-- ═══ USCA Connect — Migration v13 : Jours de présence + statut post-cure ═══

-- Jours de présence soignants
-- Array d'entiers : [1,2,3,4,5] = lun-ven, [4] = jeudi seulement
-- NULL = présent tous les jours (défaut)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS jours_presence INTEGER[] DEFAULT NULL;

-- Statut du dossier post-cure (workflow uniquement, pas de données patient)
-- JSONB avec des dates : {"patient_usca":"2026-04-17","patient_structure":"2026-04-17","medecin_rempli":"2026-04-17"}
ALTER TABLE patients ADD COLUMN IF NOT EXISTS postcure_statut JSONB DEFAULT '{}'::jsonb;
