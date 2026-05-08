# Design — MétaboScope v1.0 : Modules de l'application

> Spec issu d'une session brainstorming avec JC le 2026-04-27.
> Statut : design validé, prêt pour `writing-plans`.

---

## 1. Contexte et objectif

PWA d'aide à la décision clinique pour les pharmaciens cliniciens et addictologues USCA/ELSA de la Pitié-Salpêtrière. Le scaffolding (React 18 + Vite 5 + TS + Tailwind + PWA + Dexie) est en place ainsi que les helpers métier (`scoring.ts`, `pgx.ts`, `searchMolecules`) et 77 molécules consolidées dans 5 fichiers JSON conformes au schéma v2.

**Aucun module UI n'est encore livré.** Cette spec décrit la livraison v1 : 3 onglets (Recherche/Fiche, Interactions, Atlas), index unifié médicaments + drogues + NPS, scoring PD cumulé, et un script de comparaison multi-sources HUG/CBIP/JSON existants.

---

## 2. Périmètre v1.0 vs reporté

### Inclus en v1.0

- 3 onglets fonctionnels (Recherche/Fiche, Interactions, Atlas)
- Recherche unifiée sur les 77 molécules (médicaments + drogues + NPS dans un index commun)
- Fiche molécule : bandeau résumé fixe + 11 sections en accordéon plié par défaut
- Vérificateur d'interactions : 5 alertes PD cumulées (QTc / Sérotonine / Triade respiratoire / ACB / Seuil épileptogène) + paires PK + PGx affichée sans génotype
- Atlas dynamique : sous-onglets CYP / UGT / Transporteurs, agrégé depuis les 77 molécules
- DisclaimerGate au premier lancement (versionné)
- Script `compare-sources.mjs` pour MoE multi-sources (HUG + CBIP + JSON) sur les 35 mol. en recouvrement
- Tests minimaux : `data.test.ts`, `scoring.test.ts`, `MoleculeCard.test.tsx`

### Reporté en v1.1+

