// src/components/ui/AutoComplete.tsx
import { useState, useEffect, useRef, type ReactNode } from 'react';

interface AutoCompleteProps<T> {
  placeholder?: string;
  /** Fonction de recherche, retourne max 20 résultats triés */
  search: (query: string) => T[];
  /** Comment afficher chaque résultat dans la dropdown */
  renderItem: (item: T) => ReactNode;
  /** Clé unique extractible d'un item */
  itemKey: (item: T) => string;
  /** Callback quand l'utilisateur sélectionne un item (Entrée ou clic) */
  onSelect: (item: T) => void;
  /** Délai debounce en ms (défaut 150) */
  debounceMs?: number;
}

export function AutoComplete<T>({
  placeholder = 'Rechercher…',
  search,
  renderItem,
  itemKey,
  onSelect,
  debounceMs = 150,
}: AutoCompleteProps<T>) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), debounceMs);
    return () => clearTimeout(t);
  }, [query, debounceMs]);

  useEffect(() => {
    if (debounced.trim().length >= 2) {
      setResults(search(debounced).slice(0, 20));
      setOpen(true);
      setHighlight(0);
    } else {
      setResults([]);
      setOpen(false);
    }
  }, [debounced, search]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); onSelect(results[highlight]); setOpen(false); setQuery(''); }
    else if (e.key === 'Escape') { setOpen(false); }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        aria-label={placeholder}
        aria-autocomplete="list"
        aria-expanded={open}
        className="w-full rounded-md border border-navy-700 bg-navy-800 px-3 py-2 text-gray-100 placeholder:text-gray-500 focus-ring"
      />
      {open && results.length > 0 && (
        <ul role="listbox" className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-md border border-navy-700 bg-navy-800 shadow-lg">
          {results.map((item, idx) => (
            <li
              key={itemKey(item)}
              role="option"
              aria-selected={idx === highlight}
              onMouseDown={e => { e.preventDefault(); onSelect(item); setOpen(false); setQuery(''); }}
              onMouseEnter={() => setHighlight(idx)}
              className={`cursor-pointer px-3 py-2 text-sm ${idx === highlight ? 'bg-teal-600/30' : 'hover:bg-navy-700'}`}
            >
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
