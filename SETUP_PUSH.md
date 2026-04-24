# Setup infrastructure Supabase — USCA Connect

> **Pour Claude (future session)** : ce document est la **source de vérité de l'état du setup**. À chaque nouvelle fonctionnalité avec migration ou Edge Function, mettre à jour la checklist ci-dessous. Quand JC dit « lis setup_push.md », commence par afficher la checklist et proposer les actions restantes (cases non cochées) **avant** d'attaquer le chantier en cours.

---

## ✅ État actuel du setup (à jour au 2026-04-24)

### Migrations Supabase (SQL Editor)

| Migration | But | Exécutée |
|---|---|---|
| v23 | Robustification animateurs (FK groupe_animateurs→profiles CASCADE + policy DELETE admin) | ✅ |
| v24 | Agenda perso privé (type='personnel' + RLS cree_par=auth.uid()) | ✅ |
| v25 | Vue tuteur : accès aux `qcm_reponses` des externes (RLS) | ✅ |
| v26 | Tables `push_subscriptions`, `push_last_message`, `push_reminders_sent` | ✅ |
| v27 | pg_cron + pg_net, job `usca-push-reminders` toutes les minutes | ✅ |
| v28 | Colonne `sexe` sur `patients` (label Patient/Patiente/Patient·e) | ✅ |
| v29 | Push V2 soignants : `push_subscriptions.patient_id` nullable + `profile_id` (CHECK XOR), tables `push_last_message_staff` et `push_reminders_sent_groupe` | ✅ |

### Edge Functions Supabase

| Function | État | JWT verify |
|---|---|---|
| `send-push` | ✅ Déployée V2 (accepte patient_id \| profile_id \| profile_ids) | ✅ Activé (appelée depuis navigateur avec JWT anon) |
| `cron-reminders` | ✅ Déployée V2 (3 scans : patients + events perso + groupes A/B) | ❌ Désactivé (protégée par CRON_SECRET via header) |

### Secrets Edge Functions

| Secret | État |
|---|---|
| `VAPID_PUBLIC_KEY` | ✅ Configuré |
| `VAPID_PRIVATE_KEY` | ✅ Configuré |
| `VAPID_SUBJECT` | ✅ Configuré (`mailto:jc.luisada@gmail.com`) |
| `CRON_SECRET` | ✅ Configuré (même valeur que dans migration v27) |

### Tests

- [ ] Test end-to-end notifs Push V1 patient (voir section "Test" ci-dessous) — à faire par JC
- [ ] Test end-to-end notifs Push V2 soignant (activation, réception message patient, rappel groupe) — après commit 5

### État V2 (code livré 2026-04-24)

- [x] Migration v29 créée et exécutée (2026-04-24)
- [x] send-push Edge Function étendue (accepte profile_id / profile_ids[]) — code dans `supabase/functions/send-push/index.ts`
- [x] SW sw.js priorise profile_id puis patient_id (clés IDB séparées, cleanup au logout) — CACHE_NAME bumpé à `usca-v4.01`
- [x] Helpers `savePushSubscriptionStaff`, `sendPushToStaff`, `getSubscribedMedecinIds` dans `shared/supabase.js`
- [x] UI Paramètres admin (engrenage ⚙️ → modal avec toggle activation push)
- [x] Trigger message patient → push médecins abonnés (fire-and-forget)
- [x] Cron étendu : consultations perso (créateur) + groupes A/B aux animateurs (avec gestion annulation et nouvelle_heure)

### 🚨 Actions à faire côté JC avant test V2

- [x] Redéployer `send-push` (2026-04-24)
- [x] Redéployer `cron-reminders` (2026-04-24)
- [ ] Lancer les tests ci-dessous (voir section "Test end-to-end notifs Push V2")

---

## 🔑 Clés VAPID (générées 2026-04-23)

- **Publique** (`patient/index.html` → `VAPID_PUBLIC_KEY`, partagée avec tout le monde) :
  ```
  BKomckT8drI5ai09njWpOnZG0Dt9A9mMxtr71KTeB43oQ8c6n0pUv5OcsxQaSLXnYp4a95GB9rC2LFNsnLZn6Q4
  ```

- **Privée** (secret Supabase, **JAMAIS en Cloudflare Pages**) :
  ```
  lfoamm6eSxJGaoRN6U4ca0pSOXgldwhhQyuSkJWXF4M
  ```

---

## 📋 Procédure détaillée (pour futures migrations / fonctions)

### 1. Exécuter une migration Supabase
Dashboard Supabase → **SQL Editor** → New query → coller le contenu de `migrations/supabase-migration-vXX.sql` → Run.

### 2. Déployer une Edge Function via le dashboard (sans CLI)
Dashboard → **Edge Functions** → **Deploy a new function** → "Via Editor" → nommer (ex: `send-push`) → coller le contenu du fichier `supabase/functions/<nom>/index.ts` → **Deploy function**.

### 3. Désactiver JWT verify sur une fonction invoquée par pg_cron
Dashboard → Edge Functions → `<nom>` → **Details** → toggle **"Verify JWT with legacy secret"** → Save.
(À faire systématiquement pour les fonctions appelées par pg_cron, jamais pour celles appelées depuis le navigateur.)

