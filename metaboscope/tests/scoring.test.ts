// tests/scoring.test.ts
import { describe, it, expect } from 'vitest';
import {
  scoreQT, scoreSero, scoreResp, scoreAcb, scoreSeuilEp,
  detectPkPairs,
} from '../src/utils/scoring';
import type { Molecule } from '../src/types/molecule';

// Helper pour créer une molécule de test minimale
function mockMolecule(partial: Partial<Molecule>): Molecule {
  return {
    id: partial.id ?? 'mock_test',
    nom_dci: partial.nom_dci ?? 'Test',
    synonymes: [],
    classe: 'Test',
    statut_fr: 'Liste I',
    phase1_cyp: [],
    phase1_non_cyp: [],
    phase2: [],
    transporteurs: [],
    inhibiteur: [],
    inducteur: [],
    metabolite_actif: { present: false, nom: null, activite_relative: null, demi_vie_h: null },
    pharmacogenetique: [],
    interactions_specifiques: [],
    alertes_pd: [],
    niveau_preuve_global: 'IVH-O',
    sources_principales: ['HUG:carte_cytochromes_2020'],
    zone_grise: false,
    derniere_maj: '2026-04',
    champ_manquants: [],
    ...partial,
  };
}

describe('scoreQT', () => {
  it('rouge si total ≥ 3 (un KR seul)', () => {
    const r = scoreQT([mockMolecule({ id: 'a', alertes_pd: ['QT-KR'] })]);
    expect(r.severity).toBe('red');
    expect(r.total).toBe(3);
  });

  it('rouge si 2 × KR (score 6)', () => {
    const r = scoreQT([
      mockMolecule({ id: 'a', alertes_pd: ['QT-KR'] }),
      mockMolecule({ id: 'b', alertes_pd: ['QT-KR'] }),
    ]);
    expect(r.severity).toBe('red');
    expect(r.total).toBe(6);
  });

  it('rouge si total ≥ 3 (PR + CR = 3)', () => {
    const r = scoreQT([
      mockMolecule({ id: 'a', alertes_pd: ['QT-PR'] }),
      mockMolecule({ id: 'b', alertes_pd: ['QT-CR'] }),
    ]);
    expect(r.severity).toBe('red');
    expect(r.total).toBe(3);
  });

  it('ambre si CR + SR (score 2)', () => {
    const r = scoreQT([
      mockMolecule({ id: 'a', alertes_pd: ['QT-CR'] }),
      mockMolecule({ id: 'b', alertes_pd: ['QT-SR'] }),
    ]);
    expect(r.severity).toBe('amber');
    expect(r.total).toBe(2);
  });

  it('info si une seule molécule SR', () => {
    const r = scoreQT([mockMolecule({ id: 'a', alertes_pd: ['QT-SR'] })]);
    expect(r.severity).toBe('info');
  });
});

describe('scoreSero', () => {
  it('rouge si triade ISRS + opioïde séro + IMAO', () => {
    const r = scoreSero([
      mockMolecule({ id: 'a', classe: 'Antidépresseur ISRS', alertes_pd: ['sero'] }),
      mockMolecule({ id: 'b', alertes_pd: ['sero'] }),
      mockMolecule({ id: 'c', alertes_pd: ['CI-IMAO'] }),
    ]);
    expect(r.severity).toBe('red');
  });

  it('info si une seule molécule sero-faible', () => {
    const r = scoreSero([mockMolecule({ id: 'a', alertes_pd: ['sero-faible'] })]);
    expect(r.severity).toBe('info');
  });
});

describe('scoreResp', () => {
  it('rouge si BZD + opioïde + autre dépresseur CNS (triade)', () => {
    const r = scoreResp([
      mockMolecule({ id: 'a', classe: 'BZD', alertes_pd: ['resp'] }),
      mockMolecule({ id: 'b', classe: 'Opioïde TSO', alertes_pd: ['resp'] }),
      mockMolecule({ id: 'c', classe: 'Antihistaminique', alertes_pd: ['resp'] }),
    ]);
    expect(r.severity).toBe('red');
  });

  it('rouge dès la paire BZD + opioïde (FDA boxed warning 2016)', () => {
    const r = scoreResp([
      mockMolecule({ id: 'a', classe: 'BZD', alertes_pd: ['resp'] }),
      mockMolecule({ id: 'b', classe: 'Opioïde TSO', alertes_pd: ['resp'] }),
    ]);
    expect(r.severity).toBe('red');
  });
});

describe('scoreAcb', () => {
  it('rouge si score ≥ 6', () => {
    const r = scoreAcb([
      mockMolecule({ id: 'a', alertes_pd: ['ACB-3'] }),
      mockMolecule({ id: 'b', alertes_pd: ['ACB-3'] }),
    ]);
    expect(r.severity).toBe('red');
    expect(r.total).toBe(6);
  });

  it('ambre si score ≥ 3', () => {
    const r = scoreAcb([
      mockMolecule({ id: 'a', alertes_pd: ['ACB-2'] }),
      mockMolecule({ id: 'b', alertes_pd: ['ACB-1'] }),
    ]);
    expect(r.severity).toBe('amber');
    expect(r.total).toBe(3);
  });
});

describe('scoreSeuilEp', () => {
  it('détecte au moins un contributeur', () => {
    const r = scoreSeuilEp([mockMolecule({ id: 'a', alertes_pd: ['seuil-ep'] })]);
    expect(r.contributors.length).toBeGreaterThan(0);
  });
});

describe('detectPkPairs', () => {
  it('détecte une paire substrat × inhibiteur (CYP3A4)', () => {
    const subst = mockMolecule({
      id: 'subst', nom_dci: 'Méthadone',
      phase1_cyp: [{ isoforme: 'CYP3A4', rang: 'majeur', produit: 'EDDP', preuve: 'IVH-C', source: 'PMID:12345678' }],
    });
    const inhib = mockMolecule({
      id: 'inhib', nom_dci: 'Clarithromycine',
      inhibiteur: [{ cible: 'CYP3A4', puissance: 'fort', mecanisme: 'MBI', preuve: 'IVH-C', source: 'CBIP:interactions_chap1_2024' }],
    });
    const pairs = detectPkPairs([subst, inhib]);
    expect(pairs.length).toBeGreaterThan(0);
  });
});
