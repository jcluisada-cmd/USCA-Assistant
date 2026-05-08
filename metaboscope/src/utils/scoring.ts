// Calculs PD cumulés pour le Module 2 — Vérificateur de co-prescription.
// Règles fixées dans CLAUDE.md / INSTRUCTIONS_PROJET_METABOSCOPE.md §4 — Module 2.

import type { AlertePD, Molecule } from '../types/molecule'

export type Severity = 'ok' | 'info' | 'amber' | 'red'

export interface QtBreakdown {
  perMolecule: { id: string; nom: string; codes: string[]; points: number }[]
  total: number
  countKR: number
  severity: Severity
  rationale: string
}

export interface SeroBreakdown {
  triggers: { id: string; nom: string; codes: string[] }[]
  count: number
  severity: Severity
  rationale: string
}

export interface RespBreakdown {
  hasBzd: boolean
  hasOpioid: boolean
  hasOtherCns: boolean
  contributors: { id: string; nom: string; tag: 'bzd' | 'opioïde' | 'cns' }[]
  severity: Severity
  rationale: string
}

export interface AcbBreakdown {
  perMolecule: { id: string; nom: string; level: 1 | 2 | 3 }[]
  total: number
  severity: Severity
  rationale: string
}

export interface SeuilEpBreakdown {
  contributors: { id: string; nom: string; sevrage: boolean }[]
  count: number
  severity: Severity
  rationale: string
}

const QT_POINTS: Record<string, number> = {
  'QT-KR': 3,
  'QT-PR': 2,
  'QT-CR': 1,
  'QT-SR': 1,
}

const SERO_CODES = new Set<AlertePD>(['sero', 'sero-faible', 'sero-modere'])
const SERO_HIGH = new Set<AlertePD>(['sero', 'sero-modere'])

// Classes considérées comme dépresseurs CNS (hors BZD et opioïdes).
const CNS_CLASS_PATTERNS = [
  /alcool/i,
  /barbituriqu/i,
  /\bGHB\b/i,
  /hypnotique/i,
  /Z[- ]?drug/i,
  /antiH1\s+sédatif/i,
  /pregabal/i,
  /gabapentin/i,
  /antipsychotique/i,
]

const BZD_CLASS_PATTERN = /(BZD|benzodiaz|hypnotique|Z[- ]?drug)/i
const OPIOID_CLASS_PATTERN = /(opioïde|opio[iï]de|TSO|nitazène|opioid)/i

function tagOpioidSubstance(classe: string): boolean {
  return OPIOID_CLASS_PATTERN.test(classe)
}

function tagBzdSubstance(classe: string): boolean {
  return BZD_CLASS_PATTERN.test(classe)
}

function tagOtherCns(m: Molecule): boolean {
  if (tagBzdSubstance(m.classe) || tagOpioidSubstance(m.classe)) return false
  return CNS_CLASS_PATTERNS.some((p) => p.test(m.classe))
}

export function scoreQT(molecules: Molecule[]): QtBreakdown {
  let total = 0
  let countKR = 0
  const perMolecule = molecules.map((m) => {
    const codes = m.alertes_pd.filter((c) => c in QT_POINTS)
    const points = codes.reduce((acc, c) => acc + (QT_POINTS[c] ?? 0), 0)
    if (codes.includes('QT-KR')) countKR += 1
    total += points
    return { id: m.id, nom: m.nom_dci, codes, points }
  })

  let severity: Severity = 'ok'
  if (total === 0) severity = 'ok'
  else if (total >= 3 || countKR >= 2) severity = 'red'
  else if (total >= 2) severity = 'amber'
  else severity = 'info'

  const rationale =
    total === 0
      ? 'Aucune molécule avec alerte QT documentée parmi les sélectionnées.'
      : `Score QT cumulé : ${total} (${countKR} KR). Règle : rouge si total ≥ 3 OU ≥ 2 molécules KR ; ambre si ≥ 2.`

  return { perMolecule, total, countKR, severity, rationale }
}

