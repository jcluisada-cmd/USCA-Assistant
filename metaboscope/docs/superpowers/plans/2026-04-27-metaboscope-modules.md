# MétaboScope v1.0 — Plan d'implémentation

> **Pour les agents :** SOUS-SKILL REQUIS — utilise `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans` pour exécuter ce plan tâche par tâche. Les steps utilisent la syntaxe checkbox (`- [ ]`) pour le suivi.

**Goal :** Livrer la PWA MétaboScope v1.0 (3 onglets : Recherche/Fiche, Interactions, Atlas) sur les 77 molécules existantes, avec un script multi-sources HUG/CBIP/JSON pour préparer l'extension v1.1.

**Architecture :** Approche B atomique — briques UI agnostiques (`components/ui/`) testées d'abord, puis briques spécifiques au domaine (`components/molecule/`), puis pages, puis Atlas. Deux Contexts React (Cart + Disclaimer), pas de Zustand. Helpers métier (`scoring.ts`, `pgx.ts`, `searchMolecules`) déjà écrits — ce plan ne les modifie pas, il les consomme.

**Tech Stack :** React 18 + Vite 5 + TypeScript + Tailwind CSS 3 + react-router v6 + Vitest + Testing Library + cheerio (Node CLI).

**Spec source :** `docs/superpowers/specs/2026-04-27-metaboscope-modules-design.md` (commit `a43b2c2`)

---

## État d'exécution (mise à jour 2026-04-28)

| Tâche | Status | Commits | Note |
|---|---|---|---|
| **T1** — Script validation molécules | ✅ DONE | `50a0824`, `a4f396c`, `1370a3b`, `0ed3bfb`, `8bddc90` | Cascade C : extension vocabulaire + 107 corrections JSON. 76 molécules, exit 0. |
| **T2** — Tests runtime data | ✅ DONE | `0fbef30` | 6 tests PASS verbatim |
| **T3** — Tests scoring | ✅ DONE | `5b5a669`, `8a12a59` | 13 tests PASS. Décision JC option B : doc §7 alignée sur helper (paire BZD+opi=red FDA boxed warning, 4 niveaux ok/info/amber/red) |
| **T4-T22** | ⏸ pending | — | À reprendre via `lance les subagents` (cf. CLAUDE.md §16) |

**Branche d'implémentation :** `feat/v1-implementation` (poussée sur `origin`).
**Reprise** : `git checkout feat/v1-implementation && git pull && npm install`, puis trigger naturel *« lance les subagents »* qui reprendra à T4.

---

## Cartographie des fichiers

### Créés (delta sur l'existant)

| Catégorie | Fichier | Responsabilité |
|---|---|---|
| Utils | `src/utils/labels.ts` | Mapping codes PD → libellés FR + URL des sources + couleurs sévérité |
| Utils | `src/utils/atlas.ts` | `buildAtlasIndex()` : agrégation par enzyme/transporteur |
| Context | `src/context/CartContext.tsx` | État panier (Set d'IDs + add/remove/clear) |
| Context | `src/context/DisclaimerContext.tsx` | Flag d'acceptation versionné en localStorage |
| UI atomique | `src/components/ui/Badge.tsx` | Badge alerte PD coloré |
| UI atomique | `src/components/ui/Accordion.tsx` | Section pliable |
| UI atomique | `src/components/ui/AutoComplete.tsx` | Input + dropdown debounce 150 ms |
| UI atomique | `src/components/ui/SourceLink.tsx` | `<a>` externe selon préfixe source |
| UI atomique | `src/components/ui/EmptyState.tsx` | Message d'état vide générique |
| UI domaine | `src/components/molecule/MoleculeCard.tsx` | Assemblage SummaryHeader + 11 sections |
| UI domaine | `src/components/molecule/SummaryHeader.tsx` | Bandeau résumé fixe 4 blocs |
| UI domaine | `src/components/molecule/Section*.tsx` (×11) | Sections pliables |
| UI domaine | `src/components/molecule/PdAlertCard.tsx` | Carte alerte PD pour Module 2 |
| Disclaimer | `src/components/DisclaimerGate.tsx` | Gate première visite |
| Disclaimer | `src/components/DisclaimerModal.tsx` | Modale réutilisable (gate + lecture) |
| Pages | `src/pages/SearchPage.tsx` | Recherche + multi-select |
| Pages | `src/pages/MoleculePage.tsx` | Fiche détaillée |
| Pages | `src/pages/AtlasPage.tsx` | Atlas avec sous-onglets |
| Tests | `tests/data.test.ts` | Validation runtime des 5 JSON |
| Tests | `tests/scoring.test.ts` | Tests des 5 scores PD + helpers PK |
| Tests | `tests/MoleculeCard.test.tsx` | Smoke render + accordéons fermés |
| Tests | `tests/labels.test.ts` | Mapping codes PD + URL sources |
| Scripts | `scripts/validate-molecules.mjs` | Invariants schéma + qualité |
| Scripts | `scripts/parse-cbip.mjs` | Extraction HTML CBIP via cheerio |
| Scripts | `scripts/compare-sources.mjs` | MoE 4 sources : HUG-GPT × HUG-Opus × CBIP × JSON |

### Modifiés

| Fichier | Modification |
|---|---|
| `src/App.tsx` | Routes `/search`, `/search/:id`, `/interactions`, `/atlas`, suppression `/substances` |
| `src/main.tsx` | Wrap dans `<DisclaimerGate>` + `<CartProvider>` |
| `src/components/Layout.tsx` | 3 onglets bottom (mobile) + horizontal (desktop), suppression Substances |
| `src/pages/InteractionPage.tsx` | Refactor complet (panier + 5 cartes PD + paires PK + PGx + sources) |
| `src/types/molecule.ts` | Source autoriser `string | string[]` sur toutes les entrées de cellule |
| `package.json` | Scripts `validate:molecules`, `parse:cbip`, `compare:sources` + dép cheerio |

### Supprimés

- `src/pages/SubstancesPage.tsx` (route + lien retirés du Layout)

---

# Session 1 — Filet de sécurité + briques utils

**Objectif :** Avant de toucher à l'UI, sécuriser les données existantes (script de validation + tests scoring) et implémenter les helpers `labels.ts` qui seront consommés par toutes les briques UI.

## Task 1 : Script de validation des molécules

**Files:**
- Create: `scripts/validate-molecules.mjs`
- Modify: `package.json` (ajout script)

- [x] **Step 1 : Créer le script de validation**

```javascript
// scripts/validate-molecules.mjs
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MOLECULES_DIR = join(__dirname, '..', 'src', 'data', 'molecules');

const SOURCE_PREFIX = /^(PMID|DOI|FDA|EMA|ANSM|CredibleMeds|CPIC|DPWG|StatPearls|HUG|CBIP):/;
const DATE_FORMAT = /^\d{4}-\d{2}$/;
const PD_CODES = new Set([
  'QT-KR', 'QT-PR', 'QT-CR', 'QT-SR',
  'sero', 'sero-faible', 'sero-modere',
  'resp',
  'ACB-1', 'ACB-2', 'ACB-3',
  'seuil-ep', 'seuil-ep-sevrage',
  'hepatotox', 'nephrotox', 'myocardite',
  'CI-IMAO', 'CI-fluvoxamine', 'CI-sildenafil', 'CI-grossesse',
  'teratogene',
  'SJS-Lyell-HLA-B1502', 'DRESS-HLA-A3101',
  'fenetre-etroite', 'mesusage-documented', 'dependance-mu-opioide',
  'myelopathie-B12',
]);

const errors = [];
const allIds = new Set();
let total = 0;

const files = readdirSync(MOLECULES_DIR).filter(f => f.endsWith('.json'));

for (const file of files) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(join(MOLECULES_DIR, file), 'utf8'));
  } catch (e) {
    errors.push(`[${file}] JSON invalide : ${e.message}`);
    continue;
  }
  if (!parsed.molecules || !Array.isArray(parsed.molecules)) {
    errors.push(`[${file}] Wrapper { _metadata, molecules: [] } manquant`);
    continue;
  }
  for (const m of parsed.molecules) {
    total++;
    const ctx = `[${file} → ${m.id ?? 'SANS_ID'}]`;
    for (const f of ['id', 'nom_dci', 'classe', 'statut_fr', 'derniere_maj']) {
      if (!m[f]) errors.push(`${ctx} champ obligatoire absent : ${f}`);
    }
    if (m.id) {
      if (allIds.has(m.id)) errors.push(`${ctx} id dupliqué`);
      allIds.add(m.id);
    }
    if (!Array.isArray(m.interactions_specifiques) || m.interactions_specifiques.length === 0) {
      errors.push(`${ctx} interactions_specifiques vide (invariant §9.3)`);
    }
    if (Array.isArray(m.sources_principales)) {
      for (const s of m.sources_principales) {
        if (s === 'ND') errors.push(`${ctx} sources_principales contient "ND" (invariant §9.2)`);
        if (!SOURCE_PREFIX.test(s)) errors.push(`${ctx} source mal formée : "${s}"`);
      }
    }
    if (m.derniere_maj && !DATE_FORMAT.test(m.derniere_maj)) {
      errors.push(`${ctx} derniere_maj : format YYYY-MM attendu, reçu "${m.derniere_maj}"`);
    }
    if (Array.isArray(m.alertes_pd)) {
      for (const code of m.alertes_pd) {
        if (!PD_CODES.has(code)) errors.push(`${ctx} alertes_pd code inconnu : "${code}"`);
      }
    }
  }
}

console.log(`Validation : ${total} molécules dans ${files.length} fichiers`);
if (errors.length === 0) {
  console.log('✓ Tous les invariants respectés');
  process.exit(0);
} else {
  console.error(`\n✗ ${errors.length} erreur(s) :\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
```

- [x] **Step 2 : Ajouter le script npm**

Modifier `package.json` section `scripts` (ajouter cette ligne, garder les autres) :

```json
"validate:molecules": "node scripts/validate-molecules.mjs"
```

- [x] **Step 3 : Exécuter et vérifier**

Run : `npm run validate:molecules`
Expected : `Validation : 77 molécules dans 5 fichiers` + `✓ Tous les invariants respectés` (si les JSON existants sont propres) OU une liste d'erreurs précises à corriger avant d'aller plus loin.

- [x] **Step 4 : Si erreurs détectées, les corriger sur les JSON**

Toute erreur signale un défaut à corriger dans les JSON eux-mêmes (`src/data/molecules/*.json`), pas dans le script. Re-exécuter `npm run validate:molecules` jusqu'à exit code 0.

- [x] **Step 5 : Commit**

```bash
git add scripts/validate-molecules.mjs package.json
git commit -m "feat(scripts): script de validation des invariants JSON molécules"
```

---

## Task 2 : Tests runtime des données

**Files:**
- Create: `tests/data.test.ts`

- [x] **Step 1 : Écrire les tests**

```typescript
// tests/data.test.ts
import { describe, it, expect } from 'vitest';
import { ALL_MOLECULES, MOLECULES_BY_ID } from '../src/data';

describe('Base de données molécules', () => {
  it('charge un nombre attendu de molécules (sentinelle)', () => {
    expect(ALL_MOLECULES.length).toBeGreaterThanOrEqual(70);
    expect(ALL_MOLECULES.length).toBeLessThanOrEqual(85);
  });

  it('garantit l\'unicité globale des id', () => {
    const ids = ALL_MOLECULES.map(m => m.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('expose un index par id complet', () => {
    for (const m of ALL_MOLECULES) {
      expect(MOLECULES_BY_ID[m.id]).toBe(m);
    }
  });

  it('garantit que interactions_specifiques n\'est jamais vide', () => {
    for (const m of ALL_MOLECULES) {
      expect(m.interactions_specifiques.length, `${m.id} a interactions vides`).toBeGreaterThan(0);
    }
  });

  it('rejette ND dans sources_principales', () => {
    for (const m of ALL_MOLECULES) {
      expect(m.sources_principales, `${m.id} sources principales`).not.toContain('ND');
    }
  });

  it('valide le format YYYY-MM de derniere_maj', () => {
    for (const m of ALL_MOLECULES) {
      expect(m.derniere_maj, `${m.id}`).toMatch(/^\d{4}-\d{2}$/);
    }
  });
});
```

- [x] **Step 2 : Lancer les tests**

Run : `npm run test -- tests/data.test.ts`
Expected : 6 tests PASS.

- [x] **Step 3 : Commit**

```bash
git add tests/data.test.ts
git commit -m "test(data): tests runtime des invariants molécules"
```

---

## Task 3 : Tests des helpers de scoring

**Files:**
- Create: `tests/scoring.test.ts`

- [x] **Step 1 : Écrire les tests des 5 scores PD**

```typescript
// tests/scoring.test.ts
import { describe, it, expect } from 'vitest';
import {
  scoreQT, scoreSero, scoreResp, scoreAcb, scoreSeuilEp,
  detectPkPairs, findDocumentedInteractions,
} from '../src/utils/scoring';
import type { Molecule } from '../src/types/molecule';

// Helper pour créer une molécule de test minimale
function mockMolecule(partial: Partial<Molecule>): Molecule {
  return {
    id: partial.id ?? 'mock_test',
    nom_dci: partial.nom_dci ?? 'Test',
    synonymes: [],
    classe: 'Test',
    statut_fr: 'Liste I',
    phase1_cyp: [],
    phase1_non_cyp: [],
    phase2: [],
    transporteurs: [],
    inhibiteur: [],
    inducteur: [],
    metabolite_actif: { present: false, nom: null, activite_relative: null, demi_vie_h: null },
    pharmacogenetique: [],
    interactions_specifiques: [],
    alertes_pd: [],
    niveau_preuve_global: 'IVH-O',
    sources_principales: ['HUG:carte_cytochromes_2020'],
    zone_grise: false,
    derniere_maj: '2026-04',
    champ_manquants: [],
    ...partial,
  };
}

describe('scoreQT', () => {
  it('rouge si total ≥ 3 (un KR seul)', () => {
    const r = scoreQT([mockMolecule({ id: 'a', alertes_pd: ['QT-KR'] })]);
    expect(r.severity).toBe('red');
    expect(r.score).toBe(3);
  });

  it('rouge si 2 × KR (score 6)', () => {
    const r = scoreQT([
      mockMolecule({ id: 'a', alertes_pd: ['QT-KR'] }),
      mockMolecule({ id: 'b', alertes_pd: ['QT-KR'] }),
    ]);
    expect(r.severity).toBe('red');
    expect(r.score).toBe(6);
  });

  it('rouge si total ≥ 3 (PR + CR = 3)', () => {
    const r = scoreQT([
      mockMolecule({ id: 'a', alertes_pd: ['QT-PR'] }),
      mockMolecule({ id: 'b', alertes_pd: ['QT-CR'] }),
    ]);
    expect(r.severity).toBe('red');
    expect(r.score).toBe(3);
  });

  it('ambre si CR + SR (score 2)', () => {
    const r = scoreQT([
      mockMolecule({ id: 'a', alertes_pd: ['QT-CR'] }),
      mockMolecule({ id: 'b', alertes_pd: ['QT-SR'] }),
    ]);
    expect(r.severity).toBe('amber');
    expect(r.score).toBe(2);
  });

  it('neutre si une seule molécule SR', () => {
    const r = scoreQT([mockMolecule({ id: 'a', alertes_pd: ['QT-SR'] })]);
    expect(r.severity).toBe('neutral');
  });
});

describe('scoreSero', () => {
  it('rouge si triade ISRS + opioïde séro + IMAO', () => {
    const r = scoreSero([
      mockMolecule({ id: 'a', classe: 'Antidépresseur ISRS', alertes_pd: ['sero'] }),
      mockMolecule({ id: 'b', alertes_pd: ['sero'] }),
      mockMolecule({ id: 'c', alertes_pd: ['CI-IMAO'] }),
    ]);
    expect(r.severity).toBe('red');
  });

  it('neutre si une seule molécule sero-faible', () => {
    const r = scoreSero([mockMolecule({ id: 'a', alertes_pd: ['sero-faible'] })]);
    expect(r.severity).toBe('neutral');
  });
});

describe('scoreResp', () => {
  it('rouge si BZD + opioïde + autre dépresseur CNS (triade)', () => {
    const r = scoreResp([
      mockMolecule({ id: 'a', classe: 'BZD', alertes_pd: ['resp'] }),
      mockMolecule({ id: 'b', classe: 'Opioïde TSO', alertes_pd: ['resp'] }),
      mockMolecule({ id: 'c', classe: 'Antihistaminique', alertes_pd: ['resp'] }),
    ]);
    expect(r.severity).toBe('red');
  });

  it('ambre si BZD + opioïde sans 3e dépresseur', () => {
    const r = scoreResp([
      mockMolecule({ id: 'a', classe: 'BZD', alertes_pd: ['resp'] }),
      mockMolecule({ id: 'b', classe: 'Opioïde TSO', alertes_pd: ['resp'] }),
    ]);
    expect(r.severity).toBe('amber');
  });
});

describe('scoreAcb', () => {
  it('rouge si score ≥ 6', () => {
    const r = scoreAcb([
      mockMolecule({ id: 'a', alertes_pd: ['ACB-3'] }),
      mockMolecule({ id: 'b', alertes_pd: ['ACB-3'] }),
    ]);
    expect(r.severity).toBe('red');
    expect(r.score).toBe(6);
  });

  it('ambre si score ≥ 3', () => {
    const r = scoreAcb([
      mockMolecule({ id: 'a', alertes_pd: ['ACB-2'] }),
      mockMolecule({ id: 'b', alertes_pd: ['ACB-1'] }),
    ]);
    expect(r.severity).toBe('amber');
    expect(r.score).toBe(3);
  });
});

describe('scoreSeuilEp', () => {
  it('détecte au moins un contributeur', () => {
    const r = scoreSeuilEp([mockMolecule({ id: 'a', alertes_pd: ['seuil-ep'] })]);
    expect(r.contributors.length).toBeGreaterThan(0);
  });
});

describe('detectPkPairs', () => {
  it('détecte une paire substrat × inhibiteur (CYP3A4)', () => {
    const subst = mockMolecule({
      id: 'subst', nom_dci: 'Méthadone',
      phase1_cyp: [{ isoforme: 'CYP3A4', rang: 'majeur', produit: 'EDDP', preuve: 'IVH-C', source: 'PMID:12345678' }],
    });
    const inhib = mockMolecule({
      id: 'inhib', nom_dci: 'Clarithromycine',
      inhibiteur: [{ cible: 'CYP3A4', puissance: 'fort', mecanisme: 'MBI', preuve: 'IVH-C', source: 'CBIP:interactions_chap1_2024' }],
    });
    const pairs = detectPkPairs([subst, inhib]);
    expect(pairs.length).toBeGreaterThan(0);
  });
});
```

- [x] **Step 2 : Lancer les tests**

Run : `npm run test -- tests/scoring.test.ts`
Expected : tous PASS si les helpers `scoring.ts` respectent les seuils du `CLAUDE.md §7`. Si un test FAIL, c'est que le helper a un bug à corriger (rare — les helpers sont déjà écrits) OU que les seuils diffèrent : aligner alors le test sur le comportement réel du helper, en signalant la divergence dans le commit.

- [x] **Step 3 : Commit**

```bash
git add tests/scoring.test.ts
git commit -m "test(scoring): table de cas pour les 5 scores PD + paires PK"
```

---

## Task 4 : `utils/labels.ts` — mapping codes PD + URL sources + couleurs

**Files:**
- Create: `src/utils/labels.ts`
- Create: `tests/labels.test.ts`

- [ ] **Step 1 : Écrire les tests d'abord (TDD)**

```typescript
// tests/labels.test.ts
import { describe, it, expect } from 'vitest';
import { pdAlertLabel, sourceToHref, severityClass } from '../src/utils/labels';

describe('pdAlertLabel', () => {
  it('mappe QT-KR vers "QTc — risque connu" (red)', () => {
    const r = pdAlertLabel('QT-KR');
    expect(r.label).toBe('QTc — risque connu');
    expect(r.severity).toBe('red');
  });

  it('mappe ACB-3 vers libellé clair (red)', () => {
    expect(pdAlertLabel('ACB-3').severity).toBe('red');
    expect(pdAlertLabel('ACB-3').label).toContain('forte');
  });

  it('retourne le code brut + neutral pour un code inconnu', () => {
    const r = pdAlertLabel('CODE_INCONNU_XYZ');
    expect(r.label).toBe('CODE_INCONNU_XYZ');
    expect(r.severity).toBe('neutral');
  });
});

describe('sourceToHref', () => {
  it('PMID → pubmed.ncbi.nlm.nih.gov', () => {
    expect(sourceToHref('PMID:12345678')).toBe('https://pubmed.ncbi.nlm.nih.gov/12345678/');
  });

  it('DOI → doi.org', () => {
    expect(sourceToHref('DOI:10.1016/j.xxx')).toBe('https://doi.org/10.1016/j.xxx');
  });

  it('CPIC:doi: → doi.org', () => {
    expect(sourceToHref('CPIC:doi:10.1002/cpt.1602')).toBe('https://doi.org/10.1002/cpt.1602');
  });

  it('HUG → pharmacoclin.ch', () => {
    expect(sourceToHref('HUG:carte_cytochromes_2020')).toBe('https://www.pharmacoclin.ch/');
  });

  it('CBIP → cbip.be (chapitre interactions)', () => {
    expect(sourceToHref('CBIP:interactions_chap1_2024')).toContain('cbip.be');
  });

  it('FDA / EMA / ANSM → null (pas d\'URL stable)', () => {
    expect(sourceToHref('FDA:Vivitrol_label_2023')).toBeNull();
    expect(sourceToHref('EMA:EPAR_xyz')).toBeNull();
    expect(sourceToHref('ANSM:RCP_xyz')).toBeNull();
  });
});

describe('severityClass', () => {
  it('mappe red → bg-red-600', () => {
    expect(severityClass('red')).toContain('red');
  });
  it('mappe amber → amber', () => {
    expect(severityClass('amber')).toContain('amber');
  });
});
```

- [ ] **Step 2 : Lancer les tests (FAIL — fichier source absent)**

Run : `npm run test -- tests/labels.test.ts`
Expected : FAIL avec `Cannot find module '../src/utils/labels'`

- [ ] **Step 3 : Implémenter `src/utils/labels.ts`**

```typescript
// src/utils/labels.ts
export type Severity = 'red' | 'amber' | 'yellow' | 'green' | 'neutral';

interface PdLabel {
  label: string;
  severity: Severity;
}

const PD_LABELS: Record<string, PdLabel> = {
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

export function pdAlertLabel(code: string): PdLabel {
  return PD_LABELS[code] ?? { label: code, severity: 'neutral' };
}

export function sourceToHref(src: string): string | null {
  if (src.startsWith('PMID:')) return `https://pubmed.ncbi.nlm.nih.gov/${src.slice(5)}/`;
  if (src.startsWith('DOI:')) return `https://doi.org/${src.slice(4)}`;
  if (src.startsWith('CPIC:doi:')) return `https://doi.org/${src.slice(9)}`;
  if (src.startsWith('DPWG:PMID:')) return `https://pubmed.ncbi.nlm.nih.gov/${src.slice(10)}/`;
  if (src.startsWith('StatPearls:')) return `https://www.ncbi.nlm.nih.gov/books/${src.slice(11)}/`;
  if (src.startsWith('CredibleMeds:')) return 'https://crediblemeds.org/';
  if (src.startsWith('HUG:')) return 'https://www.pharmacoclin.ch/';
  if (src.startsWith('CBIP:')) return 'https://www.cbip.be/fr/chapters/1?frag=9990243';
  return null;
}

const SEVERITY_CLASSES: Record<Severity, string> = {
  red:     'bg-red-600 text-white border-red-700',
  amber:   'bg-amber-500 text-white border-amber-600',
  yellow:  'bg-yellow-300 text-gray-900 border-yellow-400',
  green:   'bg-emerald-500 text-white border-emerald-600',
  neutral: 'bg-gray-400 text-white border-gray-500',
};

export function severityClass(s: Severity): string {
  return SEVERITY_CLASSES[s];
}
```

- [ ] **Step 4 : Lancer les tests (PASS attendu)**

Run : `npm run test -- tests/labels.test.ts`
Expected : tous PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/utils/labels.ts tests/labels.test.ts
git commit -m "feat(utils): labels.ts — mapping codes PD + sources + couleurs sévérité"
```

---

## Task 5 : Composant `Badge` (UI atomique)

**Files:**
- Create: `src/components/ui/Badge.tsx`

- [ ] **Step 1 : Implémenter le composant**

```tsx
// src/components/ui/Badge.tsx
import { pdAlertLabel, severityClass, type Severity } from '../../utils/labels';

interface BadgeProps {
  /** Code PD (ex. 'QT-KR') OU label libre */
  code?: string;
  /** Label libre (priorité sur code) */
  label?: string;
  /** Sévérité explicite (priorité sur celle déduite du code) */
  severity?: Severity;
  /** Classes additionnelles */
  className?: string;
}

