// Modal d'insight clinique sur une voie métabolique précise.
// Affiche : couleur de la voie, toutes les molécules du panier qui la touchent
// avec leur rôle/intensité, et détecte automatiquement les paires PK
// (substrat × inhibiteur/inducteur sur la même voie).

import type { Molecule } from '../types/molecule';
import { getVoieStyle, getMoleculeVoies, intensityLevel } from '../utils/voies';
import { ModalDrawer } from './ui/ModalDrawer';
import { IntensityBars } from './ui/IntensityBars';

interface VoieDetailModalProps {
  voieId: string;
  /** Molécules du panier (pour calcul croisé sur cette voie) */
  cartMolecules: Molecule[];
  onClose: () => void;
  /** Callback pour ouvrir la fiche complète d'une molécule (transmis depuis le parent) */
  onOpenMolecule: (id: string) => void;
}

interface MolOnVoie {
  m: Molecule;
  role: 'substrat' | 'inhibiteur' | 'inducteur';
  intensity: string;
}

export function VoieDetailModal({ voieId, cartMolecules, onClose, onOpenMolecule }: VoieDetailModalProps) {
  const voie = getVoieStyle(voieId);

  // Pour chaque mol du panier, ses rôles sur CETTE voie
  const involved: MolOnVoie[] = [];
  for (const m of cartMolecules) {
    const voies = getMoleculeVoies(m);
    const entry = voies.find(v => v.voieId === voieId);
    if (!entry) continue;
    for (const d of entry.details) {
      involved.push({ m, role: d.role, intensity: d.intensity });
    }
  }

  // Détection paires PK
  const substrats = involved.filter(i => i.role === 'substrat');
  const inhibiteurs = involved.filter(i => i.role === 'inhibiteur');
  const inducteurs = involved.filter(i => i.role === 'inducteur');

  const pkPairs: { substrat: MolOnVoie; modulator: MolOnVoie; effect: 'AUC ↑' | 'AUC ↓' }[] = [];
  for (const s of substrats) {
    for (const inh of inhibiteurs) {
      if (s.m.id !== inh.m.id) {
        pkPairs.push({ substrat: s, modulator: inh, effect: 'AUC ↑' });
      }
    }
    for (const ind of inducteurs) {
      if (s.m.id !== ind.m.id) {
        pkPairs.push({ substrat: s, modulator: ind, effect: 'AUC ↓' });
      }
    }
  }

  const accent: 'red' | 'amber' | 'default' =
    pkPairs.some(p => intensityLevel(p.modulator.intensity) === 3) ? 'red'
    : pkPairs.length > 0 ? 'amber'
    : 'default';

  return (
    <ModalDrawer open onClose={onClose} title={`Voie · ${voie.label}`} accent={accent}>
      <div className="space-y-4">
        {/* Header coloré : la voie */}
        <div className={`rounded-md ${voie.bgActiveClass} p-4 text-white shadow`}>
          <h3 className="text-xl font-bold">{voie.label}</h3>
          <p className="text-xs opacity-80">{kindFr(voie.kind)}</p>
        </div>

        {/* Paires PK détectées */}
        {pkPairs.length > 0 && (
          <section className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-300">
              ⚠ Interaction PK potentielle · {pkPairs.length}
            </h4>
            <ul className="space-y-2 text-sm text-gray-100">
              {pkPairs.map((p, i) => (
                <li key={i} className="rounded bg-navy-900/40 p-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <strong>{p.substrat.m.nom_dci}</strong>
                    <span className="text-xs text-gray-400">substrat {p.substrat.intensity}</span>
                    <span className="text-amber-300">+</span>
                    <strong>{p.modulator.m.nom_dci}</strong>
                    <span className="text-xs text-gray-400">{p.modulator.role} {p.modulator.intensity}</span>
                  </div>
                  <p className="mt-1 text-xs text-amber-200">
                    → exposition <strong>{p.substrat.m.nom_dci}</strong> {p.effect}{' '}
                    {p.modulator.role === 'inhibiteur'
                      ? '(inhibition de la voie ralentit le métabolisme du substrat)'
                      : '(induction de la voie accélère le métabolisme du substrat)'}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Liste des molécules sur cette voie */}
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
            Molécules du panier sur cette voie · {involved.length}
          </h4>
          <ul className="space-y-1.5">
            {involved.map((i, idx) => {
              const lvl = intensityLevel(i.intensity);
              const roleColor = i.role === 'substrat'
                ? 'bg-blue-500/20 text-blue-200 border-blue-500/40'
                : i.role === 'inhibiteur'
                  ? 'bg-red-500/20 text-red-200 border-red-500/40'
                  : 'bg-green-500/20 text-green-200 border-green-500/40';
              return (
                <li key={idx} className="flex items-center justify-between gap-2 rounded-md border border-navy-700 bg-navy-800 p-2">
                  <div className="min-w-0 flex-1">
                    <button type="button"
                            onClick={() => { onClose(); onOpenMolecule(i.m.id); }}
                            className="text-left focus-ring">
                      <strong className="text-sm text-gray-100">{i.m.nom_dci}</strong>
                    </button>
                    <p className="text-xs text-gray-400">{i.m.classe}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-semibold ${roleColor}`}>
                    {labelRole(i.role)}
                    <span className={i.role === 'substrat' ? 'text-blue-200' : i.role === 'inhibiteur' ? 'text-red-200' : 'text-green-200'}>
                      {i.role === 'substrat'
                        ? <span className="rounded bg-black/25 px-1 text-[9px] uppercase">{lvl === 3 ? 'maj' : lvl === 2 ? 'mod' : 'min'}</span>
                        : <IntensityBars level={lvl} label={i.intensity} />}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {pkPairs.length === 0 && involved.length === 1 && (
          <p className="rounded-md border border-navy-700 bg-navy-800 p-3 text-xs text-gray-400">
            Une seule molécule du panier touche cette voie — pas de croisement PK calculable.
          </p>
        )}

        {pkPairs.length === 0 && involved.length >= 2 && (
          <p className="rounded-md border border-navy-700 bg-navy-800 p-3 text-xs text-gray-400">
            Plusieurs molécules sur la même voie, mais sans paire substrat × inhibiteur/inducteur (toutes substrats, ou toutes modulateurs). Croisement PK direct peu probable, mais saturation possible si plusieurs substrats.
          </p>
        )}
      </div>
    </ModalDrawer>
  );
}

function kindFr(k: string): string {
  switch (k) {
    case 'cyp': return 'Cytochrome P450 — phase I oxydative';
    case 'ugt': return 'UGT — phase II glucuronoconjugaison';
    case 'phase2': return 'Phase II non-UGT';
    case 'transporteur': return 'Transporteur membranaire';
    default: return 'Voie métabolique';
  }
}

function labelRole(role: 'substrat' | 'inhibiteur' | 'inducteur'): string {
  if (role === 'substrat') return 'Substrat';
  if (role === 'inhibiteur') return 'Inhibiteur';
  return 'Inducteur';
}
