# USCA Connect — Document de référence unique

> Dernière mise à jour : 19 avril 2026 (session v3.74 → v3.75 — export HTML livret IFSI + QCM simplifié + vue tuteur + nettoyage prefixe questions)
> Fusionne : INSTRUCTIONS_PROJET.md, PLAN_V2.md, SPEC_PATIENT_V3.md, PROJECT_PENDING.md, parametrage_login.md, fix-auth-complete.md, DEPLOY.md, NEXT_SESSION_QCM.md

---

## 1. IDENTITÉ & CONTEXTE

**USCA Connect** est la plateforme numérique de l'**USCA** (Unité de Soins Complexes en Addictologie) et de l'**ELSA** (Équipe de Liaison et de Soins en Addictologie) de l'hôpital **Pitié-Salpêtrière** (AP-HP, Paris).

Développeur principal : **Dr JC Luisada**, psychiatre addictologue à l'USCA.

| Application | Public | Fonction |
|---|---|---|
| **USCA Toolbox** (V1 — intégrée) | Soignants | Protocoles sevrage, scores, interactions, checklist séjour, fiches ELSA |
| **Unité Connect** (V2 — en production) | Soignants + Patients | Coordination : programme patient, alertes craving, groupes, permissions, stratégies, export PDF |

---

## 2. INFRASTRUCTURE

| Élément | Valeur |
|---|---|
| **Repo GitHub** | https://github.com/jcluisada-cmd/USCA-Assistant |
| **URL production** | https://usca-connect.pages.dev |
| **Hébergement** | Cloudflare Pages (auto-deploy sur `git push main`) |
| **BDD & Auth** | Supabase — pydxfoqxgvbmknzjzecn.supabase.co |
| **Service Worker** | usca-v3.77 |
| **Client Git** | GitHub Desktop |
| **Chemin local** | `C:\Users\jclui\OneDrive\Documents\GitHub\USCA-Assistant\` |
| **Mot de passe staff commun** | `usca_c15` |

### Charte graphique V2
| Rôle | Couleur | Hex |
|---|---|---|
| Primaire (actions, navigation) | Indigo | `#4F46E5` |
| Succès / validation | Émeraude | `#10B981` |
| Alerte / urgence | Rouge | `#EF4444` |
| Fond | Slate | `#F8FAFC` |

> La Toolbox V1 intégrée en iframe conserve sa palette navy/teal existante.

