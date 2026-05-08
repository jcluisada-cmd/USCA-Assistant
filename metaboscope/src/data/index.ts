// Agrégation des JSON molécules en un index unique en mémoire.
// Pas de fetch réseau — Vite empaquette les JSON dans le bundle (offline-first).

import type { Molecule, MoleculeFile } from '../types/molecule'

// Sessions 1-10 : format { molecules: Molecule[] }
import opioides from './molecules/molecules_opioides_tso.json'
import antidepresseurs from './molecules/molecules_antidepresseurs.json'
import antipsychotiques from './molecules/molecules_antipsychotiques.json'
import thymo from './molecules/molecules_thymoregulateurs_anticonvulsivants.json'
import bzd from './molecules/molecules_bzd_hypnotiques.json'
import psychostimulants from './molecules/molecules_psychostimulants.json'
import droguesClassiques from './molecules/molecules_drogues_classiques.json'
import hallucinogenes from './molecules/molecules_hallucinogenes_dissociatifs.json'
import ghb from './molecules/molecules_ghb_derives.json'
import cathinones from './molecules/molecules_nps_cathinones.json'

// Sessions 11-13 : format Molecule[] (tableau brut)
import npsOpioidesBenzo from './molecules/molecules_nps_opioides_benzo.json'
import npsCannabinoïdes from './molecules/molecules_nps_cannabinoides_autres.json'
import autres from './molecules/molecules_autres.json'

// ---------------------------------------------------------------------------
// Helper : accepte les deux formats de fichier (objet .molecules ou tableau brut)
// ---------------------------------------------------------------------------
function extractMolecules(raw: unknown): Molecule[] {
  if (Array.isArray(raw)) return raw as Molecule[]
  return ((raw as MoleculeFile).molecules ?? []) as Molecule[]
}

// ---------------------------------------------------------------------------
// Index global
// ---------------------------------------------------------------------------
export const ALL_MOLECULES: Molecule[] = [
  opioides,
  antidepresseurs,
  antipsychotiques,
  thymo,
  bzd,
  psychostimulants,
  droguesClassiques,
  hallucinogenes,
  ghb,
  cathinones,
  npsOpioidesBenzo,
  npsCannabinoïdes,
  autres,
].flatMap((raw) => extractMolecules(raw))

// Index par id pour lookup O(1).
export const MOLECULES_BY_ID: Map<string, Molecule> = new Map(
  ALL_MOLECULES.map((m) => [m.id, m]),
)

// Liste plate des classes uniques (utile pour filtres futurs).
export const CLASSES: string[] = [
  ...new Set(ALL_MOLECULES.map((m) => m.classe)),
].sort((a, b) => a.localeCompare(b, 'fr'))

// ---------------------------------------------------------------------------
// Recherche / autocomplete
// ---------------------------------------------------------------------------
const norm = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .trim()

interface SearchEntry {
  molecule: Molecule
  haystack: string // tous les noms cherchables, pré-normalisés et joints par |
}

const SEARCH_INDEX: SearchEntry[] = ALL_MOLECULES.map((m) => ({
  molecule: m,
  haystack: [m.nom_dci, ...(m.synonymes ?? []), m.id, m.classe]
    .map(norm)
    .join('|'),
}))

/**
 * Recherche par préfixe sur DCI + synonymes + id + classe.
 * Retourne au plus `limit` résultats triés : matches DCI exacts d'abord,
 * puis matches préfixe DCI, puis matches dans synonymes / classe.
 */
export function searchMolecules(query: string, limit = 20): Molecule[] {
  const q = norm(query)
  if (!q) return []

  const exact: Molecule[] = []
  const prefixDci: Molecule[] = []
  const prefixSynonyme: Molecule[] = []
  const contient: Molecule[] = []

  for (const entry of SEARCH_INDEX) {
    const m = entry.molecule
    const dciNorm = norm(m.nom_dci)
    if (dciNorm === q) {
      exact.push(m)
      continue
    }
    if (dciNorm.startsWith(q)) {
      prefixDci.push(m)
      continue
    }
    const synMatchPrefix = (m.synonymes ?? []).some((s) => norm(s).startsWith(q))
    if (synMatchPrefix) {
      prefixSynonyme.push(m)
      continue
    }
    if (entry.haystack.includes(q)) {
      contient.push(m)
    }
  }

  return [...exact, ...prefixDci, ...prefixSynonyme, ...contient].slice(0, limit)
}

export function getMolecule(id: string): Molecule | undefined {
  return MOLECULES_BY_ID.get(id)
}

// ---------------------------------------------------------------------------
// Module 3 — Substances (drogues licites, illicites, NPS)
// ---------------------------------------------------------------------------
const SUBSTANCE_CLASS_PATTERNS = [
  /nps/i,
  /drogue/i,
  /alcool/i,
  /cannabi/i,
  /opioïde\s+stupéfiant/i,
  /hallucinog/i,
  /dissociatif/i,
  /stimulant\s+illicite/i,
  /stupéfiant/i,
  /cathinone/i,
  /nitazène/i,
  // Sessions 12-13 : classes hors préfixe "NPS"
  /phytothérapeutique/i,   // kava
  /détourné/i,             // poppers ("usage détourné")
  /alcaloïde\s+végétal/i,  // mitragynine / kratom
]

export const SUBSTANCES: Molecule[] = ALL_MOLECULES.filter((m) =>
  SUBSTANCE_CLASS_PATTERNS.some((p) => p.test(m.classe)),
)

export function isSubstance(m: Molecule): boolean {
  return SUBSTANCE_CLASS_PATTERNS.some((p) => p.test(m.classe))
}