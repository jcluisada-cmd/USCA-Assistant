// Parser fuzzy d'une ordonnance — Mode Ordonnance (chantier D.1, 2026-05-11).
//
// Stratégie : split par lignes, extrait la DCI (avant la 1ère dose/posologie),
// délègue à searchMolecules() pour le fuzzy match (déjà tolérant accents/préfixes/synonymes),
// retourne un ParseResult par ligne avec niveau de confiance + candidats alternatifs.

import { searchMolecules } from '../data';
import type { Molecule } from '../types/molecule';

export type Confidence = 'high' | 'medium' | 'low' | 'none';

export interface ParseResult {
  /** Ligne brute saisie par l'utilisateur */
  raw: string;
  /** DCI extraite après nettoyage (avant la première dose) */
  dci: string;
  /** Dose / forme extraite si présente (ex. "10mg", "50 mg matin et soir") */
  dose?: string;
  /** Meilleur match — null si rien trouvé */
  matched: Molecule | null;
  /** Confiance dans le match top */
  confidence: Confidence;
  /** Top 5 candidats (matched + alternatives) — pour permettre à l'utilisateur de corriger */
  candidates: Molecule[];
}

const norm = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

const DOSE_RE = /(\d+(?:[,.]\d+)?)\s*(mg|µg|mcg|g|ui|ml|cp|gtt|gouttes?|patch)\b/i;

function parseLine(raw: string): ParseResult {
  // 1. Extraction dose : 1ère séquence "<nombre> <unité>"
  let dci = raw;
  let dose: string | undefined;
  const doseMatch = raw.match(DOSE_RE);
  if (doseMatch && typeof doseMatch.index === 'number') {
    dose = raw.slice(doseMatch.index).trim();
    dci = raw.slice(0, doseMatch.index).trim();
  }
  // 2. Strip ce qui suit une virgule/point-virgule (ex. "tramadol, 50mg, 3x/j" → "tramadol")
  dci = dci.replace(/[,;].*$/, '').trim();
  // 3. Strip un éventuel "1 -", "•", "*" en début de ligne
  dci = dci.replace(/^[\s\-•*·\d.)]+/, '').trim();

  if (!dci) {
    return { raw, dci: '', dose, matched: null, confidence: 'none', candidates: [] };
  }

  const results = searchMolecules(dci, 5);
  if (results.length === 0) {
    return { raw, dci, dose, matched: null, confidence: 'none', candidates: [] };
  }

  const top = results[0];
  const normDci = norm(dci);
  const normTopDci = norm(top.nom_dci);
  const normSynonymes = (top.synonymes ?? []).map(norm);

  // Calcul confidence
  let confidence: Confidence;
  if (normDci === normTopDci || normSynonymes.includes(normDci)) {
    confidence = 'high';
  } else if (normTopDci.startsWith(normDci) && normDci.length >= 4) {
    // Préfixe DCI ≥ 4 caractères → probable
    confidence = 'high';
  } else if (normSynonymes.some(s => s.startsWith(normDci)) && normDci.length >= 4) {
    confidence = 'medium';
  } else if (results.length === 1) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return { raw, dci, dose, matched: top, confidence, candidates: results };
}

/**
 * Parse une ordonnance saisie en texte brut, une molécule par ligne.
 * Lignes vides ignorées. Les caractères de puce/numérotation en début de ligne sont strippés.
 */
export function parseOrdonnance(text: string): ParseResult[] {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(parseLine);
}
