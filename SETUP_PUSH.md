# Setup infrastructure Supabase — USCA Connect

> **Pour Claude (future session)** : ce document est la **source de vérité de l'état du setup**. À chaque nouvelle fonctionnalité avec migration ou Edge Function, mettre à jour la checklist ci-dessous. Quand JC dit « lis setup_push.md », commence par afficher la checklist et proposer les actions restantes (cases non cochées) **avant** d'attaquer le chantier en cours.

---

## ✅ État actuel du setup (à jour au 2026-05-13)

> ⚠️ **À lire avant tout chantier push** : §Incident 2026-05-13 en bas du document. Le toggle "Verify JWT" de `send-push` doit IMPÉRATIVEMENT rester désactivé sinon tous les rappels cron rebondissent en 401.

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
| v30 | Push V2 pause vacances : `profiles.push_pause_until DATE` | ✅ (vérifié 2026-05-13 : colonne lue sans erreur par send-push) |
| v31 | Fix RLS push_subscriptions : SELECT ouverte (débloque activation patient + notif message patient→médecin) | ✅ |
| v32 | P5 Personnalisation modules : table `role_modules_hidden` (absence=visible) + RLS (SELECT auth, INSERT/UPDATE/DELETE admin) | ✅ |

> Migrations v33-v37 livrées entretemps — voir `DB_SCHEMA.md` §Historique pour le détail (substances_patient, push_preferences, permissions_delete_auth, push_reminders patient atelier, motifs refus permission).

### Edge Functions Supabase

| Function | État | JWT verify |
|---|---|---|
| `send-push` | ✅ Déployée (V3 personnalisable push_preferences + pause vacances + silence 8h30-18h Europe/Paris) | ❌ **DOIT rester désactivé** (régression observée 2026-05-13, voir §Incident) — appelée par cron-reminders avec service_role ; JWT verify legacy rejette les appels serveur-à-serveur. Sécurité côté obscurité des VAPID keys + identifiants non guessables |
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
- [x] Test V2 soignant : rappel event perso (validé 2026-04-24 après fix JWT verify send-push)
- [ ] Test V2 soignant : message patient → notif médecin
- [ ] Test V2 soignant : rappel groupe A/B aux animateurs

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
- [x] Exécuter migration v30 (pause vacances)
- [x] Exécuter migration v31 (fix RLS SELECT — débloque activation patient + trigger message patient→médecin) (2026-04-24)
- [x] Vérification post-incident 2026-05-13 : toggle JWT verify `send-push` remis à OFF (cron-reminders à nouveau capable d'appeler send-push, plus de 401 en `net._http_response`)
- [ ] Test réel notifs Android — prévu vendredi 2026-05-15 (event perso T-10 + message patient en plage 8h30-18h)

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

## 🔕 Silence soignant (v4.02)

Les notifs push à un soignant (profile_id ou profile_ids) sont bloquées dans `send-push` sauf dans la plage **lundi-vendredi, 8h30 → 16h00** (heure Europe/Paris), en dehors des jours fériés France.

Donc blocage si :
- En **semaine avant 8h30**
- En **semaine à partir de 16h00**
- Le **weekend** (toute la journée)
- Un **jour férié** France (liste `FERIES_FR` hardcodée dans la fonction, à étendre année par année)

La fonction renvoie alors `{ sent: 0, reason: 'staff_quiet_hours', detail: 'before_830'|'after_16h'|'weekend'|'ferie' }` avec status 200. Aucune ligne n'est écrite dans `push_last_message_staff` (pas de notif fantôme).

Les notifs patients (patient_id) ne sont **jamais** bloquées par cette règle.

Pour modifier : éditer `FERIES_FR` et la fonction `isStaffQuietHours` dans `supabase/functions/send-push/index.ts`, puis redéployer via le dashboard.

## 🏖️ Pause vacances (v4.03)

Chaque soignant peut suspendre temporairement ses notifs push via **Modal Paramètres → section "Pause vacances"** :
- Date picker "Dernier jour d'absence" (inclus) + bouton "Mettre en pause"
- Une fois en pause : bandeau orange "📴 Notifications en pause jusqu'au [date]" + bouton "Reprendre maintenant"
- **Reprise automatique** le lendemain sans action (check `today_paris > push_pause_until` dans send-push)
- La sub push en base est **préservée** (pas de désinscription navigateur)

Côté BDD : `profiles.push_pause_until DATE NULL` (migration v30).
Côté Edge Function : `send-push` fetch les profiles ciblés, filtre ceux en pause, renvoie `{ reason: 'all_on_vacation' }` si tout le monde est absent.

---

## 🚨 Incident 2026-05-13 — JWT verify silencieusement réactivé sur `send-push`

### Symptôme
- Aucune notification push depuis le 2026-05-07 (rappels rdv perso, messages patients, demandes de permission)
- `push_last_message_staff` figée au 2026-05-07 12:20 (dernière ligne : "⏰ Consultation suivi MPH")
- `cron-reminders` retourne `{"patients":0,"perso":0,"groupes":0,"failed":0}` à chaque tour (le cron tourne pourtant chaque minute, status 200)

### Cause racine
Le toggle **"Verify JWT with legacy secret"** sur `send-push` avait été réactivé (cause inconnue : peut-être un re-deploy via dashboard, peut-être un changement de défaut Supabase). Conséquence :
- `cron-reminders` appelle `send-push` en interne avec `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` (cf. `supabase/functions/cron-reminders/index.ts:164`)
- Le JWT verify legacy de Supabase rejette les JWT signés avec `service_role` (paradoxal mais documenté), seul l'`anon` JWT est accepté
- Résultat : **HTTP 401 systématique** sur tous les appels du cron, `execution_id: null` (la fonction n'est même pas exécutée)
- Diagnostic visible dans Dashboard → Edge Functions → `send-push` → Logs : paires de POST 401 toutes les minutes
- Confirmation par `SELECT id, created, status_code FROM net._http_response ORDER BY created DESC` : succession de status_code 401

### Fix
1 toggle dashboard, pas de modif code :
- Dashboard → Edge Functions → `send-push` → Details
- Désactiver "Verify JWT with legacy secret"
- Save (prise d'effet immédiate, pas besoin de redéployer)

### Validation
```sql
-- Doit ne renvoyer QUE des status_code: 200
SELECT id, created, status_code, LEFT(content, 80) AS body
FROM net._http_response
WHERE created > NOW() - INTERVAL '5 minutes'
ORDER BY created DESC LIMIT 10;
```
Validé en SQL 2026-05-13. Tests réels Android prévus vendredi 2026-05-15 (event perso à T-10 + message patient en plage 8h30-18h).

### Prévention future
- **Ne jamais** réactiver Verify JWT sur `send-push` tant que `cron-reminders` l'appelle avec service_role. Si on veut réactiver, il faut d'abord changer le pattern (ex: passer un `X-Cron-Secret` partagé et le vérifier côté send-push, comme c'est déjà fait pour `cron-reminders`)
- Tout re-deploy via dashboard de `send-push` (notamment via le Web Editor) peut réinitialiser ce toggle — préférer le redéploiement via copier-coller code identique en gardant un œil sur le toggle après save
- Surveillance : si `push_last_message_staff` n'a pas de nouvelle ligne pendant 24-48h alors qu'il y a de l'activité sur l'app, vérifier `net._http_response` en SQL pour repérer un éventuel retour des 401
