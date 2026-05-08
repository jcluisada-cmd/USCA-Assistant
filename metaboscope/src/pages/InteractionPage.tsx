// src/pages/InteractionPage.tsx
import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getMolecule } from '../data';
import type { Molecule } from '../types/molecule';
import { normalizeSources } from '../types/molecule';
import {
  scoreQT, scoreSero, scoreResp, scoreAcb, scoreSeuilEp,
  detectPkPairs, findDocumentedInteractions,
} from '../utils/scoring';
import { PdAlertCard } from '../components/molecule/PdAlertCard';
import { Accordion } from '../components/ui/Accordion';
import { SourceLink } from '../components/ui/SourceLink';
import { EmptyState } from '../components/ui/EmptyState';

export function InteractionPage() {
  const navigate = useNavigate();
  const cart = useCart();

  const molecules = useMemo<Molecule[]>(
    () => Array.from(cart.ids).map(id => getMolecule(id)).filter((m): m is Molecule => Boolean(m)),
    [cart.ids],
  );

  if (molecules.length < 2) {
    return (
      <div className="space-y-4 pb-20">
        <h1 className="text-xl font-bold text-gray-100">Vérificateur d'interactions</h1>
        <EmptyState
          title={molecules.length === 0 ? 'Panier vide' : '1 molécule seulement'}
          hint="Ajoute au moins 2 molécules depuis la recherche pour lancer une analyse cumulée."
        />
        <button type="button" onClick={() => navigate('/search')}
                className="rounded-md border border-teal-500 bg-teal-600 px-4 py-2 text-sm text-white focus-ring">
          + Choisir des molécules
        </button>
      </div>
    );
  }

  const qt = scoreQT(molecules);
  const sero = scoreSero(molecules);
  const resp = scoreResp(molecules);
  const acb = scoreAcb(molecules);
  const sep = scoreSeuilEp(molecules);
  const pkPairs = detectPkPairs(molecules);
  const docInter = findDocumentedInteractions(molecules);

  // Adaptateurs locaux : helpers retournent des shapes hétérogènes,
  // PdAlertCard attend { molecule, detail }[].
  const qtContributors = qt.perMolecule
    .filter(p => p.points > 0)
    .map(p => ({ molecule: p.nom, detail: `${p.codes.join(', ')} — ${p.points} pt(s)` }));

  const seroContributors = sero.triggers
    .map(t => ({ molecule: t.nom, detail: t.codes.join(', ') }));

  const respContributors = resp.contributors
    .map(c => ({ molecule: c.nom, detail: c.tag }));

  const acbContributors = acb.perMolecule
    .map(p => ({ molecule: p.nom, detail: `ACB-${p.level}` }));

  const sepContributors = sep.contributors
    .map(c => ({ molecule: c.nom, detail: c.sevrage ? 'sevrage' : '—' }));

  // PGx rappel — niveau A documenté
  const pgxA = molecules.flatMap(m =>
    m.pharmacogenetique
      .filter(p => p.niveau_cpic === 'A' && p.gene !== 'ND')
      .map(p => ({ molecule: m, pgx: p })),
  );

  // Sources consolidées de toutes les molécules + cellules détaillées.
  const allSources = new Set<string>();
  for (const m of molecules) {
    m.sources_principales.forEach(s => allSources.add(s));
    [
      ...m.phase1_cyp, ...m.phase1_non_cyp, ...m.phase2, ...m.transporteurs,
      ...m.inhibiteur, ...m.inducteur, ...m.pharmacogenetique, ...m.interactions_specifiques,
    ].forEach(e => normalizeSources(e.source).forEach(s => allSources.add(s)));
  }
  const sortedSources = Array.from(allSources).filter(s => s !== 'ND').sort();

  return (
    <div className="space-y-4 pb-20">
      <h1 className="text-xl font-bold text-gray-100">Vérificateur d'interactions</h1>

      {/* 1. Panier */}
      <section className="rounded-lg border border-navy-700 bg-navy-800 p-3">
        <header className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-100">
            Panier d'analyse ({molecules.length})
          </h2>
          {cart.overSoftLimit && (
            <span className="text-xs text-amber-300">Au-delà de 6 : lisibilité dégradée</span>
          )}
        </header>
        <ul className="flex flex-wrap gap-2">
          {molecules.map(m => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => cart.remove(m.id)}
                aria-label={`Retirer ${m.nom_dci} du panier`}
                className="inline-flex items-center gap-1 rounded-full border border-teal-500 bg-teal-600/30 px-3 py-1 text-xs text-teal-100 hover:border-red-500 hover:bg-red-600/30 focus-ring"
              >
                {m.nom_dci} <span aria-hidden>×</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => navigate('/search')}
                  className="rounded-md border border-navy-600 bg-navy-700 px-3 py-1 text-xs text-gray-200 focus-ring">
            + Ajouter
          </button>
          <button type="button" onClick={() => cart.clear()}
                  className="rounded-md border border-navy-600 bg-navy-700 px-3 py-1 text-xs text-gray-300 focus-ring">
            Vider
          </button>
        </div>
      </section>

      {/* 2. Paires PK + interactions documentées */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-teal-400">
          Paires PK documentées
        </h2>
        {pkPairs.length === 0 && docInter.length === 0 ? (
          <p className="rounded-md border border-navy-700 bg-navy-800 p-3 text-sm text-gray-400">
            Aucune paire PK détectée.
          </p>
        ) : (
          <ul className="space-y-2">
            {pkPairs.map((p, i) => (
              <li key={`pk-${i}`} className="rounded-lg border border-amber-500/40 bg-navy-800 p-3">
                <p className="text-sm text-gray-100">
                  <strong>{p.substrat.nom} ↔ {p.inhibiteurOuInducteur.nom}</strong>
                </p>
                <p className="mt-1 text-xs text-amber-300">
                  {p.isoenzyme} — {p.inhibiteurOuInducteur.role} ({p.inhibiteurOuInducteur.puissance})
                </p>
                <p className="mt-1 text-xs text-gray-400">{p.inhibiteurOuInducteur.mecanisme}</p>
              </li>
            ))}
            {docInter.map((d, i) => (
              <li key={`doc-${i}`} className="rounded-lg border border-navy-700 bg-navy-800 p-3">
                <p className="text-sm text-gray-100">
                  <strong>{d.source.nom} ↔ {d.cible.nom}</strong>
                </p>
                <p className="mt-1 text-xs text-amber-300">{d.mecanisme}</p>
                <p className="mt-1 text-xs text-gray-300">{d.effet}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3. Alertes PD cumulées (5 cartes) */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          Alertes pharmacodynamiques
        </h2>
        <div className="grid gap-2">
          <PdAlertCard
            title="QTc cumulé"
            severity={qt.severity}
            score={qt.total}
            threshold="≥ 3 ou ≥ 2 KR = rouge ; ≥ 2 = ambre"
            rationale={qt.rationale}
            contributors={qtContributors}
            conduct={qt.severity === 'red' ? 'ECG préalable et surveillance recommandés.' : undefined}
          />
          <PdAlertCard
            title="Sérotonine"
            severity={sero.severity}
            rationale={sero.rationale}
            contributors={seroContributors}
            conduct={sero.severity === 'red' ? 'Triade constituée — éviter, sinon surveillance étroite.' : undefined}
          />
          <PdAlertCard
            title="Dépression respiratoire"
            severity={resp.severity}
            rationale={resp.rationale}
            contributors={respContributors}
            conduct={resp.severity === 'red' ? 'Association BZD + opioïde (± autre dépresseur CNS) — risque vital.' : undefined}
          />
          <PdAlertCard
            title="Charge anticholinergique"
            severity={acb.severity}
            score={acb.total}
            threshold="≥ 3 = ambre / ≥ 6 = rouge"
            rationale={acb.rationale}
            contributors={acbContributors}
          />
          <PdAlertCard
            title="Seuil épileptogène"
            severity={sep.severity}
            rationale={sep.rationale}
            contributors={sepContributors}
          />
        </div>
      </section>

      {/* 4. Rappel PGx CPIC niveau A */}
      {pgxA.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
            Pharmacogénétique — recommandation CPIC niveau A
          </h2>
          <ul className="space-y-1">
            {pgxA.map(({ molecule: m, pgx }, i) => (
              <li key={i} className="rounded-md border border-navy-700 bg-navy-800 p-2 text-sm">
                <strong>{m.nom_dci}</strong>{' '}
                a une recommandation CPIC niveau A pour{' '}
                <code className="font-mono text-teal-400">{pgx.gene}</code>.{' '}
                <Link to={`/search/${m.id}?openSection=pgx`} className="text-teal-400 underline focus-ring">
                  Voir la fiche détaillée →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 5. Sources consolidées */}
      <Accordion title={`Sources consolidées (${sortedSources.length})`}>
        <ul className="grid gap-1">
          {sortedSources.map(s => (
            <li key={s}><SourceLink source={s} /></li>
          ))}
        </ul>
      </Accordion>
    </div>
  );
}
