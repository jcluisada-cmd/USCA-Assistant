import { Link } from 'react-router-dom'
import { ALL_MOLECULES, CLASSES } from '../data'

export function HomePage() {
  return (
    <div className="space-y-6">
      {/* Header sobre */}
      <section className="rounded-lg border border-navy-700 bg-navy-800/60 p-5">
        <h1 className="text-2xl font-bold text-teal-400">MétaboScope</h1>
        <p className="mt-2 text-sm text-gray-300 leading-relaxed">
          Aide à la décision clinique sur la métabolisation médicamenteuse — USCA / ELSA, Pitié-Salpêtrière.
        </p>
      </section>

      {/* Entrée par cas d'usage (chantier C.2) */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Que voulez-vous faire&nbsp;?
        </h2>
        <ul className="grid sm:grid-cols-3 gap-3">
          <li>
            <Link
              to="/interactions"
              className="block rounded-lg border-l-4 border-l-teal-500 border border-navy-700 hover:border-teal-400 hover:border-l-teal-400 bg-navy-800/40 p-4 focus-ring transition-colors h-full"
            >
              <div className="font-semibold text-teal-400 mb-1.5">Vérifier une co-prescription</div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Composez un panier de 2 à 6 molécules. Alertes QT cumulé, sérotoninergique, respiratoire, ACB, paires PK substrat × inhibiteur/inducteur.
              </p>
            </Link>
          </li>
          <li>
            <Link
              to="/search"
              className="block rounded-lg border-l-4 border-l-teal-500 border border-navy-700 hover:border-teal-400 hover:border-l-teal-400 bg-navy-800/40 p-4 focus-ring transition-colors h-full"
            >
              <div className="font-semibold text-teal-400 mb-1.5">Chercher une molécule</div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Autocomplete DCI, synonymes, NPS. Fiche complète&nbsp;: profil métabolique, PGx CPIC, alertes PD, sources tracées.
              </p>
            </Link>
          </li>
          <li>
            <Link
              to="/atlas"
              className="block rounded-lg border-l-4 border-l-teal-500 border border-navy-700 hover:border-teal-400 hover:border-l-teal-400 bg-navy-800/40 p-4 focus-ring transition-colors h-full"
            >
              <div className="font-semibold text-teal-400 mb-1.5">Explorer une voie métabolique</div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Index dynamique CYP / UGT / Transporteurs. Substrats, inhibiteurs et inducteurs regroupés par isoforme.
              </p>
            </Link>
          </li>
        </ul>
      </section>

      {/* Footer compteurs (factuel, désamorce la perception "outil incomplet") */}
      <section className="text-xs text-gray-500 text-center pt-2">
        Base&nbsp;: <span className="text-gray-300 font-medium">{ALL_MOLECULES.length}</span> molécules consolidées
        · <span className="text-gray-300 font-medium">{CLASSES.length}</span> classes thérapeutiques
        · données packagées offline-first.
      </section>
    </div>
  )
}
