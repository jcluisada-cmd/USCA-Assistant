# Plan d'implémentation : USCA Toolbox (V1) → Unité Connect (V2)

---

## État des lieux

| | V1 (actuelle) | V2 (cible) |
|---|---|---|
| **Fichiers** | 1 seul `index.html` (1048 lignes) + `sw.js` + `manifest.json` | Multi-pages (4 HTML + 5 JS modules + 1 Cloudflare Function) |
| **Stack** | React 18 + Babel in-browser, zéro backend | Tailwind CSS + Supabase (auth/BDD/realtime) + jsPDF + Slack |
| **Public** | Soignants uniquement | Soignants **ET** patients |
| **Données** | 100% client-side (constantes JS) | Client-side (clinique) + Supabase (patients, alertes, groupes) |

---

## Architecture cible — Arborescence des fichiers

```
USCA-Assistant/
├── index.html                  ← Routeur Patient / Staff (V2, indigo/emerald)
├── patient/
│   └── index.html              ← Interface patient (timeline, craving, PDF)
├── staff/
│   ├── index.html              ← Dashboard staff (alertes, groupes, config)
│   └── toolbox.html            ← V1 Toolbox extraite verbatim (iframe)
├── shared/
│   ├── supabase.js             ← Client Supabase + CRUD helpers
│   ├── auth.js                 ← Gestion session, PIN lock, inactivité
│   ├── rbac.js                 ← Contrôle des rôles et modules visibles
│   ├── slack.js                ← Client pour le proxy Slack
│   └── pdf.js                  ← Génération PDF (jsPDF)
├── functions/
│   └── api/
│       └── slack.js            ← Cloudflare Pages Function (proxy webhook)
├── manifest.json               ← Manifeste PWA V2
└── sw.js                       ← Service Worker multi-pages
```

### Stratégie d'intégration V1→V2

La Toolbox V1 est intégrée dans un `<iframe>` plutôt que refactorée composant par composant. Le code V1 est un monolithe auto-suffisant (son propre React root, son propre CSS, sa propre navigation par état). L'extraire composant par composant reviendrait à réécrire 1048 lignes de code clinique validé — risque majeur de régression sur du contenu médical. L'iframe isole parfaitement les deux univers CSS/JS tout en permettant la communication via `postMessage` si nécessaire.

### Proxy Slack via Cloudflare Pages Function

Les sites statiques Cloudflare Pages n'ont pas accès aux variables d'environnement côté serveur. Le plan prévoit une Function (`functions/api/slack.js`) qui agit comme proxy — elle lit le webhook URL depuis l'env serveur et le transmet à Slack. C'est gratuit, intégré au déploiement, et ça évite d'exposer le secret dans le code client.

---

## Les 8 phases d'implémentation

### Phase 1 — Fondation (~2-3 sessions)

| Étape | Action | Risque |
|---|---|---|
| 1.1 | Créer branche `v2` (GitHub Desktop) — protège la V1 en production | Bas |
| 1.2 | Copier `index.html` → `staff/toolbox.html` (ajuster les chemins sw.js/manifest) | Bas |
| 1.3 | Nouveau `index.html` racine : écran de choix Patient/Staff, Tailwind CDN, palette indigo | Bas |
| 1.4 | `staff/index.html` : shell avec navigation (Dashboard, Toolbox, Alertes, Groupes, Config) + iframe vers `toolbox.html` | **Moyen** — tester l'iframe sur iOS Safari |
| 1.5 | `patient/index.html` : shell avec placeholders (login, timeline, craving, fiche) | Bas |
| 1.6 | Mettre à jour `manifest.json` (nom "USCA Connect", palette indigo) | Bas |
| 1.7 | Mettre à jour `sw.js` (cache `usca-v2.0`, multi-pages, network-first pour Supabase) | **Moyen** |

**Livrable** : Squelette multi-pages fonctionnel. La Toolbox V1 tourne dans l'onglet Staff.

#### Détails techniques Phase 1

- **1.2 — Extraction Toolbox** : Copie verbatim du `index.html` actuel. Seuls les chemins relatifs changent (`../sw.js`, `../manifest.json`). Le fichier conserve l'intégralité du code React : constantes cliniques (SUBSTANCES, SCORES, INTERACTIONS, BZD_EQ, SEJOUR, ELSA), composants (ScoreCalc, BZDCalc, SubDetail, InterCheck, SejourView, ELSAView, ComorView, AdmView, FeedbackView, App), objets C (couleurs) et I (icônes SVG).

