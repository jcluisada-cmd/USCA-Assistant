// Mapping codes alertes pharmacodynamiques (PD) → libellé humain + sévérité UI
// Mapping préfixes sources → URL canonique externe (ou null si pas d'URL stable)
// Mapping sévérité UI → classes Tailwind
//
// Sévérité UI (5 niveaux) — distincte du type runtime de scoring.ts (4 niveaux).
// Granularité d'affichage des codes individuels vs niveau de risque combiné.

export type Severity = 'red' | 'amber' | 'yellow' | 'green' | 'neutral'

export interface PdLabel {
  label: string
  severity: Severity
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
}

export function pdAlertLabel(code: string): PdLabel {
  return PD_LABELS[code] ?? { label: code, severity: 'neutral' }
}

export function sourceToHref(src: string): string | null {
  if (src.startsWith('PMID:')) return `https://pubmed.ncbi.nlm.nih.gov/${src.slice(5)}/`
  if (src.startsWith('DOI:')) return `https://doi.org/${src.slice(4)}`
  if (src.startsWith('CPIC:doi:')) return `https://doi.org/${src.slice(9)}`
  if (src.startsWith('DPWG:PMID:')) return `https://pubmed.ncbi.nlm.nih.gov/${src.slice(10)}/`
  if (src.startsWith('StatPearls:')) return `https://www.ncbi.nlm.nih.gov/books/${src.slice(11)}/`
  if (src.startsWith('CredibleMeds:')) return 'https://crediblemeds.org/'
  if (src.startsWith('HUG:')) return 'https://www.pharmacoclin.ch/'
  if (src.startsWith('CBIP:')) return 'https://www.cbip.be/fr/chapters/1?frag=9990243'
  return null
}

const SEVERITY_CLASSES: Record<Severity, string> = {
  red: 'bg-red-600 text-white border-red-700',
  amber: 'bg-amber-500 text-white border-amber-600',
  yellow: 'bg-yellow-300 text-gray-900 border-yellow-400',
  green: 'bg-emerald-500 text-white border-emerald-600',
  neutral: 'bg-gray-400 text-white border-gray-500',
}

export function severityClass(s: Severity): string {
  return SEVERITY_CLASSES[s]
}
