import { Link } from 'react-router-dom'
import { ALL_MOLECULES, CLASSES } from '../data'

export function HomePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-navy-700 bg-navy-800/60 p-5">
        <h1 className="text-2xl font-semibold text-teal-400">
          MétaboScope — base v1.0
        </h1>
        <p className="mt-2 text-sm text-gray-300 leading-relaxed">
          Aide à la décision clinique sur la métabolisation médicamenteuse —
          USCA / ELSA, Pitié-Salpêtrière. Trois onglets : recherche par molécule
          (médicaments, drogues, NPS unifiés), vérificateur de co-prescription,
          atlas des voies métaboliques.
        </p>
        <p className="mt-3 text-xs text-gray-400">
          {ALL_MOLECULES.length} molécules consolidées · {CLASSES.length} classes
          thérapeutiques · données empaquetées (offline-first).
        </p>
      </section>

      <section className="rounded-lg border border-navy-700 bg-navy-800/30 p-5">
        <h2 className="text-lg font-semibold text-gray-100">Onglets</h2>
        <ul className="mt-3 grid sm:grid-cols-3 gap-3 text-sm">
          <li>
            <Link
              to="/search"
              className="block rounded-md border border-navy-700 hover:border-teal-500 p-3 focus-ring"
            >
              <div className="font-medium text-teal-400">Recherche</div>
              <p className="text-xs text-gray-400 mt-1">
                Autocomplete DCI / synonymes / NPS, fiche complète par molécule.
              </p>
            </Link>
          </li>
          <li>
            <Link
              to="/interactions"
              className="block rounded-md border border-navy-700 hover:border-teal-500 p-3 focus-ring"
            >
              <div className="font-medium text-teal-400">Interactions</div>
              <p className="text-xs text-gray-400 mt-1">
                2 à 6 molécules — QT, sérotonine, respiratoire, ACB, PK.
              </p>
            </Link>
          </li>
          <li>
            <Link
              to="/atlas"
              className="block rounded-md border border-navy-700 hover:border-teal-500 p-3 focus-ring"
            >
              <div className="font-medium text-teal-400">Atlas</div>
              <p className="text-xs text-gray-400 mt-1">
                Voies métaboliques (CYP / UGT / Transporteurs) — index dynamique du corpus.
              </p>
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-lg border border-amber-700/40 bg-amber-900/10 p-4 text-amber-100">
        <h2 className="font-semibold text-amber-300">Statut de développement</h2>
        <p className="mt-1 text-xs leading-relaxed">
          Sprint 4 livré — Disclaimer + 3 onglets navigables + fiche molécule
          complète (11 sections). Modules 2 (vérificateur) et 3 (atlas) en cours
          de finalisation. Voir <code className="text-amber-200">CLAUDE.md</code>{' '}
          §16 pour la roadmap.
        </p>
      </section>
    </div>
  )
}
