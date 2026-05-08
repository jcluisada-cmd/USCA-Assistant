// src/pages/MoleculePage.tsx
import { useParams, useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import { getMolecule } from '../data';
import { MoleculeCard, type SectionId } from '../components/molecule/MoleculeCard';

const VALID_SECTIONS: SectionId[] = [
  'phase1Cyp', 'phase1NonCyp', 'phase2', 'transporteurs',
  'inhibiteur', 'inducteur', 'pgx', 'interactions',
  'alertesPd', 'zoneGrise', 'sources',
];

export function MoleculePage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  if (!id) return <Navigate to="/search" replace />;
  const molecule = getMolecule(id);
  if (!molecule) return <Navigate to="/search" replace />;

  const requested = params.get('openSection');
  const openSection = VALID_SECTIONS.includes(requested as SectionId)
    ? (requested as SectionId)
    : undefined;

  return (
    <div className="space-y-3 pb-20">
      <button type="button" onClick={() => navigate(-1)}
              className="text-sm text-teal-400 hover:text-teal-300 focus-ring">
        ← Retour
      </button>
      <MoleculeCard molecule={molecule} openSection={openSection} />
    </div>
  );
}
