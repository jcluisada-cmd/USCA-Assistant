// src/components/ui/SourceLink.tsx
import { sourceToHref } from '../../utils/labels';

export function SourceLink({ source }: { source: string }) {
  const href = sourceToHref(source);
  if (!href) {
    return <span className="font-mono text-xs text-gray-400">{source}</span>;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-xs text-teal-400 underline hover:text-teal-300 focus-ring"
    >
      {source}
    </a>
  );
}
