// scripts/validate-molecules.mjs
//
// Vocabulaire schéma v2 — état au 2026-04-28 (post-intégration sessions 6-13) :
// - SOURCE_PREFIX : préfixes documentés CLAUDE.md §9 + extensions PMC/NBK/EMCDDA
// - PD_CODES : ~150 codes acceptés (canoniques ASCII + variantes accentuées
//   acceptées transitoirement, à normaliser v1.0.1 cf. CLAUDE.md §6)
// - Convention canonique : kebab-case ASCII pur (sans diacritiques).
//   Les variantes accentuées (`dépendance-*`, `sédation*`, `mésusage-*`,
//   `hépatotox*`, `idéation-*`, `psychose-réactivation`, `anxiété`, etc.)
//   sont tolérées le temps de la normalisation (warnings.md §2 absorbé en CLAUDE.md §6).
// - Wrapper fichier : 2 formats acceptés
//     a) { _metadata: {...}, molecules: Molecule[] }   (sessions 1-10)
//     b) Molecule[]                                    (sessions 11-13)
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MOLECULES_DIR = join(__dirname, '..', 'src', 'data', 'molecules');

const SOURCE_PREFIX = /^(PMID|DOI|FDA|EMA|ANSM|CredibleMeds|CPIC|DPWG|StatPearls|HUG|CBIP|PMC|NBK|EMCDDA|ResearchGate|bioRxiv|CDC):/;
const DATE_FORMAT = /^\d{4}-\d{2}$/;

// Sources internes LLM tolérées comme warnings (warnings.md §2) — à remplacer
// par des sources primaires réelles ou à `zone_grise: true` en v1.0.1.
const DEPRECATED_SOURCE_PATTERNS = [
  /^Plan_de_recherche_MetaboScope/,
  /^métaboscope\s+GPT/i,
  /^Italie\s+\d/,                          // "Italie 2014-2025 case series"
  /^PMC\d/,                                // "PMC10972361" sans préfixe ":"
  /^Gemini\s+DR/i,                         // "Gemini DR 2"
  /^Mise_à_jour_référentiel/,
  /^Rapport\s+HUG\s+2020/i,                // "Rapport HUG 2020 extension"
  /^Rapport\s+MetaboScope/i,               // "Rapport MetaboScope Substances"
  /^Littérature\s+PK/i,                    // "Littérature PK" (can_cbn)
];
const PD_CODES = new Set([
  // QT (plan §6)
  'QT-KR', 'QT-PR', 'QT-CR', 'QT-SR',
  // Sérotoninergique (plan §6)
  'sero', 'sero-faible', 'sero-modere',
  // Respiration (plan §6)
  'resp',
  // ACB cumul anticholinergique (plan §6)
  'ACB-1', 'ACB-2', 'ACB-3',
  // Seuil épileptogène (plan §6)
  'seuil-ep', 'seuil-ep-sevrage',
  // Toxicités d'organe (plan §6 + extension)
  'hepatotox', 'hepatotox-POLG', 'hepatotox-rare',
  'nephrotox',
  'myocardite',
  'IRA',
  'rhabdomyolyse',
  'ischemie-myocardique',
  // Contre-indications absolues (plan §6 + extension)
  'CI-IMAO', 'CI-fluvoxamine', 'CI-sildenafil', 'CI-grossesse', 'CI-alcool',
  'CI-anorexie-boulimie', 'CI-sevrage-alcool-BZD-aigu',
  // Tératogénicité (plan §6 + phénotypes spécifiques)
  'teratogene', 'teratogene-Ebstein', 'teratogene-hydantoine',
  'foetotoxicite-grossesse',
  // Hypersensibilité grave (plan §6 + extension)
  'SJS', 'SJS-Lyell-HLA-B1502', 'SJS-Lyell-rare',
  'DRESS', 'DRESS-HLA-A3101', 'DRESS-rare',
  'SMN',
  // Mésusage / dépendance (plan §6 + extension)
  'fenetre-etroite',
  'mesusage-documented',
  'dependance', 'dependance-documented', 'dependance-mu-opioide',
  'dependance-faible', 'dependance-documented-faible-vs-amphetamine',
  'detournement-IV-fente-narines', 'detournement-reduit-vs-amphetamine',
  'detournement-cognitive-enhancement',
  'sevrage-cephalees-fatigue',
  'binge-pattern',
  // Antipsychotiques (extension sessions 1-5)
  'agranulocytose', 'akathisie', 'aggressivite-boxed-warning',
  'sedation', 'sedation-profonde',
  'sialorrhee', 'bronchospasme-voie-inhalee',
  'hypotension-orthostatique',
  'metabolique', 'metabolique-prise-poids', 'diabete',
  'hyperprolactinemie',
  'thyroide-hypo',
  'SEP',
  'impulsivite', 'idees-suicidaires',
  'ideation-suicidaire-adolescent', 'ideation-suicidaire-jeune-adulte',
  'psychose-reactivation', 'psychose-vulnerable', 'psychose-cannabinoide',
  // Anticonvulsivants (extension sessions 1-5)
  'hyponatremie-SIADH',
  'glaucome-aigu', 'glaucome-angle-ferme',
  'lithiase-renale', 'acidose-metabolique', 'perte-poids',
  'troubles-cognitifs', 'cerebelleux-dose-dependant', 'hyperplasie-gingivale',
  'titration-lente-obligatoire',
  'troubles-neuropsy-agressivite', 'troubles-psychiatriques',
  'pancreatite', 'hyperammonemie',
  // BZD / hypnotiques (extension sessions 1-5)
  'amnesie-anterograde', 'parasomnies-complexes', 'somnambulisme',
  'chute-sujet-age', 'sujet-age-risque-confusion',
  'sevrage-BZD-like', 'sevrage-possible-si-arret-brutal',
  'soumission-chimique',
  'anesthesie',
  // Cardio / hémodynamique (extension sessions 6-13)
  'CV-HTA', 'HTA', 'HTA-dose-dep',
  'tachycardie', 'tachycardie-severe', 'bradycardie', 'palpitations', 'syncope',
  'HTA-severe',
  'mort-subite',
  'rebond-HTA-arret-brutal',
  // Stimulants / NPS (extension sessions 6-13)
  'insomnie', 'anxiete', 'agitation', 'agitation-extreme',
  'mydriase', 'hyperthermie', 'coma', 'excited-delirium',
  'donnees-tres-limitees',
  // Divers
  'demi-vie-longue',
  'myelopathie-B12',
  // -------------------------------------------------------------------------
  // Variantes accentuées tolérées transitoirement (warnings.md §2 — à normaliser
  // v1.0.1 vers leurs équivalents ASCII ci-dessus). Source canonique : ASCII.
  // -------------------------------------------------------------------------
  'dépendance-documented', 'dépendance-faible', 'dépendance-mu-opioide',
  'dépendance-documented-faible-vs-amphetamine',
  'sédation', 'sédation-profonde',
  'mésusage-documented',
  'hépatotox', 'hépatotox-rare',
  'idéation-suicidaire-adolescent', 'idéation-suicidaire-jeune-adulte',
  'psychose-réactivation', 'psychose-vulnérable', 'psychose-cannabinoïde',
  'bronchospasme-voie-inhalée',
  'agitation-extrême',
  'fœtotoxicité-grossesse',
  'hyperprolactinémie',
  'anxiété',
  'ischémie-myocardique',
  'rebond-HTA-arrêt-brutal',
  'sevrage-céphalées-fatigue',
  'HTA-sévère', 'tachycardie-sévère',
  'agitation-extrême-violente',
  'binge-pattern-prolongé',
  'psychose-excitée', 'psychose-excitée-excited-delirium',
  'hyperthermie-maligne',
  'IRA-secondaire',
  'convulsions',
  'détournement-IV-fente-narines',
  'détournement-réduit-vs-amphetamine',
  'détournement-cognitive-enhancement',
  'données-très-limitées',
]);

