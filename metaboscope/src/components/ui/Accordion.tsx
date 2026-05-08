// src/components/ui/Accordion.tsx
import { useState, useId, type ReactNode } from 'react';

interface AccordionProps {
  title: string;
  /** Forcer l'ouverture initiale (utilisé par MoleculePage avec ?openSection=) */
  defaultOpen?: boolean;
  /** Badge optionnel à droite du titre (ex. compteur) */
  badge?: ReactNode;
  children: ReactNode;
}

export function Accordion({ title, defaultOpen = false, badge, children }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  return (
    <div className="border-t border-navy-700">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left hover:bg-navy-800/50 focus-ring"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-100">
          <span aria-hidden className="text-teal-400">{open ? '▾' : '▸'}</span>
          {title}
        </span>
        {badge}
      </button>
      {open && (
        <div id={contentId} className="px-3 pb-4 text-sm text-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}