- **1.3 — Entry point V2** : HTML pur + Tailwind CDN (`https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4`). Deux grandes cartes : "Je suis soignant" → `/staff/` et "Je suis patient" → `/patient/`. Palette V2 indigo/emerald. Pas de React côté V2, vanilla JS.

- **1.4 — Staff shell** : L'onglet "Toolbox" charge `toolbox.html` dans un iframe pleine largeur, hauteur `calc(100vh - 120px)`. Paramètre `?embedded=true` pour masquer la bottom-nav V1 et éviter la double navigation.

- **1.7 — Service Worker** : `CACHE_NAME = 'usca-v2.0'`. ASSETS incluent tous les HTML, JS partagés, CDN (React, Babel, Tailwind, Supabase SDK, jsPDF). Stratégie cache-first pour les statiques, network-first pour les appels Supabase (`*.supabase.co`).

---

### Phase 2 — Authentification (~3-4 sessions)

| Étape | Action | Risque |
|---|---|---|
| **Pré-requis** | Créer projet Supabase (gratuit), noter URL + anon key | Manuel |
| 2.1 | `shared/supabase.js` : init client Supabase via CDN, fonctions `signInStaff()`, `verifyPatient()` | **Moyen** |
| 2.2 | `shared/auth.js` : `isAuthenticated()`, `requireAuth()`, `setupInactivityLock()`, `hashPin()` via Web Crypto API | Moyen |
| 2.3 | Login Staff dans `staff/index.html` : email + mot de passe → session Supabase → fetch profil | Moyen |
| 2.4 | Login Patient dans `patient/index.html` : chambre + date naissance → vérification en BDD | **Haut** |
| 2.5 | Overlay PIN après 1h d'inactivité, clavier numérique à gros boutons | Bas |

#### Détails techniques Phase 2

- **Supabase SDK** : Chargé via CDN UMD (`https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`), attaché à `window.supabase`. Approche UMD plutôt que ES modules pour éviter les problèmes de compatibilité sans bundler.

- **Auth Patient** : Query `SELECT id, prenom, programme_id FROM patients WHERE numero_chambre = :room AND date_naissance = :dob AND date_sortie_prevue >= CURRENT_DATE`. Stockage en `sessionStorage` : `patient_id` et `prenom` uniquement (pas de PII).

- **PIN Lock** : SHA-256 via `crypto.subtle.digest` (Web Crypto API, requiert HTTPS — garanti par Cloudflare). Timer d'inactivité dans `sessionStorage`. 3 échecs PIN → re-login complet.

- **Sécurité auth patient** : L'auth chambre+DDN est faible par nature. Mitigations : rate-limiting client (3 tentatives → 5 min blocage), périmètre limité (prénom + programme, pas de données médicales), contexte réseau hospitalier. Amélioration future possible : token unique généré à l'admission.

---

### Phase 3 — Base de données (~2-3 sessions)

| Étape | Action | Risque |
|---|---|---|
| 3.1 | Exécuter le SQL dans Supabase : `programmes` → `profiles` → `patients` → `groupes` → `alertes` + index | Bas |
| 3.2 | Politiques RLS sur les 5 tables | **Haut** — tester chaque politique |
| 3.3 | Ajouter les CRUD helpers dans `shared/supabase.js` | Bas |
| 3.4 | Données initiales : programme template + profil admin | Bas |

#### Détails techniques Phase 3

**Ordre de création des tables** (à cause des FK) :
1. `programmes`
2. `profiles` (FK vers `auth.users(id)`)
3. `patients` (FK vers `programmes(id)`)
4. `groupes` (FK vers `profiles(id)`)
5. `alertes` (FK vers `patients(id)` et `profiles(id)`)

**Modifications par rapport au schéma INSTRUCTIONS_PROJET.md** :
- Table `alertes` : ajouter colonne `numero_chambre TEXT` (dénormalisée, pour les messages Slack sans jointure)
- Index : `idx_alertes_statut`, `idx_alertes_patient`, `idx_patients_chambre`

