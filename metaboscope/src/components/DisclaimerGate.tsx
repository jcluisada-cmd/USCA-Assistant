// src/components/DisclaimerGate.tsx
import { useDisclaimer } from '../context/DisclaimerContext';
import { DisclaimerModal } from './DisclaimerModal';
import type { ReactNode } from 'react';

export function DisclaimerGate({ children }: { children: ReactNode }) {
  const { accepted, accept } = useDisclaimer();
  if (!accepted) {
    return <DisclaimerModal mode="gate" onAccept={accept} />;
  }
  return <>{children}</>;
}
