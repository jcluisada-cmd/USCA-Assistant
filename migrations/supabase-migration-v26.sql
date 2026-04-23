-- ══════════════════════════════════════════════════════════
-- Migration v26 — Infrastructure Web Push (notifications patient)
-- Date : 2026-04-23
-- Tables :
--   1. push_subscriptions : 1 ligne par appareil patient abonné
--   2. push_reminders_sent : anti-doublon pour les rappels 5 min avant
-- RLS :
--   - Patient peut insérer/supprimer ses propres subscriptions (auth anon
--     via contexte chambre+DDN, donc policy ouverte côté écriture)
--   - Soignants (medecin/ide/psy/admin) peuvent lire les subscriptions
--     d'un patient (pour envoyer les push via Edge Function)
-- À exécuter dans Supabase → SQL Editor → New query.
-- ══════════════════════════════════════════════════════════

-- Table des abonnements Push (un patient peut avoir plusieurs appareils)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(),
  UNIQUE(endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_patient ON public.push_subscriptions(patient_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Le patient (session anon via chambre+DDN) peut s'abonner/se désabonner
DROP POLICY IF EXISTS "push_subs_insert_public" ON public.push_subscriptions;
CREATE POLICY "push_subs_insert_public" ON public.push_subscriptions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "push_subs_delete_public" ON public.push_subscriptions;
CREATE POLICY "push_subs_delete_public" ON public.push_subscriptions
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "push_subs_update_public" ON public.push_subscriptions;
CREATE POLICY "push_subs_update_public" ON public.push_subscriptions
  FOR UPDATE USING (true);

-- Les soignants authentifiés lisent (pour trigger les envois)
DROP POLICY IF EXISTS "push_subs_read_staff" ON public.push_subscriptions;
CREATE POLICY "push_subs_read_staff" ON public.push_subscriptions
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Table du dernier message à notifier pour chaque patient (1 ligne/patient)
-- Pattern "push vide + fetch" : le service worker reçoit un push sans data,
-- puis fetch ce row pour afficher le contenu de la notif. Ça évite d'avoir
-- à implémenter la crypto aes128gcm (RFC 8291) dans l'Edge Function.
CREATE TABLE IF NOT EXISTS public.push_last_message (
  patient_id UUID PRIMARY KEY REFERENCES public.patients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  url TEXT,
  tag TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.push_last_message ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_last_message_read_public" ON public.push_last_message;
CREATE POLICY "push_last_message_read_public" ON public.push_last_message
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "push_last_message_write_auth" ON public.push_last_message;
CREATE POLICY "push_last_message_write_auth" ON public.push_last_message
  FOR ALL USING (true) WITH CHECK (true);

-- Table anti-doublon pour les rappels 5 min avant
CREATE TABLE IF NOT EXISTS public.push_reminders_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evenement_id UUID REFERENCES public.evenements(id) ON DELETE CASCADE NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(evenement_id)
);

CREATE INDEX IF NOT EXISTS idx_push_reminders_evt ON public.push_reminders_sent(evenement_id);

ALTER TABLE public.push_reminders_sent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_reminders_all_auth" ON public.push_reminders_sent;
CREATE POLICY "push_reminders_all_auth" ON public.push_reminders_sent
  FOR ALL USING (true) WITH CHECK (true);