**Politiques RLS** :

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | Authentifié | Admin | Propre ligne | Admin |
| `patients` | Tous (anon + auth) | Authentifié | Authentifié | Authentifié |
| `programmes` | Tous | Authentifié | Authentifié | Authentifié |
| `groupes` | Tous | Authentifié | Authentifié | Authentifié |
| `alertes` | Authentifié | Tous (patients anon) | Authentifié | Authentifié |

**CRUD Helpers** :
- Patients : `getPatients()`, `getPatientByRoom(room, dob)`, `createPatient(data)`, `updatePatient(id, data)`
- Alertes : `createAlerte(data)`, `getAlertesNonTraitees()`, `getAlertesHistorique(limit)`, `updateAlerteStatut(id, statut, traitee_par)`
- Groupes : `getGroupes()`, `getGroupesByDate(date)`, `createGroupe(data)`, `updateGroupe(id, data)`, `updatePresence(id, participants)`
- Programmes : `getProgrammes()`, `getProgrammeById(id)`, `createProgramme(data)`
- Profiles : `getProfile(userId)`, `updateProfile(id, data)`, `getAllProfiles()`

---

### Phase 4 — RBAC (~1-2 sessions)

| Étape | Action | Risque |
|---|---|---|
| 4.1 | `shared/rbac.js` : constante `MODULE_DEFS` + fonctions `canAccess()`, `getVisibleModules()` | Bas |
| 4.2 | `staff/index.html` : après login, n'afficher que les modules permis par le rôle. Badge "Lecture seule" pour étudiants | Bas |

#### Matrice des rôles

| Module | Admin | Médecin | IDE | Étudiant | Animateur |
|---|---|---|---|---|---|
| Toolbox | ✅ | ✅ | ✅ | 👁️ Lecture | ❌ |
| Dashboard | ✅ | ✅ | ✅ | ❌ | ❌ |
| Alertes | ✅ | ✅ | ✅ | ❌ | ❌ |
| Groupes | ✅ | ✅ | ✅ | ❌ | ✅ |
| Config Patient | ✅ | ✅ | ✅ | ❌ | ❌ |

---

### Phase 5 — Interface Patient (~3-4 sessions)

| Étape | Action | Risque |
|---|---|---|
| 5.1 | Timeline verticale du programme du jour (indicateur heure actuelle, activités passées grisées) | Moyen |
| 5.2 | Bouton craving rouge proéminent → modal intensité 1-10 → INSERT alertes + Slack → cooldown 30s | **Moyen** |
| 5.3 | `shared/pdf.js` + bouton "Ma fiche de prévention" → PDF jsPDF avec prévention + contacts urgence | Bas |
| 5.4 | Mode offline : programme en cache `localStorage`, craving désactivé avec message "Connexion requise" | Bas |

#### Détails techniques Phase 5

- **Timeline** : Données depuis `programmes.activites` (JSONB array `{heure, label, type, lieu}`). Timeline verticale avec marqueurs horaires à gauche, cartes activités à droite. Ligne verte = heure actuelle. Activités passées grisées.

- **Craving** : Alerte optimiste (confirmation immédiate, retry en arrière-plan si réseau lent). Si offline, queue dans `localStorage`, envoi au retour en ligne.

- **PDF** : jsPDF via CDN (`https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`). Contenu : prénom patient, substance, stratégies de prévention, contacts urgence (3114, CSAPA, CAARUD, AA/NA), rendez-vous de suivi. Branding USCA Connect.

---

### Phase 6 — Dashboard Staff (~4-5 sessions) — la plus complexe

| Étape | Action | Risque |
|---|---|---|
| 6.1 | Grille des chambres (cartes avec prénom, substance, jours de séjour, point rouge si alerte) | Moyen |
| 6.2 | Panel alertes non traitées (tri par date, badges type, boutons "Prise en charge" / "Traitée") | Bas |
| 6.3 | Gestion groupes (liste du jour, présence cochable, modification horaire, création) | Bas |
| 6.4 | Config patient (formulaire chambre/DDN/substance/programme template) | Bas |
| 6.5 | Onglet Toolbox = iframe `toolbox.html?embedded=true` (masque la nav V1 quand embed) | **Moyen** |