- Saisie de génotype patient + croisement PGx personnalisé (`crossPgxWithGenotype` reste sur l'étagère)
- Schéma visuel des voies métaboliques par molécule (diagramme par molécule)
- Ingestion massive CBIP/HUG (~200 nouvelles molécules) + complément CredibleMeds
- Tests d'intégration `InteractionPage.test.tsx`, e2e Playwright, axe-core a11y
- Hook git pre-commit / GitHub Actions

---

## 3. Architecture globale

### 3.1 Structure de dossiers (delta sur l'existant)

```
src/
├── App.tsx                          ← MODIF : routes /search, /search/:id, /interactions, /atlas
├── main.tsx                         ← MODIF : wrap dans <DisclaimerGate>
│
├── context/                         ← NOUVEAU
│   ├── CartContext.tsx              ← état panier (Set<string> + add/remove/clear)
│   └── DisclaimerContext.tsx        ← flag accepté + lecture localStorage versionnée
│
├── components/
│   ├── Layout.tsx                   ← MODIF : 3 onglets bottom (mobile) + horizontal (desktop)
│   ├── Disclaimer.tsx               ← existant — texte exporté
│   ├── DisclaimerGate.tsx           ← NOUVEAU — modale 1ère visite
│   ├── DisclaimerModal.tsx          ← NOUVEAU — modale réutilisable (gate + lien permanent)
│   ├── OfflineBanner.tsx            ← existant
│   │
│   ├── ui/                          ← NOUVEAU — briques atomiques agnostiques du domaine
│   │   ├── Badge.tsx                ← badge alerte PD coloré (utilise pdAlertLabel)
│   │   ├── Accordion.tsx            ← section pliable
│   │   ├── AutoComplete.tsx         ← input + dropdown, consomme searchMolecules
│   │   ├── SourceLink.tsx           ← <a> → URL externe selon préfixe source
│   │   └── EmptyState.tsx           ← "aucun résultat" / "panier vide" générique
│   │
│   └── molecule/                    ← NOUVEAU — composants spécifiques au domaine
│       ├── MoleculeCard.tsx         ← assemblage SummaryHeader + 11 sections
│       ├── SummaryHeader.tsx        ← bandeau résumé fixe
│       ├── SectionPhase1Cyp.tsx
│       ├── SectionPhase1NonCyp.tsx
│       ├── SectionPhase2.tsx
│       ├── SectionTransporteurs.tsx
│       ├── SectionInhibiteur.tsx
│       ├── SectionInducteur.tsx
│       ├── SectionPgx.tsx
│       ├── SectionInteractions.tsx
│       ├── SectionAlertesPd.tsx
│       ├── SectionZoneGrise.tsx
│       └── SectionSources.tsx
│
├── pages/
│   ├── HomePage.tsx                 ← existant — landing
│   ├── SearchPage.tsx               ← NOUVEAU
│   ├── MoleculePage.tsx             ← NOUVEAU
│   ├── InteractionPage.tsx          ← REFACTOR complet
│   ├── AtlasPage.tsx                ← NOUVEAU
│   └── SubstancesPage.tsx           ← SUPPRIMÉ (route + lien retirés)
│
├── utils/
│   ├── scoring.ts                   ← existant
│   ├── pgx.ts                       ← existant (crossPgxWithGenotype dormant en v1)
│   ├── labels.ts                    ← NOUVEAU — pdAlertLabel, sourceToHref, severityColor
│   └── atlas.ts                     ← NOUVEAU — buildAtlasIndex
│
├── data/
│   ├── index.ts                     ← existant
│   └── molecules/                   ← existants 5 JSON
│
└── types/
    └── molecule.ts                  ← MODIF — autoriser source: string | string[]

scripts/                             ← NOUVEAU
├── validate-molecules.mjs           ← invariants schéma + qualité
├── parse-cbip.mjs                   ← extraction HTML CBIP via cheerio
└── compare-sources.mjs              ← MoE HUG × CBIP × JSON existants

tests/
├── setup.ts                         ← existant
├── data.test.ts                     ← NOUVEAU
├── scoring.test.ts                  ← NOUVEAU
└── MoleculeCard.test.tsx            ← NOUVEAU

docs/
├── superpowers/specs/               ← contient cette spec
└── audits/                          ← rapports compare-sources.mjs (générés)
```

### 3.2 État global

Deux Contexts React (pas de Zustand, overkill ici).

```typescript
// CartContext — panier d'analyse Module 2
interface CartContextValue {
  ids: Set<string>;
  add: (id: string) => void;       // additif (décision panier 6.1=A)
  remove: (id: string) => void;
  clear: () => void;
  size: number;                     // utilisé pour badge sur onglet Interactions
}
// Persistance : mémoire seule (décision 6.2=A) — vidé à la fermeture
// Soft limit : 6 (décision 6.3=B) — avertissement au 7e, pas de blocage

// DisclaimerContext
interface DisclaimerContextValue {
  accepted: boolean;
  acceptedVersion: string | null;
  accept: () => void;
}
const DISCLAIMER_VERSION = '1.0';
// Persistance : localStorage clé "metaboscope.disclaimer.accepted_v1"
// Re-prompt automatique quand DISCLAIMER_VERSION change

// Hooks publics exportés depuis chaque Context
export function useCart(): CartContextValue;          // depuis CartContext.tsx
export function useDisclaimer(): DisclaimerContextValue;  // depuis DisclaimerContext.tsx
```

### 3.3 Routing

```typescript
<Routes>
  <Route element={<Layout />}>
    <Route path="/" element={<HomePage />} />
    <Route path="/search" element={<SearchPage />} />
    <Route path="/search/:id" element={<MoleculePage />} />
    <Route path="/interactions" element={<InteractionPage />} />
    <Route path="/atlas" element={<AtlasPage />} />
    <Route path="*" element={<Navigate to="/search" replace />} />
  </Route>
</Routes>
```

Transitions Module 1 → Module 2 :
- Bouton "Comparer avec…" sur `MoleculePage` → `cart.add(id); navigate('/interactions')`
- Multi-select sur `SearchPage` (cases à cocher) → `ids.forEach(cart.add); navigate('/interactions')`

### 3.4 Service worker

Aucune modification de `vite.config.ts`. La `runtimeCaching` actuelle préserve les `*.json` molécules en `CacheFirst`. Vérifier seulement que le SW préfetche l'app shell complet à l'install.

---

## 4. Module 1 — Recherche + Fiche

### 4.1 `SearchPage` (route `/search`)

Comportement :
- Champ `<AutoComplete>` en haut, debounce 150 ms, consomme `searchMolecules()`
- Résultats en cartes verticales compactes (DCI + classe + statut + 2-3 badges PD critiques)
- Chips toggle de filtre par classe au-dessus des résultats : *Tous*, *Médicaments*, *Drogues classiques*, *NPS* (regex sur `classe`)
- Mode "Sélection" : toggle qui transforme les cartes en cartes-checkbox
- En mode sélection, footer sticky : `[ Comparer N molécules → ]`
  - désactivé si `N < 2`
  - avertissement ambre si `N > 6` (par décision 6.3=B)
- Clic sur carte (hors mode sélection) → `navigate('/search/:id', { state: { from: location.search }})`
- État vide initial : `<EmptyState>` avec suggestion *« Tape un DCI, un nom commercial, ou un nom de rue NPS »*

### 4.2 `MoleculePage` (route `/search/:id`)

Comportement :
- Lookup `MOLECULES_BY_ID[id]` ; si absent → `<Navigate to="/search" replace />`
- Affiche `<MoleculeCard molecule={...} />`
- Bouton "Retour" préserve la query précédente via `location.state.from`
- **Query param `?openSection=<sectionId>`** : si présent, l'accordéon correspondant est ouvert au mount. IDs reconnus : `phase1Cyp`, `phase1NonCyp`, `phase2`, `transporteurs`, `inhibiteur`, `inducteur`, `pgx`, `interactions`, `alertesPd`, `zoneGrise`, `sources`. Utilisé par les liens depuis Module 2 (ex. `/search/ad_ssri_sertra?openSection=pgx` ouvre directement la section pharmacogénétique).

### 4.3 `<MoleculeCard>` — bandeau résumé

Toujours visible. Source de vérité de la lecture en 2 secondes.

```
┌──────────────────────────────────────────────────────────────┐
│  Sertraline                                       [Liste I]  │  ← Identité
│  Antidépresseur ISRS                                          │
│  Synonymes : Zoloft®                                          │
├──────────────────────────────────────────────────────────────┤
│  ⚠️  ALERTES PD                                                │  ← Alertes (libellés clairs)
│  🟡 QTc — risque conditionnel                                 │
│  🟠 Syndrome sérotoninergique                                 │
│  🟡 Abaisse seuil épileptogène                                │
│  🟢 Charge anticholinergique : faible (1/3)                  │
├──────────────────────────────────────────────────────────────┤
│  💊  PROFIL PK                                                 │  ← Substrats majeur+mineur, inh, ind
│  Substrat majeur : CYP2C19, CYP2B6                           │
│  Substrat mineur : CYP2D6, CYP3A4                             │
│  Inhibiteur : CYP2D6 (modéré), CYP2B6 (faible)               │
│  Inducteur : —                                                │
│  Métabolite actif : nordésméthylsertraline (faible)           │
├──────────────────────────────────────────────────────────────┤
│  🧬  PHARMACOGÉNÉTIQUE                                          │  ← Niveau CPIC max
│  CYP2C19 — CPIC niveau A (recommandation actionnable)         │
├──────────────────────────────────────────────────────────────┤
│  Dernière maj : 2026-04                                       │
│  [ + Ajouter au comparateur ]                                 │
└──────────────────────────────────────────────────────────────┘
```

### 4.4 `<MoleculeCard>` — sections accordéon

Toutes pliées par défaut (état `Set<string>` vide au mount). Ordre :

1. Phase I CYP
2. Phase I non-CYP
3. Phase II
4. Transporteurs
5. Inhibiteur
6. Inducteur
7. Pharmacogénétique détaillée
8. Interactions spécifiques
9. Alertes PD détaillées
10. Zone grise (compteur + liste des cellules `zone_grise: true`)
11. Sources (PMID/DOI/CPIC/HUG/CBIP dédupliqués cliquables, alphabétique)

### 4.5 Mapping codes → libellés (fichier `utils/labels.ts`)

```typescript
const PD_LABELS: Record<string, { label: string; severity: Severity }> = {
  'QT-KR': { label: 'QTc — risque connu', severity: 'red' },
  'QT-PR': { label: 'QTc — risque possible', severity: 'amber' },
  'QT-CR': { label: 'QTc — risque conditionnel', severity: 'yellow' },
  'QT-SR': { label: 'QTc — risque spécifique', severity: 'neutral' },
  'sero': { label: 'Syndrome sérotoninergique', severity: 'red' },
  'sero-modere': { label: 'Risque sérotoninergique modéré', severity: 'amber' },
  'sero-faible': { label: 'Risque sérotoninergique faible', severity: 'yellow' },
  'resp': { label: 'Dépression respiratoire', severity: 'red' },
  'ACB-1': { label: 'Charge anticholinergique faible (1/3)', severity: 'yellow' },
  'ACB-2': { label: 'Charge anticholinergique modérée (2/3)', severity: 'amber' },
  'ACB-3': { label: 'Charge anticholinergique forte (3/3)', severity: 'red' },
  'seuil-ep': { label: 'Abaisse le seuil épileptogène', severity: 'amber' },
  'seuil-ep-sevrage': { label: 'Abaisse le seuil à l\'arrêt', severity: 'amber' },
  'hepatotox': { label: 'Hépatotoxicité', severity: 'amber' },
  'nephrotox': { label: 'Néphrotoxicité', severity: 'amber' },
  'myocardite': { label: 'Risque de myocardite', severity: 'amber' },
  'CI-IMAO': { label: 'Contre-indication IMAO', severity: 'red' },
  'CI-fluvoxamine': { label: 'Contre-indication fluvoxamine', severity: 'red' },
  'CI-sildenafil': { label: 'Contre-indication sildénafil', severity: 'red' },
  'CI-grossesse': { label: 'Contre-indication grossesse', severity: 'red' },
  'teratogene': { label: 'Tératogène', severity: 'red' },
  'SJS-Lyell-HLA-B1502': { label: 'SJS/Lyell — HLA-B*1502', severity: 'red' },
  'DRESS-HLA-A3101': { label: 'DRESS — HLA-A*3101', severity: 'amber' },
  'fenetre-etroite': { label: 'Marge thérapeutique étroite', severity: 'amber' },
  'mesusage-documented': { label: 'Mésusage documenté', severity: 'amber' },
  'dependance-mu-opioide': { label: 'Dépendance μ-opioïde', severity: 'amber' },
  'myelopathie-B12': { label: 'Myélopathie B12', severity: 'amber' },
};
export function pdAlertLabel(code: string) { return PD_LABELS[code] ?? { label: code, severity: 'neutral' }; }
```

### 4.6 Mapping sources → URL (fichier `utils/labels.ts`)

```typescript
export function sourceToHref(src: string): string | null {
  if (src.startsWith('PMID:')) return `https://pubmed.ncbi.nlm.nih.gov/${src.slice(5)}/`;
  if (src.startsWith('DOI:')) return `https://doi.org/${src.slice(4)}`;
  if (src.startsWith('CPIC:doi:')) return `https://doi.org/${src.slice(9)}`;
  if (src.startsWith('DPWG:PMID:')) return `https://pubmed.ncbi.nlm.nih.gov/${src.slice(10)}/`;
  if (src.startsWith('StatPearls:')) return `https://www.ncbi.nlm.nih.gov/books/${src.slice(11)}/`;
  if (src.startsWith('CredibleMeds:')) return 'https://crediblemeds.org/';
  if (src.startsWith('HUG:')) return 'https://www.pharmacoclin.ch/';
  if (src.startsWith('CBIP:')) return 'https://www.cbip.be/fr/chapters/1?frag=9990243';
  // FDA: / EMA: / ANSM: → pas d'URL stable, afficher le label brut
  return null;
}
```

### 4.7 Couleurs par sévérité (cohérence palette navy/teal/amber/red)

| Sévérité | Hex | Usage |
|---|---|---|
| `red` | `#dc2626` | KR, contre-indication, tératogène, ACB-3, sero (triade), resp |
| `amber` | `#f59e0b` | PR, sero-modéré, ACB-2, seuil-ep, mésusage, fenêtre étroite, hépatotox/néphrotox isolée |
| `yellow` | `#fbbf24` | CR, sero-faible, ACB-1 |
| `green` | `#10b981` | SR, ACB-0, absence de risque |
| `neutral` | `gray-400` | non applicable / absent |

