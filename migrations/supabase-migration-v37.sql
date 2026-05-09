-- ══════════════════════════════════════════════════════════
-- Migration v37 — Motifs de refus permission (côté médecin)
-- Date : 2026-05-09
--
-- Ajoute deux colonnes à la table `permissions` pour stocker
-- les motifs structurés du refus saisis par le médecin :
--   - motifs_refus_codes : codes pré-définis multi-sélectionnables
--     (ex. {'tardive','retour_apres_20h','objectif_a_rediscuter'})
--   - motif_refus_libre : texte libre complémentaire
--
-- Les motifs s'affichent côté patient sous le badge "Refusée".
-- Si la permission repasse en attente (modification), le médecin
-- pourra effacer ces colonnes (cf. logique côté admin).
--
-- À exécuter dans Supabase → SQL Editor → New query.
-- ══════════════════════════════════════════════════════════

-- 1. Codes pré-définis (text[]) — vide par défaut
ALTER TABLE public.permissions
  ADD COLUMN IF NOT EXISTS motifs_refus_codes TEXT[] DEFAULT '{}';

-- 2. Commentaire libre du médecin (nullable)
ALTER TABLE public.permissions
  ADD COLUMN IF NOT EXISTS motif_refus_libre TEXT;

-- Vocabulaire des codes (documentation, pas de contrainte CHECK pour rester flexible) :
--   tardive               → "Demande trop tardive"
--   retour_apres_20h      → "Le retour ne peut pas être après 20h"
--   objectif_a_rediscuter → "Objectif de permission à rediscuter"
--
-- L'UI peut ajouter des codes ultérieurement sans migration BDD.
