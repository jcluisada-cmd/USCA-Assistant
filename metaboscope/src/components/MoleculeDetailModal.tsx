// Modal slide-in qui affiche la fiche complète d'une molécule (les 11 sections).
// Réutilise le composant MoleculeCard existant. Ouvert via ?molecule=ID dans l'URL.

import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMolecule } from '../data';
import { MoleculeCard, type SectionId } from './molecule/MoleculeCard';
import { ModalDrawer } from './ui/ModalDrawer';

const VALID_SECTIONS: SectionId[] = [
  'phase1Cyp', 'phase1NonCyp', 'phase2', 'transporteurs',
  'inhibiteur', 'inducteur', 'pgx', 'interactions',
  'alertesPd', 'zoneGrise', 'sources',
];

export function MoleculeDetailModal() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const id = params.get('molecule');
  const molecule = id ? getMolecule(id) : undefined;

  if (!id || !molecule) return null;

  const requested = params.get('openSection');
  const openSection = VALID_SECTIONS.includes(requested as SectionId)
    ? (requested as SectionId)
    : undefined;

  function close() {
    // Retire le param ?molecule= (et openSection éventuellement) en gardant le reste
    const next = new URLSearchParams(params);
    next.delete('molecule');
    next.delete('openSection');
    const search = next.toString();
    setParams(next, { replace: true });
    // setParams ne fait pas naviguer si la route reste inchangée — c'est OK ici
    void navigate;
    void search;
  }

  return (
    <ModalDrawer open onClose={close} title={molecule.nom_dci}>
      <MoleculeCard molecule={molecule} openSection={openSection} />
    </ModalDrawer>
  );
}