---

## 5. Module 2 — Vérificateur d'interactions

### 5.1 `InteractionPage` (route `/interactions`)

Layout vertical, ordre validé (décision 9.3) :

```
1. Panier d'analyse              (chips supprimables + bouton "+ ajouter")
2. Paires PK documentées         (detectPkPairs + findDocumentedInteractions)
3. Alertes pharmacodynamiques    (5 cartes : QTc / Séro / Triade resp / ACB / Seuil-ep)
4. Pharmacogénétique             (rappel — molécules avec niveau CPIC A)
5. Sources consolidées           (accordéon, dédup PMID/DOI/HUG/CBIP)
```

### 5.2 Composant `<PdAlertCard>`

Réutilisable pour les 5 alertes PD.

```typescript
interface PdAlertCardProps {
  title: string;
  severity: Severity;             // 'red' | 'amber' | 'yellow' | 'green' | 'neutral'
  score?: number;
  threshold?: string;             // ex. "≥ 3 = risque significatif"
  contributors: { molecule: string; weight: number; label: string }[];
  conduct?: string;               // ex. "ECG préalable, surveillance"
  emptyMessage?: string;          // si aucun contributeur
}
```

### 5.3 Mapping helpers existants → cartes

| Carte | Helper `scoring.ts` | Seuils |
|---|---|---|
| QTc cumulé | `scoreQT(molecules)` | rouge si total ≥ 3 ou ≥ 2 KR |
| Sérotonine | `scoreSero(molecules)` | rouge si triade (ISRS/IRSNA/IMAO/opioïde séro) |
| Triade respiratoire | `scoreResp(molecules)` | rouge si BZD + opioïde + autre dépresseur CNS |
| ACB | `scoreAcb(molecules)` | ambre ≥ 3 / rouge ≥ 6 |
| Seuil-ep | `scoreSeuilEp(molecules)` | ambre si ≥ 2 contributeurs faibles ou 1 fort |
| Paires PK | `detectPkPairs(molecules)` + `findDocumentedInteractions(molecules)` | — |

