// Rapport A4 imprimable — Chantier D.1 (2026-05-11).
//
// Layout validé via mockup HTML : composition · alertes critiques · vigilance ·
// matrix interactions · détail couples · disclaimer.
//
// Stratégie d'impression : overlay plein écran avec wrapper .rapport-print-root.
// CSS @media print dans index.css cache tout sauf ce wrapper + force palette light.

import { useEffect, useMemo } from 'react';
import type { Molecule } from '../../types/molecule';
import {
  scoreQT, scoreSero, scoreResp, scoreAcb, scoreSeuilEp,
  detectPkPairs, findDocumentedInteractions,
  type Severity,
} from '../../utils/scoring';

interface RapportPrintProps {
  open: boolean;
  molecules: Molecule[];
  onClose: () => void;
}

export function RapportPrint({ open, molecules, onClose }: RapportPrintProps) {
  // Echap pour fermer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lock scroll body quand ouvert (overlay full-screen)
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [open]);

  const qt = useMemo(() => scoreQT(molecules), [molecules]);
  const sero = useMemo(() => scoreSero(molecules), [molecules]);
  const resp = useMemo(() => scoreResp(molecules), [molecules]);
  const acb = useMemo(() => scoreAcb(molecules), [molecules]);
  const sep = useMemo(() => scoreSeuilEp(molecules), [molecules]);
  const pkPairs = useMemo(() => detectPkPairs(molecules), [molecules]);
  const docInter = useMemo(() => findDocumentedInteractions(molecules), [molecules]);

  // Alertes regroupées par sévérité (red = critiques, amber = vigilance)
  const allAlerts = useMemo(() => buildAlerts({ qt, sero, resp, acb, sep }), [qt, sero, resp, acb, sep]);
  const critiques = allAlerts.filter(a => a.severity === 'red');
  const vigilance = allAlerts.filter(a => a.severity === 'amber');

  // Couples avec interaction notable (PK ou PD partagée)
  const couples = useMemo(
    () => buildCouples(molecules, { qt, sero, resp, acb }, pkPairs, docInter),
    [molecules, qt, sero, resp, acb, pkPairs, docInter],
  );

  if (!open) return null;

  const dateStr = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  function handlePrint() {
    window.print();
  }

  return (
    <div className="rapport-print-root fixed inset-0 z-50 flex flex-col bg-black/70 overflow-y-auto"
         role="dialog" aria-modal="true" aria-label="Rapport d'analyse de co-prescription">

      {/* Toolbar (cachée à l'impression) */}
      <div className="rapport-print-toolbar sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-navy-700 bg-navy-900 px-4 py-2 shadow-lg">
        <span className="text-sm font-bold text-gray-100">📄 Rapport d'analyse — Mode Ordonnance</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-indigo-500 focus-ring"
          >
            🖨️ Imprimer
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-navy-700 bg-navy-800 text-gray-300 hover:bg-navy-700 focus-ring"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Page A4 simulée (à l'écran) — devient le document imprimé */}
      <div className="rapport-paper mx-auto my-6 w-[210mm] max-w-full bg-white px-[16mm] py-[18mm] text-[11pt] leading-snug text-slate-800 shadow-2xl">

        {/* ═══ Header ═══ */}
        <header className="mb-4 flex items-start justify-between border-b-2 border-indigo-600 pb-2">
          <div>
            <p className="text-[9pt] uppercase tracking-wider text-slate-500">
              USCA Connect · MetaboScope · Mode Ordonnance
            </p>
            <h1 className="mt-1 text-[16pt] font-bold text-indigo-700">
              Rapport d'analyse de co-prescription
            </h1>
          </div>
          <div className="text-right text-[9pt] text-slate-600">
            <div><strong className="text-slate-800">{capitalize(dateStr)}</strong></div>
            <div className="mt-0.5">Service USCA</div>
            <div>Pitié-Salpêtrière · AP-HP</div>
          </div>
        </header>

        {/* ═══ 1. Composition ═══ */}
        <Section title="1. Composition de l'ordonnance" count={`${molecules.length} molécule${molecules.length > 1 ? 's' : ''}`}>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="mb-1.5 text-[9pt] text-slate-500">
              Base MetaboScope v1.0 — 147 molécules. Seules les molécules reconnues sont analysées.
            </p>
            {molecules.length === 0 ? (
              <p className="text-[10pt] italic text-slate-500">Panier vide — rien à analyser.</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {molecules.map(m => (
                  <li key={m.id} className="inline-flex items-baseline rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-[10pt]">
                    <span>{m.nom_dci}</span>
                    <span className="ml-1.5 text-[8.5pt] text-slate-500">· {m.classe}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        {/* ═══ 2. Alertes critiques ═══ */}
        {critiques.length > 0 && (
          <Section title="2. Alertes critiques" titleClass="red" count={`${critiques.length} détectée${critiques.length > 1 ? 's' : ''}`}>
            {critiques.map((a, i) => <AlertCard key={i} alert={a} />)}
          </Section>
        )}

        {/* ═══ 3. Vigilance ═══ */}
        {vigilance.length > 0 && (
          <Section title="3. Vigilance requise" titleClass="amber" count={`${vigilance.length} détectée${vigilance.length > 1 ? 's' : ''}`}>
            {vigilance.map((a, i) => <AlertCard key={i} alert={a} />)}
          </Section>
        )}

        {/* Cas zéro alerte : note rassurante */}
        {critiques.length === 0 && vigilance.length === 0 && molecules.length >= 2 && (
          <Section title="2. Alertes">
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10pt] text-emerald-800">
              ✓ Aucune alerte PD critique ou de vigilance détectée pour ce panier.
              Vérification réflexe à l&apos;échelle de la base MetaboScope v1.0.
            </p>
          </Section>
        )}

        {/* ═══ 4. Matrix interactions ═══ */}
        {molecules.length >= 2 && (
          <Section title={`${critiques.length + vigilance.length === 0 ? 3 : 4}. Matrix interactions`} count={`${molecules.length} molécules analysées`}>
            <InteractionsMatrix molecules={molecules} couples={couples} />
          </Section>
        )}

        {/* ═══ 5. Détails couple par couple ═══ */}
        {couples.length > 0 && (
          <Section
            title={`${critiques.length + vigilance.length === 0 ? 4 : 5}. Détails couple par couple`}
            count={`${couples.length} couple${couples.length > 1 ? 's' : ''} actif${couples.length > 1 ? 's' : ''}`}
          >
            <div className="space-y-1.5">
              {couples.map((c, i) => <CoupleDetail key={i} couple={c} />)}
            </div>
          </Section>
        )}

        {/* ═══ Footer disclaimer ═══ */}
        <footer className="mt-4 border-t border-slate-200 pt-2 text-[8pt] italic leading-snug text-slate-500">
          ⚠️ Aide à la décision — ne se substitue pas au jugement clinique du prescripteur.
          Validation pharmacien clinicien USCA recommandée pour toute co-prescription à haut risque.
          Aucune donnée patient n&apos;est stockée par MetaboScope.
          Référentiel : MetaboScope v1.0 (147 molécules · multi-sources HUG 2020 + CBIP 2026 ·
          CredibleMeds · FDA Drug Interaction Table · CPIC Guidelines).
        </footer>
      </div>

      {/* Padding bottom pour le scroll */}
      <div className="h-6 print:hidden" />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ────────────────── Construction des alertes ──────────────────

type AlertEntry = {
  axis: 'qt' | 'sero' | 'resp' | 'acb' | 'sep';
  severity: Severity;
  icon: string;
  title: string;
  mechanism: string;
  conduct?: string;
  contributors: string[];
};

interface ScoringSet {
  qt: ReturnType<typeof scoreQT>;
  sero: ReturnType<typeof scoreSero>;
  resp: ReturnType<typeof scoreResp>;
  acb: ReturnType<typeof scoreAcb>;
  sep: ReturnType<typeof scoreSeuilEp>;
}

function buildAlerts(s: ScoringSet): AlertEntry[] {
  const out: AlertEntry[] = [];

  // QT
  if (s.qt.severity === 'red' || s.qt.severity === 'amber') {
    out.push({
      axis: 'qt',
      severity: s.qt.severity,
      icon: '❤',
      title: 'Allongement QTc — risque de torsades de pointes',
      mechanism: s.qt.rationale,
      conduct: 'ECG de contrôle à J1, J7, puis mensuel. Corriger toute hypokaliémie / hypomagnésémie. Éviter associations supplémentaires QT-KR ou QT-PR.',
      contributors: s.qt.perMolecule
        .filter(p => p.points > 0)
        .map(p => `${p.nom} — ${p.codes.join(', ')}`),
    });
  }

  // Sérotonine
  if (s.sero.severity === 'red' || s.sero.severity === 'amber') {
    out.push({
      axis: 'sero',
      severity: s.sero.severity,
      icon: '🧠',
      title: s.sero.severity === 'red'
        ? 'Triade sérotoninergique — risque vital'
        : 'Risque sérotoninergique',
      mechanism: s.sero.rationale,
      conduct: s.sero.severity === 'red'
        ? 'Triade à proscrire. Surveiller clonus, hyperréflexie, hyperthermie, agitation. Antidote = cyproheptadine + sédation BZD.'
        : 'Surveillance clinique du syndrome sérotoninergique. Vigilance dose maximale + facteurs aggravants.',
      contributors: s.sero.triggers.map(t => `${t.nom} — ${t.codes.join(', ')}`),
    });
  }

  // Respi
  if (s.resp.severity === 'red' || s.resp.severity === 'amber') {
    out.push({
      axis: 'resp',
      severity: s.resp.severity,
      icon: '🫁',
      title: s.resp.severity === 'red'
        ? 'Dépression respiratoire — paire BZD + opioïde'
        : 'Risque de dépression respiratoire',
      mechanism: s.resp.rationale,
      conduct: s.resp.severity === 'red'
        ? 'Reconsidérer la double prescription. Si maintien indispensable — dose minimale efficace de BZD, surveillance respiratoire renforcée, information patient/entourage sur la naloxone (kit nalsox).'
        : 'Surveillance respiratoire renforcée. Posologies minimales efficaces.',
      contributors: s.resp.contributors.map(c => `${c.nom} (${c.tag})`),
    });
  }

  // ACB
  if (s.acb.severity === 'red' || s.acb.severity === 'amber') {
    out.push({
      axis: 'acb',
      severity: s.acb.severity,
      icon: '🧓',
      title: 'Charge anticholinergique cumulée',
      mechanism: s.acb.rationale,
      conduct: 'Risque cognitif et de chute (sujet âgé surtout). Réévaluer chaque molécule, déprescrire si possible, privilégier alternatives non anticholinergiques.',
      contributors: s.acb.perMolecule.map(p => `${p.nom} (ACB-${p.level})`),
    });
  }

  // Seuil épileptogène
  if (s.sep.severity === 'red' || s.sep.severity === 'amber') {
    out.push({
      axis: 'sep',
      severity: s.sep.severity,
      icon: '⚡',
      title: 'Abaissement du seuil épileptogène',
      mechanism: s.sep.rationale,
      conduct: 'CI relative ATCD convulsions, sevrage alcool/BZD aigu, traumatisme crânien récent. Vigilance accrue en cas d\'association.',
      contributors: s.sep.contributors.map(c => `${c.nom}${c.sevrage ? ' (sevrage)' : ''}`),
    });
  }

  // Note v1 : les tags PGx CPIC niveau A apparaissent dans la matrix et le détail couples
  // (via buildCouples / hasCpicNiveauA). Pas d'alerte globale "PGx" — la pertinence
  // dépend du contexte clinique (génotype connu ? réponse atypique ?).

  return out;
}

// ────────────────── Construction des couples ──────────────────

type CoupleTag =
  | { kind: 'pd-red'; label: string }
  | { kind: 'pd-amber'; label: string }
  | { kind: 'pk'; label: string }
  | { kind: 'pgx'; label: string }
  | { kind: 'doc'; label: string };

interface CoupleEntry {
  a: Molecule;
  b: Molecule;
  tags: CoupleTag[];
  comment: string;
}

function buildCouples(
  mols: Molecule[],
  s: { qt: ReturnType<typeof scoreQT>; sero: ReturnType<typeof scoreSero>; resp: ReturnType<typeof scoreResp>; acb: ReturnType<typeof scoreAcb> },
  pkPairs: ReturnType<typeof detectPkPairs>,
  docInter: ReturnType<typeof findDocumentedInteractions>,
): CoupleEntry[] {
  const out: CoupleEntry[] = [];

  const qtMols = new Set(s.qt.perMolecule.filter(p => p.points > 0).map(p => p.id));
  const seroMols = new Set(s.sero.triggers.map(t => t.id));
  const respMols = new Map(s.resp.contributors.map(c => [c.id, c.tag] as const));
  const acbMols = new Set(s.acb.perMolecule.map(p => p.id));

  for (let i = 0; i < mols.length; i++) {
    for (let j = i + 1; j < mols.length; j++) {
      const a = mols[i];
      const b = mols[j];
      const tags: CoupleTag[] = [];
      const commentParts: string[] = [];

      // PD : QT cumulé entre les deux
      if (qtMols.has(a.id) && qtMols.has(b.id)) {
        tags.push({ kind: s.qt.severity === 'red' ? 'pd-red' : 'pd-amber', label: 'PD QT cumulé' });
      }
      // PD : sérotonine
      if (seroMols.has(a.id) && seroMols.has(b.id)) {
        tags.push({ kind: s.sero.severity === 'red' ? 'pd-red' : 'pd-amber', label: 'PD sérotonine' });
      }
      // PD : respi — paire BZD + opioïde
      const respA = respMols.get(a.id);
      const respB = respMols.get(b.id);
      if (respA && respB && respA !== respB && (
        (respA === 'bzd' && respB === 'opioïde') || (respA === 'opioïde' && respB === 'bzd')
      )) {
        tags.push({ kind: 'pd-red', label: 'PD respi (paire FDA)' });
      } else if (respA && respB) {
        tags.push({ kind: 'pd-amber', label: 'PD respi (dépresseurs CNS)' });
      }
      // PD : ACB
      if (acbMols.has(a.id) && acbMols.has(b.id)) {
        tags.push({ kind: s.acb.severity === 'red' ? 'pd-red' : 'pd-amber', label: 'PD ACB cumulé' });
      }

      // PK pairs
      const pkOfCouple = pkPairs.filter(p => (
        (p.substrat.id === a.id && p.inhibiteurOuInducteur.id === b.id) ||
        (p.substrat.id === b.id && p.inhibiteurOuInducteur.id === a.id)
      ));
      for (const pk of pkOfCouple) {
        tags.push({
          kind: 'pk',
          label: `PK ${pk.isoenzyme} (${pk.inhibiteurOuInducteur.nom} ${pk.inhibiteurOuInducteur.role} ${pk.inhibiteurOuInducteur.puissance})`,
        });
      }

      // PGx : si une des deux molécules a une recommandation CPIC niveau A
      // et l'enzyme PGx est partagée avec l'autre (substrat / inhibiteur / inducteur)
      const pgxA = hasCpicNiveauA(a);
      const pgxB = hasCpicNiveauA(b);
      if (pgxA && involvesEnzymeOf(b, a)) {
        tags.push({ kind: 'pgx', label: `PGx CPIC A (${pgxA})` });
      }
      if (pgxB && involvesEnzymeOf(a, b)) {
        tags.push({ kind: 'pgx', label: `PGx CPIC A (${pgxB})` });
      }

      // Interactions documentées
      const docOfCouple = docInter.filter(d => (
        (d.source.id === a.id && d.cible.id === b.id) ||
        (d.source.id === b.id && d.cible.id === a.id)
      ));
      for (const d of docOfCouple) {
        tags.push({ kind: 'doc', label: 'Interaction documentée' });
        if (d.effet) commentParts.push(d.effet);
      }

      // Si aucun tag, on n'ajoute pas le couple (matrix le montre comme vide)
      if (tags.length === 0) continue;

      out.push({
        a, b, tags,
        comment: commentParts.join(' · '),
      });
    }
  }

  return out;
}

function hasCpicNiveauA(m: Molecule): string | null {
  for (const pgx of m.pharmacogenetique ?? []) {
    if (pgx.niveau_cpic === 'A') {
      return pgx.gene ?? null;
    }
  }
  return null;
}

function involvesEnzymeOf(target: Molecule, source: Molecule): boolean {
  // Très approximatif v1 : si la source a PGx CPIC A sur gène X (ex. CYP2D6),
  // et target a cette enzyme dans phase1_cyp / inhibiteur / inducteur,
  // on tag le couple "PGx croise".
  const enz = hasCpicNiveauA(source);
  if (!enz) return false;
  const enzNorm = enz.toLowerCase();
  const targetEnzymes = [
    ...(target.phase1_cyp ?? []).map(c => c.isoforme),
    ...(target.inhibiteur ?? []).map(c => c.cible),
    ...(target.inducteur ?? []).map(c => c.cible),
  ].filter(Boolean).map(s => String(s).toLowerCase());
  return targetEnzymes.some(e => e === enzNorm);
}

// ════════════════════════════════════════════════════════════════
// Sous-composants visuels
// ════════════════════════════════════════════════════════════════

function Section({ title, count, titleClass, children }: {
  title: string;
  count?: string;
  titleClass?: 'red' | 'amber';
  children: React.ReactNode;
}) {
  const colorCls = titleClass === 'red'
    ? 'text-red-700 border-red-200'
    : titleClass === 'amber'
      ? 'text-amber-700 border-amber-200'
      : 'text-slate-700 border-slate-200';
  return (
    <section className="mt-3">
      <div className={`mb-1.5 flex items-baseline justify-between border-b pb-1 ${colorCls}`}>
        <h2 className="text-[11pt] font-bold uppercase tracking-wider">{title}</h2>
        {count && <span className="text-[9pt] font-normal opacity-80">{count}</span>}
      </div>
      {children}
    </section>
  );
}

function AlertCard({ alert }: { alert: AlertEntry }) {
  const isRed = alert.severity === 'red';
  const cls = isRed
    ? 'border-red-200 bg-red-50 border-l-4 border-l-red-600'
    : 'border-amber-200 bg-amber-50 border-l-4 border-l-amber-600';
  const badge = isRed
    ? 'bg-red-600 text-white'
    : 'bg-amber-600 text-white';

  return (
    <div className={`mb-2 grid grid-cols-[28px_1fr_auto] gap-3 rounded-md border px-3 py-2.5 ${cls}`}>
      <div className="pt-0.5 text-[16pt] leading-none">{alert.icon}</div>
      <div>
        <h3 className="mb-1 text-[10.5pt] font-bold text-slate-800">{alert.title}</h3>
        <p className="text-[9.5pt] text-slate-700">
          <strong className="text-slate-900">Mécanisme : </strong>{alert.mechanism}
        </p>
        {alert.conduct && (
          <p className="mt-1 text-[9.5pt] text-slate-700">
            <strong className={isRed ? 'text-red-800' : 'text-amber-800'}>Conduite à tenir : </strong>
            {alert.conduct}
          </p>
        )}
        {alert.contributors.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {alert.contributors.map((c, i) => (
              <span key={i} className={`inline-block rounded-full border bg-white px-2 py-0 text-[9pt] ${isRed ? 'border-red-200' : 'border-amber-200'}`}>
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className={`h-fit rounded px-2.5 py-1 text-[9pt] font-bold uppercase tracking-wider ${badge}`}>
        {isRed ? 'Red' : 'Amber'}
      </div>
    </div>
  );
}

function InteractionsMatrix({ molecules, couples }: { molecules: Molecule[]; couples: CoupleEntry[] }) {
  // Recherche rapide d'un couple (a, b) ou (b, a)
  function getCouple(a: Molecule, b: Molecule): CoupleEntry | undefined {
    return couples.find(c =>
      (c.a.id === a.id && c.b.id === b.id) ||
      (c.a.id === b.id && c.b.id === a.id),
    );
  }

  return (
    <table className="w-full border-collapse text-[9pt]">
      <thead>
        <tr>
          <th className="border border-slate-200 bg-slate-100 px-1.5 py-1"></th>
          {molecules.map(m => (
            <th key={m.id} className="border border-slate-200 bg-slate-50 px-2 py-1 text-center font-semibold">
              {m.nom_dci}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {molecules.map((row, i) => (
          <tr key={row.id}>
            <th className="border border-slate-200 bg-slate-50 px-2 py-1 text-left font-semibold">
              {row.nom_dci}
            </th>
            {molecules.map((col, j) => {
              if (i === j) {
                return <td key={col.id} className="border border-slate-200 bg-slate-100 px-2 py-1 text-center text-slate-400">—</td>;
              }
              if (j < i) {
                return <td key={col.id} className="border border-slate-200 bg-slate-50"></td>;
              }
              const couple = getCouple(row, col);
              if (!couple) {
                return <td key={col.id} className="border border-slate-200 px-2 py-1 text-center text-slate-400">∅</td>;
              }
              return (
                <td key={col.id} className="border border-slate-200 px-2 py-1 align-top">
                  {couple.tags.map((t, k) => (
                    <div key={k} className={`text-[8.5pt] font-semibold ${tagColor(t.kind)}`}>
                      {t.label}
                    </div>
                  ))}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function tagColor(kind: CoupleTag['kind']): string {
  switch (kind) {
    case 'pd-red': return 'text-red-700';
    case 'pd-amber': return 'text-amber-700';
    case 'pk': return 'text-blue-700';
    case 'pgx': return 'text-purple-700';
    case 'doc': return 'text-slate-700';
  }
}

function CoupleDetail({ couple }: { couple: CoupleEntry }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-[9.5pt]">
      <div className="mb-1 font-semibold text-slate-800">
        {couple.a.nom_dci} <span className="px-1.5 font-normal text-slate-400">×</span> {couple.b.nom_dci}
      </div>
      <div className="flex flex-wrap gap-1">
        {couple.tags.map((t, i) => (
          <span key={i} className={`inline-block rounded-md border px-2 py-0 text-[8pt] font-semibold ${tagBg(t.kind)}`}>
            {t.label}
          </span>
        ))}
      </div>
      {couple.comment && (
        <p className="mt-1.5 text-[9pt] text-slate-600">{couple.comment}</p>
      )}
    </div>
  );
}

function tagBg(kind: CoupleTag['kind']): string {
  switch (kind) {
    case 'pd-red': return 'bg-red-50 text-red-800 border-red-200';
    case 'pd-amber': return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'pk': return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'pgx': return 'bg-purple-50 text-purple-800 border-purple-200';
    case 'doc': return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}