### Stack technique
- HTML5 + Tailwind CSS via CDN (`@tailwindcss/browser@4`) — mobile-first
- Supabase SDK via CDN UMD (`@supabase/supabase-js@2`) — attaché à `window.supabase`
- jsPDF via CDN — génération PDF côté client
- React 18 + Babel in-browser (Toolbox V1 uniquement, dans l'iframe)
- PWA installable (manifest.json + service worker)
- Pas de bundler, pas de npm, pas de build

### Installation PWA sur téléphone
- **Android** : Chrome → menu (⋮) → "Ajouter à l'écran d'accueil"
- **iPhone** : Safari → bouton partage (↑) → "Sur l'écran d'accueil"
- L'app s'ouvre en plein écran et fonctionne hors-ligne (données cliniques)

---

## 3. ARCHITECTURE DES FICHIERS

```
USCA-Assistant/
├── index.html                  ← Login unifié Patient / Soignant
├── patient/
│   └── index.html              ← Interface patient (9 cartes + post-cure)
├── admin/
│   └── index.html              ← Dashboard soignant (Patients, Toolbox, Planning, Mon élève)
├── etudiant/
│   └── index.html              ← SPA livret IFSI (élève) + mode preview soignant
├── extern/
│   └── index.html              ← Dashboard externe (chambres lecture seule + QCM EDN + signalements)
├── staff/
│   └── toolbox.html            ← V1 Toolbox React (iframe dans admin)
├── data/                       ← Base QCM EDN (lazy-loaded, non précachée en bloc)
│   ├── index.json              ← Catalogue 23 items / 477 questions
│   └── item_*.json             ← 1 fichier par item EDN (chargé à la demande)
├── postcure/                   ← Module post-cure (volets séparés)
│   ├── patient.html            ← Formulaire patient (6 étapes, standalone)
│   ├── medecin.html            ← Formulaire médecin (standalone ou lié patient)
│   ├── logo_web.txt            ← Logo USCA base64 (affichage)
│   └── logo_pdf.txt            ← Logo USCA base64 (PDF)
├── shared/
│   ├── supabase.js             ← Client Supabase + CRUD helpers
│   ├── auth.js                 ← Gestion session, login/logout
│   ├── planning-groupes.js     ← Planning semaine A+B + réunions
│   ├── postcure-structures.js  ← 14 structures post-cure (engagements, checklists)
│   ├── craving-agenda.js       ← Composant agenda craving
│   ├── fiches-catalogue.js     ← Catalogue des 20 fiches traitements
│   ├── livret-ifsi-contenu.js  ← Contenu pédagogique livret IFSI (14 chapitres, ~90 questions)
│   ├── qcm-engine.js           ← Moteur QCM EDN (lazy-load index/items, scoring, signalements)
│   ├── theme.css               ← Variables CSS dark mode
│   └── theme.js                ← Toggle dark mode
├── functions/
│   └── api/
│       └── delete-user.js      ← Cloudflare Function proxy suppression compte
├── fiches-traitements/
│   └── fiche_*.html            ← 20 fiches patient par médicament
├── migrations/                 ← Scripts SQL (v1 à v17)
│   ├── supabase-schema.sql     ← Schéma initial
│   └── supabase-migration-v*.sql
├── assets/                     ← Images sources
│   ├── icon-source.png         ← Source icône (Gemini)
│   └── splash-source.png       ← Source splash (Gemini)
├── affiche-equipe.html         ← Affiche A4 imprimable avec QR code
├── icon-512.png, splash.png    ← Images servies par l'app
├── manifest.json               ← Manifeste PWA
└── sw.js                       ← Service Worker multi-pages
```

---

## 4. AUTHENTIFICATION

### Deux parcours distincts

| Parcours | Comment | Persistance |
|---|---|---|
| **Patient** | Chambre + date naissance → vérification BDD | localStorage, 30 jours |
| **Soignant** | prenom.nom + mot de passe → Supabase Auth (email @aphp.fr) | localStorage, session Supabase |

- Admin : champ `is_admin` boolean séparé du rôle métier
- Mode dev : triple-tap sur le logo
- Auto-redirect si session existante
- Splash screen au chargement

### Rôles métier
`medecin`, `ide`, `psychologue`, `pharmacien`, `secretaire`, `externe`, `etudiant_ide`

Admin UUID JC : `d3ad2d4b-d3d8-41f8-a494-b7bf55b79e87` (jc.luisada@gmail.com, role=medecin, is_admin=true)

---

## 5. BASE DE DONNÉES SUPABASE

### Tables principales
- `profiles` — Profils soignants (id, email, nom, role, is_admin, modules_actifs, jours_presence)
- `patients` — Patients hospitalisés (chambre, DDN, admission, sortie prévue)
- `alertes` — Alertes craving/effet_indesirable/urgence/demande (patient_id, type, intensité, statut)
- `strategies` — Stratégies de prévention patient (5 catégories Marlatt)
- `evenements` — Événements (patient_id nullable : individuels + équipe). Types : entretien, consultation, familial, rdv_externe, reunion, staff, labo, supervision
- `permissions_sortie` — Demandes de permission (statut, date/heure sortie/retour, motif)
- `messages` — Contenus partagés par le soignant (notes, liens, consignes)
- `fiches_traitements_patient` — Fiches traitements prescrites (checklist)

### Tables groupes (migrations v6-v7)
- `groupe_animateurs` — Soignants désignés animateurs (groupe_slug, user_id)
- `groupe_modifications` — Modifications par date (annulation, changement heure, exclusions, horaires_individuels JSONB)
- `groupe_rappels` — Rappels envoyés par l'animateur

### Tables participations et demandes (migrations v9-v10)
- `participations` — Présences/absences aux groupes (patient ou animateur)
- `demandes_seances` — Demandes de séances thérapies complémentaires (en_attente/acceptee/refusee)

### Tables auth et réunions (migrations v8, v11)
- `device_tokens` — Appareils de confiance soignants (auto-login 90j)
- `presences_reunions` — Présences aux réunions staff (médecins)

### Tables gestion lits (migrations v12-v14)
- `liste_attente` — Patients en attente d'admission (age, addressage, date_entree_prevue, commentaire)
- `patients.postcure_statut` — JSONB workflow post-cure (flags d'envoi, pas de données patient)

### Tables QCM EDN externe (migration v17 locale, appliquée Supabase sous nom `v15_qcm_edn`)
- `tuteur_etudiant` — Lien tuteur↔apprenant (type='externe' ou 'etudiant_ide')
- `qcm_sessions` — Une ligne par série QCM jouée (item, mode entrainement/examen, score)
- `qcm_reponses` — Une ligne par question répondue (`question_source` stable type "Item 76 - Q12", correct, temps_ms)
- `qcm_flags` — Signalements externe → tuteur (erreur_question | demande_explication, statut ouvert/traité, `tuteur_reponse`)

### Migrations exécutées
- v1 : Schéma initial (profiles, patients, alertes, programmes, groupes)
- v2 : Stratégies, permissions, messages, fiches traitements
- v3 : Evenements
- v4 : Ajustements RLS
- v5 : CASCADE sur alertes et stratégies (suppression patient)
- v6 : Tables groupes (animateurs, modifications, rappels)
- v7 : Horaires individuels (JSONB dans groupe_modifications)
- v8 : Appareils de confiance (device_tokens)
- v9 : Participations aux groupes
- v10 : Demandes de séances thérapies complémentaires
- v11 : Événements d'équipe (patient_id nullable) + présences réunions
- v12 : Liste d'attente (table liste_attente)
- v13 : Jours de présence soignants (profiles.jours_presence)
- v14 : Statut post-cure workflow (patients.postcure_statut JSONB)
- v15 : Infos de sortie (patients.sortie_info JSONB — destination RAD/post-cure/autre + checklist documents)
- v16 : Livret IFSI — tables etudiants_stages + etudiant_progression + RLS (étudiante voit son stage, IDE/médecins voient tout, admin CRUD complet)
- v17 : QCM EDN externe — tables tuteur_etudiant + qcm_sessions + qcm_reponses + qcm_flags + RLS (chacun ne voit que ses sessions/réponses/signalements). Numérotée v17 localement car v15/v16 distantes étaient déjà prises (collision résolue). Côté Supabase la migration est enregistrée sous le nom `v15_qcm_edn`.

---

## 6. ÉTAT ACTUEL — CE QUI FONCTIONNE

### Login unifié (index.html)
- ✅ Onglets Patient / Soignant
- ✅ Auto-redirect si session existante, login unique (pas de double login)
- ✅ Mode dev admin (triple-tap logo)
- ✅ Splash screen, bannière WebView iOS
- ✅ Date de naissance patient : auto-formatage JJ/MM/AAAA (clavier numérique)
- ✅ Messages d'erreur auth précis (réseau/identifiants/rate-limit)

### Module Patient — 9 cartes + post-cure
Ordre des cartes (haut-gauche → bas-droite) : Programme, Journal, Traitements, Ateliers, Stratégies, Permission, Messages, Mon avis
- ✅ **J'ai un craving** : bouton pleine largeur rouge (en haut)
- ✅ **Programme** : timeline, navigation date, routine, groupes semaine A+B colorés, badge semaine A/B, horaires individuels, boutons Présent/Absent, "Demander une séance"
- ✅ **Mon journal** : agenda craving (semaine/mois/3mois/1an), courbe tendance, stats
- ✅ **Traitements** : fiches prescrites, 20 fiches HTML, navigation par catégorie
- ✅ **Ateliers** : navigation date, Présent/Absent par groupe, demande de séance, historique, stats, animateur/lieu affichés
- ✅ **Mes stratégies** : plan prévention guidé (5 catégories Marlatt), section éducative
- ✅ **Permission** : demande sortie (48h max, 20h retour), statut en attente/validée/refusée
- ✅ **Messages** : contenus partagés par le soignant
- ✅ **Mon avis** : feedback structuré sur l'application (email ou copie)
- ✅ **Faire une demande de post-cure** : lien vers formulaire patient standalone
- ✅ **Badges notification** : ronds rouges sur Messages, Traitements, Programme, Ateliers

### Module Soignant — 3 onglets
- ✅ **Patients** : liste avec badges craving/permission, admission, détail patient (journal craving, fiches traitements, permissions, événements, voir comme patient, dossier post-cure accordion, export PDF/HTML depuis le dashboard, supprimer séjour), bouton app vierge
- ✅ **Entrées/Sorties** : sorties prévues (auto depuis date_sortie_prevue, triées par date), liste d'attente (CRUD Supabase, adressage, date entrée, bouton Admettre → crée patient)
- ✅ **Toolbox** : iframe V1 avec dark mode
- ✅ **Planning** : navigation semaine ← → avec dates et badge Semaine A/B centré, groupes dynamiques (seuls les groupes restants s'affichent), réunions de la semaine (masquées si heure passée), section "Historique de la semaine" dépliable, thérapies complémentaires masquées après 17h, Staff Psychiatrie filtré par jours de présence

### Gestion comptes (admin)
- ✅ Création, modification rôle/nom, toggle admin
- ✅ Jours de présence par soignant (bouton "Jours", array [1-5], filtre Staff Psy)
- ✅ Suppression complète (profil + compte Auth via Cloudflare Function)
- ✅ Désignation animateurs pour les groupes

### App exportée HTML autonome
- ✅ Signal craving + agenda + stratégies modifiables
- ✅ Fiches traitements embarquées
- ✅ PIN local SHA-256, dark mode, export/import JSON
- ✅ Tutoriel au premier lancement
- ✅ Génération version vierge depuis l'admin (consultation)

### Module Post-cure (P8) — 100% local, conforme non-HDS
- ✅ **Volet patient** (`postcure/patient.html`) : 6 étapes (identité, couverture, social, contacts, engagement+signature, récap), génération ZIP+PDF, envoi par email (USCA obligatoire + structure optionnel)
- ✅ **Volet médecin** (`postcure/medecin.html`) : formulaire médical complet (addictologie, ATCD, état actuel, traitements), uploads documents, génération ZIP+PDF, envoi par email, pré-remplissage patient depuis le dashboard
- ✅ **Données partagées** (`shared/postcure-structures.js`) : 14 structures post-cure (engagements, checklists, contacts)
- ✅ **Dashboard** : accordion "Dossier post-cure" dans Chambre XX avec structure (dropdown 14 cliniques ou texte libre), date post-cure, 4 checkboxes statut workflow, bouton volet médical
- ✅ **Module patient** : carte dynamique — affiche la structure + date si renseignées, sinon "Faire une demande de post-cure"
- ✅ **Toolbox** : grande carte "Dossier post-cure" (même format que Protocoles USCA et ELSA)
- ✅ **Dark mode** : complet sur les deux formulaires, synchronisé avec l'app, toggle en bas à droite
- ✅ **PDFs améliorés** : police 9pt, titre 14pt, sous-titre 10pt, sections barre colorée latérale, marges 20mm, smart page breaks, footer USCA, format Prénom Nom, DDN jj/mm/aaaa
- ✅ **Sécurité** : aucune donnée patient stockée sur serveur — seuls des flags workflow dans `patients.postcure_statut`
- ✅ **Bandeau** : "Aucune donnée personnelle n'est enregistrée sur un serveur — tout reste sur votre appareil"

### Module Externe — Dashboard QCM EDN (`extern/index.html`)
- ✅ **Garde session** : redirection automatique vers `/extern/` au login si `role='externe'`
- ✅ **Carte Chambres** (lecture seule) : liste patients hospitalisés via `db.getPatients()`, pas d'actions, juste prénom + chambre + substance principale + date sortie prévue
- ✅ **Carte Mon QCM EDN** : sélecteur item uniquement (index.json chargé une fois) — mode entraînement séquentiel par défaut, correction immédiate + explication. Plus de filtre difficulté ni de sélecteur n ni de mode examen.
- ✅ **Joueur QCM modal** : 4 choix par question, progression "Q n / total", bouton 💬 "Demander une explication" → `demande_explication` dans `qcm_flags`, bouton 👎 → `erreur_question`. Score final + persistance Supabase (`qcm_sessions` + `qcm_reponses`).
- ✅ **Affichage questions** : préfixe `[Item XX] Question N - Difficulté :` retiré via `cleanQ()` — affiche uniquement l'énoncé de la question.
- ✅ **Carte Mes signalements** : historique des flags émis (statut ouvert/traité, message original, réponse tuteur si renseignée)
- ✅ **Mode tuteur** (`?preview=tuteur`) : bandeau orange, bouton "Voir toutes les questions" par item, 👎 signalement activé, chambres/signalements/export masqués.
- ✅ **Export app autonome** : bouton ⬇ → HTML standalone 477 questions embarquées + joueur interactif. Sans features tuteur (signalements).
- ✅ **Vue tuteur dans admin** : section "Mon externe" pour médecin/admin — stats sessions, signalements en attente, réponse aux flags. Tous les médecins voient l'externe (pas de tuteur désigné).
- ✅ **Lazy-load** : `index.json` (catalogue léger) au démarrage ; un `item_XX.json` n'est chargé que lorsque l'item est sélectionné, puis caché en mémoire pour la session
- ✅ **Service Worker** : précache `extern/`, `qcm-engine.js`, `data/index.json` ; les `item_*.json` restent en cache dynamique stale-while-revalidate
- ✅ **Identifiant question stable** : `"Item 76 - Q12"` (helper `QCMEngine._utils.questionSourceId`) — invariant même si on réordonne le JSON, utilisé pour scoring et signalements

### Auth avancée
- ✅ Client Supabase robuste (safeStorage, PKCE, autoRefresh)
- ✅ Appareils de confiance (device tokens 90j, max 5, auto-register/révocation)
- ✅ Cloudflare Function suppression compte (`functions/api/delete-user.js`)

### Toolbox Soignant V1 — réorganisée
- ✅ **Accueil** : 3 grandes cartes (Protocoles USCA, ELSA, Dossier post-cure) + 3 petites (Traitements, Scores, Interactions) + Feedback
- ✅ **Protocoles USCA** → hub : Substances, Checklist Séjour J1-J12, Comorbidités psy
- ✅ **ELSA** → hub : Liaisons en cours (ToDo list avec checklist, drag-and-drop, ajout liste d'attente), Admission & Orientation, Fiches réflexes
- ✅ **Barre nav** : Accueil, Protocoles, ELSA, Scores, Plus
- ✅ Dark mode complet (swap palette C)

---

## 7. BUGS CONNUS

| Bug | Sévérité | Statut |
|---|---|---|
| ~~Modals admin ne se ferment pas au clic fond noir~~ | ~~Moyenne~~ | ✅ Corrigé v3.25 |
| ~~Déconnexion patient ne redirige pas vers l'accueil~~ | ~~Basse~~ | ✅ Corrigé v3.25 |
| ~~Suppression de compte Supabase Auth impossible~~ | ~~Haute~~ | ✅ Cloudflare Function créée v3.25 |

---

## 8. PLAN DE DÉVELOPPEMENT — CE QUI RESTE

### Fait — Session 16/04 soir (v3.25 → v3.37)
- [x] **P1** — Bugs corrigés : modals fond noir, déconnexion patient, badge craving, permissions accordion, double login soignant, date naissance mobile, encodage UTF-8
- [x] **P2** — Planning semaine A+B (alternance ISO paire=A/impaire=B), type `seances` (sophrologie cyan)
- [x] **P3** — Ateliers patient (navigation date, Présent/Absent, historique) + participation animateur + demandes séances thérapies complémentaires
- [x] **P4** — Onglet Planning (ex-Groupes) : réunions d'équipe récurrentes, Staff Psychiatrie médecins, événements ponctuels texte libre
- [x] **P6** — App exportée v3 : PIN SHA-256, tutoriel premier lancement, génération version vierge
- [x] **P9** — Auth avancée : messages erreur, safeStorage/PKCE, device tokens, Cloudflare Function suppression, WebView iOS
- [x] Badges notification patient (Messages, Traitements, Programme, Ateliers)
- [x] Carte Feedback patient ("Mon avis sur l'application")
- [x] Désignation animateurs par l'admin + accès actions animateur pour l'admin
- [x] Animateur/lieu affichés dans les ateliers patient
- [x] Fix bug export app vierge — v3.38

### Fait — Session 16-17/04 nuit (v3.39 → v3.53)
- [x] Réorganisation cartes patient (Programme, Journal, Traitements, Ateliers, Stratégies, Permission, Messages, Mon avis)
- [x] Réorganisation Toolbox : 3 grandes cartes (Protocoles USCA, ELSA, Dossier post-cure) + 3 petites (Traitements, Scores, Interactions)
- [x] Protocoles USCA → hub (Substances, Checklist Séjour, Comorbidités)
- [x] ELSA → hub (Liaisons en cours + ToDo list, Admission, Fiches réflexes)
- [x] Liaisons ELSA : formulaire, drag-and-drop, checklist (indication, motivation, orientation), ajout liste d'attente
- [x] Entrées/Sorties dans dashboard : sorties prévues auto + liste d'attente Supabase (CRUD, adressage, admission)
- [x] Planning dynamique : navigation ← semaine →, groupes à venir/historique, réunions filtrées, Staff filtré par jours de présence
- [x] Exports PDF/HTML depuis dashboard patient (Chambre XX → fiche sortie + app sortie)
- [x] **P7** — Ménage technique : suppression staff/index.html, migrations dans `migrations/`, images sources dans `assets/`
- [x] **P8** — Post-cure : séparation volet patient + volet médecin + structures partag��es, 100% local (non HDS)
- [x] P8 — PDFs améliorés (police 9pt, sections colorées, barre latérale, smart page breaks, footer)
- [x] P8 — Dark mode formulaires post-cure (sync app, toggle)
- [x] P8 — Bouton "Dossier post-cure" dans Actions Chambre XX + checkboxes statut workflow
- [x] P8 — Retrait stockage Supabase post-cure (conformité non-HDS) — tout 100% local
- [x] Jours de présence soignants (profiles.jours_presence, config depuis Comptes, filtre Staff Psy)
- [x] Dark mode : fix lisibilité indigo (patient, admin, planning, Toolbox dégradés)
- [x] Bug fix : synchro sorties prévues après mise à jour date sortie

### Fait — Session 17/04 nuit (v3.64 → v3.70)
- [x] **Fix programme patient** — timeline ne rendait qu'une ligne à cause d'un `ReferenceError: dateStr is not defined` dans `renderTimeline` (variable définie dans `loadProgrammeForDate` mais utilisée sans paramètre). Ajout passage explicite `dateStr/date/_progParticipations/_progDemandes` + filtre amont des activités avec heure invalide + try/catch par itération pour robustesse (commit `0131138`).
- [x] **Dashboard sorties — destination + checklist documents** (commit `1e9c64a`, refs `3c8cacb` pour fixes layout) — migration v15 `sortie_info` JSONB. Modal sortie avec radio RAD/Post-cure/Autre + select centre (14 via `shared/postcure-structures.js`). Accordion cliquable sur chaque ligne sortie avec checklist 3 états (Ordonnance/Transport/Bulletin/CRH — À faire / ✓ Fait / N/A). Badge chambre passe en vert quand tous items sont réglés (fait OU N/A).
- [x] **Fix SW chrome-extension** — ignore les requêtes non-http pour éviter `Failed to execute 'put' on 'Cache'`.
- [x] **Module Livret IFSI — P1 complète** (commits `f657f94`, `2c5f444`, `5881c24`, `ec51590`, `48faf3d`, `3e53ce6`) :
    - Migration v16 : tables `etudiants_stages` + `etudiant_progression` (RLS : élève voit son stage, IDE/médecin voient tout, admin CRUD).
    - Rôle `etudiant_ide` (underscore) avec redirection login → `/etudiant/`.
    - SPA `etudiant/index.html` : header sticky (safe-area iPhone OK), onglets scrollables (Accueil + Lexique + 11 chapitres), moteur rendu 6 types de questions (fill_in, QCM single/multi, vrai/faux, table_fill, texte_libre), auto-correction normalisée (casse/accents/ponctuation + mots-clés), feedback visuel (emerald/amber/rose), persistance debounced 500 ms.
    - Contenu pédagogique `shared/livret-ifsi-contenu.js` : 14 chapitres rédigés, ~90 questions. Lexique 21 acronymes (ELSA, USCA, CSAPA, CAARUD, CJC, OH, AA, RDR, TSO, THC, CBD, GHB, SLAM, PTSD, CPOA, TS, CMP, TDAH, ASPDT, AAH, ALD). Items "À rédiger" restants sur les études de cas (c'est voulu — exercice de réflexion libre).
    - **Vue tuteur (P2)** : section "Mon élève" dans dashboard admin pour IDE/médecin/admin (`db.getAllStages()` + progression). Clic "Consulter le livret" → `/etudiant/?stage=<id>` en mode lecture seule (bandeau orange, inputs disabled, feedback toujours visible, bouton "✓ Marquer comme vu" par question).
    - **Édition élève (P1-C)** : bouton ✏️ admin → modal (nom, IFSI, promo, année, dates, IDE référent·e). Menu ⋯ admin : clôturer stage / réinitialiser progression / supprimer stage.
    - **Carte Toolbox "📘 Livret IFSI"** → `/etudiant/?preview=demo` (aperçu contenu sans élève, pour IDE avant entretien).
    - Workflow "1 élève à la fois" : entre 2 stages → ✏️ modifier l'identité + ⋯ réinitialiser progression + nouveau mot de passe → livret vierge.

### Fait — Session 19/04 (v3.70 → v3.71)
- [x] **Module QCM EDN externe** (commit `6ccd59c`) — chantier complet livré en une session :
    - Migration SQL : 4 tables `tuteur_etudiant`, `qcm_sessions`, `qcm_reponses`, `qcm_flags` + RLS (chacun ne voit que ses propres données ; les signalements seront vus par les tuteurs via la table `tuteur_etudiant`). Fichier local **v17** car v15/v16 distantes étaient déjà prises (sortie_info + livret IFSI) — appliquée côté Supabase sous le nom interne `v15_qcm_edn`.
    - `shared/qcm-engine.js` : moteur lazy-load — `loadIndex()`, `loadItem(label)` avec cache mémoire, `getQuestions({item, difficulte, mode, n})` (random en entraînement, séquentiel en examen), `saveSession()`, `flagQuestion()`, `getMyFlags()`, `getMyStats()`. Helper `_utils.questionSourceId(item, n)` pour identifier une question de manière stable (`"Item 76 - Q12"`), `_utils.itemToFilename` pour résoudre `"Item 66a"` → `item_66a.json`.
    - `extern/index.html` : dashboard externe (chambres lecture seule, sessions QCM, signalements). Construction DOM 100 % `createElement` (helper `el(tag, attrs, children)`) — pas d'`innerHTML` sur données dynamiques, défensif même si le JSON devenait public.
    - `data/` : 1 catalogue `index.json` + 23 fichiers `item_*.json` (477 questions EDN Psychiatrie-Addictologie). Encodage UTF-8 vérifié (accents OK).
    - Routing `index.html` : `role='externe'` → `extern/`, `role='etudiant_ide'` → `etudiant/`, autres → `admin/`.
    - `sw.js` v3.71 : précache `extern/`, `qcm-engine.js`, `data/index.json` (les 23 items restent en cache dynamique).
    - `staff/toolbox.html` : carte "Livret IFSI" retirée (accès suffisant via dashboard "Mon élève").
    - `admin/index.html` : bouton « Générer une app patient vierge » masqué (jugé moche/inutile pour l'instant — div parent en `hidden`, code JS conservé).

### Fait — Session 17/04 soir (v3.62 → v3.64)
- [x] **Fix critique** — accolade `});` orpheline dans `admin/index.html` (commit cd32ca3) qui cassait tout le script inline : module admin figé, page vide après déconnexion, redirection erratique vers module patient. Cache SW bumped pour forcer refresh.
- [x] **Fix closure var+async dans Staff Psychiatrie** — `reu.jour` était capturé par closure dans une IIFE async → après la boucle `for`, il pointait vers la dernière réunion (jeudi). Conséquence : Dr Fatout (jours_presence=[4]) apparaissait dans le Staff du lundi. Passage de `reu.jour` en paramètre explicite.
- [x] **Fix post-cure patient** — bouton « Faire une demande de post-cure » disparaissait dès qu'une structure (et pas seulement une date) était définie. Condition simplifiée à `if (hasDate)` : le bouton réapparaît automatiquement si la date est retirée.
- [x] **Fix DB post-cure** — `updatePostcureStatut` écrasait systématiquement `structure` et `date_postcure` par la date du jour (fonction conçue pour checkboxes, détournée pour valeurs libres). Distinction `value === true` (workflow → date du jour) vs `value` string (→ valeur brute). `shared/supabase.js:549`.

### Fait — Session 19/04 soir (v3.71 → v3.75)
- [x] **Mon externe** : section dans dashboard admin/médecin (analogue à "Mon élève"). Tous les médecins peuvent voir l'externe (pas de tuteur désigné). Stats sessions QCM, signalements en attente, réponse aux flags. Migration v18 RLS médecin→externe sessions/flags.
- [x] **Accordion "Mes élèves"** unifié admin : IFSI + QCM en sous-sections, accordion repliable, titre dynamique selon le rôle.
- [x] **QCM simplifié** : suppression filtre difficulté, sélecteur n, mode examen. Sélection item uniquement + mode séquentiel (ordre progressif JSON). `qcm-engine.js` mode `'sequential'` ajouté.
- [x] **Préfixe questions nettoyé** : `cleanQ()` strip `[Item XX] Question N - Difficulté :` à l'affichage (pas en JSON source). Appliqué dans joueur, vue tuteur, export.
- [x] **Boutons 💬 Explication + 👎 signalement** distincts par question (remplace le seul bouton ⚑ Signaler).
- [x] **Mode tuteur** (`?preview=tuteur`) : bandeau, "Voir toutes les questions" par item avec explications, 👎 préservé, sections non pertinentes masquées.
- [x] **Export HTML autonome QCM** : Blob + URL.createObjectURL, 477 questions embarquées, joueur interactif DOM pur sans innerHTML. Masqué en mode tuteur.
- [x] **Fix planning réunions** : décocher présence/absence maintenant possible (`deletePresenceReunion`) + date isolée par semaine (`reuDateStr` calculé depuis `reuDate` réelle).
- [x] **Export HTML livret IFSI** : bouton ⬇ dans `etudiant/index.html`, génère un HTML imprimable avec toutes les questions + réponses de l'élève, résolution IDs→labels pour QCM, réponses attendues, explications. Disponible pour élève et soignant en mode consultation.
- [x] Retrait liens "Voir dans la Toolbox" du lexique IFSI.
- [x] `sw.js` v3.75

### À faire
- [ ] **P5** — Personnalisation modules soignant (choix des cartes affichées par rôle)
- [ ] **Formulaire pré-admission** — QR code salle d'attente (identité, couverture, substances, scores AUDIT-C/CAST, ATCD, envoi email, 5 min max)
- [ ] **Annuaire patients** — répertoire post-sortie
- [ ] UI "Mes appareils de confiance" dans paramètres du compte
- [ ] **Livret IFSI — compléter contenu** : relecture équipe (3 IDE) pour valider réponses, étoffer chapitre Motivation (1 seule question), éventuellement remplir présentation équipe + activités + objectifs de stage dans `presentation`.
- [ ] **Livret IFSI — P4** : bilan fin de stage + commentaire tuteur signé + export PDF portfolio (jsPDF).
- [ ] **QCM EDN — réinitialisation externe** : ✅ bouton ↺ dans "Mon externe" → supprime sessions/réponses/flags pour changement d'externe (analogue au reset livret IFSI). (v3.76)
- [ ] Tester toutes les nouvelles features en conditions réelles (notamment Safari iOS — SW parfois capricieux au bump de version)

---

## 9. MODULES CLINIQUES V1 (TOOLBOX)

### Accueil Toolbox (staff/toolbox.html, iframe dans admin)

| Carte | Type | Contenu |
|---|---|---|
| **Protocoles USCA** | Hub (grande carte) | → Substances (7 protocoles), Checklist Séjour J1-J12, Comorbidités psy |
| **ELSA** | Hub (grande carte) | → Liaisons en cours (ToDo), Admission & Orientation, Fiches réflexes (5) + scores repérage |
| **Dossier post-cure** | Grande carte | → Ouvre le volet médecin (postcure/medecin.html) |
| **Traitements** | Petite carte | 20 fiches patient par médicament |
| **Scores** | Petite carte | Cushman, COWS, AUDIT, PHQ-9, GAD-7, convertisseur BZD |
| **Interactions** | Petite carte | 18 interactions critiques, sélection multiple |
| **Feedback** | Barre en bas | Bug, suggestion, correction → email |

### Pharmacopée
- **Sevrage/maintien** : diazépam, oxazépam, baclofène, acamprosate, naltrexone, nalméfène, topiramate, NAC, méthadone, buprénorphine, disulfirame
- **Psychotropes** : méthylphénidate, lisdexamfétamine, sertraline, venlafaxine, vortioxétine, cyamémazine, chlorpromazine, alimémazine
- **Non pharmaco** : NADA, hypnose, TRV, tDCS

### Règles cliniques
- Toujours préciser **AMM / hors AMM**
- Toujours indiquer le **niveau de preuve** (A, B, C, D)
- Toujours lister les **contre-indications**

---

## 10. SPEC MODULE PATIENT V3 — VISION LONG TERME

### Principe directeur
L'app patient est **tournée vers l'avenir**. Le patient la construit pendant l'hospitalisation mais elle l'accompagne **après la sortie** via l'app exportée.

### Programme du jour — architecture
- **Routine** (repas, constantes, traitements) = hardcodés, affichage discret
- **Groupes thérapeutiques** = depuis `shared/planning-groupes.js`, colorés par type, mis en valeur
- **Événements individuels** = depuis table `evenements`, très visibles
- **Vues** : aujourd'hui (timeline verticale), semaine, 2 semaines (à développer)

#### Hiérarchie visuelle des activités
| Type | Importance | Style |
|---|---|---|
| Groupe thérapeutique | **Haute** | Carte colorée, icône, titre gras |
| Entretien médical | **Haute** | Carte bordure indigo, icône stéthoscope |
| Événement exceptionnel | **Très haute** | Carte fond coloré + badge "Nouveau" |
| Soin quotidien (constantes, traitement) | Basse | Ligne simple, texte petit, grisé |
| Repas | Très basse | Ligne simple, icône petite, très discret |

### Agenda craving — vues détaillées
- **Jour** : liste des cravings avec détails
- **Semaine** : barres horizontales, 7 jours, intensité max/jour
- **Mois** : calendrier avec points colorés (vert=0, ambre=modéré, rouge=intense)
- **3 mois** : graphique en ligne, tendance
- **1 an** : graphique en ligne, vue d'ensemble
- **Courbe** : axe X=temps, Y=intensité, moyenne mobile 7 jours. Objectif : le patient VOIT la progression

### Admission patient — champs simplifiés
| Champ | Obligatoire | Note |
|---|---|---|
| Chambre | Oui | |
| Date de naissance | Oui | Pour le login patient |
| Date d'admission | Auto (aujourd'hui) | |
| Date de sortie prévue | Oui | Défaut J+12 |

Le reste (substance, programme) est géré dans le détail patient après admission.

### App exportée = clone fonctionnel
- Stockage localStorage (pas de serveur)
- Signal craving + agenda + stratégies modifiables
- Fiches traitements embarquées
- PIN local optionnel, dark mode
- Export/import JSON, re-génération HTML

### Questions ouvertes pour JC
1. ~~Planning semaine B~~ → Fait (session 16/04)
2. Entretiens individuels : heures fixes ou variables ? système de rendez-vous ?
3. App exportée : mises à jour post-sortie ? (re-télécharger vs version en ligne)
4. Données sensibles dans l'export : protection suffisante avec PIN SHA-256 ?

---

## 11. SPEC AUTH AVANCÉE (À IMPLÉMENTER — P9)

### Suppression de compte admin
L'app utilise la clé `anon` Supabase (visible dans le code source, droits limités). La suppression de comptes Auth nécessite la `service_role` key (droits complets, jamais côté client).

**Solution** : Cloudflare Pages Function `functions/api/delete-user.js` comme proxy sécurisé :
- L'app envoie la demande + JWT de l'admin
- La Function lit `env.SUPABASE_SERVICE_ROLE_KEY` (variable Cloudflare)
- La Function appelle `DELETE /auth/v1/admin/users/{userId}` sur Supabase
- Transparent pour l'admin

### Appareils de confiance (table `device_tokens`)

```sql
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  appareil TEXT DEFAULT 'Appareil inconnu',
  derniere_utilisation TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '90 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_device_tokens_token ON device_tokens(token);
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "device_tokens_own" ON device_tokens FOR ALL USING (auth.uid() = user_id);
```

- Auto-login 90 jours, max 5 appareils par soignant
- Token 32 bytes (crypto.getRandomValues), détection appareil (iPhone/iPad/Android/Mac/Windows)
- Interface "Mes appareils de confiance" dans paramètres du compte
- Déconnexion = révoque le token de cet appareil

### Messages d'erreur auth précis
Classifier les erreurs : réseau (fetch/Firefox tracking) → identifiants (400) → compte inexistant (404) → rate-limit (429) → serveur (500+). Messages en français.

### Client Supabase robuste
- `safeStorage` : tente localStorage, fallback sessionStorage (Safari restrictif / navigation privée)
- `flowType: 'pkce'` (plus robuste sur Safari)
- `autoRefreshToken: true`

### Détection WebView iOS
Bannière automatique jaune "Ouvrir dans Safari" quand l'app est dans un WebView iOS (QR code scanné depuis l'app caméra). Détection : iOS + pas Safari natif (CriOS/FxiOS/EdgiOS).

### Identifiants génériques soignants (option future)
Accès Toolbox sans compte nominatif, avec hash SHA-256 côté client :
| Profil | Identifiant | Mot de passe | Persistance |
|---|---|---|---|
| Externe | `externe` | `psl.addicto.externe` | 6 mois |
| Interne | `interne` | `psl.addicto.interne` | 6 mois |
| IDE | `ide` | `psl.addicto.ide` | 6 mois |

Note : hash dans le code client = reverse-engineerable, mais suffisant pour un verrou d'accès accidentel. Pas de données patient.

### Structure localStorage session
```javascript
localStorage.setItem('usca_session', JSON.stringify({
  type: 'patient' | 'soignant' | 'admin',
  // Patient : patient_id, prenom, chambre, expires (= date_sortie_prevue)
  // Soignant générique : profil, expires (6 mois)
  // Admin : supabase_managed=true, profile_id, nom, role, modules
  created_at: '2026-04-15T10:30:00Z',
  theme: 'light' | 'dark'
}));
```

### Actions manuelles Supabase (une seule fois pour P9)
1. **Authentication → Settings** : désactiver "Enable email confirmations"
2. **Créer comptes** : Authentication → Users → Add user → cocher "Auto Confirm User"
3. **Cloudflare Pages → Settings → Environment variables** : ajouter `SUPABASE_SERVICE_ROLE_KEY`

### Questions ouvertes login
1. Accès invité Toolbox sans login pendant la transition ?
2. Changer les mots de passe génériques régulièrement ?
3. Tablettes partagées patients/soignants : bouton "Changer d'utilisateur" ?

---

## 12. CONVENTIONS DE DÉVELOPPEMENT

### Général
- **Langue** : français partout (UI, commentaires, données)
- **Mobile-first** : tout doit être utilisable sur smartphone
- **Pas de bundler** : HTML + CDN (Tailwind, Supabase SDK, jsPDF)
- **Pas de données patient nominatives** côté client
- Client Git : GitHub Desktop

### Modifications
1. Lire le fichier avec Read
2. Modifier chirurgicalement avec Edit (pas de réécriture complète)
3. Incrémenter `CACHE_NAME` dans `sw.js` à chaque modif
4. **Faire un commit** et dire **"Push !"** quand c'est prêt
5. Push via GitHub Desktop → Cloudflare Pages redéploie (~30 sec)

### Règles absolues
- ❌ Ne jamais réécrire un fichier en entier
- ❌ Ne jamais bloquer l'accès soignant avec un login (app déjà distribuée)
- ❌ Ne jamais supprimer de fonctionnalité sans validation de JC
- ❌ Ne jamais exposer la service_role key dans le code client
- ❌ Ne jamais tenter de fetch `raw.githubusercontent.com` (bloqué par le réseau)

### Service Worker — règle critique
À **chaque modification** de fichier servi, incrémenter `CACHE_NAME` dans `sw.js`. Sans ça, les utilisateurs restent sur l'ancienne version en cache. Stratégie : cache-first pour les statiques, network-first pour les appels Supabase (`*.supabase.co`).

### Risques techniques connus
| Risque | Mitigation |
|---|---|
| iframe V1 sur iOS Safari (scroll, hauteur) | `-webkit-overflow-scrolling: touch`, hauteur explicite, `?embedded=true` |
| Reconnexion Realtime (téléphone verrouillé) | Auto-reconnexion Supabase + refresh sur `visibilitychange` |
| Auth patient faible (chambre+DDN) | Rate-limiting client (3 tentatives → 5 min), données limitées, réseau hospitalier |
| Pas de bundler = gros CDN | ~315 KB gzippé, cachés par SW après 1er chargement |

### Contenu clinique — sources de vérité (par priorité)
1. **Référentiel USCA 2.2** et addendum (documents internes)
2. **Recommandations HAS** : TSO, arrêt BZD, TDAH adulte, opioïdes, RdRD, hépatite C
3. **Guidelines SFA** (Société Française d'Alcoologie)
4. **NICE guidelines** (alcool, drogues, TDAH, tabac, gambling, TCA)
5. **Littérature PubMed**

---

## 13. CONTACTS & LIENS

| Quoi | Valeur |
|---|---|
| Repo GitHub | https://github.com/jcluisada-cmd/USCA-Assistant |
| Production | https://usca-connect.pages.dev |
| Email | jc.luisada@gmail.com |
| Supabase | pydxfoqxgvbmknzjzecn.supabase.co |
| Affiche équipe | affiche-equipe.html (A4, QR code) |
