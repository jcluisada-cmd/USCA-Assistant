# USCA Connect — Document de référence unique

> Dernière mise à jour : 24 avril 2026 (v4.02 — Notifications Push V2 : silence soignant (bloque push staff en semaine après 16h, weekend, jours fériés France — patients jamais bloqués) dans Edge Function `send-push` ; fix défensif anti-orphelin (vérif BDD post-save + unsubscribe automatique en cas d'échec) côté admin et patient ; garde-fou XOR : `profile_id: null` et `patient_id: null` explicites dans les helpers `savePushSubscription*`.)
> v4.01 — Notifications Push V2 médecins : migration v29 (`push_subscriptions.patient_id` nullable + `profile_id` avec CHECK XOR, tables `push_last_message_staff` et `push_reminders_sent_groupe`) ; Edge Function `send-push` accepte maintenant `patient_id` | `profile_id` | `profile_ids[]` ; SW sw.js priorise `profile_id` puis fallback `patient_id` (clés IndexedDB séparées, cleanup au logout via `clear-push-identity`) ; engrenage ⚙️ dans le header admin → modal Paramètres avec toggle activation push ; message patient → push automatique à tous les médecins abonnés (fire-and-forget) ; cron-reminders étendu : +rappels consultations perso au créateur, +rappels groupes A/B aux animateurs (avec gestion annulation et nouvelle_heure via `groupe_modifications`). Planning A/B dupliqué en TS dans l'Edge Function — TODO priorité basse pour migrer en BDD.
> v4.00 — label inclusif patient "Patient·e de 53 ans" : colonne `sexe` sur `patients` (migration v28, F/M/NULL), radios dans nouveau patient, select inline dans détail patient, remplacement partout côté admin + extern ; chambre conservée dans le header patient (repère personnel) et sur l'avatar indigo.
> v3.99 — notifications Push patient (migrations v25+v26+v27, Edge Functions Supabase, VAPID, pg_cron rappels 5 min) ; page Paramètres patient ; QCM tuteur : clic sur session → voir toutes les réponses avec propositions + correction.
> v3.98 — agenda perso privé par soignant (migration v24), accordions Planning/Dashboard repliables, Toolbox Ressources "Fiches" replié, correctifs QCM externe + badges messages + DDN + adressage libre.
> v3.97 — fix animateurs fantômes : migration v23 FK groupe_animateurs → profiles(CASCADE), policy DELETE admin, alerte bloquante si suppression Auth échoue.
>
> **Pour l'historique détaillé des sessions, les specs déjà implémentées (vision patient V3, auth P9) et le détail des migrations : voir `CLAUDE_ARCHIVE.md` (à lire à la demande).**
>
> **📌 Setup infrastructure Supabase (migrations, Edge Functions, secrets) : voir `SETUP_PUSH.md`.** Au début de chaque session, si du travail a été fait sur des features nécessitant des migrations/Edge Functions, consulter la checklist d'état pour identifier ce qui reste à faire côté JC avant le chantier courant.

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
| **Service Worker** | usca-v4.02 |
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
│   ├── fiches_patient/         ← 20 fiches HTML à partager au patient (Aotal, baclofène, BZD, TSO, psychotropes…)
│   └── fiches_expert/          ← 8 fiches expert PDF (antipsychotiques : amisulpride, aripiprazole, chlorpromazine, clozapine, halopéridol, olanzapine, quétiapine, rispéridone)
├── ressources_doc/             ← Ressources Toolbox — manifest-driven (index.json)
│   ├── index.json              ← Liste les ressources exposées (type, titre, meta, tag, fichier, date)
│   ├── fiches/                 ← 📑 aides-mémoire imprimables (PDF/HTML)
│   ├── articles/               ← 🧪 résumés cliniques d'articles (PDF/HTML)
│   ├── recos/                  ← 📘 recommandations HAS/SFA/NICE (HTML préféré)
│   ├── algos/                  ← 🧩 algos/arbres décisionnels (HTML interactif)
│   └── */_TYPE.txt             ← descriptifs d'upload (non exposés dans l'app)
├── migrations/                 ← Scripts SQL (v1 à v21)
├── assets/                     ← Images sources (icon-source.png, splash-source.png)
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
- `profiles` — Profils soignants (id, email, nom, role, is_admin, modules_actifs, jours_presence, checklist_items)
- `patients` — Patients hospitalisés (chambre, DDN, admission, sortie prévue, postcure_statut JSONB, sortie_info JSONB)
- `alertes` — Alertes craving/effet_indesirable/urgence/demande (patient_id, type, intensité, statut)
- `strategies` — Stratégies de prévention patient (5 catégories Marlatt)
- `evenements` — Événements (patient_id nullable : individuels + équipe). Types : entretien, consultation, familial, rdv_externe, reunion, staff, labo, supervision
- `permissions_sortie` — Demandes de permission (statut, date/heure sortie/retour, motif)
- `contenus_partages` — Messages bidirectionnels patient ↔ équipe (notes, liens, consignes). `cree_par IS NULL` = envoyé par le patient, sinon = soignant. Migration v21 : policy INSERT ouverte anon.
- `fiches_traitements_patient` — Fiches traitements prescrites (checklist)

### Tables groupes
- `groupe_animateurs` — Soignants désignés animateurs (groupe_slug, user_id). Migration v23 : FK → `profiles(id) ON DELETE CASCADE` (au lieu d'auth.users) + policy DELETE ouverte aux admins.
- `groupe_modifications` — Modifications par date (annulation, changement heure, exclusions, horaires_individuels JSONB)
- `groupe_rappels` — Rappels envoyés par l'animateur
- `participations` — Présences/absences aux groupes (patient ou animateur)
- `demandes_seances` — Demandes de séances thérapies complémentaires (en_attente/acceptee/refusee)

### Tables auth et réunions
- `device_tokens` — Appareils de confiance soignants (auto-login 90j)
- `presences_reunions` — Présences aux réunions staff (médecins)

### Tables gestion lits
- `liste_attente` — Patients en attente d'admission (age, ddn, addressage, date_entree_prevue, date_sortie_prevue, pre_admission, destination_prevue JSONB, commentaire). Migration v22 : ajout `pre_admission`, `destination_prevue`, `ddn`, `date_sortie_prevue`.

### Tables livret IFSI
- `etudiants_stages` — Stage de l'étudiant·e IDE (nom, IFSI, promo, dates, IDE référent·e)
- `etudiant_progression` — Progression par question (réponses, vu par tuteur)

### Tables QCM EDN externe
- `tuteur_etudiant` — Lien tuteur↔apprenant (type='externe' ou 'etudiant_ide')
- `qcm_sessions` — Une ligne par série QCM jouée (item, mode, score)
- `qcm_reponses` — Une ligne par question répondue (`question_source` stable type "Item 76 - Q12", correct, temps_ms)
- `qcm_flags` — Signalements externe → tuteur (erreur_question | demande_explication, statut ouvert/traité, `tuteur_reponse`)
- `questions_tuteur` — Questions textuelles externe → tuteur (migration v20)

> Historique détaillé de toutes les migrations v1 à v20 : voir `CLAUDE_ARCHIVE.md` section E.

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
Ordre des cartes : Programme, Journal, Traitements, Ateliers, Stratégies, Permission, Messages, Mon avis
- ✅ **J'ai un craving** : bouton pleine largeur rouge (en haut)
- ✅ **Programme** : timeline, navigation date, routine, groupes semaine A+B colorés, badge semaine A/B, horaires individuels, boutons Présent/Absent, "Demander une séance"
- ✅ **Mon journal** : agenda craving (semaine/mois/3mois/1an), courbe tendance, stats
- ✅ **Traitements** : fiches prescrites, 20 fiches HTML, navigation par catégorie
- ✅ **Ateliers** : navigation date, Présent/Absent par groupe, demande de séance, historique, stats, animateur/lieu affichés
- ✅ **Mes stratégies** : plan prévention guidé (5 catégories Marlatt), section éducative
- ✅ **Permission** : demande sortie (48h max, 20h retour), statut en attente/validée/refusée
- ✅ **Messages** : conversation bidirectionnelle patient ↔ équipe (compose box + chat-style, patient à droite, soignant à gauche). Migration v21 (policy INSERT `contenus_partages` ouverte anon). Convention `cree_par IS NULL` = patient. Côté admin : **compose inline unifiée** dans l'accordion Messages (sélecteur type note/lien/consigne + titre + texte + envoi), le bouton "Partager du contenu" et le modal séparé ont été supprimés.
- ✅ **Mon avis** : feedback structuré sur l'application (email ou copie)
- ✅ **Faire une demande de post-cure** : lien vers formulaire patient standalone
- ✅ **Badges notification** : ronds rouges sur Messages, Traitements, Programme, Ateliers

### Module Soignant (admin) — 3 onglets
- ✅ **Dashboard** : liste patients avec badges craving/permission, admission, détail patient (journal craving, fiches traitements, permissions, événements, voir comme patient, dossier post-cure accordion, export PDF/HTML, supprimer séjour), Entrées/Sorties (sorties prévues auto, liste d'attente CRUD), sections "Mon élève" (livret IFSI) + "Mon externe" (QCM EDN)
- ✅ **Toolbox** : iframe V1 avec dark mode
- ✅ **Planning** : navigation semaine ← → avec dates et badge Semaine A/B, groupes dynamiques, réunions de la semaine (masquées si heure passée), section "Historique de la semaine" dépliable, Staff Psychiatrie filtré par jours de présence

### Gestion comptes (admin)
- ✅ Création, modification rôle/nom, toggle admin
- ✅ Jours de présence par soignant (array [1-5], filtre Staff Psy)
- ✅ Suppression complète (profil + compte Auth via Cloudflare Function)
- ✅ Désignation animateurs pour les groupes

### App exportée HTML autonome
- ✅ Signal craving + agenda + stratégies modifiables
- ✅ Fiches traitements embarquées
- ✅ PIN local SHA-256, dark mode, export/import JSON
- ✅ Tutoriel au premier lancement

### Module Post-cure (P8) — 100% local, conforme non-HDS
- ✅ **Volet patient** (`postcure/patient.html`) : 6 étapes, génération ZIP+PDF, envoi par email
- ✅ **Volet médecin** (`postcure/medecin.html`) : formulaire médical complet, uploads, pré-remplissage depuis dashboard
- ✅ **Données partagées** (`shared/postcure-structures.js`) : 14 structures post-cure
- ✅ **Dashboard** : accordion "Dossier post-cure" dans Chambre XX, structure + date, 4 checkboxes workflow
- ✅ **Dark mode** complet synchronisé
- ✅ **PDFs** : police 9pt, sections barre colorée latérale, marges 20mm, smart page breaks, footer USCA
- ✅ **Sécurité** : aucune donnée patient stockée sur serveur — seuls des flags workflow dans `patients.postcure_statut`

### Module Livret IFSI (`etudiant/index.html`)
- ✅ SPA mobile-first : 14 chapitres (~90 questions), 6 types de questions, auto-correction, feedback visuel, persistance debounced 500 ms
- ✅ Lexique 21 acronymes (ELSA, USCA, CSAPA, CAARUD, CJC, OH, AA, RDR, TSO, THC, CBD, GHB, SLAM, PTSD, CPOA, TS, CMP, TDAH, ASPDT, AAH, ALD)
- ✅ **Vue tuteur** : section "Mon élève" admin, mode lecture seule (`?stage=<id>`), bouton "Marquer comme vu"
- ✅ **Édition élève admin** : modal (nom, IFSI, promo, dates, IDE référent·e) + menu ⋯ (clôturer / réinitialiser / supprimer)
- ✅ **Aperçu Toolbox** : carte "📘 Livret IFSI" → `/etudiant/?preview=demo`
- ✅ **Export HTML imprimable** : bouton ⬇ génère HTML avec questions + réponses + explications

### Module Externe (`extern/index.html`) — 3 onglets
- ✅ **Garde session** : `role='externe'` → redirect `/extern/`
- ✅ **Onglet Dashboard** : accordion "Patients" (Chambres / Sorties / Attente avec CRUD complet), détail patient identique admin (journal craving, fiches, permissions, actions, exports PDF/HTML, voir comme patient), carte Mon QCM EDN, Checklist, Questions au tuteur, Signalements + Export
- ✅ **Onglet Toolbox** : iframe lazy-load `staff/toolbox.html?embedded=true`
- ✅ **Onglet Planning** : copie complète du planning admin, lazy-load
- ✅ **QCM EDN** : sélecteur item uniquement, mode entraînement séquentiel, correction + explication immédiate, 💬 Explication + 👎 Signalement par question, score final persisté (`qcm_sessions` + `qcm_reponses`)
- ✅ **Mode tuteur** (`?preview=tuteur`) : bandeau orange, "Voir toutes les questions" par item, masque Toolbox/Planning de la nav
- ✅ **Export app autonome** : HTML standalone 477 questions embarquées + joueur interactif
- ✅ **Checklist personnelle** : stockée dans `profiles.checklist_items` (debounce 600ms)
- ✅ **Questions au tuteur** : externe pose/modifie/supprime, tuteur répond via modal (migration v20)
- ✅ **Lazy-load data** : `index.json` au démarrage, `item_*.json` à la sélection (cache mémoire session)

### Vue tuteur dans admin
- ✅ Section "Mon externe" pour médecin/admin — stats sessions, signalements en attente, réponse aux flags, questions de l'externe avec réponse inline, bouton ↺ réinitialisation (supprime sessions/réponses/flags au changement d'externe). Tous les médecins voient l'externe.
- ✅ Accordion "Mes élèves" unifié : IFSI + QCM en sous-sections

### Auth avancée
- ✅ Client Supabase robuste (safeStorage, PKCE, autoRefresh)
- ✅ Appareils de confiance (device tokens 90j, max 5, auto-register/révocation)
- ✅ Cloudflare Function suppression compte (`functions/api/delete-user.js`)

### Toolbox Soignant V1
- ✅ **Accueil** : 3 grandes cartes (Protocoles USCA, ELSA, Dossier post-cure) + 3 petites (Traitements, Scores, Interactions) + Feedback
- ✅ **Protocoles USCA** → hub : Substances (7) + **Ressources** (4 accordions : Fiches / Articles / Recos / Algos, tags thématiques colorés, ouverture `target="_blank"`). Manifest-driven : `ressources_doc/index.json` fetch au mount, 6 ressources actuellement (BZD étoiles PDF + BZD équivalences HTML, antipsy étoiles PDF + antipsy CPZ HTML + comparatif antipsy HTML, INCAS TUS/TDAH PDF). Design system partagé `shared/ressource-doc.css` pour tous les HTMLs (responsive mobile, dark mode auto, impression).
- ✅ **Traitements** → 2 accordions : **Fiches Patient** (20 HTML, ouvertes par défaut, répartis en 5 catégories Sevrage/TSO/BZD/Psychotropes/Hypnotiques) + **Fiches Expert** (8 PDFs antipsychotiques classés G1 neuroleptiques classiques / G2 atypiques, ouverture `target="_blank"`).
- ✅ **Scores → OUTILS** : Convertisseur BZD (→ diazépam, seuil hospit >40 mg DZP-eq) + **Convertisseur CPZ** (→ chlorpromazine, 14 molécules G1/G2, alerte haute dose >1000 mg CPZ-eq/j, vigilance addicto OH/BZD/opioïdes).
- ✅ **ELSA** → hub : Liaisons en cours (ToDo list + drag-and-drop + checklist), Admission & Orientation, Fiches réflexes (5)
- ✅ Dark mode complet

---

## 7. À FAIRE

**🎯 Prochain chantier : P5 — Personnalisation modules soignant** (plan d'implémentation à définir lors de la prochaine session). Principe : chaque profil (médecin / IDE / psychologue / pharmacien / secrétaire / externe / étudiant IDE) ne voit que les cartes pertinentes pour son rôle (dans dashboard, toolbox, etc.). Stockage : colonne `modules_actifs` (JSONB ou TEXT[]) déjà présente dans `profiles`.

- [ ] **Notifications Push V2 — étape suivante** : étendre aux groupes thérapeutiques (rappel 5 min avant pour les patients hospitalisés) et aux séances de thérapie complémentaire. V2 médecins en cours (migration v29 + send-push + SW + UI admin + cron étendu — voir `SETUP_PUSH.md`). V1 shippée v3.99 : events planifiés + messages + permissions + rappels 5 min (events uniquement).
- [ ] **(Priorité basse) Planning A/B stocké en BDD** : aujourd'hui le planning A/B est côté client (`shared/planning-groupes.js`). La V2 Push médecins (cron-reminders) duplique une copie minimale en TS dans l'Edge Function — c'est pragmatique mais ça crée 2 sources de vérité. Migrer le planning dans une table Supabase (ex: `groupes_planning(slug, jour, heure_debut, heure_fin, semaine, actif)`) permettrait au cron de la lire directement et supprimerait la duplication. À faire quand un autre module aura besoin du planning côté serveur.
- [ ] **(Priorité basse) Silence soignant configurable par profil** : aujourd'hui la règle "silence" (semaine après 16h + weekend + fériés France) est hardcodée dans `supabase/functions/send-push/index.ts`. Permettre à chaque soignant de régler ses propres plages horaires depuis le modal Paramètres (colonne `profiles.push_quiet_hours JSONB` par exemple). Liste des jours fériés FR à maintenir chaque année tant qu'on ne calcule pas Pâques dynamiquement.
- [ ] **Formulaire pré-admission** — QR code salle d'attente (identité, couverture, substances, scores AUDIT-C/CAST, ATCD, envoi email, 5 min max)
- [ ] **Annuaire patients** — répertoire post-sortie
- [ ] UI "Mes appareils de confiance" dans paramètres du compte
- [ ] **Livret IFSI — P4** : export PDF du livret rempli à la fin du stage (jsPDF).
- [ ] **(Priorité basse) Toolbox — performances & dark mode instantané** : la Toolbox a ~500 ms de latence au chargement (transpilation Babel in-browser du JSX) et au toggle dark mode (reload de l'iframe forcé car les couleurs sont figées dans les constantes JS `C.n[]`, `C.t[]`…). Fix racine commun : introduire un bundler (Vite ou esbuild) pour pré-compiler le JSX et passer les couleurs en variables CSS (`var(--n-800)` au lieu de `C.n[800]`). Contrevient à la règle "pas de bundler" §9 — à reconsidérer quand la latence deviendra vraiment gênante.
- [ ] **Ressources Toolbox — GitHub Action pour regénérer `index.json`** : aujourd'hui le manifest est maintenu à la main (ajouter un PDF = ajouter une entrée au JSON). Ajouter une Action qui scanne `ressources_doc/fiches|articles|recos|algos/` et regénère `index.json` à chaque push, pour un "vrai" zéro-code workflow. Inférence raisonnable : type depuis le sous-dossier, nom de fichier → titre (humanisé), date = dernière modif git. Garder les overrides `tag` et `meta` dans un YAML frontmatter optionnel dans le nom/fichier si nécessaire.
- [ ] **Toolbox — Fiches Expert hors antipsychotiques** : enrichir `fiches_expert/` avec synthèses cliniques pour les autres familles (BZD, TSO/méthadone-BHD, thymorégulateurs, stimulants, antidépresseurs). Structure d'accordion déjà en place dans `TraitementsView` — il suffit d'ajouter les PDFs et les entrées dans `FICHES_EXPERT_CATS`.

---

## 8. MODULES CLINIQUES V1 (TOOLBOX)

### Accueil Toolbox (staff/toolbox.html, iframe dans admin)

| Carte | Type | Contenu |
|---|---|---|
| **Protocoles USCA** | Hub (grande carte) | → Substances (7 protocoles) + Ressources (manifest-driven, 4 accordions, tags thématiques) |
| **ELSA** | Hub (grande carte) | → Liaisons en cours (ToDo), Admission & Orientation, Fiches réflexes (5) + scores repérage |
| **Dossier post-cure** | Grande carte | → Ouvre le volet médecin (postcure/medecin.html) |
| **Traitements** | Petite carte | 2 accordions : Fiches Patient (20 HTML) + Fiches Expert (8 PDFs antipsychotiques) |
| **Scores** | Petite carte | Cushman, COWS, AUDIT, PHQ-9, GAD-7, convertisseurs BZD et CPZ |
| **Interactions** | Petite carte | 18 interactions critiques, sélection multiple |
| **Feedback** | Barre en bas | Bug, suggestion, correction → email |

### Pharmacopée
- **Sevrage/maintien** : diazépam, oxazépam, baclofène, acamprosate, naltrexone, nalméfène, topiramate, NAC, méthadone, buprénorphine, disulfirame
- **Psychotropes** : méthylphénidate, lisdexamfétamine, sertraline, venlafaxine, vortioxétine, cyamémazine, chlorpromazine, alimémazine
- **Convertisseurs** : BZD → diazépam (seuil hospitalisation >40 mg DZP-eq) · Antipsychotiques → chlorpromazine (alerte haute dose >1000 mg CPZ-eq/j, 14 molécules G1/G2)
- **Non pharmaco** : NADA, hypnose, TRV, tDCS

### Règles cliniques
- Toujours préciser **AMM / hors AMM**
- Toujours indiquer le **niveau de preuve** (A, B, C, D)
- Toujours lister les **contre-indications**

---

## 9. CONVENTIONS DE DÉVELOPPEMENT

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

## 10. CONTACTS & LIENS

| Quoi | Valeur |
|---|---|
| Repo GitHub | https://github.com/jcluisada-cmd/USCA-Assistant |
| Production | https://usca-connect.pages.dev |
| Email | jc.luisada@gmail.com |
| Supabase | pydxfoqxgvbmknzjzecn.supabase.co |
| Affiche équipe | affiche-equipe.html (A4, QR code) |
| **Archive historique** | `CLAUDE_ARCHIVE.md` (à lire à la demande) |
