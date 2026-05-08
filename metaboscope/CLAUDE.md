# CLAUDE.md — MetaboScope (sous-app intégrée à USCA-Connect)

> **Note d'intégration (2026-05-08)** : ce fichier provient du repo MetaboScope d'origine (`C:\Users\jclui\Documents\MetaboScope`). Le sous-projet vit désormais dans `C:\Users\jclui\Documents\USCA-Connect\metaboscope\`, intégré comme iframe dans la Toolbox V1 USCA-Connect. Les chemins, remote git et règles "pas de bundler" ne s'appliquent plus tels quels — voir le `CLAUDE.md` racine d'USCA-Connect §0 pour le contexte global, et `METABOSCOPE_APP.md` (racine USCA-Connect) pour la roadmap d'amélioration en cours. Le contenu ci-dessous reste la **référence v1.0 livrée** (architecture, schéma, méthodologie data) — il sert de base à toute modification du code/des données du sous-dossier.

---

> **Lis ce fichier en entier avant toute modification.** Dernière mise à jour : 2026-04-29 (v1.0 livrée — 3 modules navigables, base 147 molécules, audit multi-source).

---

## 0. Démarrage de session — à lire dans cet ordre

À chaque ouverture de session Claude Code dans ce repo, **lire ces fichiers dans l'ordre suivant** avant toute action :

1. **`CLAUDE.md`** *(ce fichier)* — identité du projet, stack, règles qualité, état d'avancement, reprise.
2. **`docs/superpowers/specs/2026-04-27-metaboscope-modules-design.md`** — spec v1 validé (architecture, 3 modules, multi-sources). **À lire avant le plan.**
3. **`docs/superpowers/plans/2026-04-27-metaboscope-modules.md`** — plan d'implémentation 22 tâches sur 7 sessions, prêt à exécuter.
4. **`DATA_SCHEMA.md`** — schéma JSON v2 normatif des molécules (obligatoire avant toute modif de données).
5. **`INSTRUCTIONS_PROJET_METABOSCOPE.md`** — contexte clinique étendu, cibles utilisateur, hiérarchie des sources, méthodologie de production des JSON. Lecture recommandée pour toute session "données" ou "ajout molécule".
6. **`src/data/warnings.md`** — **avertissements et points notables sur les données** : couples CI absolues (§1), codes hors vocabulaire à normaliser v1.0.1 (§2), zones grises (§3), sources uniques à cross-valider (§4), récap PGx CPIC (§5), récap QT (§6), notes par fichier (§7), champs manquants (§8), actions de maintenance (§9). À consulter pour toute question clinique fine ou avant une décision sur les données.
7. **`SETUP.md`** — référence de scaffolding initial (déjà appliqué). À consulter si on doit re-scaffolder ou reproduire la config sur un autre poste.
8. **JSON molécules concernés** dans `src/data/molecules/` — *avant* toute réponse sur une molécule précise.

> Règle : ne **jamais** modifier `src/data/molecules/*.json` sans `git diff` préalable et validation contre le schéma.

> **Reprise rapide** : si le but est d'attaquer l'implémentation, sauter directement à §16 ci-dessous.

---

## 1. Identité du projet

PWA d'aide à la décision clinique sur la métabolisation médicamenteuse, pour pharmacologues cliniciens et addictologues AP-HP (USCA / ELSA, Pitié-Salpêtrière). Aucun référentiel français n'intègre : psychotropes + voies non-CYP + drogues/NPS + PGx CPIC actionnable + alertes PD (QT/séro/resp/ACB). Le tableau HUG Genève 2020 est la référence de service à dépasser.

**Porteur unique : JC** (psychiatre addictologue, AP-HP). Poste verrouillé Windows 11, pas de droits admin. Git Portable + Claude Code. Repo : `C:\Users\4070521\Documents\MetaboScope` (hors OneDrive). Remote : `https://github.com/jcluisada-cmd/MetaboScope.git`.

---

## 2. Stack imposé

```
React 18 + Vite 5 + TypeScript + Tailwind CSS 3
PWA  : service worker + manifest (Workbox via vite-plugin-pwa)
Routing : react-router-dom v6
Stockage offline : Dexie.js (IndexedDB) — base pour cache utilisateur futur
Tests : Vitest + Testing Library (jsdom)
Build : Vite / esbuild / PostCSS
```

Contraintes absolues :
- **Offline-first** — Wi-Fi AP-HP instable, l'app doit fonctionner hors ligne après premier chargement.
- **Pas de backend** — données packagées dans `src/data/molecules/*.json`, pas de fetch externe.
- **Pas de données patient** — aucun formulaire ne persiste ni ne transmet des noms/identifiants.
- **Pas de télémétrie** — aucun appel sortant vers GA, Sentry public, etc.
- **Mobile-first** — Samsung Galaxy Tab S7 FE (DeX) + smartphones personnels.
- **Pas de CDN ni Google Fonts** — `system-ui` uniquement.

---

## 3. Palette visuelle (identité USCA)

| Rôle | Hex | Tailwind |
|------|-----|----------|
| Navy fond / headers | `#0f1e33` → `#1e3a5f` | `navy-900` / `navy-800` / `navy-700` |
| Teal actions / accents | `#0d9488` → `#14b8a6` | `teal-600` / `teal-500` / `teal-400` |
| Amber alertes / zones grises / PGx | `#f59e0b` → `#d97706` | Tailwind par défaut `amber-*` |
| Red CI absolues | `#dc2626` | Tailwind par défaut `red-*` |
| Gray texte / bordures | échelle Tailwind standard | `gray-*` |

Custom dans `tailwind.config.ts` : `navy.*`, `teal.*` étendus. `amber/red/gray` = défaut Tailwind.

---

## 4. Structure du projet (état 2026-04-27)

```
MetaboScope/
├── CLAUDE.md                     ← point d'entrée Claude Code (ce fichier)
├── DATA_SCHEMA.md                ← schéma JSON v2 normatif
├── INSTRUCTIONS_PROJET_METABOSCOPE.md  ← contexte clinique étendu
├── SETUP.md                      ← référence scaffold (déjà appliqué)
├── package.json / tsconfig*.json / vite.config.ts / tailwind.config.ts / postcss.config.js / vitest.config.ts
├── index.html
├── public/
│   ├── favicon.svg
│   ├── icons/icon.svg            ← icône PWA (SVG, scalable, "any maskable")
│   └── _redirects                ← Netlify SPA fallback
├── src/
│   ├── main.tsx                  ← entry React + BrowserRouter
│   ├── App.tsx                   ← routes / /interactions /substances
│   ├── index.css                 ← Tailwind layers + scrollbar custom + .focus-ring
│   ├── vite-env.d.ts
│   ├── data/
│   │   ├── index.ts              ← agrège les 5 JSON, expose ALL_MOLECULES, MOLECULES_BY_ID, CLASSES, SUBSTANCES, searchMolecules()
│   │   └── molecules/            ← 5 JSON consolidés (NE PAS MODIFIER sans git diff)
│   │       ├── molecules_opioides_tso.json                    ✅ 18 mol.
│   │       ├── molecules_antidepresseurs.json                  ✅ 14 mol.
│   │       ├── molecules_antipsychotiques.json                 ✅ 18 mol.
│   │       ├── molecules_thymoregulateurs_anticonvulsivants.json ✅ 13 mol.
│   │       └── molecules_bzd_hypnotiques.json                  ✅ session 5
│   ├── types/
│   │   └── molecule.ts           ← interfaces TS du schéma v2 (variants string|array tolérés)
│   ├── utils/
│   │   ├── scoring.ts            ← scoreQT, scoreSero, scoreResp, scoreAcb, scoreSeuilEp, detectPkPairs, findDocumentedInteractions
│   │   └── pgx.ts                ← isCpicNiveauA, crossPgxWithGenotype, variantsToString
│   ├── components/
│   │   ├── Layout.tsx            ← navbar bottom (mobile) + horizontal (desktop) + Disclaimer + OfflineBanner
│   │   ├── Disclaimer.tsx        ← disclaimer clinique (DISCLAIMER_TEXT exporté)
│   │   └── OfflineBanner.tsx     ← bandeau si !navigator.onLine
│   └── pages/
│       ├── HomePage.tsx          ← landing + nav modules + statut
│       ├── InteractionPage.tsx   ← Module 2 — panier + 5 cartes PD + paires PK + PGx (T18)
│       ├── MoleculePage.tsx      ← fiche détaillée /search/:id (T16)
│       ├── SearchPage.tsx        ← recherche unifiée /search (T15)
│       └── AtlasPage.tsx         ← Atlas /atlas — sous-onglets CYP/UGT/Transporteurs (T19)
└── tests/
    └── setup.ts                  ← @testing-library/jest-dom
```

---

## 5. État de l'application — 2026-04-29

Build production : ✅ `npm run build` → `dist/` ~588 KiB JS gzip ~148 KiB · CSS 17 KiB gzip 4 KiB · SW généré · 10 entrées précachées (~603 KiB).

| Bloc | État | Notes |
|---|---|---|
| Scaffold Vite + React + TS + Tailwind v3 | ✅ | `npm run build` OK |
| PWA (vite-plugin-pwa, Workbox) | ✅ | manifest + SW générés ; CacheFirst sur `/molecules/*.json` |
| Icônes PWA (SVG `any maskable`) | ✅ | `public/icons/icon.svg` + `public/favicon.svg` |
| Types TypeScript schéma v2 | ✅ | `src/types/molecule.ts` (extension `source: string \| string[]` planifiée T9) |
| Index de données + recherche | ✅ | `searchMolecules()`, normalisation accents, tri exact > préfixe DCI > préfixe synonyme > contient |
| Helpers scoring PD | ✅ | QT, séro, resp (paire BZD+opi=red FDA 2016), ACB, seuil-ep — 4 niveaux ok/info/amber/red |
| Helpers PGx | ✅ | match phénotype génotype-utilisateur ↔ guideline |
| Layout mobile-first + nav + disclaimer + offline | ✅ | navbar bottom mobile / horizontale desktop |
| **Filet de sécurité (scripts/validate-molecules + tests data + tests scoring)** | ✅ | T1-T3 (2026-04-28) — exit 0 sur 76 molécules, 6+13 tests PASS |
| **Headers Cloudflare Pages PWA** | ✅ | `public/_headers` : no-cache sur `index.html`/`sw.js`, immutable sur `assets/*` |
| **Module 1 — Recherche + MoleculeCard** | ✅ | T10-T16 livrées — SearchPage + MoleculePage + 11 sections accordéon + bandeau résumé |
| **Module 2 — Vérificateur co-prescription** | ✅ | T18 livrée — panier + 5 cartes PD + paires PK + PGx |
| Module 3 — Atlas (renomée Substances v0) | ✅ | T19 livrée — sous-onglets CYP/UGT/Transporteurs dynamiques |
| First-use disclaimer screen (localStorage flag) | ✅ | T13 livrée — DisclaimerGate versionné |
| Briques UI atomiques (Badge, Accordion, AutoComplete, SourceLink, EmptyState) | ✅ | T5-T8 livrées sessions 1-2 |
| Tests smoke (MoleculeCard) | ✅ | T12 livrée — 4 tests passent |
| Bannière offline | ✅ | `OfflineBanner.tsx` |
| **Branche d'implémentation** | `feat/v1-implementation` | poussée sur `origin`, prête pour reprise multi-poste |

---

## 6. Schéma JSON molécule (v2) — résumé

Voir `DATA_SCHEMA.md` pour le schéma complet. Champs obligatoires (extrait) :

```typescript
interface Molecule {
  id: string;                    // "classe_abrev_dci"
  nom_dci: string;
  synonymes: string[];
  classe: string;
  statut_fr: string;             // "Liste I" | "Liste II" | "Stupéfiants" | ...
  phase1_cyp: CYPEntry[];
  phase1_non_cyp: NonCYPEntry[];
  phase2: Phase2Entry[];
  transporteurs: TransporteurEntry[];
  inhibiteur: InhibEntry[];
  inducteur: InductEntry[];
  metabolite_actif: MetaboliteActif;
  pharmacogenetique: PGxEntry[];
  interactions_specifiques: InteractionEntry[];  // JAMAIS vide
  alertes_pd: AlertePD[];
  niveau_preuve_global: NiveauPreuve;
  sources_principales: string[];  // JAMAIS "ND" ici
  zone_grise: boolean;
  derniere_maj: string;          // "YYYY-MM"
  champ_manquants: string[];
}
```

**Particularité de typage rencontrée dans les JSON existants** : `pharmacogenetique[].variants` peut être `string` (ex. `"S145C, L311V"`) OU `string[]`. Les types TS l'autorisent en union (`string | string[]`).

**Wrapper de fichier** : chaque JSON est `{ "_metadata": {...}, "molecules": [Molecule, ...] }`.

**Vocabulaire alertes PD — convention `kebab-case` ASCII pur (pas de diacritiques).** Source de vérité : `scripts/validate-molecules.mjs` (Set `PD_CODES`). Liste organisée par sous-domaine (mise à jour 2026-04-28 post-intégration sessions 6-13) :

- **QT (4)** : `QT-KR` `QT-PR` `QT-CR` `QT-SR`
- **Sérotonine (3)** : `sero` `sero-faible` `sero-modere`
- **Respiration (1)** : `resp`
- **ACB cumul anticholinergique (3)** : `ACB-1` `ACB-2` `ACB-3`
- **Seuil épileptogène (2)** : `seuil-ep` `seuil-ep-sevrage`
- **Toxicités d'organe (4)** : `hepatotox` `hepatotox-POLG` `nephrotox` `myocardite`
- **Contre-indications absolues (5)** : `CI-IMAO` `CI-fluvoxamine` `CI-sildenafil` `CI-grossesse` `CI-alcool`
- **Tératogénicité (3)** : `teratogene` `teratogene-Ebstein` `teratogene-hydantoine`
- **Hypersensibilité grave (5)** : `SJS` `SJS-Lyell-HLA-B1502` `DRESS` `DRESS-HLA-A3101` `SMN`
- **Mésusage / dépendance (5)** : `fenetre-etroite` `mesusage-documented` `dependance` `dependance-documented` `dependance-mu-opioide`
- **Antipsychotiques (15)** : `agranulocytose` `akathisie` `aggressivite-boxed-warning` `sedation` `sedation-profonde` `sialorrhee` `bronchospasme-voie-inhalee` `hypotension-orthostatique` `metabolique` `metabolique-prise-poids` `diabete` `hyperprolactinemie` `thyroide-hypo` `SEP` `impulsivite` `idees-suicidaires`
- **Anticonvulsivants (12)** : `hyponatremie-SIADH` `glaucome-aigu` `glaucome-angle-ferme` `lithiase-renale` `acidose-metabolique` `perte-poids` `troubles-cognitifs` `cerebelleux-dose-dependant` `hyperplasie-gingivale` `titration-lente-obligatoire` `troubles-neuropsy-agressivite` `troubles-psychiatriques` `pancreatite` `hyperammonemie`
- **BZD / hypnotiques (8)** : `amnesie-anterograde` `parasomnies-complexes` `somnambulisme` `chute-sujet-age` `sujet-age-risque-confusion` `sevrage-BZD-like` `sevrage-possible-si-arret-brutal` `soumission-chimique` `anesthesie`
- **Cardio / hémodynamique (10)** : `CV-HTA` `HTA` `HTA-dose-dep` `HTA-severe` `tachycardie` `tachycardie-severe` `bradycardie` `palpitations` `syncope` `mort-subite`
- **Stimulants / NPS (8)** : `insomnie` `anxiete` `agitation` `agitation-extreme` `mydriase` `hyperthermie` `coma` `excited-delirium` `binge-pattern` `donnees-tres-limitees`
- **Toxicités d'organe étendues (3)** : `IRA` `rhabdomyolyse` `ischemie-myocardique`
- **CI étendues (2)** : `CI-anorexie-boulimie` `CI-sevrage-alcool-BZD-aigu`
- **Mésusage / détournement (5)** : `dependance-faible` `detournement-IV-fente-narines` `detournement-reduit-vs-amphetamine` `detournement-cognitive-enhancement` `sevrage-cephalees-fatigue`
- **Idéation / psychose (4)** : `ideation-suicidaire-adolescent` `ideation-suicidaire-jeune-adulte` `psychose-reactivation` `psychose-vulnerable` `psychose-cannabinoide`
- **Hépatotox / hypersensibilité étendues (4)** : `hepatotox-rare` `SJS-Lyell-rare` `DRESS-rare` `foetotoxicite-grossesse`
- **Divers (3)** : `demi-vie-longue` `myelopathie-B12` `rebond-HTA-arret-brutal`

**Total : ~110 codes canoniques.** Pour ajouter un code : 1) PR sur `scripts/validate-molecules.mjs` (Set `PD_CODES`), 2) mise à jour de cette liste dans `CLAUDE.md` §6, 3) usage dans les JSON.

> **Dette v1.0.1 — codes hors vocabulaire (~150 occurrences)** : les JSON sessions 6-13 contiennent des codes diacritiques (`dépendance-documented`, `sédation`, `mésusage-documented`, `hépatotox`, `idéation-*`, `psychose-réactivation`, etc.) et des codes ad-hoc à normaliser (`psychose-aiguë`, `nausées`, `convulsions`, `hyperthermie-maligne`, etc.). **Ils sont tolérés en runtime** (fallback `pdAlertLabel` → label brut + severity neutral) mais signalés comme **warnings** par `npm run validate:molecules`. Liste exhaustive : `src/data/warnings.md` §2. Normalisation prévue v1.0.1 (cf. plan §16 « Veille v1.0.1 »).

**Préfixes sources autorisés (regex `SOURCE_PREFIX`)** : `PMID:` `DOI:` `FDA:` `EMA:` `ANSM:` `CredibleMeds:` `CPIC:` `DPWG:` `StatPearls:` `HUG:` `CBIP:` `PMC:` `NBK:` `EMCDDA:` `ResearchGate:` `bioRxiv:` `CDC:`

> Aucune source "interne" (`Gemini DR X`, `Plan_de_recherche`, `Mise_à_jour_référentiel`, `Rapport HUG 2020 extension`, `Rapport MetaboScope Substances`, `métaboscope GPT 3`, `Italie 2014-2025 case series`, `Littérature PK`, etc.) n'est acceptée — ce sont des artefacts process LLM ou des références non préfixées. Le validate les **tolère comme warnings** (dette v1.0.1 documentée dans `src/data/warnings.md` §4). Si une info ne peut pas être sourcée à un préfixe valide, marquer `zone_grise: true` au niveau cellule plutôt que d'inventer une source.

---

## 7. Trois modules de l'app

**Module 1 — Recherche par molécule** (✅ livré v1.0)
Autocomplete DCI + noms commerciaux + synonymes NPS. Fiche complète : profil métabolique + PGx + alertes PD + sources PMID/DOI cliquables + badge zone grise par cellule.

**Module 2 — Vérificateur de co-prescription** (✅ livré v1.0)
2 à 6 molécules. Interactions PK (substrat commun, inhibition/induction) + alertes PD cumulées :

**Sévérité retournée par les helpers** (4 niveaux, non 3 comme dans une lecture rapide) :
- `'ok'` : aucun contributeur — pas d'affichage UI dédié
- `'info'` : 1 contributeur isolé faible (ex. QT-SR seul, sero-faible seul) — affichage informationnel doux, pas une alerte
- `'amber'` : seuil intermédiaire — alerte à pondérer cliniquement
- `'red'` : seuil critique — combinaison à proscrire sauf bénéfice supérieur dûment justifié

**Scores PD :**
- **QT cumulé** : KR=3, PR=2, CR=1, SR=1 → `red` si total ≥ 3 ou ≥ 2 KR ; `amber` si total ≥ 2 ; `info` si 1 contributeur ; `ok` sinon
- **Sérotoninergique** : triade ISRS/IRSNA/IMAO/opioïdes séro/linézolide/triptans → `red` si triade ; `info` si 1 contributeur faible isolé
- **Respiratoire** : `red` dès la **paire BZD + opioïde** (FDA boxed warning 2016 — paire la plus létale du périmètre USCA, première cause d'overdose). Triade BZD + opioïde + autre dépresseur CNS → `red` a fortiori. `amber` si paire (BZD ou opioïde) + autre dépresseur CNS sans le partenaire critique.
- **ACB cumulé** : `amber` ≥ 3, `red` ≥ 6
- **Seuil épileptogène** : liste de contributeurs (pas de scoring numérique)
- **PGx** : si génotype CYP2D6/2C19/2B6 renseigné, croiser avec recommandation CPIC niveau A *(report v1.1, pas exposé en UI v1)*

**Module 3 — Atlas** (✅ livré v1.0 — anciennement « Substances »)
Sous-onglets CYP / UGT / Transporteurs construits dynamiquement depuis `ALL_MOLECULES` via `buildAtlasIndex()`. Drogues + NPS sont désormais indexés dans la recherche unifiée du Module 1 (alcool 3 phases, cocaïne/cocaéthylène/crack, MDMA MBI 10j, cannabis THC/CBD, héroïne/6-MAM, GHB, kétamine, psilocybine, NPS…).

---

## 8. Base de données molécules (état 2026-04-28 — v1.0 base intégrée)

**147 molécules consolidées sur 13 fichiers — source de vérité = JSON Claude, sessions 1-13. Intégration complète v1.0.**

| Fichier | Molécules | Format | Statut |
|---------|-----------|--------|--------|
| molecules_opioides_tso.json | 18 | wrapper | ✅ validé |
| molecules_antidepresseurs.json | 14 | wrapper | ✅ validé |
| molecules_antipsychotiques.json | 18 | wrapper | ✅ validé |
| molecules_thymoregulateurs_anticonvulsivants.json | 13 | wrapper | ✅ validé |
| molecules_bzd_hypnotiques.json | 13 | wrapper | ✅ validé |
| molecules_psychostimulants.json | 8 | wrapper | ✅ S6 |
| molecules_drogues_classiques.json | 14 | wrapper | ✅ S7 (alcool 3 phases, cocaïne 3 entités, MDMA MBI 10j) |
| molecules_hallucinogenes_dissociatifs.json | 11 | wrapper | ✅ S8 |
| molecules_ghb_derives.json | 4 | wrapper | ✅ S9 |
| molecules_nps_cathinones.json | 8 | wrapper | ✅ S10 |
| molecules_nps_opioides_benzo.json | 12 | tableau brut | ✅ S11 (nitazènes, xylazine, étizolam, bromazolam) |
| molecules_nps_cannabinoides_autres.json | 8 | tableau brut | ✅ S12 (HHC, THCP, MDMB-4en-PINACA, ADB-BUTINACA) |
| molecules_autres.json | 6 | tableau brut | ✅ S13 (N2O, kava, kratom, phénibut, NAC, poppers) |

**Deux formats de wrapper** acceptés par `src/data/index.ts:extractMolecules()` et `scripts/validate-molecules.mjs:extractMolecules()` :
- **Format A (sessions 1-10)** : `{ "_metadata": {...}, "molecules": [Molecule, ...] }`
- **Format B (sessions 11-13)** : `Molecule[]` direct (tableau brut sans wrapper)

**Total v1.0 livré : 147 molécules** (vs ~140 projetées). État de fiabilité résumé dans `src/data/warnings.md` :
- 28 zones grises documentées (warnings.md §3)
- 13 molécules à source unique à cross-valider (warnings.md §4)
- 27 PGx CPIC niveau A actionnables (warnings.md §5)
- 11 QT-KR + 13 QT-PR + 18 QT-CR (warnings.md §6)
- 11 couples CI absolues v1 (warnings.md §1, voir aussi §9 ci-dessous)

---

## 9. Règles qualité — INVARIANTS

Ces règles ne souffrent AUCUNE exception :

1. **Pas de PMID inventé** — si pas de source vérifiée → `zone_grise: true` + code `AN` ou `ND` sur le champ
2. **`sources_principales[]` ne contient jamais `"ND"`** — si source introuvable, reclasser le champ comme zone grise
3. **`interactions_specifiques[]` jamais vide** — mettre a minima les interactions cliniquement pertinentes documentées
4. **PGx niveau A CPIC = recommandation verbatim** (pas juste un code)
5. **6β-naltrexol** (pas 6β-naltrexone) via AKR1C4 — jamais CYP
6. **Alcool = 3 entités distinctes** : aigu / chronique / sevrage
7. **Cocaïne = 3 entités** : seule / cocaéthylène / crack-AEME
8. **MDMA CYP2D6 = MBI irréversible**, fenêtre de récupération 10 jours
9. **Baclofène : QT-CR** (CredibleMeds, ajouté session 1)
10. **Zones grises obligatoires** : AKR1C4 polymorphismes, OPRM1 A118G, CYP2A6 PGx
11. **Couples CI absolues v1** (cf. `src/data/warnings.md` §1 — affichage **rouge** systématique en Module 2) :
    - Poppers + inhibiteurs PDE5 (sildénafil/tadalafil/vardénafil/avanafil) → hypotension sévère/décès
    - IMAO irréversibles + ISRS/IRSNa/tramadol/triptans → syndrome sérotoninergique fatal
    - Agomélatine + fluvoxamine → AUC ×60
    - Ibogaïne + méthadone non sevrée → QTc cumulé / torsade
    - Valproate + femme en âge de procréer sans contraception (PNDS 2024)
    - Oxybate Na + alcool → dépression respiratoire (FDA boxed warning)
    - Nitazènes + naloxone dose standard → résistance, doses 0,8-4 mg + perfusion
    - Xylazine + naloxone seule → naloxone INEFFICACE sur composante xylazine
    - Carbamazépine + porteur HLA-B\*1502 (Asie du Sud-Est) → SJS/Lyell
    - GHB/GBL + alcool → ADH/ALDH saturées, dépression respiratoire fatale
    - Cocaïne + alcool → cocaéthylène, cardiotoxicité ×18-25

**Hiérarchie sources en cas de conflit :**
CPIC > CredibleMeds > FDA Drug Interaction Table > JSON Claude > ChatGPT DR

**Codes niveau de preuve :**
`IVH-C` (in vivo humain contrôlé) > `IVH-O` (observationnel) > `CAS` (cas cliniques) > `FOR` (forensique) > `IVA` (animal) > `IVT` (in vitro) > `AN` (analogie) > `ND`

---

## 10. Ce que Claude NE DOIT PAS faire

- Inventer un PMID, DOI, ou source
- Combler silencieusement un champ manquant par inférence non signalée
- Proposer stocker/transmettre des données patient
- Proposer un backend distant ou intégration SaaS sans validation RSSI AP-HP
- Écraser un JSON existant sans vérification git diff + validation schéma
- Recommander une posologie concrète
- Utiliser `localStorage` / `sessionStorage` pour des données sensibles
- Ajouter de la télémétrie
- Importer une dépendance hors liste blanche (React/Vite/Tailwind/Dexie/react-router/Vitest/vite-plugin-pwa) sans justification

---

## 11. Disclaimer clinique (à afficher dans l'UI)

> *MétaboScope est un outil d'aide à la décision. Il ne se substitue pas au jugement clinique du prescripteur. Les recommandations pharmacogénétiques nécessitent confirmation par le laboratoire de pharmacogénomique. Les données sur les NPS sont par nature évolutives. Validation pharmacien clinicien recommandée pour toute co-prescription à haut risque.*

Doit apparaître : page d'accueil, pied de chaque fiche molécule, écran d'installation PWA. Texte exporté depuis `src/components/Disclaimer.tsx` (`DISCLAIMER_TEXT`).

---

## 12. Commandes utiles

```bash
# Installation initiale (déjà fait)
npm install

# Dev server
npm run dev          # → http://localhost:5173

# Build prod + service worker
npm run build

# Prévisualiser le build
npm run preview

# Tests
npm run test         # vitest run
npm run test:watch
npm run test:ui      # Vitest UI

# Type-check seul
npx tsc -b

# Validation JSON molécules (script à créer si besoin)
npm run validate:molecules
```

---

## 13. Reprise (HISTORIQUE — superseded par §16)

> **Cette section est conservée à titre historique.** Le brainstorming du 2026-04-27 a remplacé cette TODO ad hoc par un plan d'implémentation complet : voir §16. La TODO ci-dessous reflète l'état avant brainstorming et est désormais obsolète :
> - L'organisation en *« Modules 1/2/3 »* a évolué vers **3 onglets** (Recherche/Fiche, Interactions, Atlas) — onglet *Substances* supprimé, médicaments + drogues + NPS unifiés dans la recherche.
> - Le périmètre v1 a été cadré (sans saisie de génotype, sans schéma visuel, ingestion HUG/CBIP en v1.1).
> - L'ordre d'implémentation a été redessiné en **Approche B atomique** (briques avant pages).

L'ancienne TODO était : Module 1 → Module 2 → Module 3 stub → Disclaimer → tests → script validation. **Désormais : suivre le plan §16.**

---

## 14. Conventions UI (Tailwind)

- Classes principales : `bg-navy-900` (fond app), `bg-navy-800` (cards), `border-navy-700`, `text-teal-400` (accents), `text-amber-300` (zones grises / disclaimer), `text-red-400` (CI absolues)
- Focus visible : utility `.focus-ring` (définie dans `index.css`)
- Mobile-first : navbar fixe en bas (`fixed bottom-0`) en mobile, horizontale en desktop (`sm:`)
- Breakpoint principal : `sm:` (≥640px) pour basculer mobile→tablet/desktop
- Aucun `<a target="_blank">` sans `rel="noopener noreferrer"`
- Tous les éléments interactifs : `aria-label`, navigation clavier, focus visible

---

## 15. Démarrage rapide (rappel)

```bash
git pull
npm install            # si node_modules absent
npm run dev            # http://localhost:5173
```

Pour la suite : voir §16 — chantier post-brainstorming, plan d'implémentation 22 tâches.

---

## 16. Chantier post-brainstorming v1 (état au 2026-04-29 — v1.0 livrée)

### Avancement (2026-04-29 — v1.0 close, 7 sessions livrées)

| Session | Tâches | Status | Commits clés |
|---|---|---|---|
| **Session 1** (T1-T6) | Filet sécurité + briques utils + Badge + Accordion | ✅ DONE | `50a0824` → `1004c51` |
| **Session 2** (T7-T9) | AutoComplete + SourceLink + EmptyState + types multi-sources | ✅ DONE | `ba790f1` → `5d60d2f` |
| **Session 3** (T10-T12) | SummaryHeader + 11 sections + MoleculeCard + smoke tests | ✅ DONE | `5427bf0` → `978db81` |
| **Session 4** (T13-T17) | Disclaimer + Cart + SearchPage + MoleculePage + routing | ✅ DONE | `7d86754` → `57d8f72` (T13-T17 + fix HomePage) |
| **Session 5** (T18) | Module 2 Vérificateur | ✅ DONE | `6402da6` → `3c2bcb5` (T18 + fix Link) |
| **Session 6** (T19) | Atlas | ✅ DONE | `8b7a536` → `ab30b68` (T19 + fix natural sort) |
| **Session 7** (T20-T22) | T20 skip, T21 compare-sources, T22 acceptance | ✅ DONE | `1766f9a` → `f792152` (T21 + 2 fix-ups), T22 = ce commit |

**Décisions cliniques cristallisées sessions T1-T12 :**
- **Vocabulaire codes PD canoniques étendu** de 22 → ~110 codes ASCII pur (cf. §6 + `scripts/validate-molecules.mjs:PD_CODES`). ~150 codes hors vocabulaire (diacritiques + ad-hoc) tolérés en runtime via fallback `pdAlertLabel` mais signalés par validate comme **warnings** (à normaliser v1.0.1 — voir plan §16 « Veille v1.0.1 »).
- **Préfixes sources étendus** : `PMC:`, `NBK:`, `EMCDDA:` (sessions 1-5) puis `ResearchGate:`, `bioRxiv:`, `CDC:` (sessions 6-13) rejoignent les préfixes du plan.
- **Sources internes LLM bannies** : `Gemini DR X`, `Plan_de_recherche_*`, `métaboscope GPT *`, `Mise_à_jour_*`, `Rapport HUG 2020 extension`, `Rapport MetaboScope Substances`, `Italie 2014-2025`, `Littérature PK`. **Règle absolue** : si pas de préfixe sourçable → `zone_grise: true` au niveau cellule, JAMAIS d'invention. Le validate les **tolère comme warnings** (dette v1.0.1).
- **Paire BZD + opioïde = red** (FDA boxed warning 2016, étendu 2019 aux gabapentinoïdes). Cf. §7.
- **4 niveaux de sévérité** (`ok`/`info`/`amber`/`red`) confirmés et documentés.
- **Validate-molecules en mode errors/warnings** : exit 0 si dette documentée seulement (warnings non bloquants), exit 1 si invariants vraiment cassés (id manquant, JSON invalide, sources ND, etc.).
- **2 formats de wrapper JSON acceptés** : `{molecules: []}` (sessions 1-10) et `Molecule[]` direct (sessions 11-13). Helper `extractMolecules()` côté `src/data/index.ts` et `validate-molecules.mjs`.

### Reprise multi-poste

Si la session reprend sur un autre PC :

```bash
git clone https://github.com/jcluisada-cmd/MetaboScope.git
cd MetaboScope
git checkout feat/v1-implementation
git pull
npm install
npm run validate:molecules    # doit afficher "✓ Tous les invariants respectés (avec warnings)"
npm run test                  # 34 tests doivent PASS (6 data + 13 scoring + 11 labels + 4 MoleculeCard)
```

Puis trigger naturel **« lance les subagents »** → reprend à T13 (`DisclaimerContext + Gate + Modal`).

### Ce qui a été produit pendant la session brainstorming du 2026-04-27

- **Spec validé** : `docs/superpowers/specs/2026-04-27-metaboscope-modules-design.md` (commit `a43b2c2`)
  - 3 onglets (Recherche/Fiche, Interactions, Atlas) ; SubstancesPage supprimée
  - Index unifié médicaments + drogues + NPS
  - Fiche : bandeau résumé fixe + 11 sections accordéon pliées par défaut
  - Module 2 sans génotype patient en v1 (`crossPgxWithGenotype` reste sur l'étagère)
  - Atlas dynamique CYP / UGT / Transporteurs (calcul côté client depuis `ALL_MOLECULES`)
  - DisclaimerGate au premier lancement (versionné via constante `DISCLAIMER_VERSION`)
  - Schéma v2 étendu : `source: string | string[]` (multi-sourçage cellule par cellule)
  - Vocabulaire sources étendu : `HUG:`, `CBIP:` (consensus expert institutionnel = `IVH-O`, pas zone grise)
- **Plan d'implémentation** : `docs/superpowers/plans/2026-04-27-metaboscope-modules.md` (commit `9f2470b`)
  - 22 tâches sur 7 sessions, **Approche B atomique**
  - Chaque tâche = un commit atomique (test FAIL → implement → test PASS → commit), reprenable cold
  - Estimation : ~14-20h de travail focused
- **Sources externes regroupées dans `data_hug_cbip/`** (en `.gitignore`, reproductibles) :
  - `data_hug_cbip/hug_2020_opus.json` — extraction Claude Opus du PDF HUG 2020 (245 mol., qualité élevée, rang substrat + métabolite_actif)
  - `data_hug_cbip/cbip_gpt.json` — extraction GPT du HTML CBIP (472 mol., couverture étendue 2024+, sans rang substrat)
  - `data_hug_cbip/CBIP_interactions_V3_audit.json` — audit interne GPT (45 incohérences CBIP à dédupliquer/arbitrer)
  - `data_hug_cbip/Doc HUG 2020.pdf` + `data_hug_cbip/CBIP _ Interactions des médicaments.html` — sources brutes originales
- **Audit comparatif CBIP × HUG pré-généré** (rend la T21 quasi-triviale — consommation directe au lieu de recalcul) :
  - `data_hug_cbip/metaboscope_audit_cbip_vs_hug_summary.json` — 508 mol union, 27 high-severity à arbitrer manuellement
  - `data_hug_cbip/metaboscope_audit_cbip_vs_hug_divergences.csv` — 1194 lignes, prêtes à filtrer
  - `data_hug_cbip/metaboscope_audit_cbip_vs_hug_complete.json` — données fusionnées par molécule (1.7 MB)

### Pour reprendre l'implémentation à la prochaine session

> **🚀 TRIGGER EN LANGAGE NATUREL — IMPORTANT** : si JC dit *« lance les subagents »*, *« lance le plan »*, *« attaque l'implémentation »*, *« passe à l'exécution »* ou tout équivalent, **exécute automatiquement la commande ci-dessous** sans demander de confirmation supplémentaire. JC n'a pas à retenir la commande exacte.

**Commande à exécuter** (subagent-driven, recommandé) :

```
/superpowers:subagent-driven-development docs/superpowers/plans/2026-04-27-metaboscope-modules.md
```

Le skill dispatchera un sous-agent par tâche T1 → T22 avec checkpoint review entre chacune. JC peut interrompre à n'importe quel moment, le plan est conçu pour reprendre cold.

**Variante (inline, batch)** : si JC dit *« lance en mode inline »* ou *« inline »* :

```
/superpowers:executing-plans docs/superpowers/plans/2026-04-27-metaboscope-modules.md
```

Exécution batch dans la session courante avec checkpoints.

### Ordre d'attaque par défaut (Approche B atomique pure — sécurité d'abord)

| Session | Tâches | Description | Effort |
|---|---|---|---|
| 1 | T1-T6 | Filet sécurité (script validation + tests data + tests scoring) + briques utils + Badge + Accordion | 2-3h |
| 2 | T7-T9 | AutoComplete + SourceLink + EmptyState + extension types `source: string | string[]` | 1-2h |
| 3 | T10-T12 | SummaryHeader + 11 sections accordéon + MoleculeCard + tests smoke | 3-4h |
| 4 | T13-T17 | Disclaimer (Context+Gate+Modal) + Cart Context + SearchPage + MoleculePage + routing | 3-4h |
| 5 | T18 | InteractionPage refactor (panier + 5 cartes PD + paires PK + PGx rappel) | 2h |
| 6 | T19 | AtlasPage + helper `buildAtlasIndex()` | 1-2h |
| 7 | T20-T22 | T20 OPTIONNELLE (parser cheerio CBIP) + T21 compare-sources + acceptation finale | 2-3h |

### 🎨 Chemin court "UI visible le plus vite possible" (alternative)

> Si JC dit *« je veux voir une UI rapidement »*, *« montre-moi un truc qui tourne »*, *« vite un visuel »* ou équivalent — **utiliser cet ordre alternatif**, qui retarde les tests à la fin pour produire du rendu navigable au plus tôt :

**Sprint 1 — Premier UI navigable (~3-4h)** :
- T4 `utils/labels.ts` (mapping codes PD + sources + couleurs)
- T5 `Badge` (composant visible immédiatement)
- T6 `Accordion`
- T7 `AutoComplete` (input recherche fonctionnel)
- T8 `SourceLink` + `EmptyState`
- T13 `DisclaimerContext` + `DisclaimerModal` + `DisclaimerGate` (sinon l'app reste bloquée)
- T14 `CartContext` (sinon crash sur `useCart`)
- T17 abrégé : `App.tsx` + `Layout.tsx` 3 onglets + suppression `SubstancesPage` (avec `MoleculePage`/`AtlasPage` en stubs minimaux)
- T15 `SearchPage` (avec autocomplete fonctionnel, mais le clic peut juste ouvrir un placeholder pour l'instant)

→ **Résultat** : modale Disclaimer → page d'accueil → onglet Recherche avec autocomplete + cartes-résultat sélectionnables → nav 3 onglets fonctionnelle.

**Sprint 2 — Fiches consultables (~3-4h)** :
- T10 `SummaryHeader` (bandeau résumé fonctionnel)
- T11 les 11 sections accordéon (`SectionPhase1Cyp` à `SectionSources`)
- T12 `MoleculeCard` (assemblage)
- T16 `MoleculePage` (route `/search/:id`)

→ **Résultat** : clic sur résultat → fiche détaillée avec accordéons + bouton "Ajouter au comparateur" fonctionnel.

**Sprint 3 — Module 2 visible (~2h)** :
- T18 `InteractionPage` refactor complet

→ **Résultat** : vérificateur d'interactions opérationnel.

**Sprint 4 — Atlas (~1-2h)** :
- T19 `AtlasPage` + `buildAtlasIndex()`

→ **Résultat** : tous les 3 modules visibles et connectés.

**Sprint 5 — Filet de sécurité (~2h, en dette technique short-term)** :
- T1 script validation JSON
- T2 tests data
- T3 tests scoring
- T9 mise à jour types `source: string | string[]`

**Sprint 6 — Multi-sources (~1h grâce à l'audit pré-généré)** :
- T20 (skip — extraction GPT déjà faite)
- T21 wrapper consommant `data_hug_cbip/metaboscope_audit_cbip_vs_hug_*` → rapport markdown
- T22 acceptation finale (build prod + parcours bout en bout)

**⚠️ Trade-off du chemin court** : pendant les Sprints 1-4, les tests `tests/scoring.test.ts` n'existent pas encore. Si un bug subtil dans `scoreQT()` se cache, il sera découvert via l'UI plutôt que par un test. C'est acceptable pour un solo dev qui veut voir tourner vite, mais le Sprint 5 n'est **pas** négociable — il doit suivre les Sprints 1-4 sans report.

### Notes techniques importantes pour la prochaine session

- **`hug_2020_gpt.json` n'a pas été produit** (un seul LLM extracteur sur HUG, pas de cross-validation inter-LLM possible). Le script T21 `compare-sources.mjs` est robuste à l'absence et tournera avec les sources disponibles.
- **CBIP est plus exhaustif que HUG en volume** (472 vs 245 mol.) mais sans rang substrat (limitation du source CBIP). Pour le rang majeur/mineur → privilégier HUG-Opus.
- **L'audit V3 CBIP doit être consommé en pré-filtrage** dans le script T21 — il signale 45 divergences internes au CBIP source (déduplications par graphie + incohérences table CYP ≠ pivot). Le script T21 actuel intègre ce traitement.
- **Helpers métier déjà prêts** : `src/utils/scoring.ts` (5 scores PD + paires PK), `src/utils/pgx.ts`, `src/data/index.ts` (`searchMolecules`, `ALL_MOLECULES`, `MOLECULES_BY_ID`). Le plan les consomme sans les modifier.
- **Pas de hook git pre-commit ni CI en v1** — décision YAGNI. À ajouter en v1.1 si besoin.

### Référence wiki-brain

Pages associées dans `C:/Users/jclui/Documents/ObsidianVaults/wiki-brain/wiki/` :
- `[[MetaboScope architecture v1]]` — synthèse architecturale durable + évaluation qualité sources
- `[[MoE multi-LLM extraction]]` — pattern méthodologique réutilisable

---

## 17. Roadmap post-v1.0 (synthèse pour la suite)

> **v1.0 close au 2026-04-29.** 22 tâches du plan livrées sur 7 sessions, 7 commits par session en moyenne (filets de sécurité + briques + 3 modules + multi-source). 0 backend, 0 télémétrie, 0 dépendance hors liste blanche. App PWA navigable hors-ligne après premier chargement.

### v1.0 — livré (jalon actuel)

- **Module 1 — Recherche/Fiche** : autocomplete unifié médicaments + drogues + NPS, fiche détaillée avec bandeau résumé + 11 sections accordéon, deep-link `?openSection=` pour ouvrir une section depuis l'extérieur.
- **Module 2 — Vérificateur** : panier 2-6 molécules, 5 cartes PD cumulées (QT/sérotonine/respi/ACB/seuil-ep) avec sévérité 4-niveaux, paires PK détectées + interactions documentées, rappel PGx CPIC niveau A, sources consolidées.
- **Module 3 — Atlas** : index dynamique CYP/UGT/Transporteurs depuis les 147 molécules, tri naturel des isoformes, lien direct vers fiche.
- **DisclaimerGate** versionné (localStorage `metaboscope.disclaimer.accepted_v1`), bump = re-acceptation forcée.
- **Multi-source audit** (T21) : `npm run compare:sources` produit `docs/audits/cbip-hug-divergences-{date}.{md,json}` (gitignored, régénérable) — 508 union CBIP × HUG, 57 recouvrement avec JSON, 451 candidats v1.1, 30 divergences high-severity.

### v1.0.1 — dette technique immédiate (1-2 jours, pas de feature)

Détaillée dans §16 sous-section « Veille v1.0.1 ». Synthèse :

1. **Normaliser ~150 codes PD hors vocabulaire** (`src/data/warnings.md` §2) — diacritiques + ad-hoc → ASCII canonique.
2. **Supprimer ~25 sources LLM internes** (`Gemini DR X`, `métaboscope GPT 3`, etc., `warnings.md` §4) — remplacer par `zone_grise: true` au niveau cellule.
3. **Cross-valider 13 molécules à source unique** (`warnings.md` §4) — récupérer un préfixe officiel.
4. **Confirmer statut réglementaire FR** sur les NPS récents (`warnings.md` §9.3).
5. **Ajouter `aria-label` clinicien** sur la badge cart Interactions (M-5 du review T17) et `aria-pressed` partout où il manque (M-4 du review T15, déjà appliqué partiellement).
6. **Documenter la divergence Severity** (scoring.ts 4 valeurs vs labels.ts 5 valeurs) en commentaire en-tête des deux fichiers.
7. **Élargir la regex Atlas transporteurs** (M-3 review T19) — ajouter OAT, MRP, NTCP, OST, BSEP.
8. **Smoke test `buildAtlasIndex`** (M-6 review T19) — 5 cas, fichier `tests/atlas.test.ts`.
9. **Empêcher la ré-introduction** du double-padding `pb-24` enfant + Layout (M-4 review T15, M-5 review T18).
10. **Élargir filtre `meds/drogues/nps` SearchPage** (I-1 review T15) — soit étendre la regex, soit ajouter un champ `bucket` dans le schéma JSON et y mapper une fois pour toutes.

### v1.1 — extension multi-source (1-2 semaines, semi-feature)

1. **Ingestion des 451 candidats CBIP/HUG** dans `src/data/molecules/molecules_extension_cbip_hug.json` — sources préfixées `HUG:` ou `CBIP:`, niveau de preuve `IVH-O`, `zone_grise: true` sur les cellules monosourcées.
2. **Arbitrage manuel des 30 divergences high-severity** (consigner les décisions dans `src/data/warnings.md`).
3. **Multi-sourçage cellule par cellule** : `source: string[]` activé partout où HUG ET CBIP corroborent un fait — augmente la confiance affichée en UI.
4. **Saisie de génotype patient (CYP2D6/2C19/2B6)** : réintroduire `crossPgxWithGenotype` (déjà en place dans `src/utils/pgx.ts`) avec un toggle dans la fiche molécule pour croiser le génotype avec la recommandation CPIC.
5. **Hook git pre-commit** + CI GitHub Actions (validate + tests + build) — décision reportée v1.0 (YAGNI), à reconsidérer en v1.1 si la fréquence d'ingestion data justifie le filet.
6. **Code-splitting du bundle** (manualChunks Vite) si gzip dépasse 200 KiB après ingestion.

### v2 — exploratoire (pas avant validation usage AP-HP)

- Cache utilisateur via Dexie (déjà installé, jamais utilisé en v1) — historique des requêtes locales sans PHI.
- Mode "comparateur sauvegardé" — sérialiser un panier dans une URL partageable (sans PHI).
- Ingestion ANSM / FDA labels comme 4ème source.
- Variantes d'affichage par profil utilisateur (psychiatre / pharmacologue / urgentiste).
