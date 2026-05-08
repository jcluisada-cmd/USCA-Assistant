// src/utils/atlas.ts
import type { Molecule } from '../types/molecule';

export type AtlasCategory = 'cyp' | 'ugt' | 'transporteurs';

export interface AtlasEntry {
  substratsMajeurs: Molecule[];
  substratsMineurs: Molecule[];
  inhibiteursForts: Molecule[];
  inhibiteursModeres: Molecule[];
  inhibiteursFaibles: Molecule[];
  inducteurs: Molecule[];
}

export type AtlasIndex = Record<string, AtlasEntry>;

function emptyEntry(): AtlasEntry {
  return {
    substratsMajeurs: [], substratsMineurs: [],
    inhibiteursForts: [], inhibiteursModeres: [], inhibiteursFaibles: [],
    inducteurs: [],
  };
}

function matchesCategory(name: string, cat: AtlasCategory): boolean {
  if (cat === 'cyp') return /^CYP\d/i.test(name);
  if (cat === 'ugt') return /^UGT/i.test(name);
  if (cat === 'transporteurs') return /^(P-gp|BCRP|OCT|MATE|OATP|ABC|SLC)/i.test(name);
  return false;
}

export function buildAtlasIndex(molecules: Molecule[], category: AtlasCategory): AtlasIndex {
  const idx: AtlasIndex = {};
  const ensure = (key: string) => { if (!idx[key]) idx[key] = emptyEntry(); return idx[key]; };

  for (const m of molecules) {
    // Substrats CYP
    if (category === 'cyp') {
      for (const e of m.phase1_cyp) {
        const entry = ensure(e.isoforme);
        if (e.rang === 'majeur') entry.substratsMajeurs.push(m);
        else if (e.rang === 'mineur') entry.substratsMineurs.push(m);
      }
    }
    // Substrats UGT (depuis phase2 filtrés)
    if (category === 'ugt') {
      for (const e of m.phase2) {
        if (matchesCategory(e.enzyme, 'ugt')) {
          const entry = ensure(e.enzyme);
          if (e.rang === 'majeur') entry.substratsMajeurs.push(m);
          else if (e.rang === 'mineur') entry.substratsMineurs.push(m);
        }
      }
    }
    // Substrats transporteurs
    if (category === 'transporteurs') {
      for (const t of m.transporteurs) {
        if (!matchesCategory(t.transporteur, 'transporteurs')) continue;
        const entry = ensure(t.transporteur);
        if (t.role === 'substrat') entry.substratsMajeurs.push(m); // pas de rang dans le schéma transporteur
        else if (t.role === 'inhibiteur') entry.inhibiteursForts.push(m);
        else if (t.role === 'inducteur') entry.inducteurs.push(m);
      }
    }
    // Inhibiteur / Inducteur (toutes catégories)
    for (const inh of m.inhibiteur) {
      if (!matchesCategory(inh.cible, category)) continue;
      const entry = ensure(inh.cible);
      if (inh.puissance === 'fort') entry.inhibiteursForts.push(m);
      else if (inh.puissance === 'modéré') entry.inhibiteursModeres.push(m);
      else entry.inhibiteursFaibles.push(m);
    }
    for (const ind of m.inducteur) {
      if (!matchesCategory(ind.cible, category)) continue;
      ensure(ind.cible).inducteurs.push(m);
    }
  }
  return idx;
}
