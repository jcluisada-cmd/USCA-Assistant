import { describe, it, expect } from 'vitest';
import { ALL_MOLECULES, MOLECULES_BY_ID } from '../src/data';

describe('Base de données molécules', () => {
  it('charge un nombre attendu de molécules (sentinelle)', () => {
    // Plage post-intégration sessions 6-13 (147 molécules sur 13 fichiers).
    // Ajuster les bornes si la base évolue significativement.
    expect(ALL_MOLECULES.length).toBeGreaterThanOrEqual(140);
    expect(ALL_MOLECULES.length).toBeLessThanOrEqual(160);
  });

  it('garantit l\'unicité globale des id', () => {
    const ids = ALL_MOLECULES.map(m => m.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('expose un index par id complet', () => {
    for (const m of ALL_MOLECULES) {
      expect(MOLECULES_BY_ID.get(m.id)).toBe(m);
    }
  });

  it('garantit que interactions_specifiques n\'est jamais vide', () => {
    for (const m of ALL_MOLECULES) {
      expect(m.interactions_specifiques.length, `${m.id} a interactions vides`).toBeGreaterThan(0);
    }
  });

  it('rejette ND dans sources_principales', () => {
    for (const m of ALL_MOLECULES) {
      expect(m.sources_principales, `${m.id} sources principales`).not.toContain('ND');
    }
  });

  it('valide le format YYYY-MM de derniere_maj', () => {
    for (const m of ALL_MOLECULES) {
      expect(m.derniere_maj, `${m.id}`).toMatch(/^\d{4}-\d{2}$/);
    }
  });
});
