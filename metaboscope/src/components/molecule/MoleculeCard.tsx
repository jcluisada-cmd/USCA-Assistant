// src/components/molecule/MoleculeCard.tsx
import type { Molecule } from '../../types/molecule';
import { SummaryHeader } from './SummaryHeader';
import { SectionPhase1Cyp } from './SectionPhase1Cyp';
import { SectionPhase1NonCyp } from './SectionPhase1NonCyp';
import { SectionPhase2 } from './SectionPhase2';
import { SectionTransporteurs } from './SectionTransporteurs';
import { SectionInhibiteur } from './SectionInhibiteur';
import { SectionInducteur } from './SectionInducteur';
import { SectionPgx } from './SectionPgx';
import { SectionInteractions } from './SectionInteractions';
import { SectionAlertesPd } from './SectionAlertesPd';
import { SectionZoneGrise } from './SectionZoneGrise';
import { SectionSources } from './SectionSources';

export type SectionId =
  | 'phase1Cyp' | 'phase1NonCyp' | 'phase2' | 'transporteurs'
  | 'inhibiteur' | 'inducteur' | 'pgx' | 'interactions'
  | 'alertesPd' | 'zoneGrise' | 'sources';

interface Props {
  molecule: Molecule;
  /** ID de section à ouvrir au mount (depuis ?openSection=) */
  openSection?: SectionId;
}

export function MoleculeCard({ molecule, openSection }: Props) {
  const isOpen = (id: SectionId) => openSection === id;
  return (
    <article className="space-y-1">
      <SummaryHeader molecule={molecule} />
      <div className="rounded-lg border border-navy-700 bg-navy-800">
        <SectionPhase1Cyp molecule={molecule} defaultOpen={isOpen('phase1Cyp')} />
        <SectionPhase1NonCyp molecule={molecule} defaultOpen={isOpen('phase1NonCyp')} />
        <SectionPhase2 molecule={molecule} defaultOpen={isOpen('phase2')} />
        <SectionTransporteurs molecule={molecule} defaultOpen={isOpen('transporteurs')} />
        <SectionInhibiteur molecule={molecule} defaultOpen={isOpen('inhibiteur')} />
        <SectionInducteur molecule={molecule} defaultOpen={isOpen('inducteur')} />
        <SectionPgx molecule={molecule} defaultOpen={isOpen('pgx')} />
        <SectionInteractions molecule={molecule} defaultOpen={isOpen('interactions')} />
        <SectionAlertesPd molecule={molecule} defaultOpen={isOpen('alertesPd')} />
        <SectionZoneGrise molecule={molecule} defaultOpen={isOpen('zoneGrise')} />
        <SectionSources molecule={molecule} defaultOpen={isOpen('sources')} />
      </div>
      <p className="px-3 pt-3 text-xs italic text-gray-500">
        Aide à la décision — non substitutive — voir <a href="#" className="underline">Disclaimer</a>.
      </p>
    </article>
  );
}
