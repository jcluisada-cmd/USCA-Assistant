// src/components/molecule/SummaryHeader.tsx
import type { Molecule } from '../../types/molecule';
import { Badge } from '../ui/Badge';
import { useCart } from '../../context/CartContext';

interface Props {
  molecule: Molecule;
}

export function SummaryHeader({ molecule }: Props) {
  const cart = useCart();
  const inCart = cart.ids.has(molecule.id);

  // Profil PK : substrats majeurs / mineurs
  const cypMajeur = molecule.phase1_cyp.filter(e => e.rang === 'majeur').map(e => e.isoforme);
  const cypMineur = molecule.phase1_cyp.filter(e => e.rang === 'mineur').map(e => e.isoforme);
  const inhib = molecule.inhibiteur.map(i => `${i.cible} (${i.puissance})`);
  const induc = molecule.inducteur.map(i => `${i.cible} (${i.puissance})`);
  const meta = molecule.metabolite_actif.present ? molecule.metabolite_actif.nom : null;

  // PGx : niveau CPIC max
  const cpicA = molecule.pharmacogenetique.find(p => p.niveau_cpic === 'A');
  const cpicB = molecule.pharmacogenetique.find(p => p.niveau_cpic === 'B');
  const pgxBest = cpicA ?? cpicB;

  return (
    <header className="rounded-lg border border-navy-700 bg-navy-800 p-4 shadow-sm">
      {/* Bloc 1 : Identité */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-100">{molecule.nom_dci}</h1>
          <p className="text-sm text-teal-400">{molecule.classe}</p>
          {molecule.synonymes.length > 0 && (
            <p className="mt-1 text-xs text-gray-400">Synonymes : {molecule.synonymes.join(', ')}</p>
          )}
        </div>
        <Badge label={molecule.statut_fr} severity="neutral" />
      </div>

      {/* Bloc 2 : Alertes PD */}
      {molecule.alertes_pd.length > 0 && (
        <section className="mt-4 border-t border-navy-700 pt-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-300">⚠️ Alertes PD</h2>
          <div className="flex flex-wrap gap-2">
            {molecule.alertes_pd.map(code => <Badge key={code} code={code} />)}
          </div>
        </section>
      )}

      {/* Bloc 3 : Profil PK */}
      <section className="mt-4 border-t border-navy-700 pt-3 text-sm">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-400">💊 Profil PK</h2>
        <dl className="grid gap-1">
          {cypMajeur.length > 0 && <div><dt className="inline text-gray-400">Substrat majeur : </dt><dd className="inline text-gray-100">{cypMajeur.join(', ')}</dd></div>}
          {cypMineur.length > 0 && <div><dt className="inline text-gray-400">Substrat mineur : </dt><dd className="inline text-gray-100">{cypMineur.join(', ')}</dd></div>}
          <div><dt className="inline text-gray-400">Inhibiteur : </dt><dd className="inline text-gray-100">{inhib.length > 0 ? inhib.join(', ') : '—'}</dd></div>
          <div><dt className="inline text-gray-400">Inducteur : </dt><dd className="inline text-gray-100">{induc.length > 0 ? induc.join(', ') : '—'}</dd></div>
          {meta && <div><dt className="inline text-gray-400">Métabolite actif : </dt><dd className="inline text-gray-100">{meta}</dd></div>}
        </dl>
      </section>

      {/* Bloc 4 : PGx */}
      {pgxBest && (
        <section className="mt-4 border-t border-navy-700 pt-3 text-sm">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-300">🧬 Pharmacogénétique</h2>
          <p className="text-gray-100">
            {pgxBest.gene} — CPIC niveau {pgxBest.niveau_cpic} (recommandation actionnable)
          </p>
        </section>
      )}

      {/* Footer : maj + bouton */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-navy-700 pt-3 text-xs text-gray-400">
        <span>Dernière maj : {molecule.derniere_maj}</span>
        {inCart ? (
          <button
            type="button"
            onClick={() => cart.remove(molecule.id)}
            className="rounded-md border border-amber-600 bg-amber-600/20 px-3 py-1 text-amber-200 focus-ring"
          >
            ✓ Dans le panier — retirer
          </button>
        ) : (
          <button
            type="button"
            onClick={() => cart.add(molecule.id)}
            className="rounded-md border border-teal-500 bg-teal-600/20 px-3 py-1 text-teal-200 hover:bg-teal-600/30 focus-ring"
          >
            + Ajouter au comparateur
          </button>
        )}
      </div>
    </header>
  );
}
