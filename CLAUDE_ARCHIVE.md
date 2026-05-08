# USCA Connect — Archive (historique & specs)

> Fichier d'archive à lire **à la demande** (pas chargé automatiquement en contexte).
> Contient : historique détaillé des sessions, bugs corrigés, specs déjà implémentées, vision long terme.
> Pour l'état courant et les règles actives, voir `CLAUDE.md`.

---

## A. BUGS HISTORIQUES (corrigés)

| Bug | Sévérité | Statut |
|---|---|---|
| Modals admin ne se ferment pas au clic fond noir | Moyenne | ✅ Corrigé v3.25 |
| Déconnexion patient ne redirige pas vers l'accueil | Basse | ✅ Corrigé v3.25 |
| Suppression de compte Supabase Auth impossible | Haute | ✅ Cloudflare Function créée v3.25 |

---

## B. HISTORIQUE DES SESSIONS

### Session 16/04 soir (v3.25 → v3.37)
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

### Session 16-17/04 nuit (v3.39 → v3.53)
- [x] Réorganisation cartes patient (Programme, Journal, Traitements, Ateliers, Stratégies, Permission, Messages, Mon avis)
- [x] Réorganisation Toolbox : 3 grandes cartes (Protocoles USCA, ELSA, Dossier post-cure) + 3 petites (Traitements, Scores, Interactions)
- [x] Protocoles USCA → hub (Substances, Checklist Séjour, Comorbidités)
- [x] ELSA → hub (Liaisons en cours + ToDo list, Admission, Fiches réflexes)
- [x] Liaisons ELSA : formulaire, drag-and-drop, checklist (indication, motivation, orientation), ajout liste d'attente
- [x] Entrées/Sorties dans dashboard : sorties prévues auto + liste d'attente Supabase (CRUD, adressage, admission)
- [x] Planning dynamique : navigation ← semaine →, groupes à venir/historique, réunions filtrées, Staff filtré par jours de présence
- [x] Exports PDF/HTML depuis dashboard patient (Chambre XX → fiche sortie + app sortie)
- [x] **P7** — Ménage technique : suppression staff/index.html, migrations dans `migrations/`, images sources dans `assets/`
- [x] **P8** — Post-cure : séparation volet patient + volet médecin + structures partagées, 100% local (non HDS)
- [x] P8 — PDFs améliorés (police 9pt, sections colorées, barre latérale, smart page breaks, footer)
- [x] P8 — Dark mode formulaires post-cure (sync app, toggle)
- [x] P8 — Bouton "Dossier post-cure" dans Actions Chambre XX + checkboxes statut workflow
- [x] P8 — Retrait stockage Supabase post-cure (conformité non-HDS) — tout 100% local
- [x] Jours de présence soignants (profiles.jours_presence, config depuis Comptes, filtre Staff Psy)
- [x] Dark mode : fix lisibilité indigo (patient, admin, planning, Toolbox dégradés)
- [x] Bug fix : synchro sorties prévues après mise à jour date sortie

### Session 17/04 soir (v3.62 → v3.64)
- [x] **Fix critique** — accolade `});` orpheline dans `admin/index.html` (commit cd32ca3) qui cassait tout le script inline : module admin figé, page vide après déconnexion, redirection erratique vers module patient. Cache SW bumped pour forcer refresh.
- [x] **Fix closure var+async dans Staff Psychiatrie** — `reu.jour` était capturé par closure dans une IIFE async → après la boucle `for`, il pointait vers la dernière réunion (jeudi). Conséquence : Dr Fatout (jours_presence=[4]) apparaissait dans le Staff du lundi. Passage de `reu.jour` en paramètre explicite.
- [x] **Fix post-cure patient** — bouton « Faire une demande de post-cure » disparaissait dès qu'une structure (et pas seulement une date) était définie. Condition simplifiée à `if (hasDate)` : le bouton réapparaît automatiquement si la date est retirée.
- [x] **Fix DB post-cure** — `updatePostcureStatut` écrasait systématiquement `structure` et `date_postcure` par la date du jour (fonction conçue pour checkboxes, détournée pour valeurs libres). Distinction `value === true` (workflow → date du jour) vs `value` string (→ valeur brute). `shared/supabase.js:549`.