// Helper : extrait le tableau de molécules selon le format du fichier.
// - format A : { _metadata, molecules: [...] }
// - format B : Molecule[] direct
function extractMolecules(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.molecules)) return parsed.molecules;
  return null;
}

const errors = [];
const warnings = [];
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
  const molecules = extractMolecules(parsed);
  if (!molecules) {
    errors.push(`[${file}] Format inattendu : ni { molecules: [] } ni Molecule[]`);
    continue;
  }
  for (const m of molecules) {
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
        if (!SOURCE_PREFIX.test(s)) {
          // Tolérer les patterns deprecated comme warnings (à corriger v1.0.1).
          if (DEPRECATED_SOURCE_PATTERNS.some(p => p.test(s))) {
            warnings.push(`${ctx} source LLM interne / non préfixée à corriger : "${s}"`);
          } else {
            errors.push(`${ctx} source mal formée : "${s}"`);
          }
        }
      }
    }
    if (m.derniere_maj && !DATE_FORMAT.test(m.derniere_maj)) {
      errors.push(`${ctx} derniere_maj : format YYYY-MM attendu, reçu "${m.derniere_maj}"`);
    }
    if (Array.isArray(m.alertes_pd)) {
      for (const code of m.alertes_pd) {
        if (!PD_CODES.has(code)) {
          // Codes hors vocabulaire canonique → warning à normaliser v1.0.1
          // (warnings.md §2). Sont tolérés runtime via fallback labels.ts.
          warnings.push(`${ctx} alertes_pd code hors vocabulaire : "${code}"`);
        }
      }
    }
  }
}

console.log(`Validation : ${total} molécules dans ${files.length} fichiers`);
if (warnings.length > 0) {
  console.warn(`\n⚠ ${warnings.length} dette(s) v1.0.1 (non bloquantes — voir warnings.md §2/§4) :\n`);
  for (const w of warnings) console.warn(`  ${w}`);
}
if (errors.length === 0) {
  console.log(`\n✓ Tous les invariants respectés${warnings.length > 0 ? ' (avec warnings)' : ''}`);
  process.exit(0);
} else {
  console.error(`\n✗ ${errors.length} erreur(s) :\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
