import type { Molecule } from '../../types/molecule';
import { Accordion } from '../ui/Accordion';
import { Badge } from '../ui/Badge';

export function SectionZoneGrise({ molecule, defaultOpen }: { molecule: Molecule; defaultOpen?: boolean }) {
  const greyPgx = molecule.pharmacogenetique.filter(p => p.zone_grise);
  const flagged = molecule.zone_grise;
  if (!flagged && greyPgx.length === 0 && molecule.champ_manquants.length === 0) return null;

  return (
    <Accordion title="Zone grise" defaultOpen={defaultOpen} badge={<Badge label={`${greyPgx.length}`} severity="amber" />}>
      {flagged && <p className="mb-2 text-sm text-amber-300">Cette molécule est globalement marquée en zone grise.</p>}
      {greyPgx.length > 0 && (
        <>
          <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Cellules PGx en zone grise</p>
          <ul className="ml-4 list-disc text-sm text-gray-200">
            {greyPgx.map((p, i) => <li key={i}>{p.gene} — {p.recommandation}</li>)}
          </ul>
        </>
      )}
      {molecule.champ_manquants.length > 0 && (
        <>
          <p className="mb-1 mt-3 text-xs font-semibold uppercase text-gray-400">Champs à compléter (veille)</p>
          <ul className="ml-4 list-disc text-sm text-gray-300">
            {molecule.champ_manquants.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </>
      )}
    </Accordion>
  );
}