### Session 17/04 nuit (v3.64 → v3.70)
- [x] **Fix programme patient** — timeline ne rendait qu'une ligne à cause d'un `ReferenceError: dateStr is not defined` dans `renderTimeline` (variable définie dans `loadProgrammeForDate` mais utilisée sans paramètre). Ajout passage explicite `dateStr/date/_progParticipations/_progDemandes` + filtre amont des activités avec heure invalide + try/catch par itération pour robustesse (commit `0131138`).
- [x] **Dashboard sorties — destination + checklist documents** (commit `1e9c64a`, refs `3c8cacb` pour fixes layout) — migration v15 `sortie_info` JSONB. Modal sortie avec radio RAD/Post-cure/Autre + select centre (14 via `shared/postcure-structures.js`). Accordion cliquable sur chaque ligne sortie avec checklist 3 états (Ordonnance/Transport/Bulletin/CRH — À faire / ✓ Fait / N/A). Badge chambre passe en vert quand tous items sont réglés (fait OU N/A).
- [x] **Fix SW chrome-extension** — ignore les requêtes non-http pour éviter `Failed to execute 'put' on 'Cache'`.
- [x] **Module Livret IFSI — P1 complète** (commits `f657f94`, `2c5f444`, `5881c24`, `ec51590`, `48faf3d`, `3e53ce6`) :
    - Migration v16 : tables `etudiants_stages` + `etudiant_progression` (RLS : élève voit son stage, IDE/médecin voient tout, admin CRUD).
    - Rôle `etudiant_ide` (underscore) avec redirection login → `/etudiant/`.
    - SPA `etudiant/index.html` : header sticky (safe-area iPhone OK), onglets scrollables (Accueil + Lexique + 11 chapitres), moteur rendu 6 types de questions (fill_in, QCM single/multi, vrai/faux, table_fill, texte_libre), auto-correction normalisée (casse/accents/ponctuation + mots-clés), feedback visuel (emerald/amber/rose), persistance debounced 500 ms.
    - Contenu pédagogique `shared/livret-ifsi-contenu.js` : 14 chapitres rédigés, ~90 questions. Lexique 21 acronymes (ELSA, USCA, CSAPA, CAARUD, CJC, OH, AA, RDR, TSO, THC, CBD, GHB, SLAM, PTSD, CPOA, TS, CMP, TDAH, ASPDT, AAH, ALD).
    - **Vue tuteur (P2)** : section "Mon élève" dans dashboard admin pour IDE/médecin/admin (`db.getAllStages()` + progression). Clic "Consulter le livret" → `/etudiant/?stage=<id>` en mode lecture seule (bandeau orange, inputs disabled, feedback toujours visible, bouton "✓ Marquer comme vu" par question).
    - **Édition élève (P1-C)** : bouton ✏️ admin → modal (nom, IFSI, promo, année, dates, IDE référent·e). Menu ⋯ admin : clôturer stage / réinitialiser progression / supprimer stage.
    - **Carte Toolbox "📘 Livret IFSI"** → `/etudiant/?preview=demo` (aperçu contenu sans élève, pour IDE avant entretien).
    - Workflow "1 élève à la fois" : entre 2 stages → ✏️ modifier l'identité + ⋯ réinitialiser progression + nouveau mot de passe → livret vierge.

### Session 19/04 (v3.70 → v3.71)
- [x] **Module QCM EDN externe** (commit `6ccd59c`) — chantier complet livré en une session :
    - Migration SQL : 4 tables `tuteur_etudiant`, `qcm_sessions`, `qcm_reponses`, `qcm_flags` + RLS. Fichier local **v17** car v15/v16 distantes étaient déjà prises (sortie_info + livret IFSI) — appliquée côté Supabase sous le nom interne `v15_qcm_edn`.
    - `shared/qcm-engine.js` : moteur lazy-load — `loadIndex()`, `loadItem(label)` avec cache mémoire, `getQuestions({item, difficulte, mode, n})` (random en entraînement, séquentiel en examen), `saveSession()`, `flagQuestion()`, `getMyFlags()`, `getMyStats()`. Helper `_utils.questionSourceId(item, n)` pour identifier une question de manière stable (`"Item 76 - Q12"`), `_utils.itemToFilename` pour résoudre `"Item 66a"` → `item_66a.json`.
    - `extern/index.html` : dashboard externe (chambres lecture seule, sessions QCM, signalements). Construction DOM 100 % `createElement` (helper `el(tag, attrs, children)`) — pas d'`innerHTML` sur données dynamiques, défensif même si le JSON devenait public.
    - `data/` : 1 catalogue `index.json` + 23 fichiers `item_*.json` (477 questions EDN Psychiatrie-Addictologie). Encodage UTF-8 vérifié.
    - Routing `index.html` : `role='externe'` → `extern/`, `role='etudiant_ide'` → `etudiant/`, autres → `admin/`.
    - `sw.js` v3.71 : précache `extern/`, `qcm-engine.js`, `data/index.json` (les 23 items restent en cache dynamique).
    - `staff/toolbox.html` : carte "Livret IFSI" retirée (accès suffisant via dashboard "Mon élève").
    - `admin/index.html` : bouton « Générer une app patient vierge » masqué (code JS conservé).

### Session 19/04 soir (v3.71 → v3.75)
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

### Session 19-20/04 (v3.81 → v3.82) — Refonte extern en 3 onglets
- [x] **Dashboard externe — refonte complète** : `extern/index.html` passe de single-page (1298 lignes) à 3 onglets (~3370 lignes) avec navigation bottom-nav et IDs admin directs (sans préfixe `ex-`).
- [x] **Onglet Dashboard** : accordion "Patients" avec 3 sous-onglets (Chambres / Sorties / Attente) + carte QCM EDN + 2 petites cartes (Signalements + Export) + Checklist + Questions au tuteur. Le détail patient (section dédiée) reprend exactement les fonctionnalités admin : Journal craving, Fiches traitements, Permissions, Actions (événement, permission, contenu, sortie, post-cure), exports PDF/HTML, Voir comme patient, suppression séjour. Tous les modals admin (delete, event, perm, contenu, sortie) intégrés.
- [x] **Onglet Toolbox** : iframe lazy-load `staff/toolbox.html?embedded=true` (ne charge qu'au premier clic).
- [x] **Onglet Planning** : copie complète du planning admin (renderGroupesTab + openGroupeActionModal + handlers `btn-prev/next-week`, `btn-add-event-equipe`, `btn-toggle-historique`, modal animateur). Lazy-load au premier affichage.
- [x] **Mode tuteur (`?preview=tuteur`)** : bandeau orange via div HTML `#tuteur-banner` (plus injecté dynamiquement), masque les sections non-QCM, masque les onglets Toolbox/Planning de la nav (focus QCM uniquement).
- [x] **Architecture HTML** : `body` en flex column 100dvh, conteneur tabs avec `position:absolute; inset:0`, classe `.extern-tab-flex` pour le tab toolbox afin que l'iframe remplisse tout l'espace via `flex:1`.
- [x] **Scripts partagés** ajoutés à extern : `fiches-catalogue.js`, `planning-groupes.js`, `postcure-structures.js` (pour les fonctions de détail patient et planning).
- [x] **sw.js** : v3.81 → v3.82.
- [x] **admin/index.html** : onglet "Patients" renommé "Dashboard", icône Toolbox passée en clé.

### Session 20/04 (v3.82 → v3.83) — Message au tuteur + archive CLAUDE.md
- [x] **Extern** : carte "Signalements" remplacée par "Message au tuteur" (canal texte libre externe ↔ tuteur).
- [x] **Extern** : rechargement `loadExternData()` à chaque ouverture de l'accordion Patients (évite données obsolètes).
- [x] **CLAUDE.md** : extraction de l'historique détaillé (migrations v1-v20, sessions précédentes, spec vision patient V3, spec auth P9) vers `CLAUDE_ARCHIVE.md`. CLAUDE.md passe de document fleuve à référence concise chargée en contexte, archive lue à la demande.
- [x] **sw.js** : v3.82 → v3.83.

### Session 20/04 (suite) — Bouton ↺ réinitialisation externe + ménage todo
- [x] **Admin — Mon externe** : bouton ↺ ajouté, supprime `qcm_sessions` + `qcm_reponses` + `qcm_flags` + `questions_tuteur` de l'externe courant (changement d'externe).
- [x] **dashboard.md** supprimé (chantier v3.81 clos).
- [x] **LIVRET_IFSI_IMPLEMENTATION.md — P4 simplifiée** : retrait du bilan d'auto-évaluation, du commentaire tuteur signé et de la table `bilans_stage`. P4 = export PDF du livret rempli, point.

