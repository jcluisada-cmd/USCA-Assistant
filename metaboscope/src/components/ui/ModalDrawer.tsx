// Drawer slide-in depuis la droite — utilisé pour les détails molécule/voie/alerte.
// Couvre l'écran complet sur mobile, max-w-2xl en desktop avec arrière-plan dimmé.

import { useEffect, type ReactNode } from 'react';

interface ModalDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Niveau d'accent (par défaut indigo USCA) */
  accent?: 'default' | 'amber' | 'red';
  children: ReactNode;
}

export function ModalDrawer({ open, onClose, title, accent = 'default', children }: ModalDrawerProps) {
  // Echap pour fermer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const accentBorder = accent === 'red'
    ? 'border-l-red-500'
    : accent === 'amber'
      ? 'border-l-amber-500'
      : 'border-l-teal-500';

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      {/* Drawer panel */}
      <div className={`relative ml-auto flex h-full w-full max-w-2xl flex-col border-l-4 ${accentBorder} bg-navy-900 shadow-2xl`}>
        <header className="flex items-center justify-between gap-2 border-b border-navy-700 px-4 py-3">
          <h2 className="truncate text-base font-bold text-gray-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-navy-700 text-gray-300 hover:bg-navy-800 focus-ring"
          >
            ✕
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
