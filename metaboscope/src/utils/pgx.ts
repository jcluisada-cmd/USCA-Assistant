// Helpers pharmacogénétique — affichage et croisement génotype/molécule.
import type { Molecule, PGxEntry } from '../types/molecule'

export function isCpicNiveauA(p: PGxEntry): boolean {
  return p.niveau_cpic === 'A'
}

export function isCpicActionable(p: PGxEntry): boolean {
  return p.niveau_cpic === 'A' || p.niveau_cpic === 'B'
}

export function variantsToString(p: PGxEntry): string {
  if (Array.isArray(p.variants)) return p.variants.join(', ')
  return p.variants
}

// Étant donné un génotype utilisateur (ex: { CYP2D6: 'PM', CYP2C19: 'IM' }),
// retourne pour chaque molécule sélectionnée les recommandations PGx applicables.
export interface PgxHit {
  molecule: { id: string; nom: string }
  entry: PGxEntry
  matchedGene: string
  matchedPhenotype: string
}

export function crossPgxWithGenotype(
  molecules: Molecule[],
  genotype: Record<string, string | undefined>,
): PgxHit[] {
  const hits: PgxHit[] = []
  for (const m of molecules) {
    for (const p of m.pharmacogenetique) {
      const userPhen = genotype[p.gene]
      if (!userPhen) continue
      // Match phénotype de la guideline si l'utilisateur a ce phénotype
      // (les fiches CPIC distinguent PM/IM/UM/RM ; on tolère un match strict).
      if (p.phenotype.toUpperCase().includes(userPhen.toUpperCase())) {
        hits.push({
          molecule: { id: m.id, nom: m.nom_dci },
          entry: p,
          matchedGene: p.gene,
          matchedPhenotype: userPhen,
        })
      }
    }
  }
  return hits
}
