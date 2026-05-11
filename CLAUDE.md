# USCA Connect — Référence projet

> **Version courante** : v4.36 (2026-05-11) — MetaboScope G.1 Refonte classification 147 molécules. Champ `bucket?: ClassBucket` explicite sur `Molecule` (override) + fallback regex `classes.ts`. 2 nouveaux buckets : `anticraving` (4 mol) et `sevrage_tabac` (3 mol). 33 molécules patchées (anti-craving alcool, sevrage tabac, drogues classiques, TDAH non-stim, Xylazine, Ibogaïne…). Distribution finale propre : antidep 14 · antipsy 18 · bzd 19 · thymo 13 · opioid 18 · stim 8 · drogues 32 · anticraving 4 · sevrage_tabac 3 · nps_autres 18.
> Pour le détail de cette release et des précédentes : voir `CHANGELOG.md` (1 ligne par version) et `CLAUDE_ARCHIVE.md` §B (sessions détaillées).

---

## §0. LECTURE CONDITIONNELLE

Charge ce `CLAUDE.md` systématiquement (~200 lignes). Charge **en plus** seulement si la session courante touche à l'un de ces domaines :

| Si la session concerne…                            | Lis aussi                       |
|----------------------------------------------------|---------------------------------|
| Notifications push (V2/V3, FCM, cron, silence)     | `SETUP_PUSH.md`                 |
| Schéma BDD, nouvelle migration, RLS                | `DB_SCHEMA.md`                  |
| Module patient/admin/externe/IFSI/Toolbox/post-cure| `MODULES.md` (section concernée)|
| MetaboScope — intégration technique (build, iframe, SW) | `METABOSCOPE_INTEGRATION.md`    |
| MetaboScope — features, UX, roadmap d'amélioration | `METABOSCOPE_APP.md`            |
| MetaboScope — schéma data, méthodologie molécules  | `metaboscope/CLAUDE.md` + `metaboscope/INSTRUCTIONS_PROJET_METABOSCOPE.md` |
| Feature ou bug touchant les fiches EEG-ECT         | `eeg_ect/fiche_*.html` direct   |
| Historique d'une version v3.x ou v4.x              | `CHANGELOG.md` puis `CLAUDE_ARCHIVE.md` §B si plus de détail nécessaire |

Ne charge **pas** systématiquement `CLAUDE_ARCHIVE.md` ni `CHANGELOG.md` ni les fichiers MetaboScope.

---

## §1. IDENTITÉ & CONTEXTE

**USCA Connect** est la plateforme numérique de l'**USCA** (Unité de Soins Complexes en Addictologie) et de l'**ELSA** (Équipe de Liaison et de Soins en Addictologie) de l'hôpital **Pitié-Salpêtrière** (AP-HP, Paris).

Développeur principal : **Dr JC Luisada**, psychiatre addictologue à l'USCA.

| Application | Public | Fonction |
|---|---|---|
| **USCA Toolbox** (V1 — intégrée en iframe) | Soignants | Protocoles sevrage, scores, interactions, ressources, fiches ELSA, fiches EEG/ECT |
| **Unité Connect** (V2 — production) | Soignants + Patients | Coordination : programme patient, alertes craving, groupes, permissions, stratégies, export PDF |

---

## §2. INFRASTRUCTURE

