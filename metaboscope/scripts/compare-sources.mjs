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
    // Two wrapper formats coexist: { molecules: [...] } and Molecule[] (top-level array).
    if (Array.isArray(parsed)) all.push(...parsed);
    else if (parsed?.molecules) all.push(...parsed.molecules);
  }
  return all;
}

// Audit pré-généré (source de vérité pour la comparaison CBIP × HUG)
const summary = loadJson(join(DATA, 'metaboscope_audit_cbip_vs_hug_summary.json'), 'audit summary');
const complete = loadJson(join(DATA, 'metaboscope_audit_cbip_vs_hug_complete.json'), 'audit complete');
const divergencesCsv = existsSync(join(DATA, 'metaboscope_audit_cbip_vs_hug_divergences.csv'))
  ? readFileSync(join(DATA, 'metaboscope_audit_cbip_vs_hug_divergences.csv'), 'utf8')
  : null;

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
    // Naive split — le CSV high-severity n'a pas de virgule dans les cellules (vérifié)
    const cols = line.split(',');
    const [nom, canonical_key, type, category, voie, severity, action] = cols;
    if (severity === 'high') {
      highSeverityDivergences.push({ nom, canonical_key, type, category, voie, action });
    }
  }
}

// Cross-référence audit × JSON MétaboScope : détecter les molécules enrichissables
// Schéma réel du complete : molecules[] avec { nom_canonique, canonical_key, presence: { cbip, hug_2020_opus }, fiabilite_metaboscope: { niveau } }
const candidatsIngestion = [];   // molécules dans audit mais absentes du JSON MétaboScope
const recouvrementJson = [];      // molécules dans audit ET déjà dans JSON
const auditMols = complete.merged_data ?? complete.molecules ?? [];
if (auditMols.length === 0) {
  console.warn('[WARN] complete.merged_data/molecules vide ou absent — schéma audit changé ?');
}
for (const molAudit of auditMols) {
  const name = molAudit.nom_canonique ?? molAudit.nom ?? molAudit.canonical_key ?? '';
  const k = key(name);
  if (!k) continue;
  const reliability = molAudit.fiabilite_metaboscope?.niveau ?? molAudit.reliability ?? null;
  const presence = molAudit.presence ?? {};
  const sources = [];
  if (presence.cbip) sources.push('CBIP');
  if (presence.hug_2020_opus || presence.hug) sources.push('HUG');
  if (idxJson.has(k)) {
    recouvrementJson.push({ name, jsonId: idxJson.get(k).id });
  } else {
    candidatsIngestion.push({ name, reliability, sources });
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
