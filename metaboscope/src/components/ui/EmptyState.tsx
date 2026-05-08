// src/components/ui/EmptyState.tsx
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  hint?: string;
}

export function EmptyState({ icon, title, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center text-gray-400">
      {icon && <div aria-hidden className="text-4xl text-teal-500">{icon}</div>}
      <p className="font-medium text-gray-200">{title}</p>
      {hint && <p className="max-w-md text-sm">{hint}</p>}
    </div>
  );
}
