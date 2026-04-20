-- ═══════════════════════════════════════════════════════════════════
-- Migration v22 — Liste d'attente enrichie
-- ═══════════════════════════════════════════════════════════════════
-- Date : 2026-04-20
-- Objet : enrichir la table `liste_attente` avec quatre nouveaux champs
--         pour accélérer l'admission dès qu'un lit se libère.
--   - pre_admission       : BOOLEAN — le patient a été vu en pré-admission
--   - destination_prevue  : JSONB  — {destination, postcure_centre, autre_precision}
--                                     (même shape que patients.sortie_info)
--   - ddn                 : TEXT   — DDN saisie en texte libre ("01011980" ou
--                                     "01/01/1980") avant l'admission formelle
--   - date_sortie_prevue  : DATE   — date de sortie USCA si déjà envisagée
--
-- Tous nullables : compatible avec les entrées déjà existantes.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE liste_attente
  ADD COLUMN IF NOT EXISTS pre_admission      BOOLEAN  DEFAULT false,
  ADD COLUMN IF NOT EXISTS destination_prevue JSONB,
  ADD COLUMN IF NOT EXISTS ddn                TEXT,
  ADD COLUMN IF NOT EXISTS date_sortie_prevue DATE;
