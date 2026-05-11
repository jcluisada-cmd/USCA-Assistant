// Interactions v2 — refonte (chantier UX/UI 2026-05-09).
//
// Cards molécule visuelles avec voies pills colorées (1 couleur par CYP),
// voies partagées entre molécules surlignées avec ⚡ orange,
// alertes PD cumulées en haut (cliquables → modal détail),
// barre de recherche pour ajouter une molécule.

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ALL_MOLECULES, searchMolecules } from '../data';
import type { Molecule } from '../types/molecule';
import { useCart } from '../context/CartContext';
import {
  scoreQT, scoreSero, scoreResp, scoreAcb, scoreSeuilEp,
  detectPkPairs, findDocumentedInteractions,
  type Severity,
} from '../utils/scoring';
import { getVoieStyle, getMoleculeVoies, intensityLevel } from '../utils/voies';
import { getMoleculeBucket, getBucketShort, CLASS_BUCKETS, type ClassBucket } from '../utils/classes';
import { IntensityBars } from '../components/ui/IntensityBars';
import { ModalDrawer } from '../components/ui/ModalDrawer';
import { VoieDetailModal } from '../components/VoieDetailModal';
import { OrdonnanceModal } from '../components/ordonnance/OrdonnanceModal';
import { RapportPrint } from '../components/ordonnance/RapportPrint';
import { pdAlertLabel } from '../utils/labels';

type AlertKind = 'qt' | 'sero' | 'resp' | 'acb' | 'sep';

const STORAGE_EXPANDED_BUCKETS = 'metaboscope_expanded_buckets_v1';