### 5.4 Section "Pharmacogénétique" (sans génotype patient)

Pour chaque molécule du panier ayant `pharmacogenetique[]` avec `niveau_cpic === 'A'` :

> *« {DCI} a une recommandation CPIC niveau A pour {gène}. Voir la fiche détaillée pour la conduite exacte. »*

Lien direct vers `/search/:id?openSection=pgx`.

### 5.5 Section "Sources consolidées"

```typescript
const allSources = new Set<string>();
for (const m of cart.molecules) {
  m.sources_principales.forEach(s => allSources.add(s));
  // + sources des cellules individuelles (multi-source possible : string | string[])
  collectCellSources(m).forEach(s => allSources.add(s));
}
// Rendu : liste alphabétique de <SourceLink> dédupliqués
```

---

## 6. Module 3 — Atlas (CYP / UGT / Transporteurs)

### 6.1 `AtlasPage` (route `/atlas`)

3 sous-onglets internes (décision 10.2=A) : **CYP / UGT / Transporteurs**.

```
[ CYP ] [ UGT ] [ Transporteurs ]    ← sous-onglets

CYP1A2
  Substrats majeurs     : clozapine, olanzapine, ...
  Substrats mineurs     : duloxétine, ...
  Inhibiteurs forts     : fluvoxamine, ...
  Inhibiteurs modérés   : ...
  Inducteurs            : carbamazépine, tabac, ...

CYP2B6
  ...
```

Chaque DCI affiché = lien vers `/search/:id` (drill-down).

