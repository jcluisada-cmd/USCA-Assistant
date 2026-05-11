// Regroupement des classes thérapeutiques (texte libre dans m.classe)
// vers les buckets utilisés par le filtre Atlas, Mode Ordonnance et Interactions.
//
// Chantier G (2026-05-11) :
//   - Le type ClassBucket est désormais dans types/molecule.ts (utilisable depuis Molecule.bucket).
//   - `getMoleculeBucket` honore le champ `m.bucket` explicit si présent — sinon fallback regex.
//   - 2 buckets ajoutés : `anticraving` (médicaments anti-craving alcool) et `sevrage_tabac`.

import type { Molecule, ClassBucket } from '../types/molecule';

// Re-export pour rétro-compat des imports existants depuis pages/*
export type { ClassBucket };

export const CLASS_BUCKETS: { id: ClassBucket; label: string; match: (classe: string) => boolean }[] = [
  // Ordre = priorité (1er match gagne) — utilisé en fallback uniquement quand m.bucket absent.
  {
    id: 'anticraving',
    label: 'Anti-craving',
    match: c => /anti[- ]?craving/i.test(c),
  },
  {
    id: 'sevrage_tabac',
    label: 'Sevrage tabagique',
    match: c => /(sevrage\s+tabagique|substituts?\s+nicotiniques?|TSN\b)/i.test(c),
  },
  {
    id: 'opioid',
    label: 'Opioïdes · TSO',
    match: c => /(opio[iï]de|TSO|methadon|méthadon|buprenorphin|buprénorphin|tramadol|fentanyl|nitazèn|nitazene|opio[iï]de\s+stupéfi)/i.test(c),
  },
  {
    id: 'antidep',
    label: 'Antidépresseurs',
    match: c => /(antid[eé]presseur|ISRS|IRSNA?|IMAO|SNRI|SSRI|tricycliqu|antid[eé]presseur\s+tricycliqu)/i.test(c),
  },
  {
    id: 'antipsy',
    label: 'Antipsychotiques',
    match: c => /(antipsychotiqu|neuroleptiqu)/i.test(c),
  },
  {
    id: 'bzd',
    label: 'Anxiolytiques · Hypnotiques',
    match: c => /(BZD|benzodiaz|hypnotiqu|Z[- ]?drug|anxiolyti|barbituri)/i.test(c),
  },
  {
    id: 'thymo',
    label: 'Thymorégulateurs · Anticonvulsivants',
    match: c => /(thymor[eé]gul|anticonvulsi|antiépile|antiepile|stabili|lithium)/i.test(c),
  },
  {
    id: 'stim',
    label: 'Psychostimulants',
    match: c => /(psychostimul|stimulant\s+(thérapeutique|therapeutique))/i.test(c),
  },
  {
    id: 'drogues',
    label: 'Drogues classiques',
    match: c => /(drogue\s+(classique|licite|récréative)|alcool|cannabi|coca[iï]ne|MDMA|hallucinog|dissociatif|GHB|ket[aá]mine|opio[iï]de\s+illicite|h[eé]ro[iï]ne|crack|stupéfi|stimulant\s+illicite|entactogène|phénéthylamine|tryptamine|Iboga|psilocyb)/i.test(c),
  },
  {
    id: 'nps_autres',
    label: 'NPS · Autres',
    match: () => true, // catch-all
  },
];

const BUCKET_BY_MOL: Map<string, ClassBucket> = new Map();

export function getMoleculeBucket(m: Molecule): ClassBucket {
  // Priorité 1 : override explicite via m.bucket (chantier G — sortie regex peu fiable sur texte libre)
  if (m.bucket) return m.bucket;
  // Priorité 2 : cache mémoire pour éviter de rejouer le regex
  const cached = BUCKET_BY_MOL.get(m.id);
  if (cached) return cached;
  // Priorité 3 : fallback regex sur m.classe
  const bucket = CLASS_BUCKETS.find(b => b.match(m.classe))?.id ?? 'nps_autres';
  BUCKET_BY_MOL.set(m.id, bucket);
  return bucket;
}

export function getBucketLabel(id: ClassBucket): string {
  return CLASS_BUCKETS.find(b => b.id === id)?.label ?? id;
}

/** Helper rapide : abréviation pour affichage compact ("antipsy", "ATD", "BZD"…) */
export function getBucketShort(id: ClassBucket): string {
  switch (id) {
    case 'antidep': return 'ATD';
    case 'antipsy': return 'antipsy';
    case 'bzd': return 'BZD';
    case 'thymo': return 'thymo';
    case 'opioid': return 'opioïde';
    case 'stim': return 'stim';
    case 'drogues': return 'drogue';
    case 'anticraving': return 'anti-craving';
    case 'sevrage_tabac': return 'sevrage tabac';
    case 'nps_autres': return 'NPS/autre';
  }
}
