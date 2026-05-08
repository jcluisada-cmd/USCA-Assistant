// src/context/DisclaimerContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export const DISCLAIMER_VERSION = '1.0';
const STORAGE_KEY = 'metaboscope.disclaimer.accepted_v1';

interface Stored {
  version: string;
  date: string;
}

interface DisclaimerContextValue {
  accepted: boolean;
  acceptedVersion: string | null;
  accept: () => void;
}

const DisclaimerContext = createContext<DisclaimerContextValue | null>(null);

export function DisclaimerProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<Stored | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setStored(JSON.parse(raw) as Stored);
    } catch { /* localStorage indisponible — disclaimer affiché par sécurité */ }
  }, []);

  const accepted = stored?.version === DISCLAIMER_VERSION;

  function accept() {
    const payload: Stored = { version: DISCLAIMER_VERSION, date: new Date().toISOString() };
    setStored(payload);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch { /* noop */ }
  }

  return (
    <DisclaimerContext.Provider value={{ accepted, acceptedVersion: stored?.version ?? null, accept }}>
      {children}
    </DisclaimerContext.Provider>
  );
}

export function useDisclaimer() {
  const ctx = useContext(DisclaimerContext);
  if (!ctx) throw new Error('useDisclaimer doit être utilisé dans <DisclaimerProvider>');
  return ctx;
}
