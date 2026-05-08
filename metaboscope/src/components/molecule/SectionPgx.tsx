import type { Molecule } from '../../types/molecule';
import { Accordion } from '../ui/Accordion';
import { variantsToString } from '../../utils/pgx';
import { normalizeSources } from '../../types/molecule';
import { SourceLink } from '../ui/SourceLink';
import { Badge } from '../ui/Badge';

export function SectionPgx({ molecule, defaultOpen }: { molecule: Molecule; defaultOpen?: boolean }) {
  const real = molecule.pharmacogenetique.filter(p => p.gene !== 'ND');
  if (real.length === 0) return null;
  return (
    <Accordion title={`Pharmacogénétique détaillée (${real.length})`} defaultOpen={defaultOpen}>
      <ul className="space-y-2">
        {real.map((p, i) => (
          <li key={i} className="rounded-md border border-navy-700 bg-navy-800/50 p-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-teal-400">{p.gene}</span>
              <span className="text-xs text-gray-400">variants : {variantsToString(p)}</span>
              {p.zone_grise && <Badge label="Zone grise" severity="amber" />}
              <span className="ml-auto text-xs text-gray-400">CPIC {p.niveau_cpic} · {p.phenotype}</span>
            </div>
            <p className="mt-2 text-sm text-gray-100">{p.recommandation}</p>
            <p className="mt-1 flex flex-wrap gap-2">
              {normalizeSources(p.source).map((s, j) => <SourceLink key={j} source={s} />)}
            </p>
          </li>
        ))}
      </ul>
    </Accordion>
  );
}
