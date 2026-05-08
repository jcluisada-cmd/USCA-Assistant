import type { Molecule } from '../../types/molecule';
import { Accordion } from '../ui/Accordion';
import { Badge } from '../ui/Badge';

export function SectionAlertesPd({ molecule, defaultOpen }: { molecule: Molecule; defaultOpen?: boolean }) {
  if (molecule.alertes_pd.length === 0) return null;
  return (
    <Accordion title={`Alertes PD détaillées (${molecule.alertes_pd.length})`} defaultOpen={defaultOpen}>
      <dl className="space-y-2">
        {molecule.alertes_pd.map(code => (
          <div key={code} className="flex flex-col gap-1 rounded-md border border-navy-700 bg-navy-800/50 p-2">
            <Badge code={code} />
            <dd className="text-xs text-gray-400">Code : <code>{code}</code></dd>
          </div>
        ))}
      </dl>
    </Accordion>
  );
}
