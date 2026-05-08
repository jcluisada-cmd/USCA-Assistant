// Catalogue des voies métaboliques connues + couleur d'affichage cohérente
// dans toute l'app (Atlas, Interactions, fiches). 1 couleur = 1 voie.
//
// Les voies non listées ici tombent en couleur "slate" générique (helper getVoieStyle).

import type { Molecule } from '../types/molecule';

export type VoieKind = 'cyp' | 'ugt' | 'phase2' | 'transporteur' | 'autre';

export interface VoieStyle {
  /** Identifiant normalisé (CYP3A4, UGT1A4, P-gp…) — clé de référence */
  id: string;
  /** Libellé affiché (peut différer de l'id) */
  label: string;
  /** Catégorie (utile pour l'ordre d'affichage de la grille) */
  kind: VoieKind;
  /** Classes Tailwind pour pill non sélectionnée (border) et sélectionnée (bg) */
  borderClass: string;
  textClass: string;
  bgActiveClass: string;
  /** Classes pour pill "petite" affichée à côté du nom de la molécule (fond pâle + texte foncé) */
  pillBgClass: string;
  pillTextClass: string;
}

// Catalogue ordonné (1ère colonne = id, 2ème = label, 3ème = kind, 4ème = teinte tailwind)
const VOIES_RAW: { id: string; label?: string; kind: VoieKind; tone: string }[] = [
  // CYP — 10 majeures
  { id: 'CYP1A2',  kind: 'cyp', tone: 'pink' },
  { id: 'CYP2A6',  kind: 'cyp', tone: 'fuchsia' },
  { id: 'CYP2B6',  kind: 'cyp', tone: 'yellow' },
  { id: 'CYP2C8',  kind: 'cyp', tone: 'orange' },
  { id: 'CYP2C9',  kind: 'cyp', tone: 'amber' },
  { id: 'CYP2C19', kind: 'cyp', tone: 'red' },
  { id: 'CYP2D6',  kind: 'cyp', tone: 'green' },
  { id: 'CYP2E1',  kind: 'cyp', tone: 'lime' },
  { id: 'CYP3A4',  kind: 'cyp', tone: 'blue' },
  { id: 'CYP3A5',  kind: 'cyp', tone: 'sky' },
  // UGT — 5 majeures
  { id: 'UGT1A1',  kind: 'ugt', tone: 'purple' },
  { id: 'UGT1A4',  kind: 'ugt', tone: 'purple' },
  { id: 'UGT1A6',  kind: 'ugt', tone: 'violet' },
  { id: 'UGT1A9',  kind: 'ugt', tone: 'violet' },
  { id: 'UGT2B7',  kind: 'ugt', tone: 'indigo' },
  { id: 'UGT2B15', kind: 'ugt', tone: 'indigo' },
  // Phase II non-UGT
  { id: 'SULT1A1', kind: 'phase2', tone: 'rose' },
  { id: 'NAT2',    kind: 'phase2', tone: 'rose' },
  { id: 'COMT',    kind: 'phase2', tone: 'rose' },
  { id: 'MAO-A',   kind: 'phase2', tone: 'red' },
  { id: 'MAO-B',   kind: 'phase2', tone: 'red' },
  { id: 'AKR1C4',  kind: 'phase2', tone: 'rose' },
  // Phase I non-CYP
  { id: 'ADH',     label: 'ADH (alcool)', kind: 'autre', tone: 'amber' },
  { id: 'ALDH',    label: 'ALDH', kind: 'autre', tone: 'amber' },
  { id: 'FMO3',    kind: 'autre', tone: 'lime' },
  // Transporteurs
  { id: 'P-gp',    label: 'P-gp', kind: 'transporteur', tone: 'teal' },
  { id: 'BCRP',    kind: 'transporteur', tone: 'cyan' },
  { id: 'OATP1B1', kind: 'transporteur', tone: 'sky' },
  { id: 'OATP1B3', kind: 'transporteur', tone: 'sky' },
  { id: 'OAT1',    kind: 'transporteur', tone: 'emerald' },
  { id: 'OAT3',    kind: 'transporteur', tone: 'emerald' },
  { id: 'MATE1',   kind: 'transporteur', tone: 'teal' },
  { id: 'MRP2',    kind: 'transporteur', tone: 'cyan' },
  { id: 'BSEP',    kind: 'transporteur', tone: 'cyan' },
];