| Élément | Valeur |
|---|---|
| **Repo GitHub** | https://github.com/jcluisada-cmd/USCA-Assistant |
| **URL production** | https://usca-connect.pages.dev |
| **Hébergement** | Cloudflare Pages (auto-deploy sur `git push main`) |
| **BDD & Auth** | Supabase — pydxfoqxgvbmknzjzecn.supabase.co |
| **Service Worker** | `usca-v4.36` |
| **Client Git** | GitHub Desktop |
| **Chemin local** | `C:\Users\jclui\Documents\USCA-Connect\` |
| **Mot de passe staff commun** | `usca_c15` |
| **Admin UUID JC** | `d3ad2d4b-d3d8-41f8-a494-b7bf55b79e87` (jc.luisada@gmail.com, role=medecin, is_admin=true) |

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
- **Pas de bundler, pas de npm, pas de build** — sauf exception `metaboscope/` (sous-app React/Vite/TS, voir `METABOSCOPE_INTEGRATION.md`)

### Installation PWA sur téléphone
- **Android** : Chrome → menu (⋮) → "Ajouter à l'écran d'accueil"
- **iPhone** : Safari → bouton partage (↑) → "Sur l'écran d'accueil"
- L'app s'ouvre en plein écran et fonctionne hors-ligne

---

## §3. ARCHITECTURE DES FICHIERS

```
USCA-Connect/
├── index.html                  ← Login unifié Patient / Soignant
├── patient/index.html          ← Interface patient (9 cartes + post-cure)
├── admin/index.html            ← Dashboard soignant (Patients, Toolbox, Planning, Mon élève)
├── etudiant/index.html         ← SPA livret IFSI
├── extern/index.html           ← Dashboard externe (3 onglets)
├── staff/toolbox.html          ← V1 Toolbox React (iframe dans admin)
├── data/                       ← Base QCM EDN (lazy-loaded)
├── postcure/                   ← Module post-cure (volets séparés)
├── shared/                     ← Modules JS partagés (supabase, auth, planning, fiches, etc.)
├── functions/api/delete-user.js ← Cloudflare Function proxy suppression compte
├── fiches-traitements/         ← 29 fiches patient + 8 fiches expert PDFs
├── fiches-substances/          ← 16 fiches HTML d'information substances
├── ressources_doc/             ← Ressources Toolbox manifest-driven (index.json)
├── eeg_ect/                    ← Fiches EEG/ECT (1 Pratique ECT + 7 handbook + assets/)
├── metaboscope/                ← (Sous-app React/Vite, intégration en cours)
├── migrations/                 ← Scripts SQL (v1 à v36)
├── assets/                     ← Images sources
├── manifest.json               ← Manifeste PWA
└── sw.js                       ← Service Worker multi-pages
```

> Pour le détail d'un module (composants, conventions internes) : voir `MODULES.md`.

---

## §4. AUTHENTIFICATION (résumé)

| Parcours | Comment | Persistance |
|---|---|---|
| **Patient** | Chambre + date naissance → vérification BDD | localStorage, 30 jours |
| **Soignant** | prenom.nom + mot de passe → Supabase Auth (email @aphp.fr) | localStorage, session Supabase |

- Admin : champ `is_admin` boolean séparé du rôle métier
- Mode dev : triple-tap sur le logo
- Auto-redirect si session existante
- Rôles métier : `medecin`, `ide`, `psychologue`, `pharmacien`, `secretaire`, `externe`, `etudiant_ide`

> Pour le détail (device tokens, WebView iOS, suppression compte, structure session) : voir `MODULES.md` §9.

---

## §5. BASE DE DONNÉES (résumé)

Tables principales : `profiles`, `patients`, `alertes`, `strategies`, `evenements`, `permissions_sortie`, `contenus_partages`, `fiches_traitements_patient`, `substances_patient`.

Tables groupes : `groupe_animateurs`, `groupe_modifications`, `groupe_rappels`, `participations`, `demandes_seances`.

Tables auth : `device_tokens`, `presences_reunions`.

Tables push : `push_subscriptions`, `push_last_message_staff`, `push_reminders_sent_groupe`.

Tables QCM EDN : `tuteur_etudiant`, `qcm_sessions`, `qcm_reponses`, `qcm_flags`, `questions_tuteur`.

Tables livret IFSI : `etudiants_stages`, `etudiant_progression`.

Personnalisation modules : `role_modules_hidden` (P5).

> Pour les schémas détaillés, RLS, et l'historique des migrations v1-v36 : voir `DB_SCHEMA.md`.

---

## §6. ÉTAT ACTUEL — APERÇU

### Login unifié (`index.html`)
Onglets Patient / Soignant, auto-redirect, mode dev, splash screen, bannière WebView iOS, formatage DDN automatique, messages erreur précis.

### Module Patient — 9 cartes + post-cure
Programme · Journal · Traitements · Ateliers · Stratégies · Permission · Messages · Mon avis · Demande post-cure. Bouton craving rouge pleine largeur en haut.

### Module Soignant (admin) — 3 onglets
Dashboard (patients, entrées/sorties, mon élève IFSI, mon externe QCM) · Toolbox (iframe) · Planning (semaine A/B + réunions).

### Module Externe (`extern/`) — 3 onglets
Dashboard (patients lecture seule + QCM EDN + signalements + questions tuteur) · Toolbox (iframe) · Planning. Mode tuteur via `?preview=tuteur`.

### Module Livret IFSI (`etudiant/`)
SPA 14 chapitres ~90 questions, lexique 21 acronymes, vue tuteur dans admin, export HTML imprimable.

### Module Post-cure (P8) — 100% local non-HDS
Volet patient (6 étapes ZIP+PDF email) + volet médecin + 14 structures partagées + accordion "Dossier post-cure" dashboard. Aucune donnée patient sur serveur — seuls flags workflow `patients.postcure_statut`.

### Toolbox V1 — 4 grandes + 5 petites cartes
Protocoles USCA · Ressources USCA · Fiches Traitements et Substances · Dossier post-cure · Scores · EEG/ECT · Interactions (MetaboScope) · ELSA · Feedback. Dark mode synchronisé (URL param `?theme=`).

> Pour le détail de chaque module (cartes, badges, pop-ups, conventions) : voir `MODULES.md` (sections §2-§7).

---

## §7. À FAIRE

### Chantier MetaboScope (en cours, prioritaire)

> **Décision 2026-05-08** : `metaboscope/` dans USCA-Connect = **source unique**. Le repo MetaboScope d'origine est figé (à archiver sur GitHub). Toutes les modifs (UI, molécules, audits) se font directement dans `USCA-Connect/metaboscope/`.
> Roadmap fonctionnelle complète : voir `METABOSCOPE_APP.md`.
> Procédure technique d'intégration iframe : voir `METABOSCOPE_INTEGRATION.md`.

- [x] **Chantier A — Import docs/audits** (livré 2026-05-08) : `metaboscope/CLAUDE.md`, `metaboscope/SETUP.md`, `metaboscope/data_hug_cbip/`, `metaboscope/docs/audits/`, `metaboscope/docs/superpowers/{specs,plans}/`.
- [ ] **Phase B — Intégration iframe Toolbox** (P0 — bloquant pour la suite) : appliquer les 2 patches `staff/toolbox.html` (case `"interactions"` → iframe MetaboScope) + `sw.js` (`LOCAL_ASSETS` + bump `v4.24` → `v4.25`) selon `METABOSCOPE_INTEGRATION.md` §2-§3. Test local + commit.
- [x] **Chantier C — UX & cohérence USCA** (livré v4.29 → v4.33) : sync thème dark/light (v4.26+v4.28+v4.30), refonte 2 onglets remplaçant la HomePage (v4.29), disclaimer pied de page (v4.33). C.3 (liens fiches Toolbox) et C.4 (optim tablette) abandonnés 2026-05-09 — voir `METABOSCOPE_APP.md` §3 pour le détail.
- [ ] **Chantier B — Couverture v1.1 (451 molécules CBIP×HUG)** (P2, METABOSCOPE_APP.md §2) : ingestion par classe ATC prioritaire (anticoagulants oraux directs, statines, antifongiques azolés, immunosuppresseurs, macrolides ≈ 30 molécules en première vague — couvre ~80% des liaisons ELSA). Arbitrer les 30 conflits puissance discordante avant ingestion (méthode FDA Drug Interaction Table prioritaire). 4-8 sessions Claude estimées.
- [ ] **Chantier D — Workflow décisionnel** (P2, METABOSCOPE_APP.md §4) : Mode Ordonnance (textarea DCI → rapport HTML imprimable A4), suggestions d'alternatives (sur QT-KR/sérotonine/ACB), calculateurs combinés (score ECG, équivalences BZD/CPZ via lien Toolbox), bookmarks/récents (localStorage anonymisé).
- [ ] **Chantier E — Couverture addicto avancée** (P3, METABOSCOPE_APP.md §5) : scénarios précâblés (sevrage OH+QT long, TSO+psychotropes, BZD+opioïde, cannabis+chronique), PGx actionnable (saisie génotype CYP2D6/2C19/2B6 → reco CPIC verbatim), veille NPS (flag rouge data >2 ans), annotations cliniques USCA.
- [ ] **Chantier F — Hygiène technique** (P5, METABOSCOPE_APP.md §6) : décision build (commit `dist/` vs GitHub Action), Service Worker pré-cache bundles hashés (manifest Vite), tests d'intégration `InteractionPage`, audit accessibilité Lighthouse a11y >90, perf bundle <300 KB gzipped, doc reprise `CHANGELOG.md` MetaboScope local.
- [ ] **6 décisions à trancher avec JC avant exécution** : voir `METABOSCOPE_APP.md` §8 (scope chantier B, format rapport D.1, palette navy vs indigo USCA, build dist/ vs Action, ton suggestions D.2, ordre B vs C).

### Notifications push

- [ ] **V2 médecins — étape suivante** : étendre aux séances de thérapie complémentaire. V2 médecins en cours (voir `SETUP_PUSH.md`). V1 shippée v3.99.

### Tech debt — priorité basse

- [ ] **Planning A/B stocké en BDD** : aujourd'hui dupliqué côté client (`shared/planning-groupes.js`) et en TS dans cron-reminders. Migrer en table Supabase quand un autre module aura besoin du planning côté serveur.
- [ ] **Silence soignant configurable par profil** : règle "lun-ven 18h + weekend + fériés FR" hardcodée dans `send-push`. Permettre à chaque soignant de régler ses plages (`profiles.push_quiet_hours JSONB`).
- [ ] **Toolbox — performances & dark mode instantané** : ~500 ms de latence (Babel in-browser + reload toggle). Fix racine : bundler (Vite) + couleurs en variables CSS. Contrevient à la règle §8 "pas de bundler" — à reconsidérer si latence devient gênante.

### Features applicatives

- [ ] **Formulaire pré-admission** — QR code salle d'attente (identité, couverture, substances, scores AUDIT-C/CAST, ATCD, envoi email, 5 min max).
- [ ] **Annuaire patients** — répertoire post-sortie.
- [ ] **UI "Mes appareils de confiance"** dans paramètres du compte.
- [ ] **Livret IFSI — P4** : export PDF du livret rempli à la fin du stage (jsPDF).
- [ ] **Ressources Toolbox — GitHub Action pour regénérer `index.json`** : aujourd'hui maintenu à la main. Action qui scanne `ressources_doc/{fiches,articles,recos,algos}/` à chaque push.
- [ ] **Toolbox — Fiches Expert hors antipsychotiques** : enrichir `fiches_expert/` (BZD, TSO, thymorégulateurs, stimulants, antidépresseurs).

---

## §8. CONVENTIONS DE DÉVELOPPEMENT

### Général
- **Langue** : français partout (UI, commentaires, données)
- **Mobile-first** : tout doit être utilisable sur smartphone
- **Pas de bundler** : HTML + CDN (Tailwind, Supabase SDK, jsPDF). Exception : `metaboscope/` (sous-app Vite/TS isolée en iframe).
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
- ❌ Ne jamais exposer la `service_role` key dans le code client
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

> Pour les règles cliniques détaillées (AMM, niveau de preuve, contre-indications, pharmacopée) : voir `MODULES.md` §7.

---

## §9. CONTACTS & LIENS

| Quoi | Valeur |
|---|---|
| Repo GitHub | https://github.com/jcluisada-cmd/USCA-Assistant |
| Production | https://usca-connect.pages.dev |
| Email | jc.luisada@gmail.com |
| Supabase | pydxfoqxgvbmknzjzecn.supabase.co |
| Affiche équipe | `affiche-equipe.html` (A4, QR code) |

### Fichiers de référence projet
| Fichier | Quand le lire |
|---|---|
| `CLAUDE.md` | Toujours (ce fichier) |
| `CHANGELOG.md` | Pour résumé 1-ligne d'une version |
| `CLAUDE_ARCHIVE.md` | Historique détaillé d'une session ancienne |
| `MODULES.md` | Détail d'un module spécifique |
| `DB_SCHEMA.md` | Schéma BDD, RLS, migrations |
| `SETUP_PUSH.md` | Setup infrastructure push |
| `METABOSCOPE_INTEGRATION.md` | Intégration MetaboScope |
| `METABOSCOPE_README.md` | Vue d'ensemble export MetaboScope |
