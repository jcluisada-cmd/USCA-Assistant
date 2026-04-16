-- ═══ USCA Connect — Migration v13 : Jours de présence soignants ═══

-- Array d'entiers : [1,2,3,4,5] = lun-ven, [4] = jeudi seulement, etc.
-- NULL = présent tous les jours (défaut)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS jours_presence INTEGER[] DEFAULT NULL;
