// src/components/molecule/PdAlertCard.tsx
import type { Severity } from '../../utils/scoring';

const SEVERITY_HEADER_CLASS: Record<Severity, string> = {
  ok:    'bg-navy-700 text-gray-300',
  info:  'bg-teal-600/20 text-teal-200',
  amber: 'bg-amber-600/30 text-amber-200',
  red:   'bg-red-600/30 text-red-200',
};

interface Contributor {
  molecule: string;
  detail: string;
}

interface Props {
  title: string;
  severity: Severity;
  score?: number;
  threshold?: string;
  rationale?: string;
  contributors: Contributor[];
  conduct?: string;
  emptyMessage?: string;
}

export function PdAlertCard({
  title, severity, score, threshold, rationale, contributors, conduct, emptyMessage,
}: Props) {
  return (
    <article className="rounded-lg border border-navy-700 bg-navy-800">
      <header className={`flex items-center justify-between rounded-t-lg px-3 py-2 ${SEVERITY_HEADER_CLASS[severity]}`}>
        <h3 className="font-semibold">{title}</h3>
        {typeof score === 'number' && <span className="text-sm font-mono">Score : {score}</span>}
      </header>
      <div className="space-y-2 p-3 text-sm text-gray-200">
        {threshold && <p className="text-xs italic text-gray-400">{threshold}</p>}
        {rationale && <p className="text-xs text-gray-300">{rationale}</p>}
        {contributors.length === 0 ? (
          <p className="text-gray-500">{emptyMessage ?? 'Aucun contributeur identifié.'}</p>
        ) : (
          <ul className="space-y-1">
            {contributors.map((c, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-gray-100">{c.molecule}</span>
                <span className="text-xs text-gray-400">{c.detail}</span>
              </li>
            ))}
          </ul>
        )}
        {conduct && (
          <p className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-200">
            ⚠️ {conduct}
          </p>
        )}
      </div>
    </article>
  );
}
