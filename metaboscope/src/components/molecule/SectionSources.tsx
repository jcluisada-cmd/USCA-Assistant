import type { Molecule } from '../../types/molecule';
import { Accordion } from '../ui/Accordion';
import { SourceLink } from '../ui/SourceLink';
import { normalizeSources } from '../../types/molecule';

function collectAllSources(m: Molecule): string[] {
  const set = new Set<string>(m.sources_principales);
  const collect = (s: string | string[] | undefined) => {
    if (!s) return;
    normalizeSources(s).forEach(x => set.add(x));
  };
  m.phase1_cyp.forEach(e => collect(e.source));
  m.phase1_non_cyp.forEach(e => collect(e.source));
  m.phase2.forEach(e => collect(e.source));
  m.transporteurs.forEach(e => collect(e.source));
  m.inhibiteur.forEach(e => collect(e.source));
  m.inducteur.forEach(e => collect(e.source));
  m.pharmacogenetique.forEach(e => collect(e.source));
  m.interactions_specifiques.forEach(e => collect(e.source));
  return Array.from(set).filter(s => s !== 'ND').sort();
}

export function SectionSources({ molecule, defaultOpen }: { molecule: Molecule; defaultOpen?: boolean }) {
  const sources = collectAllSources(molecule);
  if (sources.length === 0) return null;
  return (
    <Accordion title={`Sources (${sources.length})`} defaultOpen={defaultOpen}>
      <ul className="grid gap-1">
        {sources.map(s => <li key={s}><SourceLink source={s} /></li>)}
      </ul>
    </Accordion>
  );
}