export function InteractionPage() {
  const cart = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [openAlert, setOpenAlert] = useState<AlertKind | null>(null);
  const [openVoie, setOpenVoie] = useState<string | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Workflow 2 phases : sélection (badges classes dépliables) → analyse
  const [analyzeMode, setAnalyzeMode] = useState(false);
  // Mode Ordonnance (D.1) — modal saisie + rapport imprimable
  const [ordonnanceOpen, setOrdonnanceOpen] = useState(false);
  const [rapportOpen, setRapportOpen] = useState(false);
  const [expandedBuckets, setExpandedBuckets] = useState<Set<ClassBucket>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_EXPANDED_BUCKETS);
      if (raw) return new Set(JSON.parse(raw) as ClassBucket[]);
    } catch { /* ignore */ }
    return new Set(); // tout replié par défaut
  });

  // Persist expandedBuckets
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_EXPANDED_BUCKETS, JSON.stringify(Array.from(expandedBuckets)));
    } catch { /* ignore */ }
  }, [expandedBuckets]);

  // Auto-bascule en mode analyse si on arrive avec ?analyze=1 (depuis Atlas)
  useEffect(() => {
    if (searchParams.get('analyze') === '1') {
      setAnalyzeMode(true);
      const next = new URLSearchParams(searchParams);
      next.delete('analyze');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Si panier vide, repasser en mode sélection automatiquement
  useEffect(() => {
    if (cart.size === 0) setAnalyzeMode(false);
  }, [cart.size]);

  function toggleBucket(b: ClassBucket) {
    setExpandedBuckets(prev => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b); else next.add(b);
      return next;
    });
  }

  const molecules = useMemo<Molecule[]>(
    () => Array.from(cart.ids)
      .map(id => ALL_MOLECULES.find(m => m.id === id))
      .filter((m): m is Molecule => Boolean(m)),
    [cart.ids],
  );

  // ─── Calculs cumulés ──────────────────────────────────────
  const qt = useMemo(() => scoreQT(molecules), [molecules]);
  const sero = useMemo(() => scoreSero(molecules), [molecules]);
  const resp = useMemo(() => scoreResp(molecules), [molecules]);
  const acb = useMemo(() => scoreAcb(molecules), [molecules]);
  const sep = useMemo(() => scoreSeuilEp(molecules), [molecules]);
  const pkPairs = useMemo(() => detectPkPairs(molecules), [molecules]);
  const docInter = useMemo(() => findDocumentedInteractions(molecules), [molecules]);

  // ─── Voies partagées ──────────────────────────────────────
  const sharedVoies = useMemo<Set<string>>(() => {
    if (molecules.length < 2) return new Set();
    const counts: Map<string, number> = new Map();
    for (const m of molecules) {
      const seen = new Set<string>();
      for (const { voieId } of getMoleculeVoies(m)) {
        if (!seen.has(voieId)) {
          seen.add(voieId);
          counts.set(voieId, (counts.get(voieId) ?? 0) + 1);
        }
      }
    }
    const out = new Set<string>();
    for (const [v, n] of counts) if (n >= 2) out.add(v);
    return out;
  }, [molecules]);

  // ─── Recherche autocomplete ──────────────────────────────
  const searchResults = useMemo<Molecule[]>(() => {
    if (query.trim().length < 2) return [];
    return searchMolecules(query, 8).filter(m => !cart.ids.has(m.id));
  }, [query, cart.ids]);

  // ─── Molécules pré-groupées par bucket pour la phase sélection ──
  const moleculesByBucket = useMemo<Map<ClassBucket, Molecule[]>>(() => {
    const map = new Map<ClassBucket, Molecule[]>();
    for (const m of ALL_MOLECULES) {
      const b = getMoleculeBucket(m);
      if (!map.has(b)) map.set(b, []);
      map.get(b)!.push(m);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.nom_dci.localeCompare(b.nom_dci, 'fr'));
    }
    return map;
  }, []);

  function addFromSearch(id: string) {
    cart.add(id);
    setQuery('');
    setSearchOpen(false);
  }

  const openMoleculeModal = useCallback((id: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('molecule', id);
      return next;
    });
  }, [setSearchParams]);

  // ─── Liste alertes ───────────────────────────────────────
  const alerts: { kind: AlertKind; label: string; severity: Severity; summary: string }[] = [
    { kind: 'qt', label: 'QT cumulé', severity: qt.severity, summary: `score ${qt.total}${qt.countKR > 0 ? ` (${qt.countKR} KR)` : ''}` },
    { kind: 'sero', label: 'Sérotonine', severity: sero.severity, summary: `${sero.count} contributeur${sero.count > 1 ? 's' : ''}` },
    { kind: 'resp', label: 'Dépression respiratoire', severity: resp.severity, summary: respSummary(resp) },
    { kind: 'acb', label: 'Charge anticholinergique', severity: acb.severity, summary: `score ${acb.total}` },
    { kind: 'sep', label: 'Seuil épileptogène', severity: sep.severity, summary: `${sep.count} contributeur${sep.count > 1 ? 's' : ''}` },
  ];
  const visibleAlerts = alerts.filter(a => a.severity === 'red' || a.severity === 'amber');

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="space-y-3 pb-12">
      {/* Barre recherche + bouton ordonnance */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => { blurTimer.current = setTimeout(() => setSearchOpen(false), 150); }}
            placeholder="🔎 Ajouter une molécule (DCI, nom commercial, NPS)…"
            className="w-full rounded-full border border-navy-700 bg-navy-800 px-4 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus-ring"
          />
          {searchOpen && searchResults.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-md border border-navy-700 bg-navy-800 shadow-lg">
              {searchResults.map(m => (
                <li key={m.id}>
                  <button type="button" onMouseDown={() => addFromSearch(m.id)}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-navy-700 focus-ring">
                    <span className="font-medium text-gray-100">{m.nom_dci}</span>
                    <span className="ml-2 text-xs text-gray-400">{m.classe}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Bouton Mode Ordonnance (D.1) */}
        <button
          type="button"
          onClick={() => setOrdonnanceOpen(true)}
          aria-label="Mode Ordonnance — coller une liste de molécules"
          title="Coller une ordonnance — analyse rapide"
          className="shrink-0 rounded-full border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-gray-200 hover:bg-navy-700 focus-ring"
        >
          📋 <span className="hidden sm:inline">Ordonnance</span>
        </button>
      </div>

      {/* ════ MODE SÉLECTION : badges classes dépliables ════ */}
      {!analyzeMode && (
        <>
          {/* Récap panier compact en haut */}
          {molecules.length > 0 && (
            <section className="rounded-md border border-indigo-500/40 bg-indigo-500/10 p-2.5">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  Panier · {molecules.length}
                </span>
                <button type="button" onClick={() => cart.clear()}
                        className="text-[10px] text-gray-400 underline hover:text-gray-200 focus-ring">
                  Vider
                </button>
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {molecules.map(m => (
                  <li key={m.id}>
                    <button type="button" onClick={() => cart.remove(m.id)}
                            aria-label={`Retirer ${m.nom_dci}`}
                            className="inline-flex items-center gap-1 rounded-full bg-indigo-500/30 px-2 py-0.5 text-xs text-indigo-100 hover:bg-red-500/30 hover:text-red-100 focus-ring">
                      {m.nom_dci} <span aria-hidden>×</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Badges classes dépliables */}
          <section>
            <h2 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Choisir des molécules par classe · sélection multiple
            </h2>
            <div className="space-y-1.5">
              {CLASS_BUCKETS.map(bucket => {
                const bucketMol = moleculesByBucket.get(bucket.id) ?? [];
                if (bucketMol.length === 0) return null;
                const isExpanded = expandedBuckets.has(bucket.id);
                const inCartCount = bucketMol.filter(m => cart.ids.has(m.id)).length;
                return (
                  <div key={bucket.id} className="rounded-md border border-navy-700 bg-navy-800">
                    <button type="button" onClick={() => toggleBucket(bucket.id)}
                            aria-expanded={isExpanded}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm focus-ring">
                      <span aria-hidden className="inline-block w-3 text-gray-500">{isExpanded ? '▾' : '▸'}</span>
                      <span className="font-semibold text-gray-100">{bucket.label}</span>
                      <span className="text-[10px] text-gray-500">({bucketMol.length})</span>
                      {inCartCount > 0 && (
                        <span className="ml-auto inline-flex items-center rounded-full bg-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-indigo-200">
                          {inCartCount} au panier
                        </span>
                      )}
                    </button>
                    {isExpanded && (
                      <ul className="grid grid-cols-1 gap-1 border-t border-navy-700 p-2 sm:grid-cols-2">
                        {bucketMol.map(m => {
                          const inCart = cart.ids.has(m.id);
                          return (
                            <li key={m.id}
                                className={`flex items-center justify-between gap-1.5 rounded border px-2 py-1.5 text-sm ${
                                  inCart ? 'border-indigo-500 bg-indigo-500/10' : 'border-navy-700 bg-navy-900'
                                }`}>
                              <button type="button" onClick={() => openMoleculeModal(m.id)}
                                      className="min-w-0 flex-1 truncate text-left focus-ring">
                                <span className="font-medium text-gray-100">{m.nom_dci}</span>
                              </button>
                              <button type="button"
                                      onClick={() => inCart ? cart.remove(m.id) : cart.add(m.id)}
                                      aria-label={inCart ? `Retirer ${m.nom_dci}` : `Ajouter ${m.nom_dci}`}
                                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-sm font-bold focus-ring ${
                                        inCart
                                          ? 'bg-indigo-500 text-white'
                                          : 'border border-navy-600 text-indigo-300 hover:bg-indigo-500/10'
                                      }`}>
                                {inCart ? '✓' : '+'}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* FAB Analyser → */}
          {cart.size >= 2 && (
            <button type="button" onClick={() => setAnalyzeMode(true)}
                    className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-2xl hover:bg-indigo-500 focus-ring">
              <span>Analyser</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{cart.size}</span>
              <span aria-hidden>→</span>
            </button>
          )}

          {cart.size === 1 && (
            <p className="text-center text-xs text-gray-500">
              Ajoute au moins une 2<sup>e</sup> molécule pour lancer l'analyse.
            </p>
          )}
        </>
      )}

      {/* ════ MODE ANALYSE : alertes + cards mol + voies ════ */}
      {analyzeMode && (
        <>
          {/* Bouton retour vers sélection */}
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={() => setAnalyzeMode(false)}
                    className="rounded-md border border-navy-700 bg-navy-800 px-3 py-1.5 text-xs text-gray-300 hover:text-gray-100 focus-ring">
              ✎ Modifier le panier
            </button>
            <span className="text-[10px] text-gray-500">{molecules.length} molécule{molecules.length > 1 ? 's' : ''}</span>
          </div>

          {/* Alertes en haut */}
          {visibleAlerts.length > 0 && (
            <section className="space-y-1.5">
              {visibleAlerts.map(a => (
                <button
                  key={a.kind}
                  type="button"
                  onClick={() => setOpenAlert(a.kind)}
                  className={`flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm focus-ring ${
                    a.severity === 'red'
                      ? 'border-red-500/40 bg-red-500/10 text-red-200'
                      : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                  }`}
                >
                  <span><strong>⚠ {a.label}</strong> · {a.summary}</span>
                  <span aria-hidden className="text-xs opacity-60">→</span>
                </button>
              ))}
            </section>
          )}

          {/* Paires PK détectées + interactions documentées */}
          {(pkPairs.length > 0 || docInter.length > 0) && molecules.length >= 2 && (
            <section className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
              <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                Interactions PK détectées · {pkPairs.length + docInter.length}
              </h3>
              <ul className="space-y-1.5 text-xs text-gray-200">
                {pkPairs.map((p, i) => (
                  <li key={`pk-${i}`}>
                    <strong>{p.substrat.nom}</strong> ↔ <strong>{p.inhibiteurOuInducteur.nom}</strong>
                    <span className="text-amber-300"> · {p.isoenzyme} ({p.inhibiteurOuInducteur.role}, {p.inhibiteurOuInducteur.puissance})</span>
                  </li>
                ))}
                {docInter.map((d, i) => (
                  <li key={`doc-${i}`}>
                    <strong>{d.source.nom}</strong> ↔ <strong>{d.cible.nom}</strong>
                    <span className="text-gray-400"> · {d.effet}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Cards molécule */}
          {molecules.map(m => (
            <MoleculeCardRow key={m.id} m={m} sharedVoies={sharedVoies}
                             onRemove={() => cart.remove(m.id)}
                             onOpenDetail={() => openMoleculeModal(m.id)}
                             onClickVoie={(voieId) => setOpenVoie(voieId)} />
          ))}

          {/* Boutons bas mode analyse : Rapport + Vider */}
          {molecules.length > 0 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button type="button" onClick={() => setRapportOpen(true)}
                      className="rounded-md border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-200 hover:bg-indigo-500/20 focus-ring">
                🖨️ Rapport imprimable A4
              </button>
              <button type="button" onClick={() => cart.clear()}
                      className="rounded-md border border-navy-700 bg-navy-800 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 focus-ring">
                Vider le panier
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals alertes */}
      {openAlert && (
        <AlertDetailModal
          kind={openAlert}
          onClose={() => setOpenAlert(null)}
          qt={qt} sero={sero} resp={resp} acb={acb} sep={sep}
        />
      )}
      {/* Modal voie */}
      {openVoie && (
        <VoieDetailModal
          voieId={openVoie}
          cartMolecules={molecules}
          onClose={() => setOpenVoie(null)}
          onOpenMolecule={openMoleculeModal}
        />
      )}

      {/* Mode Ordonnance (D.1) — modal saisie textarea + parser fuzzy */}
      <OrdonnanceModal
        open={ordonnanceOpen}
        onClose={() => setOrdonnanceOpen(false)}
        onLoaded={() => setAnalyzeMode(true)}
      />

      {/* Rapport imprimable A4 — overlay plein écran avec @media print */}
      <RapportPrint
        open={rapportOpen}
        molecules={molecules}
        onClose={() => setRapportOpen(false)}
      />
    </div>
  );
}

function respSummary(resp: ReturnType<typeof scoreResp>): string {
  const tags = resp.contributors.map(c => c.tag);
  if (resp.severity === 'red') return tags.join(' + ');
  return `${resp.contributors.length} contributeur${resp.contributors.length > 1 ? 's' : ''}`;
}

// ════════════════════════════════════════════════════════════
// Card molécule individuelle dans le panier
// ════════════════════════════════════════════════════════════

interface MoleculeCardRowProps {
  m: Molecule;
  sharedVoies: Set<string>;
  onRemove: () => void;
  onOpenDetail: () => void;
  onClickVoie: (voieId: string) => void;
}

function MoleculeCardRow({ m, sharedVoies, onRemove, onOpenDetail, onClickVoie }: MoleculeCardRowProps) {
  const voies = useMemo(() => getMoleculeVoies(m), [m]);
  // Aggrège : pour chaque voie, on garde le rôle le plus fort
  const aggregated = voies
    .map(({ voieId, details }) => {
      // Si plusieurs rôles sur la même voie, on garde le plus important (substrat majeur > inhibiteur > inducteur)
      const sorted = [...details].sort((a, b) => intensityLevel(b.intensity) - intensityLevel(a.intensity));
      return { voieId, role: sorted[0].role, intensity: sorted[0].intensity };
    });

  return (
    <article className="rounded-lg border border-navy-700 bg-navy-800 p-3">
      <header className="flex items-start justify-between gap-2">
        <button type="button" onClick={onOpenDetail} className="text-left focus-ring">
          <h3 className="text-base font-bold text-gray-100">{m.nom_dci}</h3>
          <p className="text-xs text-gray-400">{m.classe || getBucketShort(getMoleculeBucket(m))}</p>
        </button>
        <button type="button" onClick={onRemove}
                aria-label={`Retirer ${m.nom_dci}`}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-navy-700 text-gray-400 hover:bg-red-500/20 hover:text-red-300 focus-ring">
          ✕
        </button>
      </header>

      {aggregated.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className="text-[9px] uppercase tracking-wider text-gray-500">Voies :</span>
          {aggregated.map(({ voieId, role, intensity }) => {
            const v = getVoieStyle(voieId);
            const lvl = intensityLevel(intensity);
            const shared = sharedVoies.has(voieId);
            const roleColor = role === 'substrat' ? 'bg-blue-600' : role === 'inhibiteur' ? 'bg-red-600' : 'bg-green-600';
            const roleLetter = role === 'substrat' ? 'S' : role === 'inhibiteur' ? 'I' : 'Ind';
            const intensityBadge = lvl === 3
              ? 'bg-amber-500 text-amber-950'
              : lvl === 2
                ? 'bg-slate-400 text-slate-900'
                : 'bg-slate-300 text-slate-800';
            return (
              <button
                key={voieId}
                type="button"
                onClick={() => onClickVoie(voieId)}
                aria-label={`Détails ${voieId} sur ${m.nom_dci}`}
                className={`relative inline-flex items-center gap-1 rounded-full ${v.pillBgClass} ${v.pillTextClass} px-2 py-0.5 text-[10px] font-bold focus-ring transition-transform hover:scale-105 ${
                  shared ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-navy-800' : ''
                }`}
                title={`${role} ${intensity} de ${voieId} — tap pour insight clinique`}
              >
                <span className={`flex h-3.5 min-w-3.5 items-center justify-center rounded-sm ${roleColor} px-1 text-[8px] text-white`}>
                  {roleLetter}
                </span>
                {v.label}
                {role === 'substrat' ? (
                  <span className={`rounded ${intensityBadge} px-1 text-[8px] font-bold uppercase`}>
                    {lvl === 3 ? 'maj' : lvl === 2 ? 'mod' : 'min'}
                  </span>
                ) : (
                  <span className={role === 'inhibiteur' ? 'text-red-700' : 'text-green-700'}>
                    <IntensityBars level={lvl} />
                  </span>
                )}
                {shared && (
                  <span aria-label="voie partagée"
                        className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] text-white shadow">
                    ⚡
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Pictogrammes alertes PD */}
      {m.alertes_pd.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {m.alertes_pd.slice(0, 6).map(code => {
            const r = pdAlertLabel(code);
            if (r.severity !== 'red' && r.severity !== 'amber') return null;
            const cls = r.severity === 'red'
              ? 'bg-red-500/20 text-red-300 border-red-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40';
            return (
              <span key={code}
                    className={`inline-flex rounded border px-1.5 py-0 text-[9px] font-semibold ${cls}`}>
                {r.label}
              </span>
            );
          })}
        </div>
      )}
    </article>
  );
}

// ════════════════════════════════════════════════════════════
// Modal détail d'une alerte
// ════════════════════════════════════════════════════════════

interface AlertDetailModalProps {
  kind: AlertKind;
  onClose: () => void;
  qt: ReturnType<typeof scoreQT>;
  sero: ReturnType<typeof scoreSero>;
  resp: ReturnType<typeof scoreResp>;
  acb: ReturnType<typeof scoreAcb>;
  sep: ReturnType<typeof scoreSeuilEp>;
}

function AlertDetailModal({ kind, onClose, qt, sero, resp, acb, sep }: AlertDetailModalProps) {
  const config = ALERT_CONFIG[kind];
  const breakdown = kind === 'qt' ? qt : kind === 'sero' ? sero : kind === 'resp' ? resp : kind === 'acb' ? acb : sep;
  const accent: 'red' | 'amber' | 'default' = breakdown.severity === 'red' ? 'red' : breakdown.severity === 'amber' ? 'amber' : 'default';

  let contributors: { name: string; detail: string }[] = [];
  if (kind === 'qt') {
    contributors = qt.perMolecule.filter(p => p.points > 0).map(p => ({ name: p.nom, detail: `${p.codes.join(', ')} · ${p.points} pt(s)` }));
  } else if (kind === 'sero') {
    contributors = sero.triggers.map(t => ({ name: t.nom, detail: t.codes.join(', ') }));
  } else if (kind === 'resp') {
    contributors = resp.contributors.map(c => ({ name: c.nom, detail: c.tag }));
  } else if (kind === 'acb') {
    contributors = acb.perMolecule.map(p => ({ name: p.nom, detail: `ACB-${p.level}` }));
  } else {
    contributors = sep.contributors.map(c => ({ name: c.nom, detail: c.sevrage ? 'sevrage' : '—' }));
  }

  return (
    <ModalDrawer open onClose={onClose} title={config.title} accent={accent}>
      <div className="space-y-4 text-gray-200">
        <div className={`rounded-md border p-3 ${
          breakdown.severity === 'red' ? 'border-red-500/40 bg-red-500/10' :
          breakdown.severity === 'amber' ? 'border-amber-500/40 bg-amber-500/10' :
          'border-navy-700 bg-navy-800'
        }`}>
          <p className="text-sm">{breakdown.rationale}</p>
        </div>

        {contributors.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Contributeurs</h3>
            <ul className="space-y-1">
              {contributors.map((c, i) => (
                <li key={i} className="rounded border border-navy-700 bg-navy-800 px-3 py-2 text-sm">
                  <strong>{c.name}</strong> <span className="text-xs text-gray-400">· {c.detail}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Conduite à tenir</h3>
          <p className="text-sm text-gray-300">{config.conduct}</p>
        </section>
      </div>
    </ModalDrawer>
  );
}

const ALERT_CONFIG: Record<AlertKind, { title: string; conduct: string }> = {
  qt: {
    title: 'QT cumulé',
    conduct: 'Si rouge : ECG préalable et surveillance du QTc. Discuter alternative (ex. sertraline si QT court). Si ambre : surveiller, corriger hypoK+/Mg2+, éviter facteurs aggravants.',
  },
  sero: {
    title: 'Risque sérotoninergique',
    conduct: 'Triade ISRS/IRSNA + IMAO/opioïde séro/linézolide/triptan = à proscrire. Surveiller fièvre, tremblements, agitation, hyper-réflexie.',
  },
  resp: {
    title: 'Dépression respiratoire',
    conduct: 'Paire BZD + opioïde = FDA boxed warning 2016. Si association inévitable : posologies les plus basses, surveillance prolongée, formation à la naloxone.',
  },
  acb: {
    title: 'Charge anticholinergique',
    conduct: 'Score ≥ 6 = risque cognitif/chute majeur (sujet âgé surtout). Réévaluer chaque molécule, déprescrire si possible, alternatives non anticholinergiques.',
  },
  sep: {
    title: 'Seuil épileptogène',
    conduct: 'Risque cumulatif. Anamnèse : crise antérieure, sevrage, hypoglycémie, hypoNa+. Adapter posologies et surveiller au sevrage des BZD/OH.',
  },
};