### 6.2 Helper `buildAtlasIndex()` (fichier `utils/atlas.ts`)

```typescript
type AtlasCategory = 'cyp' | 'ugt' | 'transporteurs';

interface AtlasEntry {
  substratsMajeurs: Molecule[];
  substratsMineurs: Molecule[];
  inhibiteursForts: Molecule[];
  inhibiteursModeres: Molecule[];
  inhibiteursFaibles: Molecule[];
  inducteurs: Molecule[];
}

type AtlasIndex = Record<string, AtlasEntry>;

export function buildAtlasIndex(molecules: Molecule[], category: AtlasCategory): AtlasIndex;
```

Calcul côté client au mount, mémoïsé via `useMemo`. Coût négligeable sur 77 molécules.

### 6.3 Liste dynamique des isoformes

Construite depuis `ALL_MOLECULES` (pas de hardcoded). Si une molécule cite "CYP2J2" comme voie mineure, CYP2J2 apparaît automatiquement. Évite la maintenance manuelle.

---

## 7. Disclaimer + first-use

### 7.1 `<DisclaimerGate>`

Wrappe `<App>` dans `main.tsx`.

```typescript
function DisclaimerGate({ children }) {
  const { accepted } = useDisclaimer();
  if (!accepted) return <DisclaimerModal mode="gate" />;
  return children;
}
```

### 7.2 `<DisclaimerModal>`

- Modale bloquante (overlay opaque, pas de fermeture par échap/clic extérieur en mode gate)
- Mode "lecture" autorisé (depuis lien permanent) avec bouton "Fermer"
- Affiche `DISCLAIMER_TEXT` exporté depuis `Disclaimer.tsx`
- Mention version : *« MétaboScope v0.x — base de connaissance YYYY-MM »*
- Bouton gate : `[ J'ai lu et j'accepte ]` → `accept()` → `localStorage.setItem('metaboscope.disclaimer.accepted_v1', JSON.stringify({ version: DISCLAIMER_VERSION, date: ISO }))`

### 7.3 Lien permanent

- Footer du `<Layout>` : lien `[ Disclaimer ]` qui ouvre `<DisclaimerModal mode="readonly" />`
- Pied de chaque `<MoleculeCard>` : 1 ligne grise discrète *« Aide à la décision — non substitutive — voir Disclaimer »* (lien)

### 7.4 Versioning

```typescript
const DISCLAIMER_VERSION = '1.0';
```

Bumper la constante → re-prompt automatique à la prochaine ouverture.

---

## 8. Tests + validation des données

### 8.1 `scripts/validate-molecules.mjs`

Script Node ES module, lance `npm run validate:molecules`. Vérifie sur les 5 JSON :

- Tous les fichiers parsent en JSON valide
- Wrapper `{ _metadata, molecules: [] }` présent
- Unicité globale des `id` (déduplication inter-fichiers)
- Champs obligatoires : `id`, `nom_dci`, `classe`, `statut_fr`, `derniere_maj`
- `interactions_specifiques` jamais vide (CLAUDE.md §9 invariant 3)
- `sources_principales` ne contient pas `"ND"` (CLAUDE.md §9 invariant 2)
- Format sources : `^(PMID|DOI|FDA|EMA|ANSM|CredibleMeds|CPIC|DPWG|StatPearls|HUG|CBIP):`
- `derniere_maj` au format `^\d{4}-\d{2}$`
- Codes `alertes_pd` dans le vocabulaire contrôlé (`QT-KR|QT-PR|...`)

Sortie : exit code 0 si OK, code 1 + rapport groupé par fichier sinon.

### 8.2 `tests/data.test.ts`

```typescript
describe('Données molécules', () => {
  it('charge les 5 fichiers JSON sans erreur', () => { ... });
  it('totalise 77 molécules (sentinelle)', () => { ... });
  it('garantit l\'unicité globale des id', () => { ... });
  it('garantit interactions_specifiques jamais vides', () => { ... });
  it('rejette ND dans sources_principales', () => { ... });
  it('valide le format des sources', () => { ... });
});
```

### 8.3 `tests/scoring.test.ts`

Table de cas pour chaque score :

```typescript
describe('scoreQT', () => {
  it('rouge si KR + PR (score 5)', ...);
  it('rouge si 2 × KR', ...);
  it('rouge si total ≥ 3 (PR + CR)', ...);
  it('ambre si CR + SR (total 2)', ...);
  it('neutre si une seule molécule SR', ...);
});
describe('scoreSero', () => { /* triade ISRS+IMAO, etc. */ });
describe('scoreResp', () => { /* BZD + opioïde + alcool */ });
describe('scoreAcb', () => { /* ≥3 ambre, ≥6 rouge */ });
describe('scoreSeuilEp', () => { ... });
describe('detectPkPairs', () => { ... });
describe('pdAlertLabel', () => { /* mapping codes → labels FR */ });
```

### 8.4 `tests/MoleculeCard.test.tsx`

```typescript
describe('<MoleculeCard>', () => {
  it('affiche le bandeau résumé', () => { /* render + getByText DCI */ });
  it('garde tous les accordéons pliés au mount', ...);
  it('affiche les badges PD avec libellés clairs', () => { /* getByText "QTc — risque..." */ });
  it('rend sans crash sur une molécule mock', ...);
});
```

