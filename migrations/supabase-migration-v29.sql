-- ══════════════════════════════════════════════════════════
-- Migration v29 — Notifications Push V2 (soignants / médecins)
-- Date : 2026-04-24
--
-- Étend l'infrastructure Push V1 (migration v26) pour supporter
-- les soignants en plus des patients.
--
-- Modifications :
--   1. push_subscriptions : patient_id NULLABLE + ajout profile_id
--      + CHECK XOR (exactement un des deux non null)
--   2. push_last_message_staff : 1 ligne par soignant abonné
--      (miroir de push_last_message côté patient)
--   3. push_reminders_sent_groupe : anti-doublon des rappels 5 min
--      pour groupes A/B envoyés aux animateurs
--
-- Pattern : identique à la V1 (empty push + fetch), mais le SW
-- cherche d'abord un profile_id en IndexedDB puis fallback patient_id.
--
-- À exécuter dans Supabase → SQL Editor → New query.
-- ══════════════════════════════════════════════════════════

-- 1. push_subscriptions : patient_id nullable + ajout profile_id
ALTER TABLE public.push_subscriptions
  ALTER COLUMN patient_id DROP NOT NULL;

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Contrainte XOR : exactement un des deux doit être non null
ALTER TABLE public.push_subscriptions
  DROP CONSTRAINT IF EXISTS push_sub_one_owner;
ALTER TABLE public.push_subscriptions
  ADD CONSTRAINT push_sub_one_owner
  CHECK ((patient_id IS NULL) != (profile_id IS NULL));

CREATE INDEX IF NOT EXISTS idx_push_subs_profile
  ON public.push_subscriptions(profile_id);

-- 2. push_last_message_staff : 1 ligne par soignant (miroir de push_last_message)
CREATE TABLE IF NOT EXISTS public.push_last_message_staff (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  url TEXT,
  tag TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.push_last_message_staff ENABLE ROW LEVEL SECURITY;

-- Lecture ouverte (le SW fetch en anon pour afficher la notif)
DROP POLICY IF EXISTS "push_last_staff_read_public" ON public.push_last_message_staff;
CREATE POLICY "push_last_staff_read_public" ON public.push_last_message_staff
  FOR SELECT USING (true);

-- Écriture : service_role uniquement (via Edge Function send-push)
DROP POLICY IF EXISTS "push_last_staff_write_service" ON public.push_last_message_staff;
CREATE POLICY "push_last_staff_write_service" ON public.push_last_message_staff
  FOR ALL USING (true) WITH CHECK (true);

-- 3. push_reminders_sent_groupe : anti-doublon rappels groupes A/B
-- Clé unique : (slug, date, heure, animateur) car plusieurs animateurs possibles par créneau
CREATE TABLE IF NOT EXISTS public.push_reminders_sent_groupe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  groupe_slug TEXT NOT NULL,
  date_groupe DATE NOT NULL,
  heure TEXT NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (groupe_slug, date_groupe, heure, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_push_reminders_groupe_date
  ON public.push_reminders_sent_groupe(date_groupe);

ALTER TABLE public.push_reminders_sent_groupe ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_reminders_groupe_all_auth" ON public.push_reminders_sent_groupe;
CREATE POLICY "push_reminders_groupe_all_auth" ON public.push_reminders_sent_groupe
  FOR ALL USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────────────────
-- Vérifications (à copier-coller dans SQL Editor après le RUN)
-- ──────────────────────────────────────────────────────────
--
-- 1) Colonne profile_id présente et patient_id nullable :
--    \d+ public.push_subscriptions
--
-- 2) CHECK XOR fonctionne :
--    -- doit ÉCHOUER (les deux null) :
--    INSERT INTO push_subscriptions (endpoint, p256dh, auth_key)
--      VALUES ('x', 'y', 'z');
--    -- doit ÉCHOUER (les deux non null) :
--    INSERT INTO push_subscriptions (patient_id, profile_id, endpoint, p256dh, auth_key)
--      VALUES ('00000000-0000-0000-0000-000000000000',
--              '00000000-0000-0000-0000-000000000000', 'x', 'y', 'z');
--
-- 3) Tables créées :
--    SELECT table_name FROM information_schema.tables
--    WHERE table_schema = 'public'
--      AND table_name IN ('push_last_message_staff', 'push_reminders_sent_groupe');
