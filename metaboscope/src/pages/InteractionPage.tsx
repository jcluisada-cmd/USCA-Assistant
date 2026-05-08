// Interactions v2 — refonte (chantier UX/UI 2026-05-09).
//
// Cards molécule visuelles avec voies pills colorées (1 couleur par CYP),
// voies partagées entre molécules surlignées avec ⚡ orange,
// alertes PD cumulées en haut (cliquables → modal détail),
// barre de recherche pour ajouter une molécule.

import { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ALL_MOLECULES, searchMolecules } from '../data';
import type { Molecule } from '../types/molecule';
import { useCart } from '../context/CartContext';
import {
  scoreQT, scoreSero, scoreResp, scoreAcb, scoreSeuilEp,
  detectPkPairs, findDocumentedInteractions,
  type Severity,
} from '../utils/scoring';
import { getVoieStyle, getMoleculeVoies, intensityLevel } from '../utils/voies';
import { getMoleculeBucket, getBucketShort } from '../utils/classes';
import { IntensityBars } from '../components/ui/IntensityBars';
import { ModalDrawer } from '../components/ui/ModalDrawer';
import { pdAlertLabel } from '../utils/labels';

type AlertKind = 'qt' | 'sero' | 'resp' | 'acb' | 'sep';

export function InteractionPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const [, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [openAlert, setOpenAlert] = useState<AlertKind | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      {/* Recherche pour ajouter */}
      <div className="relative">
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

      {/* État vide */}
      {molecules.length === 0 && (
        <div className="rounded-lg border border-dashed border-navy-700 p-8 text-center text-sm text-gray-500">
          Panier vide<br />
          <span className="text-xs">Ajoute une molécule via la recherche ci-dessus,<br />ou bascule dans l'<button type="button" onClick={() => navigate('/')} className="text-teal-400 underline">Atlas</button> pour explorer par voies.</span>
        </div>
      )}

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
                         onOpenDetail={() => openMoleculeModal(m.id)} />
      ))}

      {/* Bouton vider */}
      {molecules.length > 0 && (
        <div className="pt-2 text-center">
          <button type="button" onClick={() => cart.clear()}
                  className="rounded-md border border-navy-700 bg-navy-800 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 focus-ring">
            Vider le panier
          </button>
        </div>
      )}

      {/* Modals alertes */}
      {openAlert && (
        <AlertDetailModal
          kind={openAlert}
          onClose={() => setOpenAlert(null)}
          qt={qt} sero={sero} resp={resp} acb={acb} sep={sep}
        />
      )}
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
}

function MoleculeCardRow({ m, sharedVoies, onRemove, onOpenDetail }: MoleculeCardRowProps) {
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
            return (
              <span
                key={voieId}
                className={`relative inline-flex items-center gap-1 rounded-full ${v.pillBgClass} ${v.pillTextClass} px-2 py-0.5 text-[10px] font-bold ${
                  shared ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-navy-800' : ''
                }`}
                title={`${role} ${intensity} de ${voieId}`}
              >
                <span className={`flex h-3.5 min-w-3.5 items-center justify-center rounded-sm ${roleColor} px-1 text-[8px] text-white`}>
                  {roleLetter}
                </span>
                {v.label}
                {role === 'substrat' ? (
                  <span className="rounded bg-black/15 px-1 text-[8px] uppercase">
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
              </span>
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