### 8.5 `package.json` — scripts à ajouter

```json
"scripts": {
  "validate:molecules": "node scripts/validate-molecules.mjs",
  "parse:cbip": "node scripts/parse-cbip.mjs",
  "compare:sources": "node scripts/compare-sources.mjs",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

---

## 9. Extension multi-sources (HUG / CBIP) — script MoE

### 9.1 Stratégie

Trois sources institutionnelles disponibles localement :

| Source | Format | Volume | Avantages |
|---|---|---|---|
| **CBIP** (`CBIP _ Interactions des médicaments.html`) | HTML structuré | ~250 mol. | Parsable cheerio, à jour 2024+ |
| **HUG 2020** (`Doc HUG 2020.pdf`) | PDF (cases colorées) | ~270 mol. | Cross-validation |
| **CredibleMeds** | Web | torsadogénicité | Obligatoire pour QT |

Plan d'utilisation :
- **CBIP** = source primaire d'extension (parser HTML automatique → 1 session)
- **HUG** = source de corroboration secondaire (extraction Gemini Pro 2.5 en parallèle)
- **CredibleMeds** = complément obligatoire pour les alertes QT lors de l'ingestion v1.1

### 9.2 Algorithme MoE (script `compare-sources.mjs`)

```
Pour chaque molécule M ∈ recouvrement (CBIP ∩ HUG ∩ JSON_actuel):
  Pour chaque axe ∈ {phase1_cyp, inhibiteur, inducteur, transporteurs[Pgp]}:
    Pour chaque cellule (isoforme, rang) :
      Si CBIP ≡ HUG ≡ JSON :
        → CORROBORATION (ajouter sources HUG/CBIP en multi-source)
      Si CBIP ≡ HUG ≠ JSON :
        → DIVERGENCE FORTE (deux sources institutionnelles vs JSON)
        → flag rouge pour décision humaine
      Si CBIP ≠ HUG :
        → DIVERGENCE INSTITUTIONNELLE (à arbitrer)
      Si HUG/CBIP cite voie absente JSON :
        → ENRICHISSEMENT proposé
```

### 9.3 Sortie du script

`docs/audits/cbip-hug-divergences-{YYYY-MM-DD}.md` avec 3 sections :

1. **Corroborations** (cellules confirmées par toutes les sources — ajout multi-source automatique proposé)
2. **Divergences à arbitrer** (incohérences inter-sources, requièrent décision humaine)
3. **Enrichissements proposés** (voies absentes du JSON mais documentées HUG/CBIP)

### 9.4 Évolutions schéma v2

Mise à jour `DATA_SCHEMA.md` pour autoriser le multi-sourçage cellule par cellule :

```diff
   "phase1_cyp": [
     {
       "isoforme": "CYP2D6",
       "rang": "majeur | mineur | trace",
       "produit": "string",
       "preuve": "IVH-C | IVH-O | CAS | FOR | IVA | IVT | AN | ND",
-      "source": "PMID:XXXXXXX | DOI:... | FDA:... | StatPearls:..."
+      "source": "string | string[]"
     }
   ],