const TONE_TO_CLASSES: Record<string, Pick<VoieStyle, 'borderClass' | 'textClass' | 'bgActiveClass' | 'pillBgClass' | 'pillTextClass'>> = {
  pink:    { borderClass: 'border-pink-400',    textClass: 'text-pink-700',    bgActiveClass: 'bg-pink-500',    pillBgClass: 'bg-pink-100',    pillTextClass: 'text-pink-800' },
  fuchsia: { borderClass: 'border-fuchsia-400', textClass: 'text-fuchsia-700', bgActiveClass: 'bg-fuchsia-500', pillBgClass: 'bg-fuchsia-100', pillTextClass: 'text-fuchsia-800' },
  rose:    { borderClass: 'border-rose-400',    textClass: 'text-rose-700',    bgActiveClass: 'bg-rose-500',    pillBgClass: 'bg-rose-100',    pillTextClass: 'text-rose-800' },
  red:     { borderClass: 'border-red-400',     textClass: 'text-red-700',     bgActiveClass: 'bg-red-500',     pillBgClass: 'bg-red-100',     pillTextClass: 'text-red-800' },
  orange:  { borderClass: 'border-orange-400',  textClass: 'text-orange-700',  bgActiveClass: 'bg-orange-500',  pillBgClass: 'bg-orange-100',  pillTextClass: 'text-orange-800' },
  amber:   { borderClass: 'border-amber-400',   textClass: 'text-amber-700',   bgActiveClass: 'bg-amber-500',   pillBgClass: 'bg-amber-100',   pillTextClass: 'text-amber-800' },
  yellow:  { borderClass: 'border-yellow-400',  textClass: 'text-yellow-700',  bgActiveClass: 'bg-yellow-500',  pillBgClass: 'bg-yellow-100',  pillTextClass: 'text-yellow-800' },
  lime:    { borderClass: 'border-lime-400',    textClass: 'text-lime-700',    bgActiveClass: 'bg-lime-500',    pillBgClass: 'bg-lime-100',    pillTextClass: 'text-lime-800' },
  green:   { borderClass: 'border-green-400',   textClass: 'text-green-700',   bgActiveClass: 'bg-green-500',   pillBgClass: 'bg-green-100',   pillTextClass: 'text-green-800' },
  emerald: { borderClass: 'border-emerald-400', textClass: 'text-emerald-700', bgActiveClass: 'bg-emerald-500', pillBgClass: 'bg-emerald-100', pillTextClass: 'text-emerald-800' },
  teal:    { borderClass: 'border-teal-400',    textClass: 'text-teal-700',    bgActiveClass: 'bg-teal-500',    pillBgClass: 'bg-teal-100',    pillTextClass: 'text-teal-800' },
  cyan:    { borderClass: 'border-cyan-400',    textClass: 'text-cyan-700',    bgActiveClass: 'bg-cyan-500',    pillBgClass: 'bg-cyan-100',    pillTextClass: 'text-cyan-800' },
  sky:     { borderClass: 'border-sky-400',     textClass: 'text-sky-700',     bgActiveClass: 'bg-sky-500',     pillBgClass: 'bg-sky-100',     pillTextClass: 'text-sky-800' },
  blue:    { borderClass: 'border-blue-400',    textClass: 'text-blue-700',    bgActiveClass: 'bg-blue-500',    pillBgClass: 'bg-blue-100',    pillTextClass: 'text-blue-800' },
  indigo:  { borderClass: 'border-indigo-400',  textClass: 'text-indigo-700',  bgActiveClass: 'bg-indigo-500',  pillBgClass: 'bg-indigo-100',  pillTextClass: 'text-indigo-800' },
  violet:  { borderClass: 'border-violet-400',  textClass: 'text-violet-700',  bgActiveClass: 'bg-violet-500',  pillBgClass: 'bg-violet-100',  pillTextClass: 'text-violet-800' },
  purple:  { borderClass: 'border-purple-400',  textClass: 'text-purple-700',  bgActiveClass: 'bg-purple-500',  pillBgClass: 'bg-purple-100',  pillTextClass: 'text-purple-800' },
  slate:   { borderClass: 'border-slate-400',   textClass: 'text-slate-700',   bgActiveClass: 'bg-slate-500',   pillBgClass: 'bg-slate-100',   pillTextClass: 'text-slate-800' },
};

