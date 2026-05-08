import type { Molecule } from '../../types/molecule';
import { Accordion } from '../ui/Accordion';
import { normalizeSources } from '../../types/molecule';
import { SourceLink } from '../ui/SourceLink';

export function SectionPhase2({ molecule, defaultOpen }: { molecule: Molecule; defaultOpen?: boolean }) {
  if (molecule.phase2.length === 0) return null;
  return (
    <Accordion title={`Phase II (${molecule.phase2.length})`} defaultOpen={defaultOpen}>
      <ul className="space-y-2">
        {molecule.phase2.map((e, i) => (
          <li key={i} className="rounded-md border border-navy-700 bg-navy-800/50 p-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-teal-400">{e.enzyme}</span>
              <span className="text-xs text-gray-400">{e.rang} · {e.preuve}</span>
            </div>
            <p className="mt-1 text-xs text-gray-300">{e.produit}</p>
            <p className="mt-1 flex flex-wrap gap-2">
              {normalizeSources(e.source).map((s, j) => <SourceLink key={j} source={s} />)}
            </p>
          </li>
        ))}
      </ul>
    </Accordion>
  );
}
