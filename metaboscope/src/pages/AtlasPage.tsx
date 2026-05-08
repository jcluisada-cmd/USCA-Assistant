// src/pages/AtlasPage.tsx
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ALL_MOLECULES } from '../data';
import { buildAtlasIndex, type AtlasCategory, type AtlasEntry } from '../utils/atlas';
import type { Molecule } from '../types/molecule';
import { EmptyState } from '../components/ui/EmptyState';

const CATEGORIES: { id: AtlasCategory; label: string }[] = [
  { id: 'cyp',           label: 'CYP' },
  { id: 'ugt',           label: 'UGT' },
  { id: 'transporteurs', label: 'Transporteurs' },
];

export function AtlasPage() {
  const [cat, setCat] = useState<AtlasCategory>('cyp');
  const idx = useMemo(() => buildAtlasIndex(ALL_MOLECULES, cat), [cat]);
  const sortedKeys = Object.keys(idx).sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));

  return (
    <div className="space-y-4 pb-20">
      <header>
        <h1 className="text-xl font-bold text-gray-100">Atlas</h1>
        <p className="text-sm text-gray-400">
          Substrats, inhibiteurs et inducteurs des voies métaboliques (consolidé sur les {ALL_MOLECULES.length} molécules indexées).
        </p>
      </header>
      <nav aria-label="Catégorie atlas" className="flex gap-1 rounded-lg border border-navy-700 bg-navy-800 p-1">
        {CATEGORIES.map(c => (
          <button key={c.id} type="button" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium focus-ring ${
                    cat === c.id ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-navy-700'
                  }`}>
            {c.label}
          </button>
        ))}
      </nav>
      {sortedKeys.length === 0 ? (
        <EmptyState
          title="Aucune entrée dans cette catégorie"
          hint="Cette catégorie sera enrichie quand les données HUG/CBIP seront ingérées (v1.1)."
        />
      ) : (
        <ul className="space-y-3">
          {sortedKeys.map(key => <AtlasIsoformeBlock key={key} name={key} entry={idx[key]} />)}
        </ul>
      )}
    </div>
  );
}

function AtlasIsoformeBlock({ name, entry }: { name: string; entry: AtlasEntry }) {
  const sections: { label: string; molecules: Molecule[] }[] = [
    { label: 'Substrats majeurs',      molecules: entry.substratsMajeurs },
    { label: 'Substrats mineurs',      molecules: entry.substratsMineurs },
    { label: 'Inhibiteurs forts',      molecules: entry.inhibiteursForts },
    { label: 'Inhibiteurs modérés',    molecules: entry.inhibiteursModeres },
    { label: 'Inhibiteurs faibles',    molecules: entry.inhibiteursFaibles },
    { label: 'Inducteurs',             molecules: entry.inducteurs },
  ].filter(s => s.molecules.length > 0);

  return (
    <li className="rounded-lg border border-navy-700 bg-navy-800 p-3">
      <h2 className="mb-2 font-mono text-base font-bold text-teal-400">{name}</h2>
      <dl className="space-y-2">
        {sections.map((s, i) => (
          <div key={i}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{s.label}</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {s.molecules.map(m => (
                <Link key={m.id} to={`/search/${m.id}`}
                      className="inline-flex items-center rounded-full border border-navy-600 bg-navy-900 px-2 py-0.5 text-xs text-gray-200 hover:border-teal-500 hover:text-teal-300 focus-ring">
                  {m.nom_dci}
                </Link>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </li>
  );
}