#### Détails techniques Phase 6

- **6.1 — Room overview** : Grid Tailwind `grid grid-cols-2 md:grid-cols-3 gap-3`. Jointure patients + dernière alerte. Cards cliquables → détail patient.

- **6.2 — Alertes** : Badges par type (craving=rouge, demande=bleu, effet_indesirable=ambre, urgence=rouge pulsant). Boutons d'action : "Prise en charge" (`statut='en_cours'`, `traitee_par=user_id`) et "Traitée" (`statut='traitee'`).

- **6.5 — Iframe** : Ajouter détection `?embedded=true` dans `toolbox.html` pour masquer conditionnellement la bottom-nav V1. Hauteur iframe : `calc(100vh - 120px)`. Fallback iOS : `-webkit-fill-available`.

---

### Phase 7 — Temps réel (~2-3 sessions)

| Étape | Action | Risque |
|---|---|---|
| **Pré-requis** | Activer Realtime pour la table `alertes` dans Supabase Dashboard | Manuel |
| 7.1 | Listener `postgres_changes` INSERT sur `alertes` côté staff → vibration + toast + badge + notification système | **Haut** |
| 7.2 | Historique alertes avec filtres (type, statut, période) + pagination | Bas |
| 7.3 | Côté patient : listener sur la mise à jour du statut de son alerte → message de confirmation | Bas |

#### Détails techniques Phase 7

- **Listener staff** :
  ```javascript
  supabase.channel('alertes-realtime')
    .on('postgres_changes', {event:'INSERT', schema:'public', table:'alertes'}, handleNewAlert)
    .subscribe()
  ```

- **handleNewAlert** : vibration (`navigator.vibrate([200, 100, 200])`), toast en haut de page, mise à jour badge compteur, notification système (Notification API si permission accordée), son optionnel (Web Audio API).

- **Reconnexion** : Supabase auto-reconnecte. En plus, sur `document.addEventListener('visibilitychange')`, rafraîchir la liste d'alertes via un fetch explicite.

- **Patient** : Après envoi d'alerte, subscribe aux updates de cette alerte. `statut='en_cours'` → "Un soignant prend en charge votre demande". `statut='traitee'` → "Votre demande a été traitée".

---

### Phase 8 — PWA + Slack (~2-3 sessions)

