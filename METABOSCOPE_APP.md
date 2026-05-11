# MetaboScope — Roadmap d'amélioration

> Document créé le 2026-05-08. Source : audit comparatif `C:\Users\jclui\Documents\MetaboScope` (repo d'origine) vs `C:\Users\jclui\Documents\USCA-Connect\metaboscope\` + diagnostic UX/clinique JC.
>
> **Pour l'intégration technique** (build, iframe Toolbox, SW, patches) : voir `METABOSCOPE_INTEGRATION.md`.
> **Pour les instructions data/molécules** (schéma, hiérarchie sources, méthodologie) : voir `metaboscope/INSTRUCTIONS_PROJET_METABOSCOPE.md`.

---

## §0. Bilan v1.0 — état réel vs attendu

**Ce qui est livré (techniquement complet)** :
- 3 onglets navigables : Recherche, Interactions (panier 2-6), Atlas voies métaboliques
- **147 molécules** consolidées (objectif 140 dépassé), 13 fichiers JSON validés
- Scoring PD : QT cumulé, sérotonine, respiratoire, ACB, seuil épileptogène
- Helpers PK : paires substrat × inhibiteur/inducteur, interactions documentées
- Pharmacogénétique CPIC niveau A actionnable
- PWA offline-first, thème navy/teal

**Limites cliniques détectées** :

| # | Limite | Impact |
|---|---|---|
| L1 | **Couverture clinique psychiatrie/addicto uniquement** — aucune statine, anticoagulant, antifongique azolé, immunosuppresseur, antibiotique macrolide, antiviral direct, antiarythmique, antimigraineux, contraceptif. Or ce sont précisément les molécules à croiser avec les psychotropes en liaison ELSA. | **Bloquant** — l'outil ne couvre pas les co-prescriptions réelles AP-HP |
| L2 | **451 molécules candidates v1.1** détectées par l'audit CBIP×HUG du 2026-04-29, jamais ingérées (atorvastatine, simvastatine, digoxine, ciclosporine, tacrolimus, itraconazole, kétoconazole, érythromycine, vérapamil, diltiazem, rifampicine, clarithromycine, lopéramide, métoprolol, etc.) | **Bloquant** — couverture clinique réelle |
| L3 | **30 conflits "puissance discordante"** entre CBIP et HUG sur 27 molécules majeures (amiodarone, vérapamil, diltiazem, fluconazole, oméprazole, rifampicine, érythromycine…) à arbitrer manuellement avant ingestion | Critique — qualité des données |
| L4 | HomePage encore en mode "Sprint 4 livré, modules 2 et 3 en cours" alors que la v1.0 est livrée | UX : effet "outil non fini" |
| L5 | **Aucune intégration visuelle USCA** : thème navy/teal sombre forcé, pas de sync avec le toggle dark mode global Toolbox | Cohérence visuelle |
| L6 | **Workflow consultatif uniquement** : on entre une molécule, on lit, on ferme. Pas de "mode ordonnance", pas de suggestions d'alternatives, pas de rapport imprimable | Différenciation vs UpToDate/Lexicomp |
| L7 | **Pas de bookmarks ni de récents** — chaque session repart de zéro | Friction d'usage répété |
| L8 | **Aucun lien avec les fiches Toolbox** existantes (BZD, antipsy, TSO) — duplication sans intégration | Cloisonnement |
| L9 | **Pas de scénarios précâblés** addicto (sevrage OH + QT long, TSO + psychotropes, BZD + opioïde) | Spécificité USCA absente |
| L10 | **Docs/audits manquants** dans la copie USCA-Connect : `CLAUDE.md`, `docs/audits/`, `data_hug_cbip/`, plans/specs superpowers | Reprise impossible depuis USCA-Connect sans aller-retour |

---

## §1. Chantier A — Import des docs et audits manquants ✅ FAIT (2026-05-08)

**Charge** : 15 min, mécanique. ~~Bloquant pour tout le reste.~~ **Terminé.**

### Fichiers importés depuis `C:\Users\jclui\Documents\MetaboScope\` vers `metaboscope\`

| Source | Destination | Statut |
|---|---|---|
| `CLAUDE.md` (591 lignes) | `metaboscope/CLAUDE.md` | ✅ + bandeau d'intégration ajouté en tête |
| `SETUP.md` (158 lignes) | `metaboscope/SETUP.md` | ✅ |
| `data_hug_cbip/cbip_gpt.json` (105 KB) | `metaboscope/data_hug_cbip/` | ✅ versionné |
| `data_hug_cbip/hug_2020_opus.json` (107 KB) | `metaboscope/data_hug_cbip/` | ✅ versionné |
| `data_hug_cbip/CBIP_interactions_V3_audit.json` (12 KB) | `metaboscope/data_hug_cbip/` | ✅ versionné |
| `data_hug_cbip/metaboscope_audit_cbip_vs_hug_complete.json` (1.7 MB) | `metaboscope/data_hug_cbip/` | ✅ versionné — **base v1.1 chantier B** |
| `data_hug_cbip/metaboscope_audit_cbip_vs_hug_divergences.csv` (106 KB) | `metaboscope/data_hug_cbip/` | ✅ versionné |
| `data_hug_cbip/metaboscope_audit_cbip_vs_hug_summary.json` (1.9 KB) | `metaboscope/data_hug_cbip/` | ✅ versionné |
| `data_hug_cbip/Doc HUG 2020.pdf` (176 KB) | `metaboscope/data_hug_cbip/` | ✅ local uniquement (gitignored) |
| `data_hug_cbip/CBIP _ Interactions des médicaments.html` (351 KB) | `metaboscope/data_hug_cbip/` | ✅ local uniquement (gitignored) |
| `docs/audits/cbip-hug-divergences-2026-04-29.{json,md}` | `metaboscope/docs/audits/` | ✅ versionné |
| `docs/superpowers/specs/2026-04-27-metaboscope-modules-design.md` (762 lignes) | `metaboscope/docs/superpowers/specs/` | ✅ versionné |
| `docs/superpowers/plans/2026-04-27-metaboscope-modules.md` (3130 lignes) | `metaboscope/docs/superpowers/plans/` | ✅ versionné |

### Non importés (artefacts ou hors scope)

- `data_hug_cbip/CBIP _ Interactions des médicaments_files/` — 2.8 MB de cache web (analytics.js, fonts) inutiles
- `node_modules/`, `dist/`, `.git/`, `.remember/`, `.claude/`, `tsconfig.*.tsbuildinfo`
- `Export/` — redondant (c'est ce dossier qui a généré la copie initiale `metaboscope/`)

### Modifications complémentaires

- `metaboscope/.gitignore` : remplacement de `data_hug_cbip/` global par `data_hug_cbip/*.pdf`, `*.html`, `CBIP*_files/` (pour versionner les JSON/CSV d'audit indispensables au chantier B, garder les sources brutes locales)
- `metaboscope/.gitignore` : suppression de la ligne `docs/audits/` pour versionner les audits
- `metaboscope/CLAUDE.md` : bandeau d'en-tête ajouté pour signaler le contexte d'intégration USCA-Connect (les chemins du repo MetaboScope isolé ne s'appliquent plus)
- `CLAUDE.md` racine USCA-Connect §0 : ajout d'une ligne pointant vers `METABOSCOPE_APP.md` pour les sessions feature/UX (en complément de `METABOSCOPE_INTEGRATION.md` pour les sessions intégration technique)

### Vérification

```
metaboscope/
├── CLAUDE.md
├── SETUP.md
├── INSTRUCTIONS_PROJET_METABOSCOPE.md  (déjà présent)
├── DATA_SCHEMA.md                      (déjà présent)
├── data_hug_cbip/
│   ├── *.json (5 fichiers, versionnés)
│   ├── *.csv  (1 fichier, versionné)
│   ├── *.pdf  (gitignored)
│   └── *.html (gitignored)
└── docs/
    ├── audits/cbip-hug-divergences-2026-04-29.{json,md}
    └── superpowers/
        ├── specs/2026-04-27-metaboscope-modules-design.md
        └── plans/2026-04-27-metaboscope-modules.md
```

---

## §2. Chantier B — Extension couverture v1.1 (451 molécules)

**Charge** : 4-8 sessions Claude. **Bénéfice clinique majeur**.

### B.1. Molécules à ingérer (vue par classe ATC)

Source : `data_hug_cbip/metaboscope_audit_cbip_vs_hug_complete.json` (à importer en chantier A).

| Classe | Molécules majeures | Fiabilité audit |
|---|---|---|
| **Anticoagulants oraux directs** | apixaban, rivaroxaban, édoxaban, dabigatran | élevé |
| **Statines** | atorvastatine, simvastatine, fluvastatine | élevé |
| **Antifongiques azolés** | itraconazole, kétoconazole, fluconazole, voriconazole | élevé |
| **Immunosuppresseurs** | ciclosporine, tacrolimus, sirolimus | élevé |
| **Antibiotiques macrolides** | clarithromycine, érythromycine, roxithromycine | élevé |
| **Antiviraux directs** | sofosbuvir, ledipasvir, maraviroc | élevé |
| **Antiarythmiques** | amiodarone, propafénone | élevé (conflit puissance) |
| **Inhibiteurs calciques** | vérapamil, diltiazem, amlodipine, isradipine | élevé/moyen |
| **Antimigraineux** | ergotamine, sumatriptan | élevé |
| **Anticancéreux** | imatinib, paclitaxel, docétaxel, vincristine, étoposide, létrozole, enzalutamide | élevé |
| **Antipaludiques** | artéméther, méfloquine | moyen |
| **Anti-VIH** | atazanavir, darunavir, saquinavir, tipranavir, éfavirenz | élevé (multi conflits) |
| **Anti-VHC** | élbasvir, grazoprévir, glécaprévir, pibrentasvir | moyen |
| **Anticoagulants AVK** | acénocoumarol, warfarine | moyen |
| **Bêta-bloquants** | métoprolol, carvédilol, nébivolol, timolol | élevé |
| **PPI** | oméprazole, ésoméprazole | élevé (conflit puissance CYP2C19) |
| **Antimuscariniques** | oxybutynine, toltérodine, fexofénadine | élevé |
| **Hypoglycémiants** | glimépiride, saxagliptine | élevé |
| **Hormones** | testostérone, finastéride, dutastéride, mifépristone, diénogest | élevé |
| **Plante interaction majeure** | **millepertuis** (inducteur CYP3A4 universel) | élevé — **prioritaire** |
| **Divers AP-HP fréquents** | colchicine, lidocaïne, lopéramide, tamsulosine, granisétron, méthylprednisolone, tadalafil, sildénafil, triazolam, sufentanil, alfentanil, tizanidine | élevé |

### B.2. Modèle d'intégration

- **Nouveau fichier** : `metaboscope/src/data/molecules/molecules_extension_cbip_hug.json`
- **Schéma** : identique aux 13 JSON existants (cf. `DATA_SCHEMA.md`)
- **Sources autorisées** : préfixes `HUG:` et `CBIP:` ajoutés au regex `SOURCE_PREFIX` de `scripts/validate-molecules.mjs` (à vérifier après import chantier A — déjà fait dans `CLAUDE.md` MetaboScope)
- **Niveau de preuve par défaut** : `IVH-O` (in vivo humain observationnel) — convention pour données HUG/CBIP non sourcées par PMID individuel
- **Champ `interactions_specifiques[]`** : peut rester minimal pour ces molécules "cardio/somatiques" — l'objectif est la couverture PK, pas l'exhaustivité PD
- **Lot par lot** : ingérer par batch de ~20-30 molécules avec validation `npm run validate:molecules` entre chaque batch

### B.3. Conflits puissance discordante (30 cas, 27 molécules)

À arbitrer manuellement **avant** ingestion. Méthode :
1. Pour chaque conflit, consulter FDA Drug Interaction Table (référence prioritaire)
2. Si FDA tranche : appliquer FDA, signaler `HUG:` et `CBIP:` en sources secondaires
3. Si FDA muette : appliquer la classification la plus prudente (inhibiteur fort > modéré > faible)
4. Documenter chaque arbitrage dans `metaboscope/docs/audits/v1.1-arbitrages.md` (à créer)

Liste des 27 molécules concernées : amiodarone (CYP2C9, CYP2D6), atazanavir, bosentan, carbamazépine (CYP1A2, Pgp), ciprofloxacine, clopidogrel, darunavir, diltiazem, éfavirenz, enzalutamide, érythromycine, ésoméprazole, fluconazole, fluvastatine, imatinib, ledipasvir, moclobémide, modafinil, oméprazole, propafénone, rifabutine, rifampicine, roxithromycine, saquinavir, tipranavir, vérapamil, voriconazole.

### B.4. Multi-sourçage des 57 molécules déjà présentes

Les 57 molécules présentes à la fois dans le JSON existant ET dans l'audit CBIP/HUG doivent voir leurs cellules concordantes enrichies en multi-source (ex : `source: ["PMID:12345", "HUG:2020-CYP3A4", "CBIP:2026-CYP3A4"]`).

Le type `Molecule` accepte déjà `string | string[]` sur les sources (cf. `src/types/molecule.ts`). Pas de migration de schéma nécessaire.

---

## §3. Chantier C — Refonte UX et intégration USCA

**Charge** : 2-3 sessions. **Bénéfice cohérence visuelle + désamorce l'effet "outil non fini"**.

### C.1. Sync dark mode Toolbox ↔ MetaboScope

**Pattern à reproduire** : v4.24 USCA-Connect (sync EEG/ECT iframes).

- La Toolbox passe `?theme=dark|light` dans le `src` de l'iframe MetaboScope selon `localStorage.usca_theme`
- MetaboScope au boot lit `URLSearchParams` et applique le thème
- **Problème spécifique** : MetaboScope est *forcé* en dark (palette navy/teal codée en dur dans Tailwind). Deux options :
  - **Option 1 (minimal)** : ajouter une variante "light" via classes Tailwind `dark:` et inverser les couleurs (navy → slate-100, teal-400 → teal-700)
  - **Option 2 (cohérence USCA)** : remplacer la palette navy par la palette indigo USCA (`#4F46E5`) en mode light, garder navy en mode dark
- **Recommandation** : Option 2, car la palette navy/teal n'est pas la charte V2 USCA Connect — c'est un héritage du repo isolé

### C.2. HomePage refonte

Fichier : `metaboscope/src/pages/HomePage.tsx`.

- **Supprimer** le bandeau "Statut de développement / Sprint 4 livré"
- **Remplacer** la grille "3 onglets" passive par 3 cards d'**entrée par cas d'usage** :
  - "Vérifier une co-prescription" → `/interactions` direct (ouverture en mode panier vide ou avec scénario précâblé)
  - "Chercher une molécule" → `/search`
  - "Explorer une voie métabolique" → `/atlas`
- **Ajouter** une card "Mode ordonnance" (chantier D.1) une fois disponible
- **Ajouter** un bandeau "Dernière mise à jour : YYYY-MM" piloté par `derniere_maj` du JSON le plus récent

### C.3. Liens depuis fiches Toolbox ❌ ABANDONNÉ (2026-05-09)

Décision JC 2026-05-09 : feature jugée inutile. Le pattern "panier pré-rempli depuis une fiche Toolbox" n'a pas trouvé d'usage clinique évident. Le mécanisme côté MetaboScope (`?cart=` dans `App.tsx:14-45`) reste en place — il sert au deep-link manuel et peut être réactivé plus tard sans refonte.

### C.4. Optimisation tablette/mobile ❌ ABANDONNÉ (2026-05-09)

Décision JC 2026-05-09 : retiré du TODO. La refonte 2 onglets v4.29-v4.32 a déjà restructuré l'UI (drawer modal molécule, atlas accordion, classes filtrables) et l'usage Galaxy Tab S7 FE n'a pas remonté de friction bloquante. À reconsidérer ponctuellement sur retour utilisateur réel.

### C.5. Disclaimer ✅ LIVRÉ v4.33 (2026-05-09)

- `DISCLAIMER_TEXT` (`metaboscope/src/components/Disclaimer.tsx`) enrichi : ajout explicite "ni à la validation du pharmacien clinicien USCA pour toute co-prescription à haut risque"
- `Layout.tsx` footer : mini-bandeau 1 ligne non-sticky ajouté avec ⚠️ Aide à la décision · pas un substitut au jugement clinicien · validation pharmacien USCA recommandée. Le bouton "Disclaimer complet" (ouvre modal readonly) est conservé en dessous.
- Choix V1 (mini-bandeau non-sticky) plutôt que V3 (sticky) pour ne pas voler d'écran sur Galaxy Tab S7 FE en portrait.

---

## §4. Chantier D — Workflow décisionnel

**Charge** : 4-8 sessions selon le scope. **Différenciation vs UpToDate/Lexicomp**.

### D.1. Mode "Ordonnance" ✅ LIVRÉ v4.35 (2026-05-11)

- Bouton `📋 Ordonnance` sur `/interactions` (à droite barre de recherche).
- Modal saisie 2-phases : (1) textarea libre (1 DCI/ligne, dose ignorée via regex `mg|µg|g|ui|ml|cp`), (2) review par ligne avec checkboxes (top match + 4 alternatives) et badge confidence `probable` (vert, pré-coché) / `possible` (amber) / `incertain` / `non reconnue` (rouge).
- Charger panier remplace le contenu courant + bascule auto en mode analyse.
- Bouton `🖨️ Rapport imprimable A4` en mode analyse → overlay plein écran avec composant `RapportPrint`.
- Rapport rendu : composition · alertes critiques (Mécanisme + Conduite à tenir, badge `Red`/`Amber` au lieu du décompte numérique opaque type "3 pts") · vigilance · matrix triangulaire annotée (PD red/amber, PK, PGx couleur-codés) · détail couples avec tags + commentaire · disclaimer USCA.
- `@media print` dans `index.css` : `@page A4 portrait` + marges 12mm/14mm, force palette light depuis theme-dark (économie encre + lisibilité photocopie), anti-titre-orphelin (`break-after: avoid` sur h2 + `break-before: avoid` sur sibling), `break-inside: avoid` sur cards/matrix/couples.
- Sync thème : light/dark à l'écran (héritage de `theme-light`/`theme-dark` global), force light à l'impression.
- Mockup HTML conservé dans `metaboscope/docs/mockups/rapport-ordonnance-mockups.html` comme spec visuelle de référence pour D.2/D.3.
- Fichiers livrés : `src/utils/parseOrdonnance.ts`, `src/components/ordonnance/OrdonnanceModal.tsx`, `src/components/ordonnance/RapportPrint.tsx`, modifs `src/pages/InteractionPage.tsx` + `src/index.css`.

#### D.1 — spec d'origine (conservée pour traçabilité)

**Use case** : interne USCA qui reçoit une ordonnance papier, veut un screening rapide.

- Nouvelle page `/ordonnance` (ou modal sur `/interactions`)
- Textarea "Coller une liste de DCI (un par ligne)"
- Parser fuzzy avec `searchMolecules()` : pour chaque ligne, suggérer la meilleure correspondance (ou flag "non reconnu")
- Validation utilisateur des correspondances (UI checkbox par ligne)
- Génère ensuite **un rapport synthétique imprimable A4** (HTML imprimable, pas jsPDF — pattern Toolbox V1) :
  - En-tête : nombre de molécules, date d'analyse
  - Section "Alertes critiques" (rouge) : QT≥3, triade respiratoire, triade sérotoninergique, CI absolues
  - Section "Alertes vigilance" (ambre) : ACB≥3, paires PK majeures, PGx CPIC A
  - Section "Détail par couple" : matrix triangulaire des paires
  - Section "Sources consolidées"
  - Pied de page disclaimer USCA

### D.2. Suggestions d'alternatives

- Sur alerte QT-KR détectée : proposer molécules **même classe** sans QT-KR (ex : escitalopram → sertraline si QT court)
- Sur alerte sérotoninergique : suggérer ISRS de remplacement avec moindre score
- Sur alerte ACB élevée : suggérer alternatives non anticholinergiques
- **UI** : badge "💡 Alternative" cliquable sur chaque alerte → modal avec 2-3 suggestions et leurs profils PD comparés
- **Caveat** : afficher "Suggestion non prescriptive — décision finale prescripteur" sur chaque modal
- **Source classes** : indexer `molecules.classe` au boot, regrouper par sous-famille thérapeutique

### D.3. Calculateurs intégrés

- **Score risque ECG combiné** : QT cumulé + bradycardie (ralentisseurs FC dans le panier) + facteurs cliniques (hypoK+, IRénale, âge — input optionnel)
- **Équivalence diazépam** : déjà dans Toolbox V1. Choix : (a) linker depuis MetaboScope, (b) intégrer une copie dans MetaboScope. **Recommandation** : (a), un seul endroit
- **Équivalence chlorpromazine** : idem
- **Calcul indice R Flockhart** : si données AUC disponibles dans `interactions_specifiques`, afficher R = AUCi/AUC

### D.4. Bookmarks et récents

- localStorage `metaboscope_bookmarks` (anonymisé, pas de PHI) :
  - Liste de molécules pinnées (max 20)
  - Liste des paniers d'analyse fréquents (ex : "TSO + ATD + AP" pré-saved)
- Liste des 5 dernières recherches en bas de `/search`
- Bouton "Pin" sur chaque MoleculeCard

---

## §5. Chantier E — Couverture clinique addictologique avancée

**Charge** : 4-6 sessions. **Spécificité USCA, différenciation forte**.

### E.1. Scénarios précâblés

Use case : interne ou psychiatre qui veut tester un cas typique sans saisir 5 molécules.

- Nouvelle section sur HomePage "Scénarios cliniques" :
  - "Sevrage OH avec ATCD QT long" → panier oxazépam + (à choisir) thiamine + halopéridol
  - "TSO + psychotropes" → méthadone + (à choisir entre quétiapine/sertraline/etc.)
  - "BZD + opioïde — risque vital" → diazépam + oxycodone (pour démonstration alerte rouge respiratoire)
  - "Cannabis quotidien + traitement chronique" → THC + (à choisir)
  - "Cocaïne + traitement chronique" → cocaïne + (à choisir)
- Implémentation : objet `SCENARIOS` dans `src/data/scenarios.ts`, lien direct vers `/interactions?cart=...`

### E.2. Pharmacogénétique actionnable

Aujourd'hui : panier détecte CPIC niveau A et affiche un rappel.
Cible : permettre la saisie d'un génotype patient (anonyme, localStorage volatil) et recevoir des recommandations spécifiques.

- Nouvelle page `/pgx` ou modal accessible depuis `/interactions`
- Inputs : statut métaboliseur CYP2D6 (PM/IM/EM/UM), CYP2C19, CYP2B6, dépisté en pratique AP-HP
- Croisement automatique avec panier
- Output : recommandation CPIC verbatim par molécule
- **Caveat** : disclaimer "Données génétiques ≠ HDS — ne pas saisir nom patient"

### E.3. Veille NPS

- Champ `derniere_maj` (déjà au schéma) : afficher dans la fiche
- Flag rouge "data >2 ans, à vérifier" automatique sur la fiche
- Lien sortant vers EMCDDA et ANSM Trend pour la molécule (si NPS)
- Section "Nouveautés à veiller" sur HomePage : 5 NPS les plus récents avec date dernière maj

### E.4. Annotations cliniques USCA

- Notes propres à l'usage USCA (ex : "Méthadone — vérifier QTc pré et J7 selon protocole USCA")
- Stockées dans un fichier séparé `src/data/annotations_usca.json` (pour ne pas polluer les molécules)
- Affichées dans une section "Notes USCA" sur la fiche molécule

---

## §6. Chantier F — Performance, qualité, build

**Charge** : 2-4 sessions. **Hygiène technique**.

### F.1. Build et déploiement

- Aujourd'hui : `metaboscope/dist/` est commité (intégration v1). Décider :
  - **Option A** : continuer à commit `dist/` (simple, fonctionne avec Cloudflare Pages)
  - **Option B** : build dans une GitHub Action déclenchée au push, output dans `metaboscope/dist/` ignoré
- **Recommandation** : Option A pour l'instant (cohérent avec "pas de bundler" du reste d'USCA-Connect), Option B quand le build dépassera 30s

### F.2. Service Worker

- Aujourd'hui : `vite-plugin-pwa` désactivé dans la copie (le SW USCA principal couvre tout)
- Ajouter `metaboscope/dist/assets/*.js` aux `LOCAL_ASSETS` du `sw.js` USCA pour cache offline (déjà partiellement fait via stratégie cache-first runtime)
- Chaque update MetaboScope → bump `CACHE_NAME` USCA (règle générale projet)

### F.3. Tests

- Couverture actuelle : smoke tests Vitest, validation runtime des JSON
- Ajouter tests d'intégration sur `InteractionPage` :
  - Cas QT-KR + QT-KR → score 6 → severity red
  - Cas BZD + opioïde → respiratoire red
  - Cas vide → empty state
  - Cas overload (>6 molécules) → warning
- Ajouter test sur `/atlas` : tous les CYP référencés ont au moins 1 substrat

### F.4. Audit accessibilité

- Lighthouse audit a11y : viser >90
- Vérifier contrastes WCAG AA en dark *et* light (chantier C.1)
- Navigation clavier sur `AutoComplete` (déjà OK), `Accordion` (à vérifier), `PdAlertCard` (à vérifier)
- ARIA labels sur les badges de sévérité

### F.5. Performance bundle

- Mesurer taille bundle actuelle (`npm run build` puis `dist/assets/*.js`)
- Cible : <300 KB gzipped
- Si dépassé : code-splitting par route (React.lazy) — atlas et interactions sont les plus lourds

### F.6. Documentation et reprise

- `CLAUDE.md` du sous-dossier MetaboScope mis à jour avec pointeurs vers ce roadmap
- `CHANGELOG.md` MetaboScope local (différent de celui d'USCA-Connect)
- `metaboscope/CLAUDE.md` §0 : ajouter ligne "Si feature/UX → lire `METABOSCOPE_APP.md` à la racine USCA-Connect"

---

## §7. Priorisation et phasage proposé

| Priorité | Chantier | Charge estimée | Bénéfice | Bloquant ? |
|---|---|---|---|---|
| **P0** | A — Import docs/audits | 15 min | Permet de reprendre depuis USCA-Connect | Oui pour B et C |
| **P1** | C.1 — Sync thème | 30 min – 2h | Cohérence visuelle USCA | — |
| **P1** | C.2 — HomePage refonte | 1h | Désamorce "Sprint 4 livré" | — |
| **P1** | F.6 — Doc reprise | 30 min | Hygiène | — |
| **P2** | B (par batchs) — Ingestion v1.1 | 4-8 sessions | Couverture clinique réelle | Pour scénarios E |
| ~~P2~~ | ~~D.1 — Mode Ordonnance~~ | — | ✅ Livré v4.35 (2026-05-11) | — |
| ~~P1~~ | ~~C.3 — Liens depuis Toolbox~~ | — | ❌ Abandonné 2026-05-09 | — |
| ~~P3~~ | ~~C.4 — Optim tablette~~ | — | ❌ Abandonné 2026-05-09 | — |
| **P3** | E.1 — Scénarios précâblés | 2-3h | Spécificité USCA | Dépend B |
| **P3** | D.2 — Suggestions alternatives | 4-6h | Différenciation | Dépend B (besoin masse critique molécules même classe) |
| **P4** | D.3 — Calculateurs combinés | 2-3h | Avancé | — |
| **P4** | D.4 — Bookmarks/récents | 1-2h | Friction usage répété | — |
| **P4** | E.2 — PGx actionnable | 2-3h | Public limité | — |
| **P4** | E.3 — Veille NPS | 1h | Maintenance | — |
| **P4** | E.4 — Annotations USCA | 2h | Spécifique | Dépend B |
| **P5** | F.1 à F.5 — Hygiène technique | 2-4h | Maintenance | — |

---

## §8. Décisions actées (2026-05-08, après livraison Phase B v4.25)

1. ✅ **Scope chantier B — par classe ATC**, plus tard. 1ère vague : anticoagulants oraux directs + statines + antifongiques azolés + immunosuppresseurs + macrolides ≈ 30 molécules (couvre ~80% des liaisons ELSA). Pas en cours.
2. ✅ **Mode Ordonnance D.1 → HTML imprimable A4** (cohérent Toolbox V1, plus simple à itérer que jsPDF).
3. ✅ **Sync dark mode C.1 → max intégration USCA**. Migration palette navy/teal MetaboScope → indigo USCA V2 (`#4F46E5`) en mode light, navy conservé en mode dark. Sync `?theme=dark/light` via `localStorage.usca_theme` (pattern v4.24 EEG/ECT).
4. ✅ **Build F.1 → commit `dist/`** (statu quo, cohérent règle "pas de bundler" §8 CLAUDE.md USCA-Connect). Rebuild manuel `cd metaboscope && npm run build` + bump `CACHE_NAME` à chaque modif. GitHub Action à reconsidérer si build dépasse 30 sec.
5. ✅ **Suggestions alternatives D.2 → pas de préfixe d'avertissement** (l'utilisateur tire ses conclusions). Option de préfixer gardée en réserve si retours d'usage le demandent.
6. ✅ **C avant B** (UX d'abord). L'UX bénéficie aux 147 molécules existantes ; les 451 nouvelles dans une mauvaise UX restent peu utilisables.

---

## §10. Chantier G — Révision classification & données molécules (P2, ajouté 2026-05-08)

**Contexte** : test pilote v4.25 a révélé un mauvais rangement des molécules dans les buckets internes MetaboScope. Exemples remontés par JC :
- `acamprosate` classé en `molecules_drogues_classiques.json` → c'est un **médicament anti-craving prescrit**, pas une drogue
- `3MMC` classé en NPS → à valider (cathinone synthétique, OK ou pas ?)

**Problème de fond** : la classification a été dictée par la chronologie d'ingestion (sessions S1-S13 par lots thématiques) plutôt que par une **taxonomie clinique cohérente**. Le module Recherche/Atlas affiche ces buckets tels quels → friction pour l'utilisateur soignant.

**Charge** : 2-3 sessions selon ampleur. **Bénéfice clinique** : module Recherche enfin utilisable sans dictionnaire mental.

### G.1. Audit complet des 147 molécules ✅ LIVRÉ v4.36 (2026-05-11)

**Audit réalisé** : 40 anomalies détectées par script Node (extraction `{fichier, nom_dci, classe}` + comparaison contre bucket attendu).

**Stratégie livrée** :
- Champ `bucket?: ClassBucket` ajouté au schéma `Molecule` (`types/molecule.ts`). Optionnel, override le regex fallback.
- `ClassBucket` déplacé de `utils/classes.ts` vers `types/molecule.ts` pour éviter le cycle d'import.
- 2 nouveaux buckets : `anticraving` et `sevrage_tabac`.
- `getMoleculeBucket(m)` honore `m.bucket` en priorité 1, cache mémoire en P2, regex en P3.
- Regex `drogues` enrichi : `entactogène|phénéthylamine|tryptamine|Iboga|psilocyb|drogue\s+(classique|licite|récréative)`.
- 33 molécules patchées explicitement via script Node :
  - 4 anti-craving (Acamprosate, Baclofène, Disulfirame, Nalméfène) — sortent de `opioides_tso.json`
  - 3 sevrage tabac (Varénicline, Nicotine sevrage, Nicotine TSN)
  - 13 drogues classiques (Alcool×3, Cocaïne×3, Héroïne, 6-MAM, MDMA, THC, CBD, CBN, Tabac fumé)
  - 3 dérivés GHB (GHB, GBL, 1,4-BD) + 1 nps_autres (Oxybate Xyrem)
  - Ibogaïne (sort de `opioid` via regex piège "sevrage opioïdes" dans la classe)
  - 4 TDAH (Atomoxétine, Guanfacine, Modafinil, Bupropion) → `stim`
  - Xylazine → `nps_autres` (sort de `opioid` via regex piège)
  - Tianeptine NPS, Mitragynine, NAC → `nps_autres`

**Distribution finale 147 molécules par bucket** :

| Bucket | Count |
|---|---|
| antidep | 14 |
| antipsy | 18 |
| bzd | 19 |
| thymo | 13 |
| opioid | 18 |
| stim | 8 |
| drogues | 32 |
| **anticraving** | **4** (nouveau) |
| **sevrage_tabac** | **3** (nouveau) |
| nps_autres | 18 |

**Non patché (encore via regex)** : Hydroxyzine (bzd via `anxiolyti`), Kava (bzd via `anxiolyti`), 11 hallucinogènes (drogues via regex enrichi), 4 NPS cannabinoïdes (drogues via `cannabi`), 6 NPS opioïdes (opioid via `opio[iï]de`), 5 NPS BZD (bzd via `benzodiaz`), 8 cathinones (nps_autres catch-all — non patchées, à reconsidérer si pertinence clinique). 1P-LSD / AL-LAD restent en `nps_autres` (regex psychédélique non ajouté).

#### G.1 — historique de la spec (conservée pour traçabilité)

- Re-grouper par taxonomie clinique cohérente :
  - **Médicaments addictologiques** (TSO, anti-craving acamprosate/naltrexone/disulfirame/baclofène, sevrage)
  - **Psychotropes** (ATD, antipsy, BZD/hypnotiques, thymorégulateurs, stimulants thérapeutiques)
  - **Drogues classiques** (alcool, cocaïne, cannabis, héroïne, MDMA, hallucinogènes, GHB)
  - **NPS** (cathinones, opioïdes synthétiques, cannabinoïdes synthétiques, BZD analogues, etc.)
  - **Autres** (kava, kratom, NAC, poppers, N2O — à reclasser ou splitter)
- Implémentation : ajouter un champ `bucket` au schéma `Molecule` (string enum), backfiller les 147 via script
- Avantage : indépendant des fichiers JSON sources (qui peuvent rester organisés par session d'ingestion historique)

### G.2. UX Recherche/Atlas après G.1

- SearchPage : ajouter filtres `bucket` au-dessus de la liste de résultats
- AtlasPage : option de regrouper les molécules par bucket dans les listes CYP/UGT/Transporteurs
- HomePage : éventuellement afficher un compteur "X médicaments addicto · Y drogues · Z NPS" (factuel, désamorce la perception "outil incomplet")

### G.3. Acamprosate — fix immédiat possible (~10 min, hors session ATC complète)

Si JC veut un quick fix avant le chantier G complet : ouvrir `metaboscope/src/data/molecules/molecules_drogues_classiques.json`, retirer la fiche acamprosate (la dupliquer dans `molecules_opioides_tso.json` ou créer `molecules_anticraving.json`). Validation `npm run validate:molecules`. Rebuild. Bump CACHE_NAME.

---

## §11. Chantier F additions

### F.7. Catch SW USCA hors-scope (livré v4.25, 2026-05-08)

`sw.js` ligne 167 (cache-first runtime) faisait un `fetch(e.request)` non catché → `Uncaught (in promise) TypeError: Failed to fetch` en console pour toute requête hors-scope (extensions navigateur, BrowserRouter sous-app MetaboScope, `searchAnalyzer.js` Edge/Bing).

**Fix appliqué v4.25** : `.catch(() => new Response('', { status: 408 }))` propre. Bug pré-existant à MetaboScope, juste révélé par la nouvelle iframe. À documenter en §F si besoin de revisiter.

## §12. Chantier H — Refonte UX/UI 2 onglets (livré v4.29-v4.30, 2026-05-09)

Refonte profonde issue du brainstorming visuel JC ↔ Claude (mockups via Visual Companion superpowers). Décisions clés validées :

### Architecture
- **2 onglets** au lieu de 3 : `Atlas` (par défaut) + `Interactions`. Suppression de `HomePage`, `SearchPage` isolée et `MoleculePage` isolée.
- **Tabs en haut** style navigateur (au lieu de bottom nav) avec indicateur 2px qui glisse + badge dynamique sur Interactions (pulsant orange quand panier > 0).
- **Routes simplifiées** : `/` = Atlas, `/interactions`. Redirects legacy `/search`, `/search/:id` (→ `?molecule=:id`), `/atlas`.
- **Fiche molécule = `MoleculeDetailModal`** slide-in (drawer) ouvert via `?molecule=ID` dans l'URL — accessible depuis n'importe où.
- Routes obsolètes nettoyées du dossier `pages/`.

### Atlas refondu
- **Barre de recherche universelle** (autocomplete → ouvre `MoleculeDetailModal`).
- **Grille de toggles voies** (~30 voies CYP/UGT/Phase II/Non-CYP/Transporteurs) en multi-sélection. **1 couleur unique par voie** (CYP3A4 bleu, CYP2D6 vert, etc. — cohérent avec Interactions). `src/utils/voies.ts`.
- **Mode OU/ET** pour combiner les voies sélectionnées.
- **Filtre classes thérapeutiques** : 8 buckets (`Antidépresseurs`, `Antipsychotiques`, `Anxiolytiques · Hypnotiques`, `Thymorégulateurs`, `Opioïdes · TSO`, `Psychostimulants`, `Drogues classiques`, `NPS · Autres`). Compteur discret en haut droit, dropdown léger, persistance `localStorage`. `src/utils/classes.ts`.
- **3 sections résultats empilées** : Substrats (badge MAJ/mod/min) / Inhibiteurs (barres d'intensité 3/2/1, rouge) / Inducteurs (idem, vert). Chaque mol = card avec voies pills colorées + bouton `+`/`✓` pour ajouter au panier.
- **⚡ orange sur les toggles voies** partagées par les molécules du panier.
- **Bannière flottante panier** en bas : "X mol · ⚡ N voies partagées · Analyser →" — bascule vers Interactions.

### Interactions refondu
- **Barre de recherche** pour ajouter une molécule.
- **Alertes PD cumulées** en haut (QT, sérotonine, respiratoire, ACB, seuil épileptogène) — uniquement les niveaux red/amber visibles, cliquables → `AlertDetailModal` (rationale + contributeurs + conduite à tenir).
- **Cards molécule visuelles** : nom + classe + ✕ retire, voies en pills colorées (lettre `S`/`I`/`Ind` dans carré + intensité MAJ/mod/min ou barres 3/2/1), voies partagées avec halo + ⚡, pictogrammes alertes PD red/amber.
- Section "Interactions PK détectées" si paires PK ou interactions documentées.

### `VoieDetailModal` (v4.30)
- Tap sur n'importe quelle pill voie (Atlas ou Interactions) → modal slide-in avec :
  - Header coloré de la voie (palette uniforme dans toute l'app)
  - **Détection automatique paires PK** : pour chaque substrat × chaque inhibiteur/inducteur sur la même voie → flag "AUC ↑" ou "AUC ↓" avec mini-explication
  - Liste des molécules du panier touchant cette voie + leur rôle/intensité
  - Lien vers fiche complète d'une molécule

### Lisibilité dark/light (v4.30)
Les classes Tailwind `text-{color}-{100,200,300}` sont conçues pour fond foncé. En mode light, elles devenaient illisibles (jaune pâle sur blanc, rouge pâle sur blanc). Ajout de règles d'inversion dans `metaboscope/src/index.css` : `html.theme-light .text-amber-{100,200,300}` → `text-amber-{800,800,700}`, idem red/blue/green/indigo. Contrastes badges intensité aussi renforcés (slate-300/400 au lieu de slate-200/black-15%).

### Composants nouveaux
- `src/utils/voies.ts` — catalogue voies + couleurs + helper `getMoleculeVoies(m)` qui agrège phase1_cyp/non_cyp + phase2 + transporteurs + inhibiteur + inducteur.
- `src/utils/classes.ts` — regroupement 8 classes thérapeutiques avec regex.
- `src/components/ui/ModalDrawer.tsx` — drawer slide-in générique (Echap pour fermer, backdrop dimmé, accent border colorée).
- `src/components/ui/IntensityBars.tsx` — 3 barres remplies selon level (1/2/3).
- `src/components/MoleculeDetailModal.tsx` — wrap `MoleculeCard` dans drawer.
- `src/components/VoieDetailModal.tsx` — insight clinique sur une voie + détection paires PK.

### Conservé tel quel
DisclaimerGate, CartContext, OfflineBanner, helpers `scoring.ts`/`pgx.ts`/`data/index.ts`, composant `MoleculeCard` (réutilisé dans le modal), sync thème dark/light (v4.26 + v4.28), deep link `?cart=` (v4.26).

### Hors scope (reporté)
- Vue "réseau" molécules ↔ voies (Layout B refusé — moins compact, moins scalable)
- Scénarios cliniques précâblés (refusés)
- Mode Ordonnance (chantier D.1 reporté)
- Migration Tailwind v4 (chantier F.9 — la refonte v4.29 ne dépend pas de l'API v3 spécifique)
- Refonte de la classification fine des molécules (chantier G — séparé)

---

## §11 (déplacée). Chantier F additions

### F.7. Catch SW USCA hors-scope (livré v4.25, 2026-05-08)

`sw.js` ligne 167 (cache-first runtime) faisait un `fetch(e.request)` non catché → `Uncaught (in promise) TypeError: Failed to fetch` en console pour toute requête hors-scope (extensions navigateur, BrowserRouter sous-app MetaboScope, `searchAnalyzer.js` Edge/Bing).

**Fix appliqué v4.25** : `.catch(() => new Response('', { status: 408 }))` propre. Bug pré-existant à MetaboScope, juste révélé par la nouvelle iframe. À documenter en §F si besoin de revisiter.

### F.8. Meta `mobile-web-app-capable` (livré v4.25, 2026-05-08)

Chrome ≥ 109 a déprécié `<meta name="apple-mobile-web-app-capable">` au profit du standard `<meta name="mobile-web-app-capable">`. Ajout du tag standard à côté de l'apple-meta dans 5 fichiers HTML USCA (`index.html` racine, `admin/`, `patient/`, `staff/toolbox.html`, export imprimable patient). Apple-meta conservé (compat iOS Safari).

### F.9. Migration MetaboScope Tailwind v3 → v4 (à planifier)

**Contexte** : USCA-Connect utilise Tailwind v4 via CDN (`@tailwindcss/browser@4`), MetaboScope utilise Tailwind v3 avec Vite + PostCSS + `tailwind.config.ts`. Stack hétérogène. Demande JC 2026-05-08 d'uniformiser.

**Charge estimée** : 1-2h — config + tests visuels sur 30+ composants. Risque modéré (Tailwind v4 récent, breaking changes possibles).

**Bénéfices** :
- Cohérence stack USCA-Connect ↔ MetaboScope (un seul Tailwind à connaître)
- Build MetaboScope plus rapide (Lightning CSS Rust vs PostCSS Node)
- Configuration plus simple (CSS-first via `@theme {}`, suppression `tailwind.config.ts` + `postcss.config.js`)

**Étapes** :
1. `npm install -D tailwindcss@4 @tailwindcss/vite` (remplace `tailwindcss@3` + `postcss` + `autoprefixer`)
2. `vite.config.ts` : ajouter le plugin `@tailwindcss/vite`
3. `src/index.css` : remplacer `@tailwind base; @tailwind components; @tailwind utilities;` par `@import "tailwindcss";`
4. Migrer les couleurs custom de `tailwind.config.ts` vers un bloc `@theme {}` dans `index.css`
5. Supprimer `tailwind.config.ts` + `postcss.config.js`
6. `npm run build` → vérifier qu'il n'y a pas de classe non reconnue
7. Test visuel : home + search + interaction + atlas + fiche molécule, en light ET dark
8. Bump `CACHE_NAME` USCA + commit

**Décision** : ne pas attaquer maintenant. Planifié post chantier B (extension molécules) ou en chantier "stabilisation" si rien d'urgent. Le système light/dark v4.26 livré ne dépend pas de l'API v3 spécifique → la migration v4 ne le cassera pas.

**Précaution** : Tailwind v4 a quelques renames de classes (ex. `bg-opacity-50` → `bg-{color}/50` qui était déjà la syntaxe utilisée dans MetaboScope, donc OK). Vérifier la page de migration officielle au moment de l'attaquer.

---

## §9. Notes de méthode

- **Aucune réécriture massive** : chaque chantier propose des fichiers ciblés à créer/modifier, pas un refactor global
- **Pas de bundler nouveau** : on garde Vite, on n'introduit pas de stack supplémentaire
- **Pas de SaaS/backend distant** : toute fonctionnalité reste 100% client-side (contrainte HDS AP-HP)
- **Pas de télémétrie** : aucune nouvelle fonctionnalité ne doit ajouter d'appels sortants
- **Versionnement** : chaque chantier livré incrémente `metaboscope/package.json` `version` (1.1.0, 1.2.0…) et bump `CACHE_NAME` du `sw.js` USCA