### 4. Ajouter un secret Edge Function
Dashboard → Edge Functions → **Secrets** (ou Settings → Edge Functions → Add secret) → Name + Value → Save. Partagé par toutes les fonctions.

---

## 🧪 Test end-to-end notifs Push V1

1. Sur ton téléphone : ouvre la PWA patient (iPhone : Safari → bouton partage → Ajouter à l'écran d'accueil).
2. Connecte-toi en tant que **patient** (chambre + DDN).
3. Bouton engrenage ⚙️ en haut à droite → **Paramètres** → "Activer les notifications" → accepter le prompt.
4. Verrouille l'écran du téléphone.
5. Depuis un ordi, connecte-toi en **soignant** → détail du patient → envoie un message.
6. Le téléphone doit recevoir "💬 Nouveau message" en 1-3 sec.
7. Planifie un événement dans 6 min → attendre 1 min, le rappel "⏰ Rappel : …" doit arriver à T-5.

## 🧪 Test end-to-end notifs Push V2 (soignant médecin)

**Prérequis** : Edge Functions `send-push` et `cron-reminders` redéployées depuis le code V2.

1. **Activation** : sur ton téléphone, ouvre la PWA **admin** (installée en "Ajouter à l'écran d'accueil"). Login médecin → ⚙️ engrenage en haut à droite → "Activer les notifications" → accepter.
2. Vérif BDD : `SELECT profile_id, user_agent FROM push_subscriptions WHERE profile_id IS NOT NULL;` → ta ligne doit apparaître.
3. Verrouille l'écran du téléphone.
4. **Test message patient → médecin** : depuis un autre appareil (ou ordi), connecte-toi en patient (chambre + DDN), envoie un message. Le téléphone médecin doit recevoir "💬 Message de Ch.XX" en 1-3 sec.
5. **Test rappel consultation perso** : sur la PWA admin, agenda perso → planifie une consultation dans 6 min. Attendre 1 min → rappel "⏰ [Titre]" à T-5.
6. **Test rappel groupe A/B** : dans admin, désigne-toi animateur d'un groupe (ex: "Craving et RRD" le mardi 14:30). Le mardi à 14:25, tu dois recevoir "⏰ Groupe : Craving…". (Tester en décalant manuellement l'horaire du groupe via `groupe_modifications.nouvelle_heure` est plus pratique pour ne pas attendre le vrai créneau.)

**Astuce pour tester le rappel groupe rapidement** :
```sql
-- Simule que le groupe 'craving-rrd' commence dans 5 min aujourd'hui (ex: il est 15:00, on met 15:05)
INSERT INTO groupe_modifications (groupe_slug, date_effet, nouvelle_heure)
VALUES ('craving-rrd', CURRENT_DATE, to_char(NOW() AT TIME ZONE 'Europe/Paris' + INTERVAL '5 min', 'HH24:MI'))
ON CONFLICT (groupe_slug, date_effet) DO UPDATE SET nouvelle_heure = EXCLUDED.nouvelle_heure, annule = false;
-- Attendre 1 min → rappel reçu. Puis nettoyer :
DELETE FROM groupe_modifications WHERE groupe_slug = 'craving-rrd' AND date_effet = CURRENT_DATE;
DELETE FROM push_reminders_sent_groupe WHERE groupe_slug = 'craving-rrd' AND date_groupe = CURRENT_DATE;
```

---

## 🐛 Débogage

### Cron qui tourne mais en échec
```sql
-- Historique des exécutions pg_cron
SELECT d.start_time, d.status, d.return_message
FROM cron.job_run_details d
JOIN cron.job j ON j.jobid = d.jobid
WHERE j.jobname = 'usca-push-reminders'
ORDER BY d.start_time DESC LIMIT 5;
-- 'succeeded' + return_message = '1' (= pg_net request_id async)

-- Réponses HTTP effectives
SELECT id, created, status_code, content, error_msg
FROM net._http_response
ORDER BY created DESC LIMIT 5;
-- 200 + {"scanned":0} = OK
-- 401 UNAUTHORIZED_NO_AUTH_HEADER = oublie de désactiver JWT verify
-- 404 NOT_FOUND = fonction pas déployée
```

### Notif pas reçue
- `SELECT * FROM push_subscriptions;` → la sub est-elle enregistrée ?
- Dashboard → Edge Functions → `send-push` → Logs → erreur ?
- DevTools navigateur → Application → Service Workers → message reçu ?

### iOS
- PWA installée depuis l'écran d'accueil obligatoire (pas Safari).
- iOS ≥ 16.4 requis.
- Mode avion / batterie faible peut bloquer.

---

## 📌 Limitations V1 (à adresser en V2)

- **Groupes thérapeutiques** (planning A/B) : pas de rappel 5 min (le planning est côté client). À porter dans l'Edge Function pour la V2.
- **Séances de thérapie complémentaire** : idem.
- **Craving** : pas de push (décision JC).
- **Soignants** : pas encore destinataires (V2 prévue : médecins uniquement).
