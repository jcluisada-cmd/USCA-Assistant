-- ══════════════════════════════════════════════════════════
-- Migration v7 — Horaires individuels pour les groupes
-- Permet d'assigner un créneau par patient (ex: thérapies complémentaires)
-- À exécuter dans Supabase → SQL Editor → New query
-- ══════════════════════════════════════════════════════════

ALTER TABLE groupe_modifications
  ADD COLUMN IF NOT EXISTS horaires_individuels JSONB DEFAULT '{}';

-- horaires_individuels format : { "patient_uuid": { "heure": "10:00", "fin": "10:30" }, ... }
