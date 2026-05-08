// Atlas v2 — refonte complète (chantier MetaboScope UX/UI 2026-05-09).
//
// Structure : barre de recherche (→ modal molécule via ?molecule=ID) +
// grille de toggles voies (multi-sélection) + filtre classes thérapeutiques +
// 3 sections résultats (Substrats / Inhibiteurs / Inducteurs) + bannière panier.

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ALL_MOLECULES, searchMolecules } from '../data';
import type { Molecule } from '../types/molecule';
import { useCart } from '../context/CartContext';
import { VOIES, getVoieStyle, getMoleculeVoies, intensityLevel, type VoieStyle, type VoieKind } from '../utils/voies';
import { CLASS_BUCKETS, getMoleculeBucket, getBucketShort, type ClassBucket } from '../utils/classes';
import { IntensityBars } from '../components/ui/IntensityBars';

const STORAGE_DISABLED_CLASSES = 'metaboscope_disabled_classes_v1';

type FilterMode = 'OR' | 'AND';

interface MoleculeWithRoles {
  m: Molecule;
  /** Pour chaque voie sélectionnée touchée par la mol : { voieId, role, intensity } */
  hits: { voieId: string; role: 'substrat' | 'inhibiteur' | 'inducteur'; intensity: string }[];
}

export function AtlasPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const [, setSearchParams] = useSearchParams();

  // ─── State ───────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedVoies, setSelectedVoies] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<FilterMode>('OR');
  const [classFilterOpen, setClassFilterOpen] = useState(false);
  const [disabledClasses, setDisabledClasses] = useState<Set<ClassBucket>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_DISABLED_CLASSES);
      if (raw) return new Set(JSON.parse(raw) as ClassBucket[]);
    } catch { /* ignore */ }
    return new Set();
  });

  // Persist disabledClasses
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_DISABLED_CLASSES, JSON.stringify(Array.from(disabledClasses)));
    } catch { /* ignore */ }
  }, [disabledClasses]);

  // ─── Helpers ─────────────────────────────────────────────
  function toggleVoie(id: string) {
    setSelectedVoies(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleClass(id: ClassBucket) {
    setDisabledClasses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const openMoleculeModal = useCallback((id: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('molecule', id);
      return next;
    });
    setSearchOpen(false);
    setQuery('');
  }, [setSearchParams]);

  // ─── Recherche autocomplete ──────────────────────────────
  const searchResults = useMemo<Molecule[]>(() => {
    if (query.trim().length < 2) return [];
    return searchMolecules(query, 8);
  }, [query]);

  // ─── Filtrage molécules par voies + classes ──────────────
  const filteredResults = useMemo<MoleculeWithRoles[]>(() => {
    if (selectedVoies.size === 0) return [];
    const out: MoleculeWithRoles[] = [];

    for (const m of ALL_MOLECULES) {
      // Filtre classe
      if (disabledClasses.has(getMoleculeBucket(m))) continue;

      // Voies de la molécule
      const molVoies = getMoleculeVoies(m);
      const matched: MoleculeWithRoles['hits'] = [];
      for (const { voieId, details } of molVoies) {
        if (selectedVoies.has(voieId)) {
          for (const d of details) {
            matched.push({ voieId, role: d.role, intensity: d.intensity });
          }
        }
      }

      if (matched.length === 0) continue;

      // Filtre OR / AND
      if (mode === 'AND') {
        const matchedSet = new Set(matched.map(h => h.voieId));
        const allRequired = Array.from(selectedVoies).every(v => matchedSet.has(v));
        if (!allRequired) continue;
      }

      out.push({ m, hits: matched });
    }
    return out;
  }, [selectedVoies, disabledClasses, mode]);

  // Découpe en 3 sections
  const substrats = filteredResults.filter(r => r.hits.some(h => h.role === 'substrat'));
  const inhibiteurs = filteredResults.filter(r => r.hits.some(h => h.role === 'inhibiteur'));
  const inducteurs = filteredResults.filter(r => r.hits.some(h => h.role === 'inducteur'));

  // ─── Voies partagées par les molécules du panier ─────────
  const sharedVoies = useMemo<Set<string>>(() => {
    if (cart.size < 2) return new Set();
    const cartMolecules: Molecule[] = Array.from(cart.ids)
      .map(id => ALL_MOLECULES.find(m => m.id === id))
      .filter((m): m is Molecule => Boolean(m));
    const counts: Map<string, number> = new Map();
    for (const m of cartMolecules) {
      const seenInThisMol = new Set<string>();
      for (const { voieId } of getMoleculeVoies(m)) {
        if (!seenInThisMol.has(voieId)) {
          seenInThisMol.add(voieId);
          counts.set(voieId, (counts.get(voieId) ?? 0) + 1);
        }
      }
    }
    const shared = new Set<string>();
    for (const [v, n] of counts) if (n >= 2) shared.add(v);
    return shared;
  }, [cart.ids, cart.size]);

  // ─── Voies groupées par catégorie pour la grille ─────────
  const voiesByKind = useMemo(() => {
    const groups: Record<VoieKind, VoieStyle[]> = {
      cyp: [], ugt: [], phase2: [], transporteur: [], autre: [],
    };
    for (const v of VOIES) groups[v.kind].push(v);
    return groups;
  }, []);

  return (
    <div className="space-y-3 pb-24">
      {/* ───── Barre de recherche ───── */}
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
          placeholder="🔎 Tape une molécule, un CYP, un nom commercial…"
          className="w-full rounded-full border border-navy-700 bg-navy-800 px-4 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus-ring"
        />
        {searchOpen && searchResults.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-md border border-navy-700 bg-navy-800 shadow-lg">
            {searchResults.map(m => (
              <li key={m.id}>
                <button type="button" onMouseDown={() => openMoleculeModal(m.id)}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-navy-700 focus-ring">
                  <div className="font-medium text-gray-100">{m.nom_dci}</div>
                  <div className="text-xs text-gray-400">{m.classe}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ───── Grille de toggles voies ───── */}
      <section>
        <h2 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Filtrer par voie · sélection multiple
        </h2>

        {(['cyp', 'ugt', 'phase2', 'autre', 'transporteur'] as VoieKind[]).map(kind => {
          const list = voiesByKind[kind];
          if (list.length === 0) return null;
          return (
            <div key={kind} className="mb-2">
              <p className="mb-1 text-[9px] uppercase tracking-wider text-gray-500">
                {kindLabel(kind)}
              </p>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                {list.map(v => {
                  const active = selectedVoies.has(v.id);
                  const shared = sharedVoies.has(v.id);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggleVoie(v.id)}
                      aria-pressed={active}
                      className={`relative rounded-md border-[1.5px] px-1 py-1.5 text-[10px] font-bold focus-ring ${
                        active
                          ? `${v.bgActiveClass} text-white border-transparent`
                          : `bg-navy-800 ${v.borderClass} ${v.textClass}`
                      }`}
                    >
                      {v.label}
                      {active && <span className="ml-1">✓</span>}
                      {shared && (
                        <span aria-label="voie partagée par le panier"
                              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] text-white shadow">
                          ⚡
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* ───── Toolbar : mode OR/AND + filtre classes ───── */}
      {selectedVoies.size > 0 && (
        <section className="flex items-center justify-between gap-2 border-y border-navy-800 py-2">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-400">Mode :</span>
            <button
              type="button"
              onClick={() => setMode('OR')}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold focus-ring ${
                mode === 'OR' ? 'bg-teal-500 text-white' : 'bg-navy-800 border border-navy-700 text-gray-400'
              }`}
            >OU</button>
            <button
              type="button"
              onClick={() => setMode('AND')}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold focus-ring ${
                mode === 'AND' ? 'bg-teal-500 text-white' : 'bg-navy-800 border border-navy-700 text-gray-400'
              }`}
            >ET</button>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setClassFilterOpen(o => !o)}
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold focus-ring ${
                disabledClasses.size > 0
                  ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                  : 'border-navy-700 text-gray-400 hover:text-gray-200'
              }`}
            >
              ⚙ {disabledClasses.size === 0 ? 'Toutes classes' : `${CLASS_BUCKETS.length - disabledClasses.size}/${CLASS_BUCKETS.length} classes`} {classFilterOpen ? '▴' : '▾'}
            </button>
            {classFilterOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-md border border-navy-700 bg-navy-800 p-2 shadow-lg">
                <div className="mb-2 flex items-center justify-between border-b border-navy-700 pb-1.5 text-[11px]">
                  <strong className="text-gray-200">Filtrer par classe</strong>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setDisabledClasses(new Set())}
                            className="text-teal-400 underline hover:text-teal-300">Tout</button>
                    <button type="button" onClick={() => setDisabledClasses(new Set(CLASS_BUCKETS.map(b => b.id)))}
                            className="text-teal-400 underline hover:text-teal-300">Aucun</button>
                  </div>
                </div>
                {CLASS_BUCKETS.map(b => {
                  const checked = !disabledClasses.has(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleClass(b.id)}
                      className="flex w-full items-center gap-2 rounded px-1 py-1 text-left text-xs hover:bg-navy-700 focus-ring"
                    >
                      <span className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                        checked ? 'border-teal-500 bg-teal-500 text-white' : 'border-navy-600 bg-navy-900'
                      }`}>{checked ? '✓' : ''}</span>
                      <span className="flex-1 text-gray-200">{b.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ───── Résultats ───── */}
      {selectedVoies.size === 0 && (
        <div className="rounded-lg border border-dashed border-navy-700 p-8 text-center text-sm text-gray-500">
          Sélectionne une voie ci-dessus<br />pour voir les molécules concernées
        </div>
      )}

      {selectedVoies.size > 0 && filteredResults.length === 0 && (
        <div className="rounded-lg border border-navy-700 bg-navy-800 p-4 text-center text-sm text-gray-400">
          Aucune molécule ne correspond aux voies sélectionnées
          {disabledClasses.size > 0 && ' (compte tenu des classes filtrées)'}
        </div>
      )}

      {substrats.length > 0 && (
        <ResultsSection
          kind="substrats"
          molecules={substrats}
          openMolecule={openMoleculeModal}
          cart={cart}
        />
      )}
      {inhibiteurs.length > 0 && (
        <ResultsSection
          kind="inhibiteurs"
          molecules={inhibiteurs}
          openMolecule={openMoleculeModal}
          cart={cart}
        />
      )}
      {inducteurs.length > 0 && (
        <ResultsSection
          kind="inducteurs"
          molecules={inducteurs}
          openMolecule={openMoleculeModal}
          cart={cart}
        />
      )}

      {/* ───── Bannière panier flottante ───── */}
      {cart.size >= 1 && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-3xl items-center justify-between gap-2 border-t border-indigo-700 bg-indigo-600 px-4 py-2.5 text-white shadow-2xl sm:rounded-t-lg">
          <div className="text-xs">
            <strong className="block text-sm">{cart.size} molécule{cart.size > 1 ? 's' : ''} au panier</strong>
            {cart.size >= 2 && (
              <span className="text-indigo-100">
                <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">⚡ {sharedVoies.size}</span> voie{sharedVoies.size > 1 ? 's' : ''} partagée{sharedVoies.size > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate('/interactions')}
            className="rounded-md bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 focus-ring"
          >
            Analyser →
          </button>
        </div>
      )}
    </div>
  );
}

function kindLabel(k: VoieKind): string {
  switch (k) {
    case 'cyp': return 'Cytochromes';
    case 'ugt': return 'UGT';
    case 'phase2': return 'Phase II non-UGT';
    case 'autre': return 'Phase I non-CYP';
    case 'transporteur': return 'Transporteurs';
  }
}

// ════════════════════════════════════════════════════════════
// Section de résultats (Substrats / Inhibiteurs / Inducteurs)
// ════════════════════════════════════════════════════════════

interface ResultsSectionProps {
  kind: 'substrats' | 'inhibiteurs' | 'inducteurs';
  molecules: MoleculeWithRoles[];
  openMolecule: (id: string) => void;
  cart: ReturnType<typeof useCart>;
}

function ResultsSection({ kind, molecules, openMolecule, cart }: ResultsSectionProps) {
  const config = SECTION_CONFIG[kind];
  const targetRole = kind === 'substrats' ? 'substrat' : kind === 'inhibiteurs' ? 'inhibiteur' : 'inducteur';

  return (
    <section className={`rounded-lg border ${config.border} ${config.bg} p-3`}>
      <header className="mb-2 flex items-center justify-between">
        <h3 className={`text-xs font-bold uppercase tracking-wider ${config.text}`}>
          {config.icon} {config.title} · <span className="font-mono">{molecules.length}</span>
        </h3>
      </header>
      <ul className="space-y-1.5">
        {molecules.map(({ m, hits }) => {
          const inCart = cart.ids.has(m.id);
          const relevantHits = hits.filter(h => h.role === targetRole);
          return (
            <li key={m.id}
                className={`flex items-start justify-between gap-2 rounded-md border bg-navy-900 p-2 ${
                  inCart ? 'border-indigo-500 ring-1 ring-indigo-500/40' : 'border-navy-700'
                }`}>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => openMolecule(m.id)}
                  className="text-left focus-ring"
                >
                  <span className="font-semibold text-gray-100">{m.nom_dci}</span>
                  <span className="ml-2 text-[10px] text-gray-400">{getBucketShort(getMoleculeBucket(m))}</span>
                </button>
                <div className="mt-1 flex flex-wrap gap-1">
                  {relevantHits.map((h, i) => {
                    const v = getVoieStyle(h.voieId);
                    const lvl = intensityLevel(h.intensity);
                    return (
                      <span key={`${h.voieId}-${i}`}
                            className={`inline-flex items-center gap-1 rounded-full ${v.pillBgClass} ${v.pillTextClass} px-1.5 py-0.5 text-[10px] font-semibold`}>
                        <span>{v.label}</span>
                        {targetRole === 'substrat' ? (
                          <span className={`rounded px-1 py-0 text-[9px] font-bold ${
                            lvl === 3 ? 'bg-amber-500 text-amber-950' : lvl === 2 ? 'bg-slate-300 text-slate-800' : 'bg-slate-200 text-slate-700'
                          }`}>{lvl === 3 ? 'MAJ' : lvl === 2 ? 'mod' : 'min'}</span>
                        ) : (
                          <span className={config.text}>
                            <IntensityBars level={lvl} />
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => inCart ? cart.remove(m.id) : cart.add(m.id)}
                aria-label={inCart ? `Retirer ${m.nom_dci} du panier` : `Ajouter ${m.nom_dci} au panier`}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-bold focus-ring ${
                  inCart
                    ? 'bg-indigo-500 text-white border border-indigo-500'
                    : 'border border-navy-600 text-indigo-300 hover:bg-indigo-500/10'
                }`}
              >
                {inCart ? '✓' : '+'}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const SECTION_CONFIG = {
  substrats: {
    title: 'Substrats',
    icon: '●',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    text: 'text-blue-300',
  },
  inhibiteurs: {
    title: 'Inhibiteurs',
    icon: '↓',
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    text: 'text-red-300',
  },
  inducteurs: {
    title: 'Inducteurs',
    icon: '↑',
    border: 'border-green-500/30',
    bg: 'bg-green-500/5',
    text: 'text-green-300',
  },
};
