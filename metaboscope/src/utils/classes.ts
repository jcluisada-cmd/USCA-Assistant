// Regroupement des classes thérapeutiques (texte libre dans m.classe)
// vers 8 grands buckets utilisés par le filtre Atlas + futur chantier G.
//
// Le matching est fait par regex sur m.classe — tolérant aux variations orthographiques
// (acentué/désaccentué, pluriels). En cas de doublon de match, le 1er bucket prime.

import type { Molecule } from '../types/molecule';

export type ClassBucket =
  | 'antidep'
  | 'antipsy'
  | 'bzd'
  | 'thymo'
  | 'opioid'
  | 'stim'
  | 'drogues'
  | 'nps_autres';

export const CLASS_BUCKETS: { id: ClassBucket; label: string; match: (classe: string) => boolean }[] = [
  // Ordre = priorité (1er match gagne)
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
    match: c => /(drogue\s+classique|alcool|cannabi|coca[iï]ne|MDMA|hallucinog|dissociatif|GHB|ket[aá]mine|opio[iï]de\s+illicite|h[eé]ro[iï]ne|crack|stupéfi|stimulant illicite)/i.test(c),
  },
  {
    id: 'nps_autres',
    label: 'NPS · Autres',
    match: () => true, // catch-all
  },
];

const BUCKET_BY_MOL: Map<string, ClassBucket> = new Map();

export function getMoleculeBucket(m: Molecule): ClassBucket {
  const cached = BUCKET_BY_MOL.get(m.id);
  if (cached) return cached;
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
    case 'nps_autres': return 'NPS/autre';
  }
}