### Session 20/04 (v3.83 → v3.84) — Nettoyage Toolbox
- [x] **Toolbox / Protocoles USCA** : suppression de "Checklist Séjour J1-J12" (jamais utilisée) et de "Comorbidités psy" (contenu insatisfaisant). Retrait du composant `SejourView`, de la const `SEJOUR`, du composant `ComorView`, des routes `case "sejour"` / `case "comorbidites"`, des entrées du hub `ProtocolesHub`, mise à jour `protoViews` et du sous-titre de la carte d'accueil.
- [x] Le hub Protocoles USCA ne contient plus que "Substances" — prépare l'arrivée des ressources addicto (PubMed / HAS) dans un prochain chantier.
- [x] **sw.js** : v3.83 → v3.84.

### Session 20/04 (v3.84 → v3.85) — Carte « Ressources » dans Toolbox
- [x] **Toolbox / Protocoles USCA** : nouvelle carte **Ressources** (`RessourcesView`) avec 3 accordions par type : 📑 Fiches pratiques, 🧪 Résumés d'articles, 📘 Recommandations (accordion "Bientôt…" si vide).
- [x] **Tags thématiques colorés** (pastilles) : OH, BZD, Opioïdes, TDAH, TSPT, Humeur, Cannabis, Stimulants, Polyconso, Général. Définis dans const `RESSOURCE_TAGS`.
- [x] **2 ressources initiales** dans `ressources_doc/` : `benzodiazepines_etoiles_print_A4.pdf` (fiche BZD système étoilé) et `INCAS_resume_clinique.pdf` (article TUS+TDAH, Brynte et al. 2026, tag TDAH).
- [x] **Ouverture `target="_blank"`** : le viewer natif du navigateur gère la rotation paysage sur mobile + desktop — `manifest.json` inchangé (`"orientation": "portrait"` préservé pour le reste de l'app). Solutions écartées : `orientation: any` (casse les autres vues), `screen.orientation.lock('landscape')` (pas supporté iOS Safari), iframe + rotation CSS (UX dégradée).
- [x] **Service Worker** : PDFs non pré-cachés (poids cumulé), mise en cache automatique cache-first au 1er clic.
- [x] **Navigation** : entrée "Ressources" dans `ProtocolesHub`, route `case "ressources"` dans `renderContent()`, `"ressources"` ajouté à `protoViews` pour que l'onglet du bas reste actif.
- [x] Spec d'origine → archivée ici depuis `TOOLBOX_RESSOURCES.md` (supprimé). Questions ouvertes tranchées : libellé court "Ressources", icône `I.book` (existait), pas de badge "Nouveau" en v1, accordion vide → placeholder "Bientôt…".
- [x] **sw.js** : v3.84 → v3.85.

### Session 20/04 (v3.85 → v3.86) — Messages bidirectionnels patient ↔ équipe
- [x] **Migration v21** (`supabase-migration-v21.sql`) : policy INSERT `contenus_partages` passée de `auth.role() = 'authenticated'` à `WITH CHECK (true)` pour autoriser le patient anon (session localStorage chambre + DDN).
- [x] **Convention auteur** : `cree_par IS NULL` = message du patient, `cree_par = <uuid>` = message du soignant. Aucun changement de schéma, aucune colonne ajoutée.
- [x] **Patient** (`patient/index.html`) :
  - Panel "Messages" devient bidirectionnel. Header renommé "Messages" (plus "Messages de l'équipe").
  - Compose box en bas : `<textarea>` auto-resize + bouton envoi rond violet. Entrée = envoi, Shift+Entrée = saut de ligne.
  - Affichage **chat-style** : patient à droite (bulle violette pleine, arrondi `rounded-br-sm`), soignant à gauche (bulle blanche avec bordure). Titre + icône type conservés pour les messages soignant.
  - Tri chronologique croissant + auto-scroll en bas après chargement / envoi.
- [x] **Admin** (`admin/index.html`) :
  - Nouvel accordion **Messages** dans le détail patient (entre Permissions et Actions), icône violette + badge "N patient" quand le patient a envoyé ≥1 message (différencié visuellement du badge neutre).
  - `renderPatientMessages(patientId)` : chat-style inversé côté admin (patient à gauche, soignant à droite), scroll interne `max-h-[400px]`.
  - Refresh automatique après envoi via le modal "Partager du contenu" existant (pas de nouveau bouton — réutilisation).
- [x] **sw.js** : v3.85 → v3.86.

> **Note** : les sessions v3.87 → v4.06 (10 versions, 20/04 → 25/04) sont résumées dans le header de `CLAUDE.md` mais n'ont pas d'entrée détaillée dans cette archive. Cleanup à faire dans une session dédiée si besoin d'archéologie complète.

### Session 27/04 (v4.06 → v4.07) — P5 Personnalisation modules soignant
- [x] **Spec design** (`docs/superpowers/specs/2026-04-24-p5-personnalisation-modules-design.md`) : décisions figées le 2026-04-24, ajustements 2026-04-27 (inventaire 21 → 18 modules après retrait de `dashboard_nouveau_patient`, `patient_voir_comme_patient`, `patient_supprimer_sejour` qui restent toujours visibles ; déclencheur edit mode déplacé du header vers la modale Paramètres ⚙️).
- [x] **Plan d'implémentation atomique** (`docs/superpowers/plans/2026-04-27-p5-personnalisation-modules-implementation.md`) : découpage en 11 tâches T1-T11, code complet par step, scénarios de vérif manuelle (pas de test runner dans la codebase).
- [x] **Migration v32** (`supabase-migration-v32.sql`) : table `role_modules_hidden` (PK composite `(role, module_id)`, FK `updated_by → profiles ON DELETE SET NULL`). RLS : `rmh_read` ouverte aux authenticated, `rmh_write` réservée aux `is_admin=true`.
- [x] **Modèle "absence = visible"** : la table ne stocke QUE les masquages. Aucune ligne pour un (rôle, module) → visible. Conséquences : BDD légère (~50 lignes max), nouveau module = aucune migration (visible par défaut partout), config lisible d'un coup d'œil.
- [x] **`shared/modules-config.js`** : inventaire des 18 modules (2 onglets, 3 dashboard, 7 patient, 6 toolbox), 5 rôles (`medecin`, `ide`, `psychologue`, `pharmacien`, `secretaire`), labels FR.
- [x] **`shared/module-visibility.js`** : helpers `apply(profile)` (injecte `<style>` dynamique avec `[data-module="X"]{display:none!important}`, bypass admin), `setEnabled(bool)` (toggle du style), `toggleHidden(role, id, bool)` (upsert/delete BDD avec error handling), `fetchHiddenMap()` (retour `{role: Set<moduleId>}`), `mountEditButtons(callback)` (idempotent, injecte ⚙️ par module). Toutes les méthodes utilisent `createElement` + `textContent` (pas d'`innerHTML`, défense XSS proactive).
- [x] **Markup `data-module`** : 17 anchors dans `admin/index.html` (12 modules dont 4 à 2 anchors pour les accordions bouton+content : `patient_craving`, `patient_fiches`, `patient_permissions`, `patient_sortie`) + `dashboard_patients_list` à 2 anchors (`#patients-list` + `#section-patient-detail`). 6 anchors dans `staff/toolbox.html` (cartes JSX d'accueil via champ `dm` ajouté à chaque objet du map).
- [x] **Wire scripts** : `admin/index.html` charge `modules-config.js` + `module-visibility.js` après `auth.js`, appelle `moduleVisibility.apply(profile)` dans `showAdminApp()` après set de `currentProfile`. `staff/toolbox.html` alias `window.parent.sb → window.sb` (même origine), charge les 2 scripts P5 après React/Babel, IIFE de bootstrap qui lit `window.parent.currentProfile` et appelle `apply()`.
- [x] **Edit mode admin** (modale Paramètres) : section "Personnalisation" avec bouton "Activer le mode édition modules" (visible uniquement si `is_admin=true` via toggle hidden dans handler `btn-params`). Clic active `body.module-edit`, désactive le filtrage (`setEnabled(false)`), injecte un bandeau sticky indigo `#module-edit-banner` (avec bouton "Terminer"), monte les ⚙️ par module via `mountEditButtons()`. Sortie via "Terminer" ou re-clic toggle dans la modale.
- [x] **Popover de sélection rôle** : clic ⚙️ ouvre un `.module-popover` flottant aligné au coin haut-droit de l'anchor. 5 checkboxes (1 par rôle), état initial lu depuis `fetchHiddenMap()`. Change event → `toggleHidden()` avec rollback visuel et alert si erreur (typiquement v32 non appliquée). Class `has-hides` mise à jour live sur tous les anchors du module (outline rouge si ≥1 rôle masque). Click outside ferme le popover.
- [x] **Matrix Comptes** (accordion en bas de `#section-comptes`, admin only) : table 18×5 (modules × rôles) groupée par strate (séparateurs "── Onglets ──" / "── Dashboard ──" / "── Patient ──" / "── Toolbox ──"). Cocher = visible, décocher = masqué. Re-fetch BDD à chaque ouverture de l'accordion. Cohérence cross-UI avec edit mode (même store BDD).
- [x] **CSS** (`shared/theme.css`) : `body.module-edit [data-module]` outline indigo dashed (rouge si `has-hides`), `.module-edit-gear` bouton position absolute coin haut-droit (caché hors edit mode), `#module-edit-banner` bandeau sticky, `.module-popover` carte flottante. `!important` sur le `display:none` du masquage runtime — cas d'usage légitime pour qu'aucune règle locale ne re-révèle.
- [x] **Tests scénarios manuels** validés en prod (5/5) : default state (compte test par rôle voit l'UI complète), masquage via edit mode (popover → BDD update → visible côté pharma.test), masquage via matrix (idem mais via cases du tableau Comptes), admin bypass (admin avec role=pharmacien voit TOUT), RLS pharma refus (insert direct depuis console pharma → "row violates RLS").
- [x] **sw.js** : `usca-v4.06` → `usca-v4.07` (bumpé en avance de phase pour faciliter le testing du checkpoint 2 sans Ctrl+Shift+R, single user refresh global).
- [x] **Limites** (notées dans le spec §7) : masquage UI ≠ sécurité BDD (les RLS des tables patients/messages/etc. restent inchangées — un user avec accès API peut toujours lire les données qu'on cache visuellement). Si à l'avenir une feature exige un vrai contrôle d'accès données par rôle, il faudra ajouter des policies RLS dédiées indépendamment de P5.
- [x] **Extensions V2 hors scope** (notées spec §9 pour référence future) : per-user overrides (table `user_modules_override` qui prime sur `role_modules_hidden`), preset par substance/parcours patient, journal d'audit (`role_modules_log`), intégration auto pour nouveaux modules (ajouter à `modules-config.js` + `data-module` → apparaît automatiquement dans matrix + edit mode).

### Sessions v4.08 → v4.24 (24 avril → 8 mai 2026) — détail livré

> Format hérité du header CLAUDE.md avant le split en `CHANGELOG.md` + `MODULES.md` + `DB_SCHEMA.md`.
> Pour le résumé 1-ligne par version : voir `CHANGELOG.md`.

**v4.24 — Sync dark mode iframes EEG/ECT ↔ Toolbox global**
1. **Stratégie URL param** : la Toolbox passe `?theme=dark|light` dans le `src` de l'iframe selon `localStorage.usca_theme`. La fiche lit le param au chargement et applique le dark mode. Comme le toggle global de la Toolbox déclenche déjà un reload (`saveViewThenReload` ligne 1779), l'iframe est rechargée avec le bon param — pas besoin de postMessage runtime, solution minimaliste et robuste.
2. **`shared/ressource-doc.js`** : priorité de résolution du thème — (1) URL param `?theme=` (mode iframe synchronisé), (2) `localStorage('usca-res-theme')` (mode standalone), (3) light par défaut. **Détection mode iframe** via `window.self !== window.top` : en iframe, le bouton flottant ☀️/🌙 est masqué (toggle dans le parent). En ouverture directe (file:// ou nouvel onglet), le bouton reste fonctionnel.
3. **`eeg_ect/fiche_ect.html`** (qui utilise `body.dark`, ancien pattern, distinct de `ressource-doc.css`) : ajout d'un script inline en début de `<body>` qui lit `?theme=` et applique `body.classList.add('dark')` si dark — compatibilité avec le pattern existant sans tout migrer.
4. **Toutes les fiches EEG/ECT bénéficient** : Fiche pratique ECT + 7 fiches handbook (Technical, Normal, Sommeil, Artefacts, Épileptiforme, Status, EEG en réanimation).
5. **SW bump v4.23 → v4.24** (force re-fetch toolbox.html + ressource-doc.js + fiche_ect.html mis à jour).

**v4.23 — Fiche EEG en réanimation (6/6 — batch handbook complet)**
1. **Nouvelle fiche `eeg_ect/fiche_icu_eeg.html`** (~430 lignes) : 10 sections — résumé 4 questions clés (encéphalopathie ? · NCSE ? · pronostic ? · profondeur d'anesthésie ?), encéphalopathie diffuse avec SVG (delta-theta diffus haute amplitude), patterns périodiques ACNS 2021 avec SVG LPDs (anciennement PLEDs · unilatéraux), GPDs (anciennement GPEDs · bilatéraux synchrones), BIPDs (bilatéraux indépendants · pronostic très péjoratif), burst-suppression avec SVG (anesthésie ciblée vs post-anoxie), ondes triphasiques avec SVG (encéphalopathies métaboliques hépatique/urémique), silence électrique cérébral (critère mort cérébrale), continuum ictal-interictal (zone grise + test lorazépam IV), implications ECT (effet cumulatif séances rapprochées), red flags, take home.
2. **Vocabulaire ACNS 2021 mis à jour** explicitement (LPDs/GPDs/BIPDs remplacent PLEDs/GPEDs/BIPLEDs).
3. **SVG schématiques** : encéphalopathie, LPDs périodiques, burst-suppression, triphasiques. Aucune figure du manuel — concepts schématisables.
4. **Pattern iframe + ↗** : carte EEG en réanimation ajoutée (icône activité ardoise foncé `C.n[800]`). Bandeau "À venir" supprimé — toutes les 6 fiches handbook + Technical livrées.
5. **Renommage** : ICU EEG → "EEG en réanimation" partout. Slug fichier `icu_eeg` conservé.
6. **SW bump v4.22 → v4.23**. Batch handbook complet livré.

**v4.22 — Fiche Status epilepticus (5/6 du batch handbook)**
1. **Nouvelle fiche `eeg_ect/fiche_status_epilepticus.html`** (~430 lignes) : 10 sections — résumé urgence, définition opérationnelle ILAE 2015 (t1=5 min, t2=30 min), status convulsif tonico-clonique avec SVG, status focal moteur et complexe, status non-convulsif (NCSE) avec SVG, critères de Salzburg simplifiés, conduite à tenir 4 paliers (BZD 1<sup>re</sup> ligne / antiépileptique IV 2<sup>e</sup> / anesthésie générale burst-suppression 3<sup>e</sup>), implications ECT (confusion post-séance > 1 h = NCSE jusqu'à preuve du contraire), red flags, take home.
2. SVG schématiques crise tonico-clonique (4 phases distinctes en couleur rouge) et NCSE.
3. Carte ajoutée case `eeg_ect` (icône thermo rouge `C.r[700]` urgence). Bandeau "À venir" : reste **EEG en réanimation** (6/6).
4. **SW bump v4.21 → v4.22**.

**v4.21 — Fiche Activité épileptiforme (4/6 du batch handbook)**
1. **Nouvelle fiche `eeg_ect/fiche_epileptiforme.html`** (~440 lignes) : 11 sections — résumé, définition rigoureuse (stéréotypie/paroxysme/polarité/champ), 4 graphoéléments unitaires avec SVG (pointe <70 ms, sharp wave 70-200 ms, pointe-onde, polypointe-onde), patterns groupés généralisés (pointe-onde 3 Hz absence, lente 1,5-2,5 Hz Lennox-Gastaut, hypsarythmie West), distribution spatiale, activations (HV/photostim/sommeil), signification clinique (5% pop sans épilepsie, sensibilité ~50% en simple → ~80% avec sommeil/privation), pièges variants bénins (tableau 7 lignes avec renvois Normal et Sommeil), implications ECT pré/per/post-séance, red flags, take home.
2. **SVG schématiques en rouge `var(--r-500)`** pour les graphoéléments (cohérent avec Artefacts).
3. **Renommage à venir — fiche 6/6 ICU EEG → "EEG en réanimation"** (décision JC pour vocabulaire hospitalier français standard, slug `icu_eeg` conservé).
4. Pattern iframe + ↗ : carte ajoutée case `eeg_ect` (icône alerte rouge `C.r[600]`).
5. **SW bump v4.20 → v4.21**.

**v4.20 — Fiche Artefacts (3/6 du batch handbook)**
1. **Nouvelle fiche `eeg_ect/fiche_artefacts.html`** (~340 lignes) : 11 sections — résumé, 3 grandes familles (biologique/mécanique/électrique), EMG (SVG hérissé rouge), ECG/pulse (SVG impulsions régulières), oculaires/blink (SVG déflexion frontale), sueur (SVG dérive lente), secteur 50 Hz + mauvais contact (SVG oscillation fine), tableau de poche 9 lignes, méthode systématique 3 questions (où/quand/comment), pièges péri-ECT (pré-induction, per-séance, recovery), take home. Tous SVG en rouge `var(--r-500)`.
2. **Aucune figure du manuel** — tous SVG faits maison (option C).
3. Pattern iframe + ↗ : carte ajoutée case `eeg_ect` (icône alerte ambre `C.a[700]`).
4. **SW bump v4.19 → v4.20**.

**v4.19 — Fiche Sommeil (2/6 du batch handbook)**
1. **Nouvelle fiche `eeg_ect/fiche_sommeil.html`** (~280 lignes) : 7 sections — résumé · architecture du sommeil (5 stades + cycles 90 min) · stades détaillés (Éveil/N1/N2/N3/REM) · tableau récapitulatif EEG/EOG/EMG · variants bénins (vertex sharp, POST, sawtooth, K-complexes, fuseaux) avec critères distinction épileptiforme · implications péri/post-ECT · take home.
2. **2 figures Oxford intégrées** (option C, mix figures) : `fig_sommeil_stades.png` (800×1019, 454 KB — fig 17.2) et `fig_sommeil_variants.png` (800×1015, 332 KB — fig 17.4). Wrapper `.eeg-fig-wrap.compact` (max-width 520 px). Footer attribution sobre option A.
3. Pattern iframe + ↗ : carte ajoutée case `eeg_ect` (icône stéthoscope ardoise).
4. **SW bump v4.18 → v4.19**.

**v4.18 — Fiche EEG normal (1/6 du batch handbook)**
1. **Nouvelle fiche `eeg_ect/fiche_normal_eeg.html`** (~370 lignes) : 10 sections — résumé · activité de fond adulte éveillé (tableau bandes + asymétrie tolérée 50%) · réaction d'arrêt avec schéma SVG · variantes physiologiques (mu rhythm SVG en arche, lambda, BETS, wickets, 14&6, SREDA, mid-temporal RTTD) · variations par âge · activations standardisées (HV 3 min, photostim, sommeil) · checklist 10 points · frontières du normal vs anormal · implications pré/post-ECT · take home. Pas de figure manuel (concepts schématisables en SVG).
2. Pattern iframe + ↗ appliqué : carte Normal ajoutée case `eeg_ect`.
3. **TODO ajoutée — Sync dark mode global ↔ iframes fiches** (livrée en v4.24).
4. **SW bump v4.17 → v4.18**.

**v4.17 — Fiches EEG/ECT en iframe intégré + fix mise en page fiche ECT**
1. **Iframe intégré dans Toolbox** : nouveau pattern `selEegFiche` (state `useState({slug, nom})`) dans `staff/toolbox.html`. La fiche s'affiche en iframe au sein de la Toolbox (`height: calc(100vh - 180px)`). Header iframe : ← retour + nom tronqué + ↗ ouvrir nouvel onglet. `nav()` clear `selEegFiche` au changement de vue.
2. **Fix mise en page fiche ECT** : `.grid-2 { grid-template-columns: 1fr; }` permanent. Toutes les sections empilées en 1 colonne — lisibilité optimale en iframe et tablette landscape (Galaxy Tab S7 FE). Schémas spécifiques (`.sismo-schema`, `.phases`) inchangés.
3. **Pattern unifié pour toutes fiches EEG** : Technical + 6 fiches batch utilisent ce pattern.
4. **SW bump v4.16 → v4.17**.

**v4.16 — Fiche pilote EEG : Comprendre un EEG en 10 min**
1. **Nouvelle fiche `eeg_ect/fiche_technical.html`** (378 lignes) : fiche pilote chapitre Technical handbook, rédigée en synthèse pédagogique originale. Sections : résumé · 4 bandes de fréquence (schéma SVG α/β/θ/δ) · origine du signal · montages bipolaire vs référentiel (schéma SVG) · filtres et calibration · artefacts techniques · règles de lecture rapide · checklist psychiatre ECT · red flags · take home. Linke `shared/ressource-doc.css` + `.js`.
2. Pas de figures du manuel (chapitre Technical conceptuel).
3. **Case `eeg_ect` enrichi** : 2 sections distinctes — "Pratique ECT" (`fiche_ect.html` Pitié) et "Fiches EEG (handbook)" (Technical actif + bandeau "À venir" pour 5 chapitres restants).
4. **SW bump v4.15 → v4.16** : pré-cache de `fiche_technical.html` + `shared/ressource-doc.css` + `shared/ressource-doc.js` (jamais cachés auparavant).
5. **Mode validation visuelle** : fiche pilote présentée à JC pour calage du style/structure avant batch.

**v4.15 — Fixes Toolbox post-réorga**
1. **Carte "Protocoles USCA par substance" → "Protocoles USCA"** (label simplifié). Court-circuit du hub `protocoles_hub` : la grande carte ouvre directement `case "substances"`. Bottom nav `Protocoles` pointe sur `id:"substances"`. Le hub reste défini mais inaccessible.
2. **Vue Traitements — renommages + accordéons Fiches Expert** : SectionHead "Traitements" → "Fiches Traitements et Substances". Cartes "Fiches Patient" → "Fiches Traitements Patient", "Fiches Expert" → "Fiches Traitements Expert". `renderExpertSection` refondue : classes médicamenteuses repliées par défaut.
3. **MASTER_PROMPT_EEG_ECT.md — flexibilité longueur** : section "CAP LONGUEUR" relâchée. Cible 400-700 lignes maintenue mais autorisation de dépasser pour chapitres denses.
4. **SW bump v4.14 → v4.15**.

**v4.14 — Réorga Toolbox V1 + nouvelle carte EEG/ECT**
1. **Réorganisation cartes Toolbox** : passage de 3 grandes + 3 petites + 1 carte feedback isolée à **4 grandes + 5 petites**. Grandes : Protocoles USCA / Ressources USCA / Fiches Traitements et Substances / Dossier post-cure. Petites : Scores · EEG/ECT · Interactions (MetaboScope) ; ELSA · Feedback. **Ressources** sortie du sous-hub Protocoles. **ELSA** rétrogradée en petite. **Feedback** intégrée à la grille.
2. **Nouvelle carte "EEG / ECT"** : case `eeg_ect` qui ouvre `eeg_ect/fiche_ect.html` (fiche pratique ECT canonique de la Pitié, copiée depuis `EEG_ECT_handbook/fiche_ect.html`). Placeholder pour fiches EEG handbook à venir.
3. **Renommage "Interactions" → "Interactions (MetaboScope)"**. Le standalone MetaboScope sera intégré ultérieurement.
4. **`MASTER_PROMPT_EEG_ECT.md` corrigé** : aligné charte USCA + dark mode, arborescence `eeg_ect/` + manifest `index.json` calqué sur `ressources_doc/`, design system partagé `shared/ressource-doc.css`, figures PNG externes dans `eeg_ect/assets/` (pas d'inline base64), cap longueur ~400-700 lignes/fiche.
5. **SW bump v4.13 → v4.14**.

**v4.13 — Push 10 min + push patients pour ateliers + permissions triées + pop-up présence ateliers patient**
1. **Rappels push 9-10 min au lieu de 4-5 min** : fenêtre élargie dans `cron-reminders/index.ts` (`in9`/`in10`), textes "Dans 10 min" partout. La latence venait de FCM/APNs (5-30 s) et tick cron (jitter ±60 s) → fix = pousser 5 min plus tôt.
2. **Push 10 min avant atelier à TOUS patients hospitalisés abonnés** : nouveau bloc `3b. Patients hospitalisés` SCAN 3. Récupère `push_subscriptions WHERE patient_id IS NOT NULL` (distinct), filtre via `groupe_modifications.exclusions[]`. Anti-doublon migration v36 : `patient_id UUID NULL` ajoutée à `push_reminders_sent_groupe` + CHECK XOR + 2 UNIQUE partiels. Tag PWA dédié `atelier-<slug>-<date>`.
3. **Affichage permissions admin trié chronologiquement** : `renderPatientPerms` partitionne en `future` et `past`, tri ascendant `date_debut`, séparateur "Permissions passées". `buildPermCard(p, patientId, isPast)` : si past, fond gris + opacité 70% + retrait Valider/Refuser/Annuler/Modifier (seul 🗑 reste).
4. **Pop-up "Tes ateliers du jour" patient** : modal `modal-groupe-presence` 2.5s après ouverture si conditions (heure ≥ 8h30, atelier aujourd'hui, pas annulé, pas exclu, pas répondu, pas fermé jour). Liste verticale ateliers avec boutons Présent·e/Absent·e → `db.upsertParticipation`. "Plus tard" + croix ferment journée.

**v4.12 — Fix modal Paramètres scrollable + pop-up onboarding notifications + retrait notifs craving**
1. **Modal Paramètres (admin) — fix scroll** : container restructuré en `flex flex-col max-h-[90vh] overflow-hidden`, header sticky, body `overflow-y-auto flex-1`. Fermeture par clic overlay + touche Escape.
2. **Pop-up onboarding notifications** : modal `modal-notif-prompt` côté admin (médecin uniquement) ET côté patient. Trigger 1.5s après showAdminApp/showPatientApp. Conditions : `Notification.permission === 'default'` + délai 7 jours. Détection iOS Safari onglet → 3 étapes installation PWA. "Plus tard" et croix : timestamp → relance 7j. "Activer" déclenche programmatiquement le bouton existant.
3. **Retrait notifications craving** : `alerte_craving` retiré de `DEFAULT_NOTIF_PREFS`, du HTML modal Paramètres, et des helpers. Edge Function inchangée.

**v4.11 — Fix RLS DELETE permissions**
1. **Migration v35** : policy `permissions_delete_auth` (`USING (auth.role() = 'authenticated')`). Bug v4.10 — table `permissions` avait INSERT/SELECT/UPDATE en RLS mais aucune policy DELETE → tout DELETE bloqué silencieusement (0 ligne supprimée sans erreur HTTP).
2. **Helper `db.deletePermission` durci** : utilise `count: 'exact'` + throw si 0 ligne affectée.

**v4.10 — Notifications push V3 personnalisables + permissions modifiables/supprimables + nouveau logo phénix**
1. **Préférences notifications par compte** : migration v34 ajoute `profiles.push_preferences JSONB` (NULL = défauts système). Section "Mes notifications" modal Paramètres admin (médecin uniquement) — 5 checkboxes événements + 3 réglages silence perso. L'Edge Function lit `push_preferences` et filtre destinataires en amont par `event_type`. Les prefs perso peuvent **durcir** mais pas assouplir le silence weekend/férié.
2. **Silence soignant : seuil soir 16h → 18h** dans `send-push`. Garde rôle médecin pour push staff.
3. **Push patient — nouveaux événements** : (a) demande de permission patient → médecins abonnés (fire-and-forget) ; (b) validation permission soignant → patient (toujours envoyé, pas filtré).
4. **Permissions admin — modif + suppression** : bouton ✏️ Modifier (mini-form inline 4 champs date/heure + motif, validation 48h max). Modif sur perm `refusee` repasse en `en_attente`. Bouton 🗑 Supprimer disponible tous statuts avec confirmation. Helper `buildPermCard(p, patientId)` factorise rendu + handlers.
5. **UI permissions 2 jours clarifiée** : 1 jour = `Lun. 5 mai · 09:00 → 18:00` ; 2 jours = `↗ Départ : Lun. 5 mai à 18:00` + `↙ Retour : Mar. 6 mai à 09:00`.
6. **Nouveau logo + splash plein écran** : `assets/icon-source.png` remplacé (phénix + poignée de main, 4096×4096) → icon-192/512.png regénérés via PowerShell+System.Drawing. `splash.png` portrait avec mention "USCA Connect". `manifest.json` `background_color` `#f0f4f8` → `#ffffff`. `index.html` splash `inset-0 flex items-center justify-center` + `width:100%;height:100%;object-fit:contain`.

**v4.09 — Mode paysage activé (orientation libre)**
- **Mode paysage** : `manifest.json` passé de `"orientation": "portrait"` à `"orientation": "any"` → la PWA suit l'orientation physique (Android Chrome + iOS Safari ≥ 16.4 standalone). Cible : Galaxy Tab S7 FE en paysage (1366×853). Garde-fou ajouté dans `shared/theme.css` via media query `(orientation: landscape) and (max-height: 500px)` pour téléphones tournés (compactage headers/footers stickys + modales 92vh + splash logo 40vh max).

**v4.08 — Fiches substances poussées au patient + fixes PWA install + QCM externe auto-extend + toolbox accordions repliés**
1. **Fiches substances (16)** : nouveau dossier `fiches-substances/`, table `substances_patient` (migration v33, RLS calquée sur `prescriptions`), `shared/substances-catalogue.js` (16 fiches × 6 catégories : Dépresseurs SNC / Stimulants / Opioïdes / Psychodysleptiques / Mésusage médicamenteux / Tabac), helpers `db.getSubstancesPatient` / `db.addSubstancePatient` / `db.removeSubstancePatient`. Côté admin : 2ème checklist "Fiches substances". Côté patient : carte Traitements → 2 sections (traitements catégorisés ambre + substances liste plate violet). Côté toolbox : 3ème accordion "Fiches Substances" dans `TraitementsView`. Export HTML autonome embarque aussi les fiches substances. SW : 16 HTML pré-cachées.
2. **PWA install** : `icon-192.png` ajouté (généré bicubique HQ depuis icon-512), manifest mis à jour avec 4 entrées (192/512 × `any` + `maskable`).
3. **QCM externe auto-extend** : sessions en cours créées avant le fix v3.98 (cap 10 questions) sont automatiquement étendues à toutes les questions de l'item lors du "Reprendre" (compare `sessionQuestions.length` vs `questions.length`, append manquantes).
4. **Toolbox** : `TraitementsView` ouvre désormais avec tous accordions repliés (`useState(null)`).

---

## C. SPEC MODULE PATIENT V3 — VISION LONG TERME

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

## D. SPEC AUTH AVANCÉE (P9 — majoritairement implémentée)

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
- Interface "Mes appareils de confiance" dans paramètres du compte (à faire)
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

## E. MIGRATIONS SUPABASE — DÉTAIL HISTORIQUE

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
- v16 : Livret IFSI — tables etudiants_stages + etudiant_progression + RLS
- v17 : QCM EDN externe — tables tuteur_etudiant + qcm_sessions + qcm_reponses + qcm_flags + RLS. Numérotée v17 localement car v15/v16 distantes étaient déjà prises (collision résolue). Côté Supabase la migration est enregistrée sous le nom `v15_qcm_edn`.
- v18 : RLS médecin→externe (sessions/flags visibles par tous les médecins)
- v20 : Questions au tuteur (externe peut poser, modifier, supprimer ; tuteur répond)
- v21 → v31 : voir résumé dans le header de `CLAUDE.md` (gap d'archive non comblé). Migrations notables : v22 (liste_attente enrichie), v23 (FK animateurs CASCADE), v24 (agenda perso `cree_par`), v26-v27 (push subscriptions + pg_cron), v28 (sexe patient), v29-v31 (push V2 médecins).
- v32 : P5 Personnalisation modules (table `role_modules_hidden`, PK `(role, module_id)`, FK `updated_by → profiles ON DELETE SET NULL`, RLS `rmh_read` ouverte authenticated + `rmh_write` admin only). Modèle "absence = visible". Tronc de l'UI personnalisable côté soignant (médecin/IDE/psy/pharma/secrétaire), admin bypass total.