| Étape | Action | Risque |
|---|---|---|
| **Pré-requis** | Créer app Slack + webhook, ajouter `SLACK_WEBHOOK_URL` dans env vars Cloudflare | Manuel |
| 8.1 | `functions/api/slack.js` : Cloudflare Pages Function proxy (lit l'env var, forward à Slack) | Moyen |
| 8.2 | `shared/slack.js` : `sendSlackAlert()` → POST vers `/api/slack` | Bas |
| 8.3 | Finaliser `sw.js` : cache-first statiques, network-only Supabase + `/api/slack`, background sync | Moyen |
| 8.4 | Tests PWA : Lighthouse, install Android/iOS, offline, queued alerts | Bas |

#### Détails techniques Phase 8

- **Cloudflare Pages Function** : Fichier `functions/api/slack.js` = endpoint `POST /api/slack`. Accepte `{type, message}`, lit `env.SLACK_WEBHOOK_URL`, forward à Slack. Rate-limiting (1 req/5s par IP).

- **Service Worker final** :
  - Cache-first : HTML, JS, CSS, fonts, CDN
  - Network-only : `*.supabase.co/*`, `/api/slack`
  - Background sync : alertes en queue si offline → replay au retour en ligne (Chrome uniquement, fallback `localStorage` pour Safari)
  - Version : `usca-v2.1`

---

## Graphe de dépendances

```
Phase 1 (Fondation)
  │
  ├──► Phase 2 (Auth) ◄── [Supabase projet créé]
  │       │
  │       └──► Phase 4 (RBAC) ──► Phase 6 (Dashboard Staff)
  │                                      │
  Phase 3 (BDD) ◄── [Supabase projet]   │
  │       │                              │
  │       └──► Phase 5 (Patient) ────────┤
  │                                      │
  │                                      ▼
  │                              Phase 7 (Realtime)
  │                                      │
  └──────────────────────────────► Phase 8 (PWA + Slack)
```

---

## Risques majeurs et mitigations

| # | Risque | Sévérité | Mitigation |
|---|---|---|---|
| 1 | **iframe V1 sur iOS Safari** (scroll, hauteur) | Moyen | `-webkit-overflow-scrolling: touch`, hauteur explicite, `?embedded=true` pour masquer la double nav |
| 2 | **Reconnexion Realtime** quand le téléphone se verrouille | Haut | Auto-reconnexion Supabase + refresh sur `visibilitychange` + Notification API |
| 3 | **Auth patient faible** (chambre + DDN brute-forceable) | Moyen | Rate-limiting client, données limitées (prénom + programme), réseau hospitalier |
| 4 | **Pas de bundler** = gros CDN | Bas | ~315 KB total gzippé, cachés par le SW après 1er chargement |
| 5 | **Exposition webhook Slack** | Haut → résolu | Proxy Cloudflare Pages Function — le secret reste côté serveur |
| 6 | **Dérive V1/V2** si modification clinique pendant le dev | Moyen | Geler la V1, tout développement sur branche `v2` uniquement |
| 7 | **Modules ES sans bundler** | Moyen | Utiliser les builds UMD via CDN + `window.*` plutôt que `import/export` |
| 8 | **Pages Functions = déploiement hybride** | Bas | Inclus gratuit avec Cloudflare Pages, même repo, même push |

---

## Estimation d'effort

| Phase | Complexité | Sessions estimées | Déployable indépendamment |
|---|---|---|---|
| 1 — Fondation | Basse | 2-3 | Oui — squelette statique |
| 2 — Auth | Moyenne | 3-4 | Oui — avec Phase 3 |
| 3 — BDD | Moyenne | 2-3 | Oui — avec Phase 2 |
| 4 — RBAC | Basse | 1-2 | Oui |
| 5 — Patient | Moyenne | 3-4 | Oui |
| 6 — Staff Dashboard | **Haute** | 4-5 | Oui |
| 7 — Realtime | Moyenne | 2-3 | Oui |
| 8 — PWA + Slack | Moyenne | 2-3 | Oui |
| **Total** | | **~19-27 sessions** | |

---

## Critères de succès

- [ ] Toutes les fonctionnalités V1 fonctionnent identiquement dans l'iframe Staff
- [ ] Auth staff (email+mdp) et patient (chambre+DDN) opérationnels
- [ ] RBAC respecté pour les 5 rôles
- [ ] Alerte craving patient → dashboard staff en < 5 secondes + Slack
- [ ] PDF fiche de prévention téléchargeable
- [ ] PWA installable Android + iOS, Lighthouse vert
- [ ] Toolbox clinique fonctionne offline
- [ ] Aucune donnée patient nominative dans le localStorage
- [ ] Webhook Slack non exposé dans le code client

---

## Pré-requis manuels (à faire avant/pendant le développement)

1. **Créer un projet Supabase** (gratuit) — noter URL et anon key
2. **Activer l'auth par email** dans Supabase Dashboard
3. **Créer les tables SQL** dans Supabase SQL Editor (Phase 3)
4. **Activer Realtime** pour la table `alertes` (Phase 7)
5. **Créer une app Slack** avec Incoming Webhook (Phase 8)
6. **Ajouter `SLACK_WEBHOOK_URL`** dans les variables d'environnement Cloudflare Pages (Phase 8)

---

## Résumé des fichiers clés

| Fichier | Rôle |
|---|---|
| `index.html` | Routeur V2 Patient/Staff |
| `staff/index.html` | Shell staff (dashboard, alertes, groupes, config, toolbox iframe) |
| `staff/toolbox.html` | V1 Toolbox extraite verbatim |
| `patient/index.html` | Interface patient (timeline, craving, PDF) |
| `shared/supabase.js` | Client Supabase + CRUD helpers |
| `shared/auth.js` | Auth state, PIN lock, gestion session |
| `shared/rbac.js` | Contrôle rôles/modules |
| `shared/slack.js` | Client webhook Slack |
| `shared/pdf.js` | Génération PDF jsPDF |
| `functions/api/slack.js` | Cloudflare Pages Function (proxy Slack) |
| `sw.js` | Service Worker V2 multi-pages |
| `manifest.json` | Manifeste PWA V2 |