export function Badge({ code, label, severity, className = '' }: BadgeProps) {
  const resolved = code ? pdAlertLabel(code) : { label: label ?? '', severity: severity ?? 'neutral' as Severity };
  const finalLabel = label ?? resolved.label;
  const finalSeverity = severity ?? resolved.severity;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${severityClass(finalSeverity)} ${className}`}
      role="status"
    >
      {finalLabel}
    </span>
  );
}
```

- [ ] **Step 2 : Vérifier le type-check**

Run : `npx tsc -b`
Expected : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/components/ui/Badge.tsx
git commit -m "feat(ui): Badge — alerte PD coloré via pdAlertLabel"
```

---

## Task 6 : Composant `Accordion` (UI atomique)

**Files:**
- Create: `src/components/ui/Accordion.tsx`

- [ ] **Step 1 : Implémenter**

```tsx
// src/components/ui/Accordion.tsx
import { useState, useId, type ReactNode } from 'react';

interface AccordionProps {
  title: string;
  /** Forcer l'ouverture initiale (utilisé par MoleculePage avec ?openSection=) */
  defaultOpen?: boolean;
  /** Badge optionnel à droite du titre (ex. compteur) */
  badge?: ReactNode;
  children: ReactNode;
}

export function Accordion({ title, defaultOpen = false, badge, children }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  return (
    <div className="border-t border-navy-700">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left hover:bg-navy-800/50 focus-ring"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-100">
          <span aria-hidden className="text-teal-400">{open ? '▾' : '▸'}</span>
          {title}
        </span>
        {badge}
      </button>
      {open && (
        <div id={contentId} className="px-3 pb-4 text-sm text-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2 : Type-check**

Run : `npx tsc -b`
Expected : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/components/ui/Accordion.tsx
git commit -m "feat(ui): Accordion — section pliable avec ARIA"
```

---

# Session 2 — Briques UI restantes + types

## Task 7 : Composant `AutoComplete` (UI atomique)

**Files:**
- Create: `src/components/ui/AutoComplete.tsx`

- [ ] **Step 1 : Implémenter**

```tsx
// src/components/ui/AutoComplete.tsx
import { useState, useEffect, useRef, type ReactNode } from 'react';

interface AutoCompleteProps<T> {
  placeholder?: string;
  /** Fonction de recherche, retourne max 20 résultats triés */
  search: (query: string) => T[];
  /** Comment afficher chaque résultat dans la dropdown */
  renderItem: (item: T) => ReactNode;
  /** Clé unique extractible d'un item */
  itemKey: (item: T) => string;
  /** Callback quand l'utilisateur sélectionne un item (Entrée ou clic) */
  onSelect: (item: T) => void;
  /** Délai debounce en ms (défaut 150) */
  debounceMs?: number;
}

export function AutoComplete<T>({
  placeholder = 'Rechercher…',
  search,
  renderItem,
  itemKey,
  onSelect,
  debounceMs = 150,
}: AutoCompleteProps<T>) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), debounceMs);
    return () => clearTimeout(t);
  }, [query, debounceMs]);

  useEffect(() => {
    if (debounced.trim().length >= 2) {
      setResults(search(debounced).slice(0, 20));
      setOpen(true);
      setHighlight(0);
    } else {
      setResults([]);
      setOpen(false);
    }
  }, [debounced, search]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); onSelect(results[highlight]); setOpen(false); setQuery(''); }
    else if (e.key === 'Escape') { setOpen(false); }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        aria-label={placeholder}
        aria-autocomplete="list"
        aria-expanded={open}
        className="w-full rounded-md border border-navy-700 bg-navy-800 px-3 py-2 text-gray-100 placeholder:text-gray-500 focus-ring"
      />
      {open && results.length > 0 && (
        <ul role="listbox" className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-md border border-navy-700 bg-navy-800 shadow-lg">
          {results.map((item, idx) => (
            <li
              key={itemKey(item)}
              role="option"
              aria-selected={idx === highlight}
              onMouseDown={e => { e.preventDefault(); onSelect(item); setOpen(false); setQuery(''); }}
              onMouseEnter={() => setHighlight(idx)}
              className={`cursor-pointer px-3 py-2 text-sm ${idx === highlight ? 'bg-teal-600/30' : 'hover:bg-navy-700'}`}
            >
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2 : Type-check + commit**

```bash
npx tsc -b
git add src/components/ui/AutoComplete.tsx
git commit -m "feat(ui): AutoComplete générique avec debounce + nav clavier"
```

---

## Task 8 : Composants `SourceLink` et `EmptyState`

**Files:**
- Create: `src/components/ui/SourceLink.tsx`
- Create: `src/components/ui/EmptyState.tsx`

- [ ] **Step 1 : `SourceLink.tsx`**

```tsx
// src/components/ui/SourceLink.tsx
import { sourceToHref } from '../../utils/labels';

export function SourceLink({ source }: { source: string }) {
  const href = sourceToHref(source);
  if (!href) {
    return <span className="font-mono text-xs text-gray-400">{source}</span>;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-xs text-teal-400 underline hover:text-teal-300 focus-ring"
    >
      {source}
    </a>
  );
}
```

- [ ] **Step 2 : `EmptyState.tsx`**

```tsx
// src/components/ui/EmptyState.tsx
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  hint?: string;
}

export function EmptyState({ icon, title, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center text-gray-400">
      {icon && <div aria-hidden className="text-4xl text-teal-500">{icon}</div>}
      <p className="font-medium text-gray-200">{title}</p>
      {hint && <p className="max-w-md text-sm">{hint}</p>}
    </div>
  );
}
```

- [ ] **Step 3 : Type-check + commit**

```bash
npx tsc -b
git add src/components/ui/SourceLink.tsx src/components/ui/EmptyState.tsx
git commit -m "feat(ui): SourceLink + EmptyState"
```

---

## Task 9 : Mise à jour des types (multi-source par cellule)

**Files:**
- Modify: `src/types/molecule.ts`

- [ ] **Step 1 : Lire le type actuel**

Run : `cat src/types/molecule.ts | head -80` (juste pour visualisation, l'édition se fait via Edit tool)

- [ ] **Step 2 : Mettre à jour les types pour autoriser source: string | string[]**

Repérer chaque interface qui définit un champ `source: string` dans le fichier (`CYPEntry`, `NonCYPEntry`, `Phase2Entry`, `TransporteurEntry`, `InhibEntry`, `InductEntry`, `PGxEntry`, `InteractionEntry`) et remplacer par `source: string | string[]`. Conserver l'union existante pour `pharmacogenetique[].variants` (déjà en union).

Code de l'édition à appliquer (chaque interface concernée) :

```typescript
// Avant : source: string;
// Après : source: string | string[];
```

- [ ] **Step 3 : Type-check**

Run : `npx tsc -b`
Expected : si une consommation existante du champ `source` casse (utilisation directe en `string`), ajouter une normalisation utilitaire :

```typescript
// dans src/types/molecule.ts (en bas)
export function normalizeSources(s: string | string[]): string[] {
  return Array.isArray(s) ? s : [s];
}
```

Et corriger les call sites (probablement dans `scoring.ts` ou nulle part en v1 — les helpers existants n'iterent pas forcément les sources cellule par cellule). Si rien ne casse, le helper est juste prêt pour les tâches futures.

- [ ] **Step 4 : Commit**

```bash
git add src/types/molecule.ts
git commit -m "feat(types): autoriser source: string | string[] pour multi-sourçage"
```

---

# Session 3 — `MoleculeCard` (composant central)

## Task 10 : `SummaryHeader` — bandeau résumé

**Files:**
- Create: `src/components/molecule/SummaryHeader.tsx`

- [ ] **Step 1 : Implémenter**

```tsx
// src/components/molecule/SummaryHeader.tsx
import type { Molecule } from '../../types/molecule';
import { Badge } from '../ui/Badge';
import { useCart } from '../../context/CartContext';

interface Props {
  molecule: Molecule;
}

export function SummaryHeader({ molecule }: Props) {
  const cart = useCart();
  const inCart = cart.ids.has(molecule.id);

  // Profil PK : substrats majeurs / mineurs
  const cypMajeur = molecule.phase1_cyp.filter(e => e.rang === 'majeur').map(e => e.isoforme);
  const cypMineur = molecule.phase1_cyp.filter(e => e.rang === 'mineur').map(e => e.isoforme);
  const inhib = molecule.inhibiteur.map(i => `${i.cible} (${i.puissance})`);
  const induc = molecule.inducteur.map(i => `${i.cible} (${i.puissance})`);
  const meta = molecule.metabolite_actif.present ? molecule.metabolite_actif.nom : null;

  // PGx : niveau CPIC max
  const cpicA = molecule.pharmacogenetique.find(p => p.niveau_cpic === 'A');
  const cpicB = molecule.pharmacogenetique.find(p => p.niveau_cpic === 'B');
  const pgxBest = cpicA ?? cpicB;

  return (
    <header className="rounded-lg border border-navy-700 bg-navy-800 p-4 shadow-sm">
      {/* Bloc 1 : Identité */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-100">{molecule.nom_dci}</h1>
          <p className="text-sm text-teal-400">{molecule.classe}</p>
          {molecule.synonymes.length > 0 && (
            <p className="mt-1 text-xs text-gray-400">Synonymes : {molecule.synonymes.join(', ')}</p>
          )}
        </div>
        <Badge label={molecule.statut_fr} severity="neutral" />
      </div>

      {/* Bloc 2 : Alertes PD */}
      {molecule.alertes_pd.length > 0 && (
        <section className="mt-4 border-t border-navy-700 pt-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-300">⚠️ Alertes PD</h2>
          <div className="flex flex-wrap gap-2">
            {molecule.alertes_pd.map(code => <Badge key={code} code={code} />)}
          </div>
        </section>
      )}

      {/* Bloc 3 : Profil PK */}
      <section className="mt-4 border-t border-navy-700 pt-3 text-sm">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-400">💊 Profil PK</h2>
        <dl className="grid gap-1">
          {cypMajeur.length > 0 && <div><dt className="inline text-gray-400">Substrat majeur : </dt><dd className="inline text-gray-100">{cypMajeur.join(', ')}</dd></div>}
          {cypMineur.length > 0 && <div><dt className="inline text-gray-400">Substrat mineur : </dt><dd className="inline text-gray-100">{cypMineur.join(', ')}</dd></div>}
          <div><dt className="inline text-gray-400">Inhibiteur : </dt><dd className="inline text-gray-100">{inhib.length > 0 ? inhib.join(', ') : '—'}</dd></div>
          <div><dt className="inline text-gray-400">Inducteur : </dt><dd className="inline text-gray-100">{induc.length > 0 ? induc.join(', ') : '—'}</dd></div>
          {meta && <div><dt className="inline text-gray-400">Métabolite actif : </dt><dd className="inline text-gray-100">{meta}</dd></div>}
        </dl>
      </section>

      {/* Bloc 4 : PGx */}
      {pgxBest && (
        <section className="mt-4 border-t border-navy-700 pt-3 text-sm">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-300">🧬 Pharmacogénétique</h2>
          <p className="text-gray-100">
            {pgxBest.gene} — CPIC niveau {pgxBest.niveau_cpic} (recommandation actionnable)
          </p>
        </section>
      )}

      {/* Footer : maj + bouton */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-navy-700 pt-3 text-xs text-gray-400">
        <span>Dernière maj : {molecule.derniere_maj}</span>
        {inCart ? (
          <button
            type="button"
            onClick={() => cart.remove(molecule.id)}
            className="rounded-md border border-amber-600 bg-amber-600/20 px-3 py-1 text-amber-200 focus-ring"
          >
            ✓ Dans le panier — retirer
          </button>
        ) : (
          <button
            type="button"
            onClick={() => cart.add(molecule.id)}
            className="rounded-md border border-teal-500 bg-teal-600/20 px-3 py-1 text-teal-200 hover:bg-teal-600/30 focus-ring"
          >
            + Ajouter au comparateur
          </button>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 2 : Note — `useCart()` n'existe pas encore**

Le composant fait référence à `useCart()`. Il sera implémenté en Task 14. **À cette étape seulement, le type-check va échouer.** C'est normal en TDD descendant. On commit tel quel et le `tsc` repassera vert après Task 14.

Pour ne pas bloquer le commit, créer **temporairement** un stub `src/context/CartContext.tsx` minimal :

```typescript
// src/context/CartContext.tsx (stub temporaire — sera remplacé en Task 14)
export function useCart() {
  return {
    ids: new Set<string>(),
    add: (_id: string) => {},
    remove: (_id: string) => {},
    clear: () => {},
    size: 0,
  };
}
```

- [ ] **Step 3 : Type-check + commit**

```bash
npx tsc -b
git add src/components/molecule/SummaryHeader.tsx src/context/CartContext.tsx
git commit -m "feat(molecule): SummaryHeader — bandeau résumé 4 blocs (stub useCart)"
```

---

## Task 11 : Sections accordéon de la fiche

**Files:**
- Create: `src/components/molecule/SectionPhase1Cyp.tsx`
- Create: `src/components/molecule/SectionPhase1NonCyp.tsx`
- Create: `src/components/molecule/SectionPhase2.tsx`
- Create: `src/components/molecule/SectionTransporteurs.tsx`
- Create: `src/components/molecule/SectionInhibiteur.tsx`
- Create: `src/components/molecule/SectionInducteur.tsx`
- Create: `src/components/molecule/SectionPgx.tsx`
- Create: `src/components/molecule/SectionInteractions.tsx`
- Create: `src/components/molecule/SectionAlertesPd.tsx`
- Create: `src/components/molecule/SectionZoneGrise.tsx`
- Create: `src/components/molecule/SectionSources.tsx`

Pattern commun : chaque section reçoit `molecule: Molecule` et `defaultOpen?: boolean`. Utilise `<Accordion>`. Si la donnée est absente, retourne `null` (la section ne s'affiche pas) — ne pas afficher d'accordéon vide.

- [ ] **Step 1 : `SectionPhase1Cyp.tsx`**

```tsx
// src/components/molecule/SectionPhase1Cyp.tsx
import type { Molecule } from '../../types/molecule';
import { Accordion } from '../ui/Accordion';
import { normalizeSources } from '../../types/molecule';
import { SourceLink } from '../ui/SourceLink';

export function SectionPhase1Cyp({ molecule, defaultOpen }: { molecule: Molecule; defaultOpen?: boolean }) {
  if (molecule.phase1_cyp.length === 0) return null;
  return (
    <Accordion title={`Phase I — CYP (${molecule.phase1_cyp.length})`} defaultOpen={defaultOpen}>
      <ul className="space-y-2">
        {molecule.phase1_cyp.map((e, i) => (
          <li key={i} className="rounded-md border border-navy-700 bg-navy-800/50 p-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-teal-400">{e.isoforme}</span>
              <span className="text-xs text-gray-400">{e.rang} · {e.preuve}</span>
            </div>
            <p className="mt-1 text-xs text-gray-300">{e.produit}</p>
            <p className="mt-1 flex flex-wrap gap-2">
              {normalizeSources(e.source).map((s, j) => <SourceLink key={j} source={s} />)}
            </p>
          </li>
        ))}
      </ul>
    </Accordion>
  );
}
```

- [ ] **Step 2 : `SectionPhase1NonCyp.tsx` (pattern similaire, champ `enzyme` au lieu de `isoforme`, ajouter `alias` si présent)**

```tsx
import type { Molecule } from '../../types/molecule';
import { Accordion } from '../ui/Accordion';
import { normalizeSources } from '../../types/molecule';
import { SourceLink } from '../ui/SourceLink';

export function SectionPhase1NonCyp({ molecule, defaultOpen }: { molecule: Molecule; defaultOpen?: boolean }) {
  if (molecule.phase1_non_cyp.length === 0) return null;
  return (
    <Accordion title={`Phase I — non-CYP (${molecule.phase1_non_cyp.length})`} defaultOpen={defaultOpen}>
      <ul className="space-y-2">
        {molecule.phase1_non_cyp.map((e, i) => (
          <li key={i} className="rounded-md border border-navy-700 bg-navy-800/50 p-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-teal-400">{e.enzyme}{e.alias ? ` (${e.alias})` : ''}</span>
              <span className="text-xs text-gray-400">{e.rang} · {e.preuve}</span>
            </div>
            <p className="mt-1 text-xs text-gray-300">{e.produit}</p>
            <p className="mt-1 flex flex-wrap gap-2">
              {normalizeSources(e.source).map((s, j) => <SourceLink key={j} source={s} />)}
            </p>
          </li>
        ))}
      </ul>
    </Accordion>
  );
}
```

- [ ] **Step 3 : `SectionPhase2.tsx` (pattern Phase II, structure identique non-CYP sans alias)**

```tsx
import type { Molecule } from '../../types/molecule';
import { Accordion } from '../ui/Accordion';
import { normalizeSources } from '../../types/molecule';
import { SourceLink } from '../ui/SourceLink';

export function SectionPhase2({ molecule, defaultOpen }: { molecule: Molecule; defaultOpen?: boolean }) {
  if (molecule.phase2.length === 0) return null;
  return (
    <Accordion title={`Phase II (${molecule.phase2.length})`} defaultOpen={defaultOpen}>
      <ul className="space-y-2">
        {molecule.phase2.map((e, i) => (
          <li key={i} className="rounded-md border border-navy-700 bg-navy-800/50 p-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-teal-400">{e.enzyme}</span>
              <span className="text-xs text-gray-400">{e.rang} · {e.preuve}</span>
            </div>
            <p className="mt-1 text-xs text-gray-300">{e.produit}</p>
            <p className="mt-1 flex flex-wrap gap-2">
              {normalizeSources(e.source).map((s, j) => <SourceLink key={j} source={s} />)}
            </p>
          </li>
        ))}
      </ul>
    </Accordion>
  );
}
```

- [ ] **Step 4 : `SectionTransporteurs.tsx`**

```tsx
import type { Molecule } from '../../types/molecule';
import { Accordion } from '../ui/Accordion';
import { normalizeSources } from '../../types/molecule';
import { SourceLink } from '../ui/SourceLink';

export function SectionTransporteurs({ molecule, defaultOpen }: { molecule: Molecule; defaultOpen?: boolean }) {
  if (molecule.transporteurs.length === 0) return null;
  return (
    <Accordion title={`Transporteurs (${molecule.transporteurs.length})`} defaultOpen={defaultOpen}>
      <ul className="space-y-2">
        {molecule.transporteurs.map((e, i) => (
          <li key={i} className="rounded-md border border-navy-700 bg-navy-800/50 p-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-teal-400">{e.transporteur}</span>
              <span className="text-xs text-gray-400">{e.role} · {e.preuve}</span>
            </div>
            <p className="mt-1 flex flex-wrap gap-2">
              {normalizeSources(e.source).map((s, j) => <SourceLink key={j} source={s} />)}
            </p>
          </li>
        ))}
      </ul>
    </Accordion>
  );
}
```

- [ ] **Step 5 : `SectionInhibiteur.tsx` et `SectionInducteur.tsx` (pattern symétrique)**

```tsx
// src/components/molecule/SectionInhibiteur.tsx
import type { Molecule } from '../../types/molecule';
import { Accordion } from '../ui/Accordion';
import { normalizeSources } from '../../types/molecule';
import { SourceLink } from '../ui/SourceLink';

export function SectionInhibiteur({ molecule, defaultOpen }: { molecule: Molecule; defaultOpen?: boolean }) {
  if (molecule.inhibiteur.length === 0) return null;
  return (
    <Accordion title={`Inhibiteur (${molecule.inhibiteur.length})`} defaultOpen={defaultOpen}>
      <ul className="space-y-2">
        {molecule.inhibiteur.map((e, i) => (
          <li key={i} className="rounded-md border border-navy-700 bg-navy-800/50 p-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-teal-400">{e.cible}</span>
              <span className="text-xs text-gray-400">{e.puissance} · {e.mecanisme} · {e.preuve}</span>
            </div>
            <p className="mt-1 flex flex-wrap gap-2">
              {normalizeSources(e.source).map((s, j) => <SourceLink key={j} source={s} />)}
            </p>
          </li>
        ))}
      </ul>
    </Accordion>
  );
}
```

```tsx
// src/components/molecule/SectionInducteur.tsx — copie SectionInhibiteur en remplaçant
//   `inhibiteur` → `inducteur` et titre "Inducteur" en place de "Inhibiteur"
import type { Molecule } from '../../types/molecule';
import { Accordion } from '../ui/Accordion';
import { normalizeSources } from '../../types/molecule';
import { SourceLink } from '../ui/SourceLink';

export function SectionInducteur({ molecule, defaultOpen }: { molecule: Molecule; defaultOpen?: boolean }) {
  if (molecule.inducteur.length === 0) return null;
  return (
    <Accordion title={`Inducteur (${molecule.inducteur.length})`} defaultOpen={defaultOpen}>
      <ul className="space-y-2">
        {molecule.inducteur.map((e, i) => (
          <li key={i} className="rounded-md border border-navy-700 bg-navy-800/50 p-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-teal-400">{e.cible}</span>
              <span className="text-xs text-gray-400">{e.puissance} · {e.mecanisme} · {e.preuve}</span>
            </div>
            <p className="mt-1 flex flex-wrap gap-2">
              {normalizeSources(e.source).map((s, j) => <SourceLink key={j} source={s} />)}
            </p>
          </li>
        ))}
      </ul>
    </Accordion>
  );
}
```

- [ ] **Step 6 : `SectionPgx.tsx`**

```tsx
import type { Molecule } from '../../types/molecule';
import { Accordion } from '../ui/Accordion';
import { variantsToString } from '../../utils/pgx';
import { normalizeSources } from '../../types/molecule';
import { SourceLink } from '../ui/SourceLink';
import { Badge } from '../ui/Badge';

export function SectionPgx({ molecule, defaultOpen }: { molecule: Molecule; defaultOpen?: boolean }) {
  const real = molecule.pharmacogenetique.filter(p => p.gene !== 'ND');
  if (real.length === 0) return null;
  return (
    <Accordion title={`Pharmacogénétique détaillée (${real.length})`} defaultOpen={defaultOpen}>
      <ul className="space-y-2">
        {real.map((p, i) => (
          <li key={i} className="rounded-md border border-navy-700 bg-navy-800/50 p-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-teal-400">{p.gene}</span>
              <span className="text-xs text-gray-400">variants : {variantsToString(p.variants)}</span>
              {p.zone_grise && <Badge label="Zone grise" severity="amber" />}
              <span className="ml-auto text-xs text-gray-400">CPIC {p.niveau_cpic} · {p.phenotype}</span>
            </div>
            <p className="mt-2 text-sm text-gray-100">{p.recommandation}</p>
            <p className="mt-1 flex flex-wrap gap-2">
              {normalizeSources(p.source).map((s, j) => <SourceLink key={j} source={s} />)}
            </p>
          </li>
        ))}
      </ul>
    </Accordion>
  );
}
```

- [ ] **Step 7 : `SectionInteractions.tsx`**

```tsx
import type { Molecule } from '../../types/molecule';
import { Accordion } from '../ui/Accordion';
import { normalizeSources } from '../../types/molecule';
import { SourceLink } from '../ui/SourceLink';

export function SectionInteractions({ molecule, defaultOpen }: { molecule: Molecule; defaultOpen?: boolean }) {
  if (molecule.interactions_specifiques.length === 0) return null;
  return (
    <Accordion title={`Interactions documentées (${molecule.interactions_specifiques.length})`} defaultOpen={defaultOpen}>
      <ul className="space-y-2">
        {molecule.interactions_specifiques.map((e, i) => (
          <li key={i} className="rounded-md border border-navy-700 bg-navy-800/50 p-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-100">avec {e.avec}</span>
              <span className="text-xs text-gray-400">{e.preuve}</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">Mécanisme : {e.mecanisme}</p>
            <p className="mt-1 text-sm text-gray-200">{e.effet}</p>
            {e.timing && <p className="mt-1 text-xs italic text-amber-300">Timing : {e.timing}</p>}
            <p className="mt-1 flex flex-wrap gap-2">
              {normalizeSources(e.source).map((s, j) => <SourceLink key={j} source={s} />)}
            </p>
          </li>
        ))}
      </ul>
    </Accordion>
  );
}
```

- [ ] **Step 8 : `SectionAlertesPd.tsx`**

```tsx
import type { Molecule } from '../../types/molecule';
import { Accordion } from '../ui/Accordion';
import { Badge } from '../ui/Badge';
import { pdAlertLabel } from '../../utils/labels';

export function SectionAlertesPd({ molecule, defaultOpen }: { molecule: Molecule; defaultOpen?: boolean }) {
  if (molecule.alertes_pd.length === 0) return null;
  return (
    <Accordion title={`Alertes PD détaillées (${molecule.alertes_pd.length})`} defaultOpen={defaultOpen}>
      <dl className="space-y-2">
        {molecule.alertes_pd.map(code => {
          const r = pdAlertLabel(code);
          return (
            <div key={code} className="flex flex-col gap-1 rounded-md border border-navy-700 bg-navy-800/50 p-2">
              <Badge code={code} />
              <dd className="text-xs text-gray-400">Code : <code>{code}</code></dd>
            </div>
          );
        })}
      </dl>
    </Accordion>
  );
}
```

- [ ] **Step 9 : `SectionZoneGrise.tsx` — compteur des cellules zone_grise (PGx essentiellement)**

```tsx
import type { Molecule } from '../../types/molecule';
import { Accordion } from '../ui/Accordion';
import { Badge } from '../ui/Badge';

export function SectionZoneGrise({ molecule, defaultOpen }: { molecule: Molecule; defaultOpen?: boolean }) {
  const greyPgx = molecule.pharmacogenetique.filter(p => p.zone_grise);
  const flagged = molecule.zone_grise;
  if (!flagged && greyPgx.length === 0 && molecule.champ_manquants.length === 0) return null;

  return (
    <Accordion title="Zone grise" defaultOpen={defaultOpen} badge={<Badge label={`${greyPgx.length}`} severity="amber" />}>
      {flagged && <p className="mb-2 text-sm text-amber-300">Cette molécule est globalement marquée en zone grise.</p>}
      {greyPgx.length > 0 && (
        <>
          <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Cellules PGx en zone grise</p>
          <ul className="ml-4 list-disc text-sm text-gray-200">
            {greyPgx.map((p, i) => <li key={i}>{p.gene} — {p.recommandation}</li>)}
          </ul>
        </>
      )}
      {molecule.champ_manquants.length > 0 && (
        <>
          <p className="mb-1 mt-3 text-xs font-semibold uppercase text-gray-400">Champs à compléter (veille)</p>
          <ul className="ml-4 list-disc text-sm text-gray-300">
            {molecule.champ_manquants.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </>
      )}
    </Accordion>
  );
}
```

- [ ] **Step 10 : `SectionSources.tsx` — agrégation et déduplication**

```tsx
import type { Molecule } from '../../types/molecule';
import { Accordion } from '../ui/Accordion';
import { SourceLink } from '../ui/SourceLink';
import { normalizeSources } from '../../types/molecule';

function collectAllSources(m: Molecule): string[] {
  const set = new Set<string>(m.sources_principales);
  const collect = (s: string | string[] | undefined) => {
    if (!s) return;
    normalizeSources(s).forEach(x => set.add(x));
  };
  m.phase1_cyp.forEach(e => collect(e.source));
  m.phase1_non_cyp.forEach(e => collect(e.source));
  m.phase2.forEach(e => collect(e.source));
  m.transporteurs.forEach(e => collect(e.source));
  m.inhibiteur.forEach(e => collect(e.source));
  m.inducteur.forEach(e => collect(e.source));
  m.pharmacogenetique.forEach(e => collect(e.source));
  m.interactions_specifiques.forEach(e => collect(e.source));
  return Array.from(set).filter(s => s !== 'ND').sort();
}

export function SectionSources({ molecule, defaultOpen }: { molecule: Molecule; defaultOpen?: boolean }) {
  const sources = collectAllSources(molecule);
  if (sources.length === 0) return null;
  return (
    <Accordion title={`Sources (${sources.length})`} defaultOpen={defaultOpen}>
      <ul className="grid gap-1">
        {sources.map(s => <li key={s}><SourceLink source={s} /></li>)}
      </ul>
    </Accordion>
  );
}
```

- [ ] **Step 11 : Type-check + commit**

```bash
npx tsc -b
git add src/components/molecule/
git commit -m "feat(molecule): 11 sections accordéon de la fiche détaillée"
```

---

## Task 12 : `MoleculeCard` — assemblage

**Files:**
- Create: `src/components/molecule/MoleculeCard.tsx`
- Create: `tests/MoleculeCard.test.tsx`

- [ ] **Step 1 : Implémenter le composant**

```tsx
// src/components/molecule/MoleculeCard.tsx
import type { Molecule } from '../../types/molecule';
import { SummaryHeader } from './SummaryHeader';
import { SectionPhase1Cyp } from './SectionPhase1Cyp';
import { SectionPhase1NonCyp } from './SectionPhase1NonCyp';
import { SectionPhase2 } from './SectionPhase2';
import { SectionTransporteurs } from './SectionTransporteurs';
import { SectionInhibiteur } from './SectionInhibiteur';
import { SectionInducteur } from './SectionInducteur';
import { SectionPgx } from './SectionPgx';
import { SectionInteractions } from './SectionInteractions';
import { SectionAlertesPd } from './SectionAlertesPd';
import { SectionZoneGrise } from './SectionZoneGrise';
import { SectionSources } from './SectionSources';

export type SectionId =
  | 'phase1Cyp' | 'phase1NonCyp' | 'phase2' | 'transporteurs'
  | 'inhibiteur' | 'inducteur' | 'pgx' | 'interactions'
  | 'alertesPd' | 'zoneGrise' | 'sources';

interface Props {
  molecule: Molecule;
  /** ID de section à ouvrir au mount (depuis ?openSection=) */
  openSection?: SectionId;
}

export function MoleculeCard({ molecule, openSection }: Props) {
  const isOpen = (id: SectionId) => openSection === id;
  return (
    <article className="space-y-1">
      <SummaryHeader molecule={molecule} />
      <div className="rounded-lg border border-navy-700 bg-navy-800">
        <SectionPhase1Cyp molecule={molecule} defaultOpen={isOpen('phase1Cyp')} />
        <SectionPhase1NonCyp molecule={molecule} defaultOpen={isOpen('phase1NonCyp')} />
        <SectionPhase2 molecule={molecule} defaultOpen={isOpen('phase2')} />
        <SectionTransporteurs molecule={molecule} defaultOpen={isOpen('transporteurs')} />
        <SectionInhibiteur molecule={molecule} defaultOpen={isOpen('inhibiteur')} />
        <SectionInducteur molecule={molecule} defaultOpen={isOpen('inducteur')} />
        <SectionPgx molecule={molecule} defaultOpen={isOpen('pgx')} />
        <SectionInteractions molecule={molecule} defaultOpen={isOpen('interactions')} />
        <SectionAlertesPd molecule={molecule} defaultOpen={isOpen('alertesPd')} />
        <SectionZoneGrise molecule={molecule} defaultOpen={isOpen('zoneGrise')} />
        <SectionSources molecule={molecule} defaultOpen={isOpen('sources')} />
      </div>
      <p className="px-3 pt-3 text-xs italic text-gray-500">
        Aide à la décision — non substitutive — voir <a href="#" className="underline">Disclaimer</a>.
      </p>
    </article>
  );
}
```

- [ ] **Step 2 : Tests smoke**

```tsx
// tests/MoleculeCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MoleculeCard } from '../src/components/molecule/MoleculeCard';
import { ALL_MOLECULES } from '../src/data';

const sample = ALL_MOLECULES[0];

describe('<MoleculeCard>', () => {
  it('rend sans crash sur une molécule réelle', () => {
    render(<BrowserRouter><MoleculeCard molecule={sample} /></BrowserRouter>);
    expect(screen.getByText(sample.nom_dci)).toBeInTheDocument();
  });

  it('affiche la classe et le statut', () => {
    render(<BrowserRouter><MoleculeCard molecule={sample} /></BrowserRouter>);
    expect(screen.getByText(sample.classe)).toBeInTheDocument();
    expect(screen.getByText(sample.statut_fr)).toBeInTheDocument();
  });

  it('garde toutes les sections accordéon repliées par défaut (texte des items non visible)', () => {
    render(<BrowserRouter><MoleculeCard molecule={sample} /></BrowserRouter>);
    // Le titre de section est cliquable, mais le contenu détaillé (ex. nom du produit phase1) doit être absent du DOM tant que l'accordéon est plié
    if (sample.phase1_cyp.length > 0) {
      const produit = sample.phase1_cyp[0].produit;
      expect(screen.queryByText(produit)).toBeNull();
    }
  });

  it('ouvre la section ciblée par openSection', () => {
    if (sample.phase1_cyp.length === 0) return; // skip si pas applicable
    render(<BrowserRouter><MoleculeCard molecule={sample} openSection="phase1Cyp" /></BrowserRouter>);
    expect(screen.getByText(sample.phase1_cyp[0].produit)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3 : Lancer les tests**

Run : `npm run test -- tests/MoleculeCard.test.tsx`
Expected : tous PASS.

- [ ] **Step 4 : Commit**

```bash
git add src/components/molecule/MoleculeCard.tsx tests/MoleculeCard.test.tsx
git commit -m "feat(molecule): MoleculeCard — assemblage SummaryHeader + 11 sections"
```

---

# Session 4 — Contexts + Module 1

## Task 13 : `DisclaimerContext` + `DisclaimerGate` + `DisclaimerModal`

**Files:**
- Create: `src/context/DisclaimerContext.tsx`
- Create: `src/components/DisclaimerModal.tsx`
- Create: `src/components/DisclaimerGate.tsx`

- [ ] **Step 1 : `DisclaimerContext.tsx`**

```tsx
// src/context/DisclaimerContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export const DISCLAIMER_VERSION = '1.0';
const STORAGE_KEY = 'metaboscope.disclaimer.accepted_v1';

interface Stored {
  version: string;
  date: string;
}

interface DisclaimerContextValue {
  accepted: boolean;
  acceptedVersion: string | null;
  accept: () => void;
}

const DisclaimerContext = createContext<DisclaimerContextValue | null>(null);

export function DisclaimerProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<Stored | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setStored(JSON.parse(raw) as Stored);
    } catch { /* localStorage indisponible — disclaimer affiché par sécurité */ }
  }, []);

  const accepted = stored?.version === DISCLAIMER_VERSION;

  function accept() {
    const payload: Stored = { version: DISCLAIMER_VERSION, date: new Date().toISOString() };
    setStored(payload);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch { /* noop */ }
  }

  return (
    <DisclaimerContext.Provider value={{ accepted, acceptedVersion: stored?.version ?? null, accept }}>
      {children}
    </DisclaimerContext.Provider>
  );
}

export function useDisclaimer() {
  const ctx = useContext(DisclaimerContext);
  if (!ctx) throw new Error('useDisclaimer doit être utilisé dans <DisclaimerProvider>');
  return ctx;
}
```

- [ ] **Step 2 : `DisclaimerModal.tsx` (réutilisable, 2 modes)**

```tsx
// src/components/DisclaimerModal.tsx
import { DISCLAIMER_TEXT } from './Disclaimer';
import { DISCLAIMER_VERSION } from '../context/DisclaimerContext';

interface Props {
  mode: 'gate' | 'readonly';
  onAccept?: () => void;
  onClose?: () => void;
}

export function DisclaimerModal({ mode, onAccept, onClose }: Props) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="disclaimer-title"
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="max-w-xl rounded-lg border border-navy-700 bg-navy-900 p-6 shadow-xl">
        <h2 id="disclaimer-title" className="mb-3 text-lg font-bold text-gray-100">
          MétaboScope — Avertissement clinique
        </h2>
        <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-gray-200">
          {DISCLAIMER_TEXT}
        </p>
        <p className="mb-4 text-xs text-gray-500">
          Version disclaimer : {DISCLAIMER_VERSION}
        </p>
        <div className="flex justify-end gap-2">
          {mode === 'gate' && (
            <button
              type="button"
              onClick={onAccept}
              className="rounded-md border border-teal-500 bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 focus-ring"
            >
              J'ai lu et j'accepte
            </button>
          )}
          {mode === 'readonly' && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600 focus-ring"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3 : `DisclaimerGate.tsx`**

```tsx
// src/components/DisclaimerGate.tsx
import { useDisclaimer } from '../context/DisclaimerContext';
import { DisclaimerModal } from './DisclaimerModal';
import type { ReactNode } from 'react';

export function DisclaimerGate({ children }: { children: ReactNode }) {
  const { accepted, accept } = useDisclaimer();
  if (!accepted) {
    return <DisclaimerModal mode="gate" onAccept={accept} />;
  }
  return <>{children}</>;
}
```

- [ ] **Step 4 : Type-check + commit**

```bash
npx tsc -b
git add src/context/DisclaimerContext.tsx src/components/DisclaimerModal.tsx src/components/DisclaimerGate.tsx
git commit -m "feat(disclaimer): Context versionné + Gate + Modal réutilisable"
```

---

## Task 14 : `CartContext` (remplace le stub de Task 10)

**Files:**
- Modify: `src/context/CartContext.tsx`

- [ ] **Step 1 : Remplacer le stub par l'implémentation complète**

```tsx
// src/context/CartContext.tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

const SOFT_LIMIT = 6;

interface CartContextValue {
  ids: Set<string>;
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  size: number;
  /** True quand size > SOFT_LIMIT — UI doit afficher un avertissement */
  overSoftLimit: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(() => new Set());

  const add = useCallback((id: string) => {
    setIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setIds(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setIds(new Set()), []);

  return (
    <CartContext.Provider value={{ ids, add, remove, clear, size: ids.size, overSoftLimit: ids.size > SOFT_LIMIT }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé dans <CartProvider>');
  return ctx;
}
```

- [ ] **Step 2 : Type-check + commit**

```bash
npx tsc -b
git add src/context/CartContext.tsx
git commit -m "feat(cart): CartContext additif mémoire-seule + soft limit 6"
```

---

## Task 15 : `SearchPage`

**Files:**
- Create: `src/pages/SearchPage.tsx`

- [ ] **Step 1 : Implémenter**

```tsx
// src/pages/SearchPage.tsx
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchMolecules, ALL_MOLECULES, CLASSES } from '../data';
import type { Molecule } from '../types/molecule';
import { AutoComplete } from '../components/ui/AutoComplete';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { useCart } from '../context/CartContext';
import { pdAlertLabel } from '../utils/labels';

type Filter = 'all' | 'meds' | 'drogues' | 'nps';

const FILTERS: { id: Filter; label: string; match: (m: Molecule) => boolean }[] = [
  { id: 'all',     label: 'Tous',         match: () => true },
  { id: 'meds',    label: 'Médicaments',  match: m => !/\b(nps|drogue|alcool|cannabi|hallucinog|dissociatif|stimulant illicite|stupéfiant|cathinone|nitazène)\b/i.test(m.classe) },
  { id: 'drogues', label: 'Drogues',      match: m => /\b(drogue|alcool|cannabi|hallucinog|dissociatif|stimulant illicite|stupéfiant)\b/i.test(m.classe) },
  { id: 'nps',     label: 'NPS',          match: m => /\b(nps|cathinone|nitazène)\b/i.test(m.classe) },
];

export function SearchPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filterFn = FILTERS.find(f => f.id === filter)!.match;

  const visible = useMemo<Molecule[]>(() => {
    if (query.trim().length >= 2) return searchMolecules(query).filter(filterFn);
    return ALL_MOLECULES.filter(filterFn);
  }, [query, filterFn]);

  const search = useCallback((q: string) => searchMolecules(q).filter(filterFn), [filterFn]);

  function toggleSelected(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function commitSelection() {
    selected.forEach(id => cart.add(id));
    setSelected(new Set());
    setSelectMode(false);
    navigate('/interactions');
  }

  return (
    <div className="space-y-4 pb-24">
      <header className="space-y-3">
        <h1 className="text-xl font-bold text-gray-100">Recherche</h1>
        <AutoComplete<Molecule>
          placeholder="DCI, nom commercial, ou nom de rue NPS"
          search={search}
          renderItem={m => (
            <div>
              <div className="font-medium text-gray-100">{m.nom_dci}</div>
              <div className="text-xs text-gray-400">{m.classe}</div>
            </div>
          )}
          itemKey={m => m.id}
          onSelect={m => navigate(`/search/${m.id}`)}
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button key={f.id} type="button" onClick={() => setFilter(f.id)}
                    className={`rounded-full border px-3 py-1 text-xs focus-ring ${
                      filter === f.id ? 'border-teal-500 bg-teal-600/30 text-teal-200' : 'border-navy-700 bg-navy-800 text-gray-300 hover:bg-navy-700'
                    }`}>
              {f.label}
            </button>
          ))}
          <button type="button" onClick={() => { setSelectMode(s => !s); setSelected(new Set()); }}
                  className={`ml-auto rounded-full border px-3 py-1 text-xs focus-ring ${
                    selectMode ? 'border-amber-500 bg-amber-600/30 text-amber-200' : 'border-navy-700 bg-navy-800 text-gray-300 hover:bg-navy-700'
                  }`}>
            {selectMode ? 'Quitter sélection' : 'Mode sélection'}
          </button>
        </div>
      </header>

      {visible.length === 0 ? (
        <EmptyState title="Aucune molécule" hint="Essayez une autre orthographe, un synonyme, ou changez de filtre." />
      ) : (
        <ul className="space-y-2">
          {visible.map(m => {
            const checked = selected.has(m.id);
            return (
              <li key={m.id}
                  className={`rounded-lg border p-3 ${checked ? 'border-amber-500 bg-amber-600/10' : 'border-navy-700 bg-navy-800'}`}>
                <button type="button"
                        onClick={() => selectMode ? toggleSelected(m.id) : navigate(`/search/${m.id}`)}
                        className="flex w-full items-start gap-3 text-left focus-ring">
                  {selectMode && (
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded border border-navy-600 bg-navy-900 text-xs"
                          aria-hidden>{checked ? '✓' : ''}</span>
                  )}
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold text-gray-100">{m.nom_dci}</span>
                      <span className="text-xs text-teal-400">{m.classe}</span>
                    </div>
                    {m.synonymes.length > 0 && <p className="text-xs text-gray-500">{m.synonymes.slice(0, 3).join(', ')}</p>}
                    {m.alertes_pd.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {m.alertes_pd.slice(0, 3).map(c => {
                          const r = pdAlertLabel(c);
                          if (r.severity === 'red' || r.severity === 'amber') return <Badge key={c} code={c} />;
                          return null;
                        }).filter(Boolean)}
                      </div>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selectMode && (
        <div className="fixed inset-x-0 bottom-16 z-20 mx-auto flex max-w-3xl items-center justify-between gap-2 border-t border-navy-700 bg-navy-900/95 p-3 backdrop-blur sm:bottom-0">
          <span className="text-sm text-gray-300">{selected.size} sélectionnée(s)</span>
          <div className="flex items-center gap-2">
            {selected.size > 6 && <span className="text-xs text-amber-300">Au-delà de 6 : lisibilité dégradée</span>}
            <button type="button" disabled={selected.size < 2} onClick={commitSelection}
                    className="rounded-md border border-teal-500 bg-teal-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 focus-ring">
              Comparer {selected.size > 0 ? selected.size : ''} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2 : Type-check + commit**

```bash
npx tsc -b
git add src/pages/SearchPage.tsx
git commit -m "feat(pages): SearchPage — autocomplete + filtres + multi-select"
```

---

## Task 16 : `MoleculePage`

**Files:**
- Create: `src/pages/MoleculePage.tsx`

- [ ] **Step 1 : Implémenter**

```tsx
// src/pages/MoleculePage.tsx
import { useParams, useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import { MOLECULES_BY_ID } from '../data';
import { MoleculeCard, type SectionId } from '../components/molecule/MoleculeCard';

const VALID_SECTIONS: SectionId[] = [
  'phase1Cyp', 'phase1NonCyp', 'phase2', 'transporteurs',
  'inhibiteur', 'inducteur', 'pgx', 'interactions',
  'alertesPd', 'zoneGrise', 'sources',
];

export function MoleculePage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  if (!id) return <Navigate to="/search" replace />;
  const molecule = MOLECULES_BY_ID[id];
  if (!molecule) return <Navigate to="/search" replace />;

  const requested = params.get('openSection');
  const openSection = VALID_SECTIONS.includes(requested as SectionId)
    ? (requested as SectionId)
    : undefined;

  return (
    <div className="space-y-3 pb-20">
      <button type="button" onClick={() => navigate(-1)}
              className="text-sm text-teal-400 hover:text-teal-300 focus-ring">
        ← Retour
      </button>
      <MoleculeCard molecule={molecule} openSection={openSection} />
    </div>
  );
}
```

- [ ] **Step 2 : Type-check + commit**

```bash
npx tsc -b
git add src/pages/MoleculePage.tsx
git commit -m "feat(pages): MoleculePage — fiche détaillée avec ?openSection="
```

---

## Task 17 : Câblage `App.tsx` + `Layout.tsx` + `main.tsx`

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Layout.tsx`
- Modify: `src/main.tsx`
- Delete: `src/pages/SubstancesPage.tsx`

- [ ] **Step 1 : Mettre à jour `App.tsx` avec les routes**

Remplacer le contenu de `src/App.tsx` :

```tsx
// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { MoleculePage } from './pages/MoleculePage';
import { InteractionPage } from './pages/InteractionPage';
import { AtlasPage } from './pages/AtlasPage';

export default function App() {
  return (
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
  );
}
```

(Note : `AtlasPage` est encore inexistant à cette étape ; on le créera Task 19. Pour ne pas casser le build, créer un stub minimal `src/pages/AtlasPage.tsx` contenant `export function AtlasPage() { return <p>Atlas — bientôt</p>; }`. Idem si `InteractionPage` n'a pas encore été refactorisé : laisser le contenu actuel.)

- [ ] **Step 2 : Mettre à jour `Layout.tsx` avec 3 onglets bottom + lien Disclaimer**

Repérer le composant Layout actuel et adapter sa navbar pour exposer 3 liens : `/search`, `/interactions`, `/atlas`. Supprimer le lien vers `/substances`. Ajouter dans le footer un lien `Disclaimer` qui ouvre `<DisclaimerModal mode="readonly" />`.

```tsx
// src/components/Layout.tsx
import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { OfflineBanner } from './OfflineBanner';
import { DisclaimerModal } from './DisclaimerModal';
import { useCart } from '../context/CartContext';

const TABS = [
  { to: '/search',       label: 'Recherche',     icon: '🔍' },
  { to: '/interactions', label: 'Interactions',  icon: '⚖️' },
  { to: '/atlas',        label: 'Atlas',         icon: '📊' },
];

export function Layout() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const cart = useCart();
  return (
    <div className="min-h-screen bg-navy-900 text-gray-100">
      <OfflineBanner />
      <main className="mx-auto max-w-3xl px-3 pt-4 pb-24 sm:pb-4">
        <Outlet />
      </main>
      {/* Navigation : bottom sur mobile, dans le flow sur desktop */}
      <nav aria-label="Navigation principale"
           className="fixed inset-x-0 bottom-0 z-30 border-t border-navy-700 bg-navy-900/95 backdrop-blur sm:static sm:border-none sm:bg-transparent">
        <ul className="mx-auto flex max-w-3xl items-stretch sm:items-center sm:justify-center sm:gap-2 sm:py-2">
          {TABS.map(t => (
            <li key={t.to} className="flex-1 sm:flex-none">
              <NavLink to={t.to} end={t.to === '/search' ? false : true}
                       className={({ isActive }) =>
                         `flex flex-col items-center justify-center gap-0.5 px-2 py-2 text-xs font-medium focus-ring sm:flex-row sm:gap-2 sm:rounded-md sm:px-4 sm:py-2 ${
                           isActive ? 'text-teal-400 sm:bg-teal-600/20' : 'text-gray-300 hover:text-gray-100'
                         }`}>
                <span aria-hidden>{t.icon}</span>
                <span>{t.label}</span>
                {t.to === '/interactions' && cart.size > 0 && (
                  <span aria-label={`${cart.size} molécules`}
                        className="ml-1 inline-flex min-w-[1.25rem] justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-navy-900">
                    {cart.size}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <footer className="border-t border-navy-700 bg-navy-900 px-3 py-2 text-center text-xs text-gray-500 sm:py-3">
        <button type="button" onClick={() => setShowDisclaimer(true)} className="underline hover:text-gray-300 focus-ring">
          Disclaimer
        </button>
      </footer>
      {showDisclaimer && <DisclaimerModal mode="readonly" onClose={() => setShowDisclaimer(false)} />}
    </div>
  );
}
```

- [ ] **Step 3 : Mettre à jour `main.tsx` avec providers**

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CartProvider } from './context/CartContext';
import { DisclaimerProvider } from './context/DisclaimerContext';
import { DisclaimerGate } from './components/DisclaimerGate';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DisclaimerProvider>
      <CartProvider>
        <DisclaimerGate>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </DisclaimerGate>
      </CartProvider>
    </DisclaimerProvider>
  </React.StrictMode>
);
```

- [ ] **Step 4 : Supprimer `SubstancesPage.tsx`**

```bash
git rm src/pages/SubstancesPage.tsx
```

- [ ] **Step 5 : Build complet**

Run : `npm run build`
Expected : build OK, dist généré.

- [ ] **Step 6 : Test manuel rapide**

Run : `npm run dev`
Expected : `http://localhost:5173` charge la modale Disclaimer au premier lancement. Après acceptation, page d'accueil + nav 3 onglets fonctionnelle. Recherche → fiche → bouton "Ajouter au comparateur" → badge sur l'onglet Interactions.

- [ ] **Step 7 : Commit**

```bash
git add -A
git commit -m "feat(routing): 3 onglets + DisclaimerGate + suppression SubstancesPage"
```

---

# Session 5 — Module 2 (Vérificateur)

## Task 18 : `PdAlertCard` + refactor `InteractionPage`

**Files:**
- Create: `src/components/molecule/PdAlertCard.tsx`
- Modify: `src/pages/InteractionPage.tsx`

- [ ] **Step 1 : `PdAlertCard.tsx`**

```tsx
// src/components/molecule/PdAlertCard.tsx
import type { Severity } from '../../utils/labels';
import { severityClass } from '../../utils/labels';

interface Contributor {
  molecule: string;
  weight: number;
  label: string;
}

interface Props {
  title: string;
  severity: Severity;
  score?: number;
  threshold?: string;
  contributors: Contributor[];
  conduct?: string;
  emptyMessage?: string;
}

export function PdAlertCard({ title, severity, score, threshold, contributors, conduct, emptyMessage }: Props) {
  return (
    <article className="rounded-lg border border-navy-700 bg-navy-800">
      <header className={`flex items-center justify-between rounded-t-lg px-3 py-2 ${severityClass(severity)}`}>
        <h3 className="font-semibold">{title}</h3>
        {typeof score === 'number' && <span className="text-sm font-mono">Score : {score}</span>}
      </header>
      <div className="space-y-2 p-3 text-sm text-gray-200">
        {threshold && <p className="text-xs italic text-gray-400">{threshold}</p>}
        {contributors.length === 0 ? (
          <p className="text-gray-500">{emptyMessage ?? 'Aucun contributeur identifié.'}</p>
        ) : (
          <ul className="space-y-1">
            {contributors.map((c, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-gray-100">{c.molecule}</span>
                <span className="text-xs text-gray-400">{c.label}</span>
              </li>
            ))}
          </ul>
        )}
        {conduct && <p className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-200">⚠️ {conduct}</p>}
      </div>
    </article>
  );
}
```

- [ ] **Step 2 : Refactor `InteractionPage.tsx`**

```tsx
// src/pages/InteractionPage.tsx
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { MOLECULES_BY_ID } from '../data';
import {
  scoreQT, scoreSero, scoreResp, scoreAcb, scoreSeuilEp,
  detectPkPairs, findDocumentedInteractions,
} from '../utils/scoring';
import { PdAlertCard } from '../components/molecule/PdAlertCard';
import { Accordion } from '../components/ui/Accordion';
import { SourceLink } from '../components/ui/SourceLink';
import { EmptyState } from '../components/ui/EmptyState';
import { normalizeSources } from '../types/molecule';

export function InteractionPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const molecules = useMemo(() => Array.from(cart.ids).map(id => MOLECULES_BY_ID[id]).filter(Boolean), [cart.ids]);

  if (molecules.length < 2) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-gray-100">Vérificateur d'interactions</h1>
        <EmptyState
          title={molecules.length === 0 ? 'Panier vide' : '1 molécule seulement'}
          hint="Ajoute au moins 2 molécules depuis la recherche pour lancer une analyse cumulée."
        />
        <button type="button" onClick={() => navigate('/search')}
                className="rounded-md border border-teal-500 bg-teal-600 px-4 py-2 text-sm text-white focus-ring">
          + Choisir des molécules
        </button>
      </div>
    );
  }

  const qt = scoreQT(molecules);
  const sero = scoreSero(molecules);
  const resp = scoreResp(molecules);
  const acb = scoreAcb(molecules);
  const sep = scoreSeuilEp(molecules);
  const pkPairs = detectPkPairs(molecules);
  const docInter = findDocumentedInteractions(molecules);

  // PGx rappel — niveau A
  const pgxA = molecules.flatMap(m =>
    m.pharmacogenetique
      .filter(p => p.niveau_cpic === 'A' && p.gene !== 'ND')
      .map(p => ({ molecule: m, pgx: p }))
  );

  // Sources consolidées
  const allSources = new Set<string>();
  for (const m of molecules) {
    m.sources_principales.forEach(s => allSources.add(s));
    [...m.phase1_cyp, ...m.phase1_non_cyp, ...m.phase2, ...m.transporteurs,
     ...m.inhibiteur, ...m.inducteur, ...m.pharmacogenetique, ...m.interactions_specifiques]
      .forEach(e => normalizeSources(e.source).forEach(s => allSources.add(s)));
  }
  const sortedSources = Array.from(allSources).filter(s => s !== 'ND').sort();

  return (
    <div className="space-y-4 pb-20">
      <h1 className="text-xl font-bold text-gray-100">Vérificateur d'interactions</h1>

      {/* 1. Panier */}
      <section className="rounded-lg border border-navy-700 bg-navy-800 p-3">
        <header className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-100">Panier d'analyse ({molecules.length})</h2>
          {cart.overSoftLimit && <span className="text-xs text-amber-300">Au-delà de 6 : lisibilité dégradée</span>}
        </header>
        <ul className="flex flex-wrap gap-2">
          {molecules.map(m => (
            <li key={m.id}>
              <button type="button" onClick={() => cart.remove(m.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-teal-500 bg-teal-600/30 px-3 py-1 text-xs text-teal-100 hover:border-red-500 hover:bg-red-600/30 focus-ring">
                {m.nom_dci} <span aria-hidden>×</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => navigate('/search')}
                  className="rounded-md border border-navy-600 bg-navy-700 px-3 py-1 text-xs text-gray-200 focus-ring">
            + Ajouter
          </button>
          <button type="button" onClick={() => cart.clear()}
                  className="rounded-md border border-navy-600 bg-navy-700 px-3 py-1 text-xs text-gray-300 focus-ring">
            Vider
          </button>
        </div>
      </section>

      {/* 2. Paires PK */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-teal-400">💊 Paires PK documentées</h2>
        {pkPairs.length === 0 && docInter.length === 0 ? (
          <p className="rounded-md border border-navy-700 bg-navy-800 p-3 text-sm text-gray-400">Aucune paire PK détectée.</p>
        ) : (
          <ul className="space-y-2">
            {pkPairs.map((p, i) => (
              <li key={`pk-${i}`} className="rounded-lg border border-amber-500/40 bg-navy-800 p-3">
                <p className="text-sm text-gray-100"><strong>{p.substrat.nom_dci} ↔ {p.modulateur.nom_dci}</strong></p>
                <p className="mt-1 text-xs text-amber-300">{p.mecanisme}</p>
                <p className="mt-1 text-xs text-gray-400">{p.effet}</p>
              </li>
            ))}
            {docInter.map((d, i) => (
              <li key={`doc-${i}`} className="rounded-lg border border-navy-700 bg-navy-800 p-3">
                <p className="text-sm text-gray-100"><strong>{d.molecule.nom_dci} ↔ {d.interaction.avec}</strong></p>
                <p className="mt-1 text-xs text-amber-300">{d.interaction.mecanisme}</p>
                <p className="mt-1 text-xs text-gray-300">{d.interaction.effet}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3. Alertes PD */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">⚠️ Alertes pharmacodynamiques</h2>
        <div className="grid gap-2">
          <PdAlertCard title="QTc cumulé" severity={qt.severity} score={qt.score}
                       threshold="≥ 3 = risque significatif"
                       contributors={qt.contributors}
                       conduct={qt.severity === 'red' ? 'ECG préalable et surveillance.' : undefined} />
          <PdAlertCard title="Sérotonine" severity={sero.severity} contributors={sero.contributors}
                       conduct={sero.severity === 'red' ? 'Triade constituée — éviter, sinon surveillance étroite.' : undefined} />
          <PdAlertCard title="Triade respiratoire" severity={resp.severity} contributors={resp.contributors}
                       conduct={resp.severity === 'red' ? 'Triade BZD + opioïde + dépresseur CNS — risque vital.' : undefined} />
          <PdAlertCard title="Charge anticholinergique" severity={acb.severity} score={acb.score}
                       threshold="≥ 3 ambre / ≥ 6 rouge" contributors={acb.contributors} />
          <PdAlertCard title="Seuil épileptogène" severity={sep.severity} contributors={sep.contributors} />
        </div>
      </section>

      {/* 4. PGx */}
      {pgxA.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">🧬 Pharmacogénétique (CPIC niveau A)</h2>
          <ul className="space-y-1">
            {pgxA.map(({ molecule: m, pgx }, i) => (
              <li key={i} className="rounded-md border border-navy-700 bg-navy-800 p-2 text-sm">
                <strong>{m.nom_dci}</strong> a une recommandation CPIC niveau A pour <code className="font-mono text-teal-400">{pgx.gene}</code>.{' '}
                <a href={`/search/${m.id}?openSection=pgx`} className="text-teal-400 underline focus-ring">
                  Voir la fiche détaillée →
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 5. Sources consolidées */}
      <Accordion title={`Sources consolidées (${sortedSources.length})`}>
        <ul className="grid gap-1">
          {sortedSources.map(s => <li key={s}><SourceLink source={s} /></li>)}
        </ul>
      </Accordion>
    </div>
  );
}
```

- [ ] **Step 3 : Note — types de retour des helpers `scoring.ts`**

Les helpers existants (`scoreQT`, `scoreSero`, etc.) doivent retourner un objet avec au minimum `{ severity: Severity; score?: number; contributors: Array<{ molecule: string; weight: number; label: string }> }`. Si les types existants diffèrent, adapter les call sites de `InteractionPage` pour mapper les structures réelles vers cette interface — **ne pas modifier les helpers** sauf si un test scoring (Task 3) échoue.

`detectPkPairs(molecules)` doit retourner `{ substrat: Molecule; modulateur: Molecule; mecanisme: string; effet: string }[]`.
`findDocumentedInteractions(molecules)` doit retourner `{ molecule: Molecule; interaction: InteractionEntry }[]` (paires entre molécules réellement présentes dans le panier).

Si l'inspection des helpers révèle d'autres structures, créer des adaptateurs locaux dans `InteractionPage.tsx` plutôt que toucher aux helpers.

- [ ] **Step 4 : Type-check + commit**

```bash
npx tsc -b
git add src/components/molecule/PdAlertCard.tsx src/pages/InteractionPage.tsx
git commit -m "feat(pages): InteractionPage — panier + 5 cartes PD + paires PK + PGx"
```

---

# Session 6 — Atlas

## Task 19 : `utils/atlas.ts` + `AtlasPage`

**Files:**
- Create: `src/utils/atlas.ts`
- Modify: `src/pages/AtlasPage.tsx` (remplacer le stub de Task 17)

- [ ] **Step 1 : `utils/atlas.ts`**

```typescript
// src/utils/atlas.ts
import type { Molecule } from '../types/molecule';

export type AtlasCategory = 'cyp' | 'ugt' | 'transporteurs';

export interface AtlasEntry {
  substratsMajeurs: Molecule[];
  substratsMineurs: Molecule[];
  inhibiteursForts: Molecule[];
  inhibiteursModeres: Molecule[];
  inhibiteursFaibles: Molecule[];
  inducteurs: Molecule[];
}

export type AtlasIndex = Record<string, AtlasEntry>;

function emptyEntry(): AtlasEntry {
  return {
    substratsMajeurs: [], substratsMineurs: [],
    inhibiteursForts: [], inhibiteursModeres: [], inhibiteursFaibles: [],
    inducteurs: [],
  };
}

function matchesCategory(name: string, cat: AtlasCategory): boolean {
  if (cat === 'cyp') return /^CYP\d/i.test(name);
  if (cat === 'ugt') return /^UGT/i.test(name);
  if (cat === 'transporteurs') return /^(P-gp|BCRP|OCT|MATE|OATP|ABC|SLC)/i.test(name);
  return false;
}

export function buildAtlasIndex(molecules: Molecule[], category: AtlasCategory): AtlasIndex {
  const idx: AtlasIndex = {};
  const ensure = (key: string) => { if (!idx[key]) idx[key] = emptyEntry(); return idx[key]; };

  for (const m of molecules) {
    // Substrats CYP
    if (category === 'cyp') {
      for (const e of m.phase1_cyp) {
        const entry = ensure(e.isoforme);
        if (e.rang === 'majeur') entry.substratsMajeurs.push(m);
        else if (e.rang === 'mineur') entry.substratsMineurs.push(m);
      }
    }
    // Substrats UGT (depuis phase2 et phase1_non_cyp filtrés)
    if (category === 'ugt') {
      for (const e of m.phase2) {
        if (matchesCategory(e.enzyme, 'ugt')) {
          const entry = ensure(e.enzyme);
          if (e.rang === 'majeur') entry.substratsMajeurs.push(m);
          else if (e.rang === 'mineur') entry.substratsMineurs.push(m);
        }
      }
    }
    // Substrats transporteurs
    if (category === 'transporteurs') {
      for (const t of m.transporteurs) {
        if (!matchesCategory(t.transporteur, 'transporteurs')) continue;
        const entry = ensure(t.transporteur);
        if (t.role === 'substrat') entry.substratsMajeurs.push(m); // pas de rang dans le schéma
        else if (t.role === 'inhibiteur') entry.inhibiteursForts.push(m);
        else if (t.role === 'inducteur') entry.inducteurs.push(m);
      }
    }
    // Inhibiteur / Inducteur (CYP, UGT, transporteurs)
    for (const inh of m.inhibiteur) {
      if (!matchesCategory(inh.cible, category)) continue;
      const entry = ensure(inh.cible);
      if (inh.puissance === 'fort') entry.inhibiteursForts.push(m);
      else if (inh.puissance === 'modéré') entry.inhibiteursModeres.push(m);
      else entry.inhibiteursFaibles.push(m);
    }
    for (const ind of m.inducteur) {
      if (!matchesCategory(ind.cible, category)) continue;
      ensure(ind.cible).inducteurs.push(m);
    }
  }
  return idx;
}
```

- [ ] **Step 2 : `AtlasPage.tsx` (remplacer le stub)**

```tsx
// src/pages/AtlasPage.tsx
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ALL_MOLECULES } from '../data';
import { buildAtlasIndex, type AtlasCategory, type AtlasEntry } from '../utils/atlas';
import type { Molecule } from '../types/molecule';
import { EmptyState } from '../components/ui/EmptyState';

const CATEGORIES: { id: AtlasCategory; label: string }[] = [
  { id: 'cyp',           label: 'CYP' },
  { id: 'ugt',           label: 'UGT' },
  { id: 'transporteurs', label: 'Transporteurs' },
];

export function AtlasPage() {
  const [cat, setCat] = useState<AtlasCategory>('cyp');
  const idx = useMemo(() => buildAtlasIndex(ALL_MOLECULES, cat), [cat]);
  const sortedKeys = Object.keys(idx).sort();

  return (
    <div className="space-y-4 pb-20">
      <header>
        <h1 className="text-xl font-bold text-gray-100">Atlas</h1>
        <p className="text-sm text-gray-400">Substrats, inhibiteurs et inducteurs des voies métaboliques (consolidé sur les {ALL_MOLECULES.length} molécules indexées).</p>
      </header>
      <nav aria-label="Catégorie atlas" className="flex gap-1 rounded-lg border border-navy-700 bg-navy-800 p-1">
        {CATEGORIES.map(c => (
          <button key={c.id} type="button" onClick={() => setCat(c.id)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium focus-ring ${
                    cat === c.id ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-navy-700'
                  }`}>
            {c.label}
          </button>
        ))}
      </nav>
      {sortedKeys.length === 0 ? (
        <EmptyState title="Aucune entrée dans cette catégorie"
                    hint="Cette catégorie sera enrichie quand les données HUG/CBIP seront ingérées (v1.1)." />
      ) : (
        <ul className="space-y-3">
          {sortedKeys.map(key => <AtlasIsoformeBlock key={key} name={key} entry={idx[key]} />)}
        </ul>
      )}
    </div>
  );
}

function AtlasIsoformeBlock({ name, entry }: { name: string; entry: AtlasEntry }) {
  const sections: { label: string; molecules: Molecule[] }[] = [
    { label: 'Substrats majeurs',      molecules: entry.substratsMajeurs },
    { label: 'Substrats mineurs',      molecules: entry.substratsMineurs },
    { label: 'Inhibiteurs forts',      molecules: entry.inhibiteursForts },
    { label: 'Inhibiteurs modérés',    molecules: entry.inhibiteursModeres },
    { label: 'Inhibiteurs faibles',    molecules: entry.inhibiteursFaibles },
    { label: 'Inducteurs',             molecules: entry.inducteurs },
  ].filter(s => s.molecules.length > 0);

  return (
    <li className="rounded-lg border border-navy-700 bg-navy-800 p-3">
      <h2 className="mb-2 font-mono text-base font-bold text-teal-400">{name}</h2>
      <dl className="space-y-2">
        {sections.map((s, i) => (
          <div key={i}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{s.label}</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {s.molecules.map(m => (
                <Link key={m.id} to={`/search/${m.id}`}
                      className="inline-flex items-center rounded-full border border-navy-600 bg-navy-900 px-2 py-0.5 text-xs text-gray-200 hover:border-teal-500 hover:text-teal-300 focus-ring">
                  {m.nom_dci}
                </Link>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </li>
  );
}
```

- [ ] **Step 3 : Build + test manuel**

Run : `npm run build && npm run dev`
Vérifier `/atlas` → onglet CYP affiche CYP1A2, CYP2B6, etc. avec les molécules de la base.

- [ ] **Step 4 : Commit**

```bash
git add src/utils/atlas.ts src/pages/AtlasPage.tsx
git commit -m "feat(atlas): AtlasPage — sous-onglets CYP/UGT/Transporteurs dynamiques"
```

---

# Session 7 — Extension multi-sources HUG/CBIP

> **Mise à jour 2026-04-27 (post-brainstorming)** : les sources externes sont arrivées avant l'implémentation :
> - `hug_2020_opus.json` (245 mol., extraction Opus avec rang substrat + métabolite_actif)
> - `cbip_gpt.json` (472 mol., extraction GPT — pas de rang)
> - `CBIP_interactions_V3_audit.json` (audit interne GPT, 45 divergences à arbitrer)
>
> **Conséquence sur le plan** : la T20 (parser cheerio CBIP) devient **optionnelle** puisque GPT a déjà extrait. Elle est gardée comme alternative reproductible en cas de mise à jour CBIP. La T21 est adaptée pour 3 sources (HUG-Opus × CBIP-GPT × JSON) + intégration de l'audit V3 + déduplication NFD.

## Task 20 (OPTIONNELLE) : `parse-cbip.mjs` (extraction HTML CBIP)

**Files:**
- Create: `scripts/parse-cbip.mjs`
- Modify: `package.json` (ajout dépendance cheerio + script)

> **Cette tâche n'est plus nécessaire pour livrer v1.1** — l'extraction GPT (`cbip_gpt.json`, 472 molécules) est déjà disponible et a été validée en qualité. Garder la T20 uniquement si tu veux un parser reproductible offline pour ré-ingestion automatique en cas de mise à jour CBIP. À sauter en première implémentation.

- [ ] **Step 1 : Installer cheerio**

```bash
npm install --save-dev cheerio
```

- [ ] **Step 2 : Créer le parser**

```javascript
// scripts/parse-cbip.mjs
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { load } from 'cheerio';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const INPUT = join(ROOT, 'CBIP _ Interactions des médicaments.html');
const OUTPUT = join(ROOT, 'cbip_2024.json');

if (!existsSync(INPUT)) {
  console.error(`[ERREUR] Fichier source absent : ${INPUT}`);
  console.error('  Sauvegarde la page https://www.cbip.be/fr/chapters/1?frag=9990243 dans le repo avec ce nom exact.');
  process.exit(1);
}

const html = readFileSync(INPUT, 'utf8');
const $ = load(html);

/**
 * Stratégie : repérer les en-têtes "Tableau Ie" (liste alphabétique pivot)
 * qui contient pour chaque molécule trois colonnes : Substrat de / Inhibiteur de / Inducteur de.
 * À défaut, tomber sur Tableau I (par CYP) + Tableau Id (P-gp).
 */

function extractPivotTable() {
  // Le tableau Ie est annoncé par <a name="sub"></a>
  const anchor = $('a[name="sub"]').first();
  if (anchor.length === 0) return null;
  const table = anchor.closest('p').nextAll('div.container').first().find('table').first();
  if (table.length === 0) return null;

  const result = [];
  table.find('tbody tr').each((i, tr) => {
    if (i === 0) return; // header
    const tds = $(tr).find('td');
    if (tds.length < 4) return;
    const nom = $(tds[0]).text().trim();
    const substratOf = parseColumnVoies($(tds[1]).html() ?? '');
    const inhibOf = parseColumnVoies($(tds[2]).html() ?? '');
    const inducOf = parseColumnVoies($(tds[3]).html() ?? '');
    if (nom) result.push({ nom_dci: nom, substrat: substratOf, inhibiteur: inhibOf, inducteur: inducOf });
  });
  return result;
}

function parseColumnVoies(html) {
  // Texte plat de la cellule, séparer par , et détecter le gras
  const $$ = load(`<div>${html}</div>`);
  const items = [];
  $$('div').contents().each((_, node) => {
    if (node.type === 'text') {
      for (const part of node.data.split(',')) {
        const cleaned = part.trim();
        if (cleaned && /CYP|P-?gp/i.test(cleaned)) items.push({ voie: normalizeVoie(cleaned), puissance: 'normal' });
      }
    }
  });
  $$('div strong').each((_, el) => {
    const t = $$(el).text().trim();
    if (t && /CYP|P-?gp/i.test(t)) items.push({ voie: normalizeVoie(t), puissance: 'puissant' });
  });
  return items;
}

function normalizeVoie(raw) {
  return raw.replace(/\s+/g, '').replace(/3A4\/5/i, '3A4').toUpperCase();
}

const pivot = extractPivotTable();

if (!pivot || pivot.length === 0) {
  console.error('[ERREUR] Impossible d\'extraire le tableau pivot CBIP. Vérifie que l\'ancre <a name="sub"> existe et que la structure HTML n\'a pas changé.');
  process.exit(1);
}

const output = {
  _metadata: {
    source: 'CBIP:interactions_chap1_2024',
    url: 'https://www.cbip.be/fr/chapters/1?frag=9990243',
    extraction_date: new Date().toISOString().slice(0, 10),
    extraction_by: 'parse-cbip.mjs',
    totals: { molecules: pivot.length },
  },
  molecules: pivot,
};

writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
console.log(`✓ ${pivot.length} molécules extraites → ${OUTPUT}`);
```

- [ ] **Step 3 : Ajouter le script npm**

Modifier `package.json` :

```json
"parse:cbip": "node scripts/parse-cbip.mjs"
```

- [ ] **Step 4 : Exécuter**

Run : `npm run parse:cbip`
Expected : `✓ N molécules extraites → cbip_2024.json` avec N entre 200 et 350.

- [ ] **Step 5 : Inspecter la sortie pour vérifier la qualité**

```bash
head -50 cbip_2024.json
```

Vérifier que les structures sont cohérentes (méthadone substrat de CYP3A4 puissant, clarithromycine inhibiteur de CYP3A4 puissant, etc.).

- [ ] **Step 6 : Ajouter `cbip_2024.json` à `.gitignore` (extraction reproductible, pas un asset)**

Modifier `.gitignore` (ajouter à la fin) :

```
# Extractions multi-sources reproductibles (régénérer via npm run parse:cbip)
cbip_2024.json
hug_2020_gpt.json
hug_2020_opus.json
```

- [ ] **Step 7 : Commit**

```bash
git add scripts/parse-cbip.mjs package.json package-lock.json .gitignore
git commit -m "feat(scripts): parse-cbip.mjs — extraction tableau pivot HTML CBIP"
```

---

## Task 21 : `compare-sources.mjs` (consommateur de l'audit pré-généré)

**Files:**
- Create: `scripts/compare-sources.mjs`
- Modify: `package.json`

**Mise à jour 2026-04-27 (post-livraison audit)** : un audit comparatif CBIP × HUG est déjà disponible dans `data_hug_cbip/` (3 fichiers : `metaboscope_audit_cbip_vs_hug_{summary,divergences,complete}.{json,csv,json}`). T21 ne réimplémente plus la comparaison — elle **consomme** ces fichiers et croise avec les JSON MétaboScope existants pour produire un rapport actionnable.

**Sources disponibles (chemins actualisés)** :
- `data_hug_cbip/hug_2020_opus.json` (245 mol.)
- `data_hug_cbip/cbip_gpt.json` (472 mol.)
- `data_hug_cbip/CBIP_interactions_V3_audit.json` (audit interne CBIP, 45 incohérences)
- `data_hug_cbip/metaboscope_audit_cbip_vs_hug_summary.json` (508 mol union, 27 high-severity)
- `data_hug_cbip/metaboscope_audit_cbip_vs_hug_divergences.csv` (1194 lignes, prêt à filtrer)
- `data_hug_cbip/metaboscope_audit_cbip_vs_hug_complete.json` (1.7 MB, données fusionnées par molécule)
- 5 JSON molécules MétaboScope existants (77 mol.) dans `src/data/molecules/`

- [ ] **Step 1 : Créer le script (consommateur de l'audit pré-généré)**

```javascript
// scripts/compare-sources.mjs
// Consomme l'audit CBIP × HUG pré-généré dans data_hug_cbip/
// + croise avec JSON MétaboScope existants
// Sortie : docs/audits/cbip-hug-divergences-{YYYY-MM-DD}.md

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'data_hug_cbip');

function loadJson(path, label) {
  if (!existsSync(path)) {
    console.warn(`[WARN] ${label} absent : ${path}`);
    return null;
  }
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch (e) { console.error(`[ERREUR] ${label} : ${e.message}`); return null; }
}

function loadMolecules() {
  const dir = join(ROOT, 'src', 'data', 'molecules');
  const all = [];
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const parsed = loadJson(join(dir, f), f);
    if (parsed?.molecules) all.push(...parsed.molecules);
  }
  return all;
}

// Audit pré-généré (source de vérité pour la comparaison CBIP × HUG)
const summary = loadJson(join(DATA, 'metaboscope_audit_cbip_vs_hug_summary.json'), 'audit summary');
const complete = loadJson(join(DATA, 'metaboscope_audit_cbip_vs_hug_complete.json'), 'audit complete');
const divergencesCsv = existsSync(join(DATA, 'metaboscope_audit_cbip_vs_hug_divergences.csv'))
  ? readFileSync(join(DATA, 'metaboscope_audit_cbip_vs_hug_divergences.csv'), 'utf8')
  : null;

// Sources brutes (pour cross-référence)
const cbip = loadJson(join(DATA, 'cbip_gpt.json'), 'CBIP-GPT');
const hugOpus = loadJson(join(DATA, 'hug_2020_opus.json'), 'HUG-Opus');
const json = loadMolecules();

if (!summary || !complete) {
  console.error('[ERREUR] Audit pré-généré absent. Régénérer avec un agent (GPT/Opus) ou consulter docs/superpowers/specs/.../§9.5');
  process.exit(1);
}

// Normalisation NFD pour matching tolérant aux accents
function key(name) {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// Index des molécules JSON existantes (pour identifier ce qui doit être enrichi vs déjà présent)
const idxJson = new Map();
for (const m of json) {
  if (m.nom_dci) idxJson.set(key(m.nom_dci), m);
  for (const s of m.synonymes ?? []) idxJson.set(key(s), m);
}

// Extraction des divergences high-severity depuis l'audit (à arbitrer manuellement avant ingestion v1.1)
const highSeverityMolecules = summary.priority_review?.high_severity_molecules ?? [];

// Parser le CSV des divergences pour extraire les entrées high-severity
const highSeverityDivergences = [];
if (divergencesCsv) {
  const lines = divergencesCsv.split('\n').slice(1).filter(Boolean); // skip header
  for (const line of lines) {
    const [nom, canonical_key, type, category, voie, severity, action] = line.split(',');
    if (severity === 'high') {
      highSeverityDivergences.push({ nom, canonical_key, type, category, voie, action });
    }
  }
}

// Cross-référence audit × JSON MétaboScope : détecter les molécules enrichissables
const candidatsIngestion = [];   // molécules dans audit mais absentes du JSON MétaboScope
const recouvrementJson = [];      // molécules dans audit ET déjà dans JSON
for (const molAudit of complete.merged_data ?? complete.molecules ?? []) {
  const k = key(molAudit.nom ?? molAudit.canonical_key ?? '');
  if (!k) continue;
  if (idxJson.has(k)) {
    recouvrementJson.push({ name: molAudit.nom, jsonId: idxJson.get(k).id });
  } else {
    candidatsIngestion.push({
      name: molAudit.nom ?? molAudit.canonical_key,
      reliability: molAudit.reliability,
      sources: molAudit.sources_present ?? ['CBIP', 'HUG'].filter(s => molAudit[`in_${s.toLowerCase()}`]),
    });
  }
}

// Génération du rapport markdown
const date = new Date().toISOString().slice(0, 10);
const auditDir = join(ROOT, 'docs', 'audits');
if (!existsSync(auditDir)) mkdirSync(auditDir, { recursive: true });
const outPath = join(auditDir, `cbip-hug-divergences-${date}.md`);

const counts = summary.counts ?? {};
const divCounts = summary.divergence_counts ?? {};

let md = `# MétaboScope — rapport multi-sources ${date}\n\n`;
md += `Audit pré-généré dans \`data_hug_cbip/metaboscope_audit_cbip_vs_hug_*\` croisé avec ${json.length} molécules JSON MétaboScope.\n\n`;

md += `## Statistiques globales\n\n`;
md += `- **Union CBIP × HUG** : ${counts.molecules_union ?? '?'} molécules\n`;
md += `- **CBIP** : ${counts.cbip_molecules ?? '?'} · **HUG** : ${counts.hug_molecules ?? '?'}\n`;
md += `- **Recouvrement CBIP ∩ HUG** : ${counts.molecules_in_both_after_normalization ?? '?'}\n`;
md += `- **CBIP-only** : ${counts.molecules_cbip_only ?? '?'} · **HUG-only** : ${counts.molecules_hug_only ?? '?'}\n`;
md += `- **MétaboScope JSON existants** : ${json.length}\n`;
md += `- **Recouvrement audit × JSON** : ${recouvrementJson.length} (déjà couverts)\n`;
md += `- **Candidats ingestion v1.1** : ${candidatsIngestion.length} (présents dans audit, absents du JSON)\n\n`;

md += `## Divergences par catégorie\n\n`;
md += `| Catégorie | Cas |\n|---|---|\n`;
for (const [k, v] of Object.entries(divCounts)) md += `| ${k} | ${v} |\n`;
md += `\n`;

md += `## Molécules high-severity (${highSeverityDivergences.length} divergences sur ${highSeverityMolecules.length} molécules)\n\n`;
md += `Conflits de puissance CBIP ≠ HUG sur des inducteurs/inhibiteurs cliniquement majeurs.\n`;
md += `**À arbitrer manuellement avant ingestion v1.1.**\n\n`;
md += `| Molécule | Type | Voie | Action proposée |\n|---|---|---|---|\n`;
for (const d of highSeverityDivergences) {
  md += `| ${d.nom} | ${d.type} | ${d.voie} | ${d.action} |\n`;
}
md += `\n`;

md += `## Candidats à ingestion v1.1 (échantillon — ${candidatsIngestion.length} total)\n\n`;
md += `Molécules présentes dans CBIP/HUG mais absentes du JSON MétaboScope. À ingérer en v1.1 sous \`src/data/molecules/molecules_extension_cbip_hug.json\`, en respectant les invariants \`§9\` du \`CLAUDE.md\` (sources HUG/CBIP avec préfixes corrects, niveau de preuve \`IVH-O\`).\n\n`;
const tri = candidatsIngestion.slice().sort((a, b) => {
  const order = { 'élevé': 0, 'élevée': 0, 'moyen': 1, 'moyenne': 1, 'faible': 2 };
  return (order[a.reliability] ?? 3) - (order[b.reliability] ?? 3);
});
for (const c of tri.slice(0, 60)) {
  md += `- **${c.name}** — fiabilité : ${c.reliability ?? '?'} · sources : ${(c.sources ?? []).join(', ')}\n`;
}
if (tri.length > 60) md += `\n_… et ${tri.length - 60} de plus. Voir \`data_hug_cbip/metaboscope_audit_cbip_vs_hug_complete.json\` pour la liste exhaustive._\n`;

md += `\n## Recouvrement avec JSON MétaboScope existant\n\n`;
md += `Molécules de l'audit déjà présentes dans le JSON MétaboScope. Pour ces molécules, considérer l'ajout des sources HUG/CBIP en multi-source (\`source: string[]\`) sur les cellules concordantes — voir \`§9.4\` de la spec.\n\n`;
md += `${recouvrementJson.slice(0, 50).map(r => r.name).join(', ')}\n`;
if (recouvrementJson.length > 50) md += `\n_… et ${recouvrementJson.length - 50} de plus._\n`;

writeFileSync(outPath, md);
writeFileSync(outPath.replace('.md', '.json'), JSON.stringify({
  date,
  stats: {
    cbip_molecules: counts.cbip_molecules,
    hug_molecules: counts.hug_molecules,
    union: counts.molecules_union,
    recouvrement_audit_json: recouvrementJson.length,
    candidats_ingestion: candidatsIngestion.length,
    high_severity_divergences: highSeverityDivergences.length,
  },
  highSeverityDivergences,
  candidatsIngestion: tri,
  recouvrementJson,
}, null, 2));

console.log(`✓ Rapport écrit : ${outPath}`);
console.log(`  Recouvrement JSON: ${recouvrementJson.length} · Candidats v1.1: ${candidatsIngestion.length} · High-severity: ${highSeverityDivergences.length}`);
```

- [ ] **Step 2 : Ajouter le script npm**

Modifier `package.json` :

```json
"compare:sources": "node scripts/compare-sources.mjs"
```

- [ ] **Step 3 : Exécuter avec ce qui est disponible**

Run : `npm run compare:sources`
Expected : warning si certaines sources absentes (`hug_2020_gpt.json` ou `hug_2020_opus.json` non encore livrés). Le script tourne quand même avec les sources présentes. Rapport généré dans `docs/audits/cbip-hug-divergences-YYYY-MM-DD.md`.

- [ ] **Step 4 : Inspecter le rapport**

```bash
ls -la docs/audits/
```

Ouvrir le markdown généré et vérifier que les statistiques sont cohérentes (corroborations > 0 sur les ~35 mol. en recouvrement).

- [ ] **Step 5 : Commit**

```bash
git add scripts/compare-sources.mjs package.json
git commit -m "feat(scripts): compare-sources.mjs — MoE 4 sources HUG-GPT × HUG-Opus × CBIP × JSON"
```

---

## Task 22 : Build final + critères d'acceptation

- [ ] **Step 1 : Build prod**

Run : `npm run build`
Expected : pas d'erreur, dist/ généré, taille gzip < 200 KiB.

- [ ] **Step 2 : Tests complets**

Run : `npm run test`
Expected : tous tests PASS.

- [ ] **Step 3 : Validation données**

Run : `npm run validate:molecules`
Expected : exit code 0.

- [ ] **Step 4 : Test manuel — parcours bout en bout**

```bash
npm run preview
```

Ouvrir `http://localhost:4173` et vérifier :

- Première ouverture → modale Disclaimer s'affiche
- Acceptation → page d'accueil + nav 3 onglets
- Recherche "sertraline" → fiche → bouton "Ajouter au comparateur" → badge sur Interactions = 1
- Sur SearchPage, mode sélection → cocher 3 résultats → "Comparer 3 →" → InteractionPage avec 3 molécules
- Cartes PD affichées avec score et severity
- Onglet Atlas → CYP1A2 → liste avec "clozapine" → clic → fiche clozapine
- Lien Disclaimer en pied → modale lecture (pas de re-write localStorage)
- Airplane mode → toujours fonctionnel

- [ ] **Step 5 : Commit final**

```bash
git add -A
git commit -m "chore(v1): clôture jalon — build prod OK, tests passent, parcours validé manuellement"
```

---

# Self-review du plan

## Couverture spec → tâche

| Section spec | Tâche couvrant |
|---|---|
| §3.1 Structure dossiers | T4-T21 (chaque fichier listé est créé/modifié dans une tâche) |
| §3.2 État global (Cart + Disclaimer) | T13, T14 |
| §3.3 Routing | T17 |
| §3.4 Service worker | Pas de modif ; couvert par config existante |
| §4 Module 1 (Search + Fiche) | T7, T10-T12, T15, T16 |
| §4.5 Mapping codes PD | T4 |
| §4.6 Mapping sources URL | T4 |
| §5 Module 2 (Vérificateur) | T18 |
| §6 Module 3 (Atlas) | T19 |
| §7 Disclaimer | T13, T17 |
| §8 Tests | T2, T3, T4 (tests labels), T12 (MoleculeCard) |
| §9 Multi-sources HUG/CBIP | T20, T21 |
| §10-§13 Décisions, acceptation, hors-scope, risques | Implicite dans T22 |

**Couverture intégrale.**

## Cohérence des types et signatures

- `Severity` est défini une seule fois (T4) et importé partout (Badge T5, PdAlertCard T18, severityClass dans labels.ts).
- `Molecule` type vient de `src/types/molecule.ts` (existant), modifié en T9 pour `source: string | string[]`. `normalizeSources()` ajouté en T9 et utilisé en T11 (sections), T12 (MoleculeCard via SectionSources), T18 (InteractionPage).
- `useCart()` hook : stub en T10, implémentation en T14, consommé en T10 (SummaryHeader), T17 (Layout), T18 (InteractionPage).
- `useDisclaimer()` : T13, consommé en T13 (DisclaimerGate), T17 (Layout via DisclaimerModal mode readonly).
- `SectionId` type : exporté depuis `MoleculeCard.tsx` (T12), consommé en `MoleculePage.tsx` (T16).

**Cohérence vérifiée.**

## Pas de placeholders

Aucun "TODO", "TBD", "implement later", "fill in details". Chaque step montre soit du code complet, soit une commande exacte avec sortie attendue. Le seul cas où je laisse explicitement de la flexibilité est en **T9 step 3** (adaptation des types existants si rien ne casse) et **T18 step 3** (alignement sur les structures réelles des helpers `scoring.ts`) — mais c'est dûment encadré : "ne pas modifier les helpers", "créer des adaptateurs locaux".

---

# Récapitulatif sessions

| Session | Tâches | Description courte | Estimation |
|---|---|---|---|
| 1 | T1-T6 | Filet sécurité + briques utils + Badge + Accordion | 2-3h |
| 2 | T7-T9 | AutoComplete + SourceLink + EmptyState + types | 1-2h |
| 3 | T10-T12 | SummaryHeader + 11 sections + MoleculeCard + tests | 3-4h |
| 4 | T13-T17 | Disclaimer + Cart + SearchPage + MoleculePage + routing | 3-4h |
| 5 | T18 | InteractionPage refactor | 2h |
| 6 | T19 | AtlasPage + helper atlas | 1-2h |
| 7 | T20-T22 | parse-cbip + compare-sources + acceptation | 2-3h |

**Total ~14-20h de travail focused sur 5-7 sessions.**

---

# Veille v1.0.1 — dette technique post-intégration sessions 6-13 (2026-04-28)

> Source autoritative : `src/data/warnings.md` (à conserver en référence — JC). Cette section consolide les **actions à mener avant déploiement AP-HP** v1.0.1, indépendamment du plan v1 lui-même qui reste centré sur T13-T22.

## V1.0.1.A — Normalisation du vocabulaire codes PD (warnings.md §2)

**État** : ~150 warnings émis par `npm run validate:molecules` (exit 0 quand même).

**Actions** :
1. **Variantes accentuées à fusionner vers ASCII canonique** (16+ occurrences `dépendance-documented`, 12 `sédation`, 2 `sédation-profonde`, 2 `dépendance-mu-opioide`, 2 `hépatotox`, 3 `mésusage-documented`, plus diacritiques sessions 6-13).
2. **Codes ad-hoc à intégrer au vocabulaire canonique** : `psychose-aiguë` → `psychose-aigue`, `nausées-vomissements` → `nausees-vomissements`, `convulsions`, `hyperthermie-maligne`, `IRA-secondaire`, `binge-pattern-prolongé` → `binge-pattern-prolonge`, etc. Choix : soit garder verbatim (passe en warning permanent), soit normaliser ASCII (préféré).
3. **Définir un label FR pour chaque nouveau code** dans `src/utils/labels.ts:PD_LABELS` pour éviter le fallback brut côté UI.

**Mode opératoire suggéré** : script Node `scripts/normalize-pd-codes.mjs` qui :
- Mappe variantes accentuées → ASCII canonique
- Réécrit les `alertes_pd[]` en place
- Ne touche pas aux contenus `effet`/`recommandation`/`mecanisme` (ils peuvent garder les diacritiques en français naturel)

## V1.0.1.B — Suppression sources LLM internes (warnings.md §4)

**État** : ~20 occurrences signalées comme warnings par `validate-molecules`.

**Patterns concernés** (cf. `scripts/validate-molecules.mjs:DEPRECATED_SOURCE_PATTERNS`) :
- `Plan_de_recherche_MetaboScope` (sessions 6-10 cathinones surtout)
- `métaboscope GPT 3` (alpha-PVP, MDPV)
- `Italie 2014-2025 case series` (à PMID-iser)
- `PMC10972361` sans préfixe `:` (à normaliser en `PMC:10972361`)
- `Gemini DR 2` (`aut_nicotine_pure`)
- `Mise_à_jour_référentiel` (`aut_tabac_fume`)
- `Rapport HUG 2020 extension` (`ghb_ghb`, `hal_psilocybine`, `hal_psilocine`, `hal_dmt` — un cas déjà corrigé sur `pst_lisdexamfetamine`)
- `Rapport MetaboScope Substances` (`hal_2cb`, `hal_ibogaine`)
- `Littérature PK` (`can_cbn`)

**Actions** : remplacer chaque source LLM interne par soit (a) un PMID/DOI/HUG: réel après vérification source primaire, soit (b) `zone_grise: true` sur la cellule + reclassification.

**Cas particulier** `opi_6_mam` (warnings.md §4) : marqueur forensique critique de consommation héroïne. Source unique `Mise_à_jour_référentiel` à remplacer par PMID forensique primaire dédié — **priorité haute**.

## V1.0.1.C — Cross-validation sources uniques (warnings.md §4)

13 molécules à source unique listées dans warnings.md §4. Priorités :
- **Haute** (5 molécules) : `opi_6_mam`, `nps_opi_brorphine`, `nps_bzd_clonazolam`, `nps_bzd_flubromazolam`, `nps_phenth_4fa`, `aut_phenibut`
- **Moyenne** (3 molécules) : `bzd_bromazepam`, `aut_kava` (données 20 ans), `aut_poppers`
- **Faible** (1 molécule) : `aco_ethosuximide`

## V1.0.1.D — Statut réglementaire FR à confirmer (warnings.md §9.3)

À vérifier avant prod (susceptible d'évoluer entre 2024 et 2026) :
- `nps_bzd_clonazolam` (non classé 2026 — classement attendu)
- `nps_bzd_bromazolam` (non classé 2026 — classement attendu)
- `nps_cb_hhc` (classé juin 2024 — confirmer arrêté exact)
- `aut_mitragynine` (procédure ANSM en cours)

## V1.0.1.E — Champs manquants prioritaires (warnings.md §8)

Compteurs de molécules avec champ vide :
- `inducteur` : 108 — Module 2 induction
- `transporteurs` : 92 — Module 2 transporteurs
- `inhibiteur` : 90 — Module 2 inhibition
- `phase1_non_cyp` : 63 — Fiche
- `pharmacogenetique` : 58 — Module 2 PGx
- `phase2` : 47 — Fiche
- `phase1_cyp` : 32 — Fiche

> Concentration sur les NPS (sessions 11-13) reflète l'état réel de la littérature, **pas** un oubli de saisie. Les zones grises documentées (warnings.md §3) absorbent ce manque.

## V1.0.1.F — Notes cliniques par fichier (warnings.md §7)

Conservé tel quel dans `src/data/warnings.md` §7 — c'est la **carte mentale clinique** par classe (méthadone CYP2B6, naltrexone AKR1C4, MDMA MBI 10j, alcool 3 phases, oxybate Na non-linéaire, isotonitazène π-hole Trp293, etc.). Lecture obligatoire pour toute session "données" ou "ajout molécule".

## Phasage proposé v1.0.1

1. **Pré-déploiement AP-HP (bloquant)** : V1.0.1.B priorité haute (`opi_6_mam` + nitazènes/NPS sources fortes) + V1.0.1.A.1 (variantes accentuées simples).
2. **Post-déploiement (1ère itération)** : V1.0.1.A complet + V1.0.1.D + V1.0.1.E (au moins `inducteur`/`inhibiteur` complétés).
3. **Itération continue** : V1.0.1.C cross-validation, V1.0.1.E champs spécialisés.

---

*Fin du plan d'implémentation.*
