// Modal "Mode Ordonnance" — Chantier D.1 (2026-05-11).
//
// Workflow en 2 phases :
//   1. Saisie : textarea libre, 1 DCI/dose par ligne (ex. "escitalopram 10mg")
//   2. Validation : liste des matches avec checkbox + niveau de confiance
//      → l'utilisateur valide/ajuste, puis "Charger panier" remplace le panier courant.

import { useMemo, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { ModalDrawer } from '../ui/ModalDrawer';
import { parseOrdonnance, type ParseResult, type Confidence } from '../../utils/parseOrdonnance';

interface OrdonnanceModalProps {
  open: boolean;
  onClose: () => void;
  /** Appelé après chargement réussi du panier — typiquement pour basculer en mode analyse */
  onLoaded?: () => void;
}

type Phase = 'input' | 'review';

const PLACEHOLDER = `escitalopram 10mg
tramadol 50mg
oxazépam 10mg

— ou —

1 cp escitalopram 10mg le matin
tramadol LP 100mg matin et soir
`;

export function OrdonnanceModal({ open, onClose, onLoaded }: OrdonnanceModalProps) {
  const cart = useCart();
  const [phase, setPhase] = useState<Phase>('input');
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParseResult[]>([]);
  // Pour chaque ligne, l'id sélectionné (null = exclue), avec possibilité de switcher vers un candidat
  const [selectionByLine, setSelectionByLine] = useState<(string | null)[]>([]);

  function handleAnalyze() {
    if (text.trim().length === 0) return;
    const results = parseOrdonnance(text);
    setParsed(results);
    // Sélection initiale : matched.id si confidence high, sinon null (à valider explicitement)
    setSelectionByLine(
      results.map(r => (r.confidence === 'high' && r.matched ? r.matched.id : null)),
    );
    setPhase('review');
  }

  function handleReset() {
    setPhase('input');
    setParsed([]);
    setSelectionByLine([]);
  }

  function toggleLine(i: number, id: string) {
    setSelectionByLine(prev => {
      const next = [...prev];
      next[i] = next[i] === id ? null : id;
      return next;
    });
  }

  const selectedIds = useMemo(
    () => selectionByLine.filter((id): id is string => id !== null),
    [selectionByLine],
  );
  // Doublons (même mol sur 2 lignes) — on dédup pour le chargement
  const uniqueIds = useMemo(() => Array.from(new Set(selectedIds)), [selectedIds]);

  function handleLoad() {
    cart.clear();
    for (const id of uniqueIds) cart.add(id);
    handleReset();
    onClose();
    onLoaded?.();
  }

  function handleCloseAndReset() {
    handleReset();
    onClose();
  }

  return (
    <ModalDrawer
      open={open}
      onClose={handleCloseAndReset}
      title={phase === 'input' ? '📋 Mode Ordonnance' : '📋 Validation de l\'ordonnance'}
    >
      {phase === 'input' && (
        <div className="space-y-4 text-gray-200">
          <p className="text-sm text-gray-300">
            Colle ou tape ton ordonnance — <strong>une molécule par ligne</strong>.
            Les doses, formes galéniques et posologies seront ignorées.
            <br />
            Tu pourras valider chaque correspondance à l&apos;étape suivante.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={10}
            className="block w-full rounded-md border border-navy-700 bg-navy-800 px-3 py-2 font-mono text-sm text-gray-100 placeholder:text-gray-500 focus-ring"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCloseAndReset}
              className="rounded-md border border-navy-700 bg-navy-800 px-3 py-1.5 text-sm text-gray-300 hover:text-gray-100 focus-ring"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={text.trim().length === 0}
              className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 focus-ring"
            >
              Analyser →
            </button>
          </div>
        </div>
      )}

      {phase === 'review' && (
        <div className="space-y-3 text-gray-200">
          <p className="text-xs text-gray-400">
            {parsed.length} ligne{parsed.length > 1 ? 's' : ''} analysée{parsed.length > 1 ? 's' : ''} ·{' '}
            <strong className="text-indigo-300">{uniqueIds.length} molécule{uniqueIds.length > 1 ? 's' : ''}</strong> sélectionnée{uniqueIds.length > 1 ? 's' : ''} pour le panier.
            <br />
            <span className="text-gray-500">
              Coche les correspondances proposées. Les matches « probables » sont pré-cochés ; les
              « possibles » nécessitent ta validation explicite.
            </span>
          </p>

          <ul className="space-y-2">
            {parsed.map((r, i) => (
              <LineReview
                key={i}
                result={r}
                selectedId={selectionByLine[i]}
                onToggle={(id) => toggleLine(i, id)}
              />
            ))}
          </ul>

          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md border border-navy-700 bg-navy-800 px-3 py-1.5 text-sm text-gray-300 hover:text-gray-100 focus-ring"
            >
              ← Modifier la saisie
            </button>
            <button
              type="button"
              onClick={handleLoad}
              disabled={uniqueIds.length === 0}
              className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 focus-ring"
            >
              Charger {uniqueIds.length > 0 ? `${uniqueIds.length} mol. ` : ''}au panier
            </button>
          </div>
          {cart.size > 0 && (
            <p className="text-[11px] text-amber-300">
              ⚠ Le panier actuel ({cart.size} mol.) sera remplacé par cette sélection.
            </p>
          )}
        </div>
      )}
    </ModalDrawer>
  );
}

// ════════════════════════════════════════════════════════════════
// Ligne de review : affichage parsing + checkboxes candidats
// ════════════════════════════════════════════════════════════════

interface LineReviewProps {
  result: ParseResult;
  selectedId: string | null;
  onToggle: (id: string) => void;
}

const CONF_LABEL: Record<Confidence, { label: string; cls: string }> = {
  high: { label: 'probable', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  medium: { label: 'possible', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  low: { label: 'incertain', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  none: { label: 'non reconnue', cls: 'bg-red-500/20 text-red-300 border-red-500/40' },
};

function LineReview({ result, selectedId, onToggle }: LineReviewProps) {
  const conf = CONF_LABEL[result.confidence];

  return (
    <li className="rounded-md border border-navy-700 bg-navy-800 p-2.5">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-100">
            <span className="text-gray-500">›</span> {result.raw}
          </p>
          {result.dose && (
            <p className="text-[10px] text-gray-500">dose détectée : {result.dose}</p>
          )}
        </div>
        <span className={`inline-flex shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${conf.cls}`}>
          {conf.label}
        </span>
      </div>

      {result.candidates.length === 0 ? (
        <p className="text-xs text-red-300">
          Aucune correspondance dans la base MetaboScope (147 molécules v1.0). Cette ligne sera ignorée.
        </p>
      ) : (
        <ul className="space-y-1">
          {result.candidates.map((m, idx) => {
            const isSelected = selectedId === m.id;
            const isTop = idx === 0;
            return (
              <li key={m.id}>
                <label className={`flex cursor-pointer items-center gap-2 rounded border px-2 py-1.5 text-sm transition-colors ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-navy-700 bg-navy-900 hover:bg-navy-800'
                }`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(m.id)}
                    className="h-4 w-4 accent-indigo-500"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-gray-100">{m.nom_dci}</span>
                    {isTop && <span className="ml-1.5 text-[9px] uppercase tracking-wider text-indigo-400">top match</span>}
                    <span className="ml-2 text-xs text-gray-400">{m.classe}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
