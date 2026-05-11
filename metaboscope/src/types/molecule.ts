// Types TypeScript dérivés de DATA_SCHEMA.md.
// Volontairement permissifs sur certains codes (`string` en fallback) pour tolérer
// les variations rencontrées dans les JSON v2 réels (variants en string OU array,
// niveau_cpic = "ND" plutôt que "non classé", etc.).

export type NiveauPreuve =
  | 'IVH-C'
  | 'IVH-O'
  | 'CAS'
  | 'FOR'
  | 'IVA'
  | 'IVT'
  | 'AN'
  | 'ND'

export type Rang = 'majeur' | 'mineur' | 'trace'

// Bucket de classement thérapeutique pour l'UI (filtres Atlas, Mode Ordonnance, Interactions).
// Cf. utils/classes.ts pour le mapping classe → bucket (regex fallback) et les labels.
// Chantier G (2026-05-11) — un champ `bucket` explicite sur Molecule prend le pas sur le regex.
export type ClassBucket =
  | 'antidep'
  | 'antipsy'
  | 'bzd'
  | 'thymo'
  | 'opioid'
  | 'stim'
  | 'drogues'
  | 'anticraving'
  | 'sevrage_tabac'
  | 'nps_autres'

export type Puissance = 'fort' | 'modéré' | 'faible'

export interface CYPEntry {
  isoforme: string
  rang: Rang
  produit: string
  preuve: NiveauPreuve | string
  source: string | string[]
  zone_grise?: boolean
}

export interface NonCYPEntry {
  enzyme: string
  alias?: string
  rang: Rang
  produit: string
  preuve: NiveauPreuve | string
  source: string | string[]
  zone_grise?: boolean
}

export interface Phase2Entry {
  enzyme: string
  rang: Rang
  produit: string
  preuve: NiveauPreuve | string
  source: string | string[]
  zone_grise?: boolean
}

export interface TransporteurEntry {
  transporteur: string
  role: 'substrat' | 'inhibiteur' | 'inducteur' | string
  preuve: NiveauPreuve | string
  source: string | string[]
  zone_grise?: boolean
}

export interface InhibEntry {
  cible: string
  puissance: Puissance | string
  mecanisme: string
  preuve: NiveauPreuve | string
  source: string | string[]
  zone_grise?: boolean
}

export interface InductEntry {
  cible: string
  puissance: Puissance | string
  mecanisme: string
  preuve: NiveauPreuve | string
  source: string | string[]
  zone_grise?: boolean
}

export interface MetaboliteActif {
  present: boolean
  nom: string | null
  activite_relative: string | null
  demi_vie_h: number | null
}

// `variants` peut arriver en string ("S145C, L311V") OU en array (["*1","*4"]) selon les JSON.
export type PGxVariants = string | string[]

export type NiveauCpic = 'A' | 'B' | 'C' | 'D' | 'x' | 'non classé' | 'ND' | string

export interface PGxEntry {
  gene: string
  variants: PGxVariants
  phenotype: string
  niveau_cpic: NiveauCpic
  recommandation: string
  zone_grise: boolean
  source: string | string[]
}

export interface InteractionEntry {
  avec: string
  mecanisme: string
  effet: string
  timing: string | null
  preuve: NiveauPreuve | string
  source: string | string[]
}

// Vocabulaire contrôlé des alertes PD (CLAUDE.md + DATA_SCHEMA.md).
export type AlertePD =
  | 'QT-KR'
  | 'QT-PR'
  | 'QT-CR'
  | 'QT-SR'
  | 'sero'
  | 'sero-faible'
  | 'sero-modere'
  | 'resp'
  | 'ACB-1'
  | 'ACB-2'
  | 'ACB-3'
  | 'seuil-ep'
  | 'seuil-ep-sevrage'
  | 'hepatotox'
  | 'nephrotox'
  | 'myocardite'
  | 'CI-IMAO'
  | 'CI-fluvoxamine'
  | 'CI-sildenafil'
  | 'CI-grossesse'
  | 'teratogene'
  | 'SJS-Lyell-HLA-B1502'
  | 'DRESS-HLA-A3101'
  | 'fenetre-etroite'
  | 'mesusage-documented'
  | 'dependance-mu-opioide'
  | 'myelopathie-B12'
  // Fallback pour codes ajoutés ultérieurement sans casser la compilation
  | (string & {})

export interface Molecule {
  id: string
  nom_dci: string
  synonymes: string[]
  classe: string
  statut_fr: string
  phase1_cyp: CYPEntry[]
  phase1_non_cyp: NonCYPEntry[]
  phase2: Phase2Entry[]
  transporteurs: TransporteurEntry[]
  inhibiteur: InhibEntry[]
  inducteur: InductEntry[]
  metabolite_actif: MetaboliteActif
  pharmacogenetique: PGxEntry[]
  interactions_specifiques: InteractionEntry[]
  alertes_pd: AlertePD[]
  niveau_preuve_global: NiveauPreuve | string
  sources_principales: string[]
  zone_grise: boolean
  derniere_maj: string
  champ_manquants: string[]
  /** Override explicite du bucket UI (chantier G, 2026-05-11). Si absent, fallback regex sur `classe`. */
  bucket?: ClassBucket
}

// Normalise une source `string | string[]` en tableau pour itération uniforme côté UI.
export function normalizeSources(s: string | string[]): string[] {
  return Array.isArray(s) ? s : [s]
}

// Wrapper de fichier JSON tel qu'il est sur disque.
export interface MoleculeFile {
  _metadata?: {
    fichier?: string
    classes_incluses?: string[]
    nombre_molecules?: number
    nombre_zones_grises_molecule?: number
    nombre_entrees_avec_champs_zone_grise?: number
    date_consolidation?: string
    sources_rapports_projet?: string[]
    regles_fusion_appliquees?: string[]
    schema_version?: string
  }
  molecules: Molecule[]
}