```

Nouvelles entrées au vocabulaire des sources :

```
HUG:carte_cytochromes_2020         ← référence HUG Genève (institutionnelle, IVH-O)
CBIP:interactions_chap1_2024       ← Centre Belge d'Information Pharmacothérapeutique
HUG:pharmacoclin_dynamic           ← future ressource en ligne (si export récupéré)
```

Niveau de preuve par défaut pour HUG / CBIP : `IVH-O` (consensus expert institutionnel — pas zone grise).

### 9.5 Sources externes + audit pré-généré — état au 2026-04-27 (post-brainstorming)

Les fichiers d'extraction sont arrivés avant l'implémentation. Tout est regroupé dans `data_hug_cbip/` à la racine du repo (en `.gitignore` — extraction reproductible).

#### Sources brutes

| Fichier | Volume | Méthode | Qualité observée |
|---|---|---|---|
| `data_hug_cbip/hug_2020_opus.json` | 245 mol. | Extraction multimodale Claude Opus 4.7 sur ZIP de 2 JPEG (PDF HUG d'origine) | Élevée — rang substrat (majeure/mineure) + flag `metabolite_actif` (le `!`) capturé correctement |
| `data_hug_cbip/cbip_gpt.json` | 472 mol. | Extraction GPT du HTML CBIP | Élevée — couverture étendue 2024+, condition sémantique préservée (codéine prodrogue), pas de rang substrat (limitation source) |
| `data_hug_cbip/CBIP_interactions_V3_audit.json` | 12 KB | Auto-audit GPT du CBIP | Révèle 45 incohérences internes au CBIP source (graphies dupliquées + table CYP ≠ pivot) |
| `data_hug_cbip/Doc HUG 2020.pdf` | 176 KB | Source originale HUG | Référence visuelle |
| `data_hug_cbip/CBIP _ Interactions des médicaments.html` | 351 KB | Source originale CBIP | Référence pour parser cheerio (T20 optionnelle) |

**Pas de `hug_2020_gpt.json`** → la cross-validation inter-LLM sur HUG n'a pas eu lieu. Mitigation : l'audit CBIP↔HUG ci-dessous joue partiellement ce rôle de cross-validation indirecte.

#### Audit comparatif CBIP × HUG pré-généré

Trois fichiers livrés en supplément, **prêts à consommer** par `compare-sources.mjs` (T21 simplifiée) :

| Fichier | Volume | Contenu |
|---|---|---|
| `data_hug_cbip/metaboscope_audit_cbip_vs_hug_summary.json` | 1.9 KB | Statistiques exécutives + liste des 27 molécules high-severity à arbitrer |
| `data_hug_cbip/metaboscope_audit_cbip_vs_hug_divergences.csv` | 106 KB · 1194 lignes | Listing complet : `nom, canonical_key, type, category, voie, severity, action` |
| `data_hug_cbip/metaboscope_audit_cbip_vs_hug_complete.json` | 1.7 MB | Données fusionnées par molécule (matériel direct pour `molecules_extension_cbip_hug.json` v1.1) |

**Métriques clés de l'audit** :
- 508 molécules union (202 dans les 2 sources · 263 CBIP-only · 43 HUG-only)
- **30 divergences de puissance "high severity"** (27 molécules) : conflits réels à arbitrer manuellement avant ingestion v1.1
- 1127 cas "medium" avec recommandation d'action déjà inscrite (ex. `conserver_CBIP_flag_source_unique`)
- 64 cas "fiabilité élevée" (concordance majoritaire CBIP-HUG → ingestion automatisable)

**Molécules high-severity à arbitrer manuellement (v1.1)** : amiodarone, atazanavir, bosentan, carbamazépine, ciprofloxacine, clopidogrel, darunavir, diltiazem, éfavirenz, enzalutamide, érythromycine, ésoméprazole, fluconazole, fluvastatine, imatinib, ledipasvir, moclobémide, modafinil, oméprazole, propafénone, rifabutine, rifampicine, roxithromycine, saquinavir, tipranavir, vérapamil, voriconazole.

Toutes sont des inducteurs/inhibiteurs majeurs en pratique clinique → la divergence de puissance entre CBIP et HUG sur ces molécules a un impact direct sur le scoring Module 2.

#### Conséquence sur la T21

T21 (`compare-sources.mjs`) **n'a plus à recalculer l'audit** — il existe déjà. Elle devient un wrapper qui consomme les fichiers pré-générés et produit un rapport markdown navigable + une liste de molécules prêtes à enrichir le JSON v1.1. Voir plan d'implémentation `docs/superpowers/plans/2026-04-27-metaboscope-modules.md` pour le détail.

---

## 10. Décisions clés — récapitulatif

| Décision | Choix | Raison |
|---|---|---|
| Scénario d'usage prioritaire | Mix mobile/tablette, Module 1 le plus fréquent | Q1 |
| Layout fiche | Bandeau résumé fixe + accordéons pliés par défaut | Q2 |
| Index de recherche | Unifié médicaments + drogues + NPS | Q3 |
| Architecture onglets v1 | 3 onglets : Recherche/Fiche, Interactions, Atlas (Substances supprimé) | Q4 (β) |
| Atlas | Sous-onglets CYP / UGT / Transporteurs | Q10.2 |
| Workflow Module 1 → Module 2 | Bouton "Comparer avec…" sur fiche + multi-select cases à cocher | Q5 (C+D) |
| Panier — additivité | Additif (clic ajoute, ne remplace pas) | Q6.1 (A) |
| Panier — persistance | Mémoire seule (pas localStorage) | Q6.2 (A) |
| Panier — limite | Soft limit 6 (avertir mais autoriser) | Q6.3 (B) |
| Bandeau résumé | 4 blocs : Identité / Alertes PD / Profil PK / PGx | Q8 |
| Libellés codes PD | Libellés clairs en UI (`pdAlertLabel`), codes dans JSON | Q8 |
| Profil PK | Substrats majeurs ET mineurs | Q8.2 |
| Sources | Section accordéon en bas (déduplication automatique) | Q7.2 (B) |
| Génotype patient | Reporté v1.1 — `crossPgxWithGenotype` dormant | Q9.1 (C) |
| PGx Module 2 v1 | Affichage des recommandations CPIC niveau A des molécules en panier (sans patient) | Q10.1 (B) |
| Disclaimer | Modale 1ère visite + lien permanent + mention pied | Q10.3 (A+lien) |
| Tests v1 | Minimaliste : data + scoring + MoleculeCard smoke | Q10.4 (A) |
| Approche d'implémentation | B (atomique) — composants partagés d'abord, puis assemblage | Q11 |
| Source extension HUG/CBIP | CBIP primaire (HTML parsable), HUG corroboration (PDF) | Q14 (C) |
| Schéma source | Autoriser `string | string[]` pour multi-sourçage | §9.4 |

---

## 11. Critères d'acceptation v1.0

L'implémentation est terminée quand toutes les conditions suivantes sont vraies :

### 11.1 Build et type-check

- `npm run build` produit `dist/` sans erreur
- `npx tsc -b` ne remonte aucune erreur de type
- Service worker généré et fichiers `*.json` molécules dans le précache
- Bundle JS gzip < 200 KiB (sentinelle, marge sur 87 KiB actuel)

### 11.2 Validation des données

- `npm run validate:molecules` exit code 0 sur les 5 JSON existants
- `npm run test` : 100 % des tests passent

### 11.3 UX — parcours bout en bout (à tester manuellement)

- À la première ouverture, la modale Disclaimer s'affiche ; après acceptation, elle ne reparaît plus tant que `DISCLAIMER_VERSION` est constant
- Recherche "sertraline" → fiche → bouton "Ajouter au comparateur" → onglet Interactions montre le panier avec sertraline
- Sur SearchPage, mode sélection multi → cocher 3 résultats → bouton "Comparer 3 molécules" → InteractionPage charge les 3
- Dans le panier, ajouter une 7ᵉ molécule → avertissement ambre s'affiche (pas de blocage)
- Atlas → CYP1A2 → liste affichée → clic sur "clozapine" → fiche clozapine
- Lien Disclaimer en pied → modale "lecture" avec bouton Fermer (pas de re-write localStorage)

### 11.4 Mobile

- Sur émulateur Galaxy Tab S7 FE et iPhone 14 (Chrome DevTools) : navbar bottom visible, fiche scrollable, accordéons cliquables sans débordement, badges PD lisibles

### 11.5 Offline

- Première visite avec Wi-Fi, puis Airplane mode : Modules Search/Interactions/Atlas restent fonctionnels (pas de fetch externe nécessaire)

---

## 12. Hors-scope explicite v1.0

Pour mémoire, **ne pas implémenter en v1** :

- Saisie de génotype patient + croisement personnalisé (`crossPgxWithGenotype` UI)
- Schéma visuel des voies métaboliques (feature C de Q4)
- Ingestion massive HUG/CBIP (> 35 molécules de recouvrement)
- Tests d'intégration Playwright e2e
- Snapshot tests, axe-core a11y en CI
- Hook git pre-commit
- GitHub Actions CI
- Téléchargement export PDF d'une fiche
- Mode impression
- Support multilingue (anglais)
- Page de changelog visible utilisateur

---

## 13. Liste des questions ouvertes / risques résiduels

| # | Question | Mitigation |
|---|---|---|
| 1 | Le PDF HUG 2020 est-il encore parsable visuellement par Gemini avec une qualité suffisante ? | Variante 2 du prompt (Codex + script Python OCR) en backup |
| 2 | Le HTML CBIP peut évoluer (Anthropic IA actualise sa structure périodiquement) | Le parser cheerio devra être révisé à chaque version majeure ; documenter l'identifiant `frag=9990243` |
| 3 | Granularité "majeur/mineur/trace" diverge entre CBIP (gras vs normal = 2 niveaux) et HUG (rouge/orange = 2 niveaux) et MétaboScope (3 niveaux) | Mapping documenté dans `compare-sources.mjs` : gras CBIP / rouge HUG → "majeur", normal CBIP / orange HUG → "mineur", absent → ND |
| 4 | Les futures molécules HUG-only ne pourront pas alimenter `interactions_specifiques[]` (invariant : jamais vide) | Lors de l'ingestion v1.1, croiser systématiquement avec CBIP qui liste les paires ; si toujours vide, marquer dans `champ_manquants[]` |
| 5 | Le bandeau résumé peut être très long sur des molécules à profil PK riche (méthadone, fluoxétine) | Limite douce : si > 4 voies citées, n'afficher que les 3 premières + "voir détail" |

---

## 14. Annexes

### Annexe A — Glossaire codes alertes PD

(voir `utils/labels.ts` pour le mapping complet)

| Code | Libellé UI | Référence |
|---|---|---|
| `QT-KR` | QTc — risque connu | CredibleMeds Known Risk |
| `QT-PR` | QTc — risque possible | CredibleMeds Possible Risk |
| `QT-CR` | QTc — risque conditionnel | CredibleMeds Conditional Risk |
| `QT-SR` | QTc — risque spécifique | CredibleMeds Special Risk |
| `sero` | Syndrome sérotoninergique | Triade ISRS+IMAO ou équivalent |
| `ACB-1/2/3` | Charge anticholinergique 1/2/3 | Aging Brain Care Anticholinergic Burden Score |

### Annexe B — Liens externes utilisés

- HUG, Service de pharmacologie et toxicologie cliniques : https://www.pharmacoclin.ch/
- CBIP (Centre Belge d'Information Pharmacothérapeutique) : https://www.cbip.be/fr/chapters/1?frag=9990243
- CredibleMeds : https://crediblemeds.org/
- CPIC (Clinical Pharmacogenetics Implementation Consortium) : https://cpicpgx.org/
- PubMed : https://pubmed.ncbi.nlm.nih.gov/
- StatPearls (NCBI Bookshelf) : https://www.ncbi.nlm.nih.gov/books/

---

*Fin du design doc. Prochaine étape : invocation de `superpowers:writing-plans` pour le plan d'implémentation détaillé.*
