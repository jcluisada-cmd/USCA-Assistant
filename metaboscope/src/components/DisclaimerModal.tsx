// src/components/DisclaimerModal.tsx
import { DISCLAIMER_TEXT } from './Disclaimer';
import { DISCLAIMER_VERSION } from '../context/DisclaimerContext';

interface Props {
  mode: 'gate' | 'readonly';
  onAccept?: () => void;
  onClose?: () => void;
}

export function DisclaimerModal({ mode, onAccept, onClose }: Props) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="disclaimer-title"
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="max-w-xl rounded-lg border border-navy-700 bg-navy-900 p-6 shadow-xl">
        <h2 id="disclaimer-title" className="mb-3 text-lg font-bold text-gray-100">
          MétaboScope — Avertissement clinique
        </h2>
        <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-gray-200">
          {DISCLAIMER_TEXT}
        </p>
        <p className="mb-4 text-xs text-gray-500">
          Version disclaimer : {DISCLAIMER_VERSION}
        </p>
        <div className="flex justify-end gap-2">
          {mode === 'gate' && (
            <button
              type="button"
              onClick={onAccept}
              className="rounded-md border border-teal-500 bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 focus-ring"
            >
              J'ai lu et j'accepte
            </button>
          )}
          {mode === 'readonly' && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600 focus-ring"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
