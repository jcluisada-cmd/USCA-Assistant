// tests/MoleculeCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MoleculeCard } from '../src/components/molecule/MoleculeCard';
import { ALL_MOLECULES } from '../src/data';
import { CartProvider } from '../src/context/CartContext';

const sample = ALL_MOLECULES[0];

describe('<MoleculeCard>', () => {
  it('rend sans crash sur une molécule réelle', () => {
    render(<CartProvider><BrowserRouter><MoleculeCard molecule={sample} /></BrowserRouter></CartProvider>);
    expect(screen.getByText(sample.nom_dci)).toBeInTheDocument();
  });

  it('affiche la classe et le statut', () => {
    render(<CartProvider><BrowserRouter><MoleculeCard molecule={sample} /></BrowserRouter></CartProvider>);
    expect(screen.getByText(sample.classe)).toBeInTheDocument();
    expect(screen.getByText(sample.statut_fr)).toBeInTheDocument();
  });

  it('garde toutes les sections accordéon repliées par défaut (texte des items non visible)', () => {
    render(<CartProvider><BrowserRouter><MoleculeCard molecule={sample} /></BrowserRouter></CartProvider>);
    if (sample.phase1_cyp.length > 0) {
      const produit = sample.phase1_cyp[0].produit;
      expect(screen.queryByText(produit)).toBeNull();
    }
  });

  it('ouvre la section ciblée par openSection', () => {
    if (sample.phase1_cyp.length === 0) return;
    render(<CartProvider><BrowserRouter><MoleculeCard molecule={sample} openSection="phase1Cyp" /></BrowserRouter></CartProvider>);
    expect(screen.getByText(sample.phase1_cyp[0].produit)).toBeInTheDocument();
  });
});
