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
