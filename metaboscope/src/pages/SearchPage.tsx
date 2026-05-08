// src/pages/SearchPage.tsx
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchMolecules, ALL_MOLECULES } from '../data';
import type { Molecule } from '../types/molecule';
import { AutoComplete } from '../components/ui/AutoComplete';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { useCart } from '../context/CartContext';
import { pdAlertLabel } from '../utils/labels';

type Filter = 'all' | 'meds' | 'drogues' | 'nps';

// Filtres de classe — regex sur m.classe.
// Note v1.0 : ~8-12 molécules (poppers, ibogaïne, kratom, kava, 6-MAM, héroïne, etc.) ne tombent
// que dans "Tous". Audit clinique de classification prévu en v1.0.1 (cf. src/data/warnings.md).
const FILTERS: { id: Filter; label: string; match: (m: Molecule) => boolean }[] = [
  { id: 'all',     label: 'Tous',         match: () => true },
  { id: 'meds',    label: 'Médicaments',  match: m => !/\b(nps|drogue|alcool|cannabi|hallucinog|dissociatif|stimulant illicite|stupéfiant|cathinone|nitazène)\b/i.test(m.classe) },
  { id: 'drogues', label: 'Drogues',      match: m => /\b(drogue|alcool|cannabi|hallucinog|dissociatif|stimulant illicite|stupéfiant)\b/i.test(m.classe) },
  { id: 'nps',     label: 'NPS',          match: m => /\b(nps|cathinone|nitazène)\b/i.test(m.classe) },
];

export function SearchPage() {
  const navigate = useNavigate();
  const cart = useCart();
  // `query` est forward-compat : v1.0.1 prévoit de câbler AutoComplete pour filtrer aussi la liste live.
  const [query, _setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filterFn = FILTERS.find(f => f.id === filter)!.match;

  const visible = useMemo<Molecule[]>(() => {
    if (query.trim().length >= 2) return searchMolecules(query).filter(filterFn);
    return ALL_MOLECULES.filter(filterFn);
  }, [query, filterFn]);

  const search = useCallback((q: string) => searchMolecules(q).filter(filterFn), [filterFn]);

  function toggleSelected(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function commitSelection() {
    selected.forEach(id => cart.add(id));
    setSelected(new Set());
    setSelectMode(false);
    navigate('/interactions');
  }

  return (
    <div className="space-y-4 pb-24">
      <header className="space-y-3">
        <h1 className="text-xl font-bold text-gray-100">Recherche</h1>
        <AutoComplete<Molecule>
          placeholder="DCI, nom commercial, ou nom de rue NPS"
          search={search}
          renderItem={m => (
            <div>
              <div className="font-medium text-gray-100">{m.nom_dci}</div>
              <div className="text-xs text-gray-400">{m.classe}</div>
            </div>
          )}
          itemKey={m => m.id}
          onSelect={m => navigate(`/search/${m.id}`)}
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}
                    className={`rounded-full border px-3 py-1 text-xs focus-ring ${
                      filter === f.id ? 'border-teal-500 bg-teal-600/30 text-teal-200' : 'border-navy-700 bg-navy-800 text-gray-300 hover:bg-navy-700'
                    }`}>
              {f.label}
            </button>
          ))}
          <button type="button" aria-pressed={selectMode} onClick={() => { setSelectMode(s => !s); setSelected(new Set()); }}
                  className={`ml-auto rounded-full border px-3 py-1 text-xs focus-ring ${
                    selectMode ? 'border-amber-500 bg-amber-600/30 text-amber-200' : 'border-navy-700 bg-navy-800 text-gray-300 hover:bg-navy-700'
                  }`}>
            {selectMode ? 'Quitter sélection' : 'Mode sélection'}
          </button>
        </div>
      </header>

      {visible.length === 0 ? (
        <EmptyState title="Aucune molécule" hint="Essayez une autre orthographe, un synonyme, ou changez de filtre." />
      ) : (
        <ul className="space-y-2">
          {visible.map(m => {
            const checked = selected.has(m.id);
            return (
              <li key={m.id}
                  className={`rounded-lg border p-3 ${checked ? 'border-amber-500 bg-amber-600/10' : 'border-navy-700 bg-navy-800'}`}>
                <button type="button"
                        aria-pressed={selectMode ? checked : undefined}
                        onClick={() => selectMode ? toggleSelected(m.id) : navigate(`/search/${m.id}`)}
                        className="flex w-full items-start gap-3 text-left focus-ring">
                  {selectMode && (
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded border border-navy-600 bg-navy-900 text-xs"
                          aria-hidden>{checked ? '✓' : ''}</span>
                  )}
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold text-gray-100">{m.nom_dci}</span>
                      <span className="text-xs text-teal-400">{m.classe}</span>
                    </div>
                    {m.synonymes.length > 0 && <p className="text-xs text-gray-500">{m.synonymes.slice(0, 3).join(', ')}</p>}
                    {m.alertes_pd.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {m.alertes_pd.slice(0, 3).map(c => {
                          const r = pdAlertLabel(c);
                          if (r.severity === 'red' || r.severity === 'amber') return <Badge key={c} code={c} />;
                          return null;
                        }).filter(Boolean)}
                      </div>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selectMode && (
        <div className="fixed inset-x-0 bottom-16 z-20 mx-auto flex max-w-3xl items-center justify-between gap-2 border-t border-navy-700 bg-navy-900/95 p-3 backdrop-blur sm:bottom-0">
          <span className="text-sm text-gray-300">{selected.size} sélectionnée(s)</span>
          <div className="flex items-center gap-2">
            {selected.size > 6 && <span className="text-xs text-amber-300">Au-delà de 6 : lisibilité dégradée</span>}
            <button type="button" disabled={selected.size < 2} onClick={commitSelection}
                    className="rounded-md border border-teal-500 bg-teal-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 focus-ring">
              {selected.size >= 2 ? `Comparer ${selected.size}` : 'Comparer'} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