export function scoreSero(molecules: Molecule[]): SeroBreakdown {
  const triggers = molecules
    .map((m) => ({
      id: m.id,
      nom: m.nom_dci,
      codes: m.alertes_pd.filter((c) => SERO_CODES.has(c as AlertePD)),
    }))
    .filter((t) => t.codes.length > 0)

  const count = triggers.length
  const hasHigh = triggers.some((t) =>
    t.codes.some((c) => SERO_HIGH.has(c as AlertePD)),
  )

  let severity: Severity = 'ok'
  if (count >= 3) severity = 'red'
  else if (count >= 2 && hasHigh) severity = 'red'
  else if (count >= 2) severity = 'amber'
  else if (count === 1) severity = 'info'

  const rationale =
    count === 0
      ? 'Aucune molécule sérotoninergique parmi les sélectionnées.'
      : count >= 2
        ? `Triade/duo sérotoninergique (${count} molécules) — risque de syndrome sérotoninergique.`
        : 'Une seule molécule sérotoninergique — risque limité hors triade.'

  return { triggers, count, severity, rationale }
}

export function scoreResp(molecules: Molecule[]): RespBreakdown {
  const contributors: RespBreakdown['contributors'] = []
  let hasBzd = false
  let hasOpioid = false
  let hasOtherCns = false

  for (const m of molecules) {
    const isBzd = tagBzdSubstance(m.classe)
    const isOpioid = tagOpioidSubstance(m.classe)
    const isResp = m.alertes_pd.includes('resp' as AlertePD)
    const isCns = tagOtherCns(m)

    if (isBzd) {
      hasBzd = true
      contributors.push({ id: m.id, nom: m.nom_dci, tag: 'bzd' })
    } else if (isOpioid || isResp) {
      hasOpioid = isOpioid || hasOpioid
      contributors.push({ id: m.id, nom: m.nom_dci, tag: 'opioïde' })
    } else if (isCns) {
      hasOtherCns = true
      contributors.push({ id: m.id, nom: m.nom_dci, tag: 'cns' })
    }
  }

  let severity: Severity = 'ok'
  if (hasBzd && hasOpioid && hasOtherCns) severity = 'red'
  else if (hasBzd && hasOpioid) severity = 'red'
  else if ((hasBzd && hasOtherCns) || (hasOpioid && hasOtherCns)) severity = 'amber'
  else if (contributors.length >= 1) severity = 'info'

  const rationale =
    severity === 'red'
      ? 'Triade dépression respiratoire : association BZD + opioïde (± autre dépresseur CNS) — HR 2.5 documenté pour buprénorphine + BZD.'
      : severity === 'amber'
        ? 'Association de 2 dépresseurs CNS — surveillance respiratoire requise.'
        : contributors.length >= 1
          ? 'Une molécule à effet dépresseur CNS isolée — risque limité.'
          : 'Pas de dépresseur CNS parmi les sélectionnées.'

  return { hasBzd, hasOpioid, hasOtherCns, contributors, severity, rationale }
}

export function scoreAcb(molecules: Molecule[]): AcbBreakdown {
  const perMolecule = molecules
    .map((m) => {
      let level: 1 | 2 | 3 | 0 = 0
      if (m.alertes_pd.includes('ACB-3' as AlertePD)) level = 3
      else if (m.alertes_pd.includes('ACB-2' as AlertePD)) level = 2
      else if (m.alertes_pd.includes('ACB-1' as AlertePD)) level = 1
      return level === 0 ? null : { id: m.id, nom: m.nom_dci, level }
    })
    .filter((x): x is { id: string; nom: string; level: 1 | 2 | 3 } => x !== null)

  const total = perMolecule.reduce((acc, x) => acc + x.level, 0)
  let severity: Severity = 'ok'
  if (total >= 6) severity = 'red'
  else if (total >= 3) severity = 'amber'
  else if (total >= 1) severity = 'info'

  const rationale =
    total === 0
      ? 'Charge anticholinergique nulle.'
      : `ACB cumulé = ${total}. Seuil ambre = 3, rouge = 6.`

  return { perMolecule, total, severity, rationale }
}

