import type { Molecule } from '../../types/molecule';
import { Accordion } from '../ui/Accordion';
import { normalizeSources } from '../../types/molecule';
import { SourceLink } from '../ui/SourceLink';

export function SectionInteractions({ molecule, defaultOpen }: { molecule: Molecule; defaultOpen?: boolean }) {
  if (molecule.interactions_specifiques.length === 0) return null;
  return (
    <Accordion title={`Interactions documentées (${molecule.interactions_specifiques.length})`} defaultOpen={defaultOpen}>
      <ul className="space-y-2">
        {molecule.interactions_specifiques.map((e, i) => (
          <li key={i} className="rounded-md border border-navy-700 bg-navy-800/50 p-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-100">avec {e.avec}</span>
              <span className="text-xs text-gray-400">{e.preuve}</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">Mécanisme : {e.mecanisme}</p>
            <p className="mt-1 text-sm text-gray-200">{e.effet}</p>
            {e.timing && <p className="mt-1 text-xs italic text-amber-300">Timing : {e.timing}</p>}
            <p className="mt-1 flex flex-wrap gap-2">
              {normalizeSources(e.source).map((s, j) => <SourceLink key={j} source={s} />)}
            </p>
          </li>
        ))}
      </ul>
    </Accordion>
  );
}