export const VOIES: VoieStyle[] = VOIES_RAW.map(({ id, label, kind, tone }) => ({
  id,
  label: label ?? id,
  kind,
  ...(TONE_TO_CLASSES[tone] ?? TONE_TO_CLASSES.slate),
}));

const VOIE_BY_ID: Map<string, VoieStyle> = new Map(VOIES.map(v => [v.id, v]));

/** Retourne le style d'une voie par son nom (avec normalisation: P-gp/Pgp, etc.). Slate par défaut. */
export function getVoieStyle(name: string): VoieStyle {
  const direct = VOIE_BY_ID.get(name);
  if (direct) return direct;
  // Tolérance légère sur les variantes orthographiques courantes
  const normalized = name.replace(/[\s_]+/g, '').replace(/-+/g, '-').toUpperCase();
  for (const v of VOIES) {
    if (v.id.replace(/[\s_-]+/g, '').toUpperCase() === normalized) return v;
  }
  return {
    id: name,
    label: name,
    kind: 'autre',
    ...TONE_TO_CLASSES.slate,
  };
}

/** Liste des "rôles" d'une molécule sur une voie donnée — pour l'affichage Atlas. */
export type VoieRole = 'substrat' | 'inhibiteur' | 'inducteur';
export type VoieRoleDetail = {
  role: VoieRole;
  /** rang substrat (majeur/mineur/trace) ou puissance inhib/induct (fort/modéré/faible) */
  intensity: string;
};

/**
 * Pour une molécule donnée, retourne tous les couples (voie, rôle, intensité).
 * Inspecte phase1_cyp, phase2, transporteurs, inhibiteur, inducteur.
 */
export function getMoleculeVoies(m: Molecule): { voieId: string; details: VoieRoleDetail[] }[] {
  const map: Map<string, VoieRoleDetail[]> = new Map();
  const push = (voieId: string, detail: VoieRoleDetail) => {
    const arr = map.get(voieId) ?? [];
    arr.push(detail);
    map.set(voieId, arr);
  };

  for (const c of m.phase1_cyp) {
    if (c.isoforme && c.isoforme !== 'ND') push(c.isoforme, { role: 'substrat', intensity: c.rang });
  }
  for (const c of m.phase1_non_cyp) {
    if (c.enzyme && c.enzyme !== 'ND') push(c.enzyme, { role: 'substrat', intensity: c.rang });
  }
  for (const c of m.phase2) {
    if (c.enzyme && c.enzyme !== 'ND') push(c.enzyme, { role: 'substrat', intensity: c.rang });
  }
  for (const t of m.transporteurs) {
    if (t.transporteur && t.transporteur !== 'ND') {
      const role = (t.role === 'inhibiteur' || t.role === 'inducteur') ? t.role : 'substrat';
      push(t.transporteur, { role, intensity: 'majeur' });
    }
  }
  for (const i of m.inhibiteur) {
    if (i.cible && i.cible !== 'ND') push(i.cible, { role: 'inhibiteur', intensity: i.puissance });
  }
  for (const i of m.inducteur) {
    if (i.cible && i.cible !== 'ND') push(i.cible, { role: 'inducteur', intensity: i.puissance });
  }

  return Array.from(map.entries()).map(([voieId, details]) => ({ voieId, details }));
}

/** Map intensité → niveau 1/2/3 pour les barres d'intensité (3 = max). */
export function intensityLevel(intensity: string): 1 | 2 | 3 {
  const i = intensity.toLowerCase();
  if (i.includes('majeur') || i.includes('fort')) return 3;
  if (i.includes('modéré') || i.includes('modere') || i.includes('moder')) return 2;
  return 1;
}