export function scoreSeuilEp(molecules: Molecule[]): SeuilEpBreakdown {
  const contributors = molecules
    .filter(
      (m) =>
        m.alertes_pd.includes('seuil-ep' as AlertePD) ||
        m.alertes_pd.includes('seuil-ep-sevrage' as AlertePD),
    )
    .map((m) => ({
      id: m.id,
      nom: m.nom_dci,
      sevrage: m.alertes_pd.includes('seuil-ep-sevrage' as AlertePD),
    }))

  const count = contributors.length
  let severity: Severity = 'ok'
  if (count >= 3) severity = 'red'
  else if (count >= 2) severity = 'amber'
  else if (count === 1) severity = 'info'

  const rationale =
    count === 0
      ? 'Pas d\'abaissement du seuil épileptogène attendu.'
      : `${count} molécule(s) abaissant le seuil épileptogène.`

  return { contributors, count, severity, rationale }
}

// Détection paires PK : substrat d'un CYP X + inhibiteur du même CYP X.
export interface PkPair {
  isoenzyme: string
  substrat: { id: string; nom: string; rang: string }
  inhibiteurOuInducteur: {
    id: string
    nom: string
    role: 'inhibiteur' | 'inducteur'
    puissance: string
    mecanisme: string
  }
}

export function detectPkPairs(molecules: Molecule[]): PkPair[] {
  const pairs: PkPair[] = []
  for (const sub of molecules) {
    for (const cyp of sub.phase1_cyp) {
      if (cyp.rang === 'trace') continue // on ignore le bruit
      for (const other of molecules) {
        if (other.id === sub.id) continue
        for (const inh of other.inhibiteur) {
          if (inh.cible === cyp.isoforme) {
            pairs.push({
              isoenzyme: cyp.isoforme,
              substrat: { id: sub.id, nom: sub.nom_dci, rang: cyp.rang },
              inhibiteurOuInducteur: {
                id: other.id,
                nom: other.nom_dci,
                role: 'inhibiteur',
                puissance: inh.puissance,
                mecanisme: inh.mecanisme,
              },
            })
          }
        }
        for (const ind of other.inducteur) {
          if (ind.cible === cyp.isoforme) {
            pairs.push({
              isoenzyme: cyp.isoforme,
              substrat: { id: sub.id, nom: sub.nom_dci, rang: cyp.rang },
              inhibiteurOuInducteur: {
                id: other.id,
                nom: other.nom_dci,
                role: 'inducteur',
                puissance: ind.puissance,
                mecanisme: ind.mecanisme,
              },
            })
          }
        }
      }
    }
  }
  return pairs
}

// Interactions documentées explicitement dans interactions_specifiques entre les molécules sélectionnées.
export interface DocumentedInteraction {
  source: { id: string; nom: string }
  cible: { id: string; nom: string }
  mecanisme: string
  effet: string
  timing: string | null
  preuve: string
  ref: string | string[]
}

export function findDocumentedInteractions(
  molecules: Molecule[],
): DocumentedInteraction[] {
  const ids = new Set(molecules.map((m) => m.id))
  const dciToId = new Map<string, string>()
  for (const m of molecules) {
    dciToId.set(m.nom_dci.toLowerCase(), m.id)
    for (const syn of m.synonymes) dciToId.set(syn.toLowerCase(), m.id)
  }

  const found: DocumentedInteraction[] = []
  for (const m of molecules) {
    for (const inter of m.interactions_specifiques) {
      const cibleId = dciToId.get(inter.avec.toLowerCase())
      if (!cibleId || !ids.has(cibleId) || cibleId === m.id) continue
      const cibleMol = molecules.find((x) => x.id === cibleId)!
      found.push({
        source: { id: m.id, nom: m.nom_dci },
        cible: { id: cibleId, nom: cibleMol.nom_dci },
        mecanisme: inter.mecanisme,
        effet: inter.effet,
        timing: inter.timing,
        preuve: String(inter.preuve),
        ref: inter.source,
      })
    }
  }
  return found
}
