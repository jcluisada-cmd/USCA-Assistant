# Setup Notifications Push — USCA Connect

Ce document décrit **les 6 étapes manuelles** pour activer les notifications Push côté JC. Le code applicatif est déjà commité (v3.99).

## 🔑 Clés VAPID (générées 2026-04-23)

- **Clé publique** (déjà dans le code, `patient/index.html` → `VAPID_PUBLIC_KEY`) :
  ```
  BKomckT8drI5ai09njWpOnZG0Dt9A9mMxtr71KTeB43oQ8c6n0pUv5OcsxQaSLXnYp4a95GB9rC2LFNsnLZn6Q4
  ```

- **Clé privée** (secret — à configurer dans Supabase Edge Functions) :
  ```
  lfoamm6eSxJGaoRN6U4ca0pSOXgldwhhQyuSkJWXF4M
  ```

> ⚠ Si tu as déjà mis la clé privée dans Cloudflare Pages par erreur, retire-la de là (elle ne sert à rien dans Cloudflare pour cette architecture).

## 📋 Étapes dans le dashboard Supabase

### 1. Exécuter les migrations (SQL Editor)

Dans l'ordre :
1. `migrations/supabase-migration-v24.sql` (agenda perso — déjà fait)
2. `migrations/supabase-migration-v25.sql` (QCM tuteur réponses)
3. `migrations/supabase-migration-v26.sql` (tables push_subscriptions, push_last_message, push_reminders_sent)
4. `migrations/supabase-migration-v27.sql` (pg_cron — **mais d'abord** : remplacer `<PROJECT_REF>` par `pydxfoqxgvbmknzjzecn` et `<CRON_SECRET>` par une chaîne aléatoire que tu gardes)

### 2. Déployer l'Edge Function `send-push`

Dashboard Supabase → Edge Functions → New function → nommer `send-push`.
Coller le contenu de `supabase/functions/send-push/index.ts` dans l'éditeur web.
Cliquer **Deploy**.

### 3. Déployer l'Edge Function `cron-reminders`

Idem : New function → `cron-reminders` → coller `supabase/functions/cron-reminders/index.ts` → Deploy.

**⚠ Important : désactiver la vérification JWT pour `cron-reminders` uniquement.**
Par défaut Supabase impose un header `Authorization: Bearer …` sur toutes les
Edge Functions. pg_cron n'en envoie pas (on utilise `X-Cron-Secret` à la place,
vérifié dans le code). Sans ça : 401 UNAUTHORIZED_NO_AUTH_HEADER.

Dashboard → Edge Functions → `cron-reminders` → **Details** → désactiver
**"Verify JWT with legacy secret"** (ou toggle équivalent selon version UI) → Save.

`send-push` **garde** le JWT activé (appelée depuis navigateur admin/patient avec
le JWT anon, c'est correct).

### 4. Configurer les secrets Edge Functions

Dashboard Supabase → Edge Functions → **Secrets** (ou Settings → Edge Functions → Add secret). Ajouter :

| Secret | Valeur |
|---|---|
| `VAPID_PUBLIC_KEY` | `BKomckT8drI5ai09njWpOnZG0Dt9A9mMxtr71KTeB43oQ8c6n0pUv5OcsxQaSLXnYp4a95GB9rC2LFNsnLZn6Q4` |
| `VAPID_PRIVATE_KEY` | `lfoamm6eSxJGaoRN6U4ca0pSOXgldwhhQyuSkJWXF4M` |
| `VAPID_SUBJECT` | `mailto:jc.luisada@gmail.com` |
| `CRON_SECRET` | *(la même chaîne aléatoire que dans la migration v27)* |

Ces secrets sont partagés par toutes les fonctions du projet (OK).

### 5. Vérifier pg_cron

SQL Editor :
```sql
-- Le job est-il bien planifié ?
SELECT jobname, schedule, active FROM cron.job;
-- doit afficher : usca-push-reminders | * * * * * | t

-- Historique des exécutions (via JOIN car cron.job_run_details n'a que jobid)
SELECT d.start_time, d.status, d.return_message
FROM cron.job_run_details d
JOIN cron.job j ON j.jobid = d.jobid
WHERE j.jobname = 'usca-push-reminders'
ORDER BY d.start_time DESC
LIMIT 5;
-- doit afficher 'succeeded' + return_message = '1' (= pg_net request_id)

-- Réponses HTTP effectives de l'Edge Function
SELECT id, created, status_code, content, error_msg
FROM net._http_response
ORDER BY created DESC
LIMIT 5;
-- doit afficher status_code 200 + content '{"scanned":0}' (ou plus si events proches)
```

### 6. Test end-to-end

1. Ouvre la PWA patient sur téléphone (iPhone : Safari → partage → Ajouter à l'écran d'accueil).
2. Dans l'app patient, bouton engrenage en haut à droite → Paramètres → **Activer les notifications**.
3. Accepter la permission navigateur.
4. Connecte-toi côté admin → envoie un message au patient → la notif doit apparaître en ~1-2 sec.
5. Planifie un événement dans 6 min → attendre 1 min, le rappel "⏰ Rappel : …" doit arriver dans les 5 min avant.

## 🐛 Débogage

- **Notif pas reçue** :
  - SQL Editor : `SELECT * FROM push_subscriptions;` — la sub est-elle enregistrée ?
  - Supabase → Edge Functions → `send-push` → Logs — erreur ?
  - Service Worker dans DevTools (Application → Service Workers) — message reçu ?

- **Cron qui ne tourne pas** :
  - `SELECT * FROM cron.job_run_details WHERE status = 'failed' ORDER BY start_time DESC LIMIT 10;`
  - Vérifie que `pg_net` est bien activée : `SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');`

- **iOS ne reçoit rien** :
  - Vérifier que l'app est bien installée depuis l'écran d'accueil (pas Safari).
  - iOS ≥ 16.4 requis.
  - Mode avion / batterie faible peut bloquer.

## 📌 Limitations connues (V1)

- **Groupes thérapeutiques** (planning A/B) : pas de rappel 5 min (le planning est statique côté client). Workaround : un soignant peut planifier un événement explicite dans la BD.
- **Séances de thérapie complémentaire** : idem, pas de rappel automatique.
- **Craving** : pas de push (décision JC).

Ces 2 premiers points seront adressés dans une V2 si besoin.
