import { describe, it, expect } from 'vitest'
import { pdAlertLabel, sourceToHref, severityClass } from '../src/utils/labels'

describe('pdAlertLabel', () => {
  it('mappe QT-KR vers "QTc — risque connu" (red)', () => {
    const r = pdAlertLabel('QT-KR')
    expect(r.label).toBe('QTc — risque connu')
    expect(r.severity).toBe('red')
  })

  it('mappe ACB-3 vers libellé clair (red)', () => {
    expect(pdAlertLabel('ACB-3').severity).toBe('red')
    expect(pdAlertLabel('ACB-3').label).toContain('forte')
  })

  it('retourne le code brut + neutral pour un code inconnu', () => {
    const r = pdAlertLabel('CODE_INCONNU_XYZ')
    expect(r.label).toBe('CODE_INCONNU_XYZ')
    expect(r.severity).toBe('neutral')
  })
})

describe('sourceToHref', () => {
  it('PMID → pubmed.ncbi.nlm.nih.gov', () => {
    expect(sourceToHref('PMID:12345678')).toBe('https://pubmed.ncbi.nlm.nih.gov/12345678/')
  })

  it('DOI → doi.org', () => {
    expect(sourceToHref('DOI:10.1016/j.xxx')).toBe('https://doi.org/10.1016/j.xxx')
  })

  it('CPIC:doi: → doi.org', () => {
    expect(sourceToHref('CPIC:doi:10.1002/cpt.1602')).toBe('https://doi.org/10.1002/cpt.1602')
  })

  it('HUG → pharmacoclin.ch', () => {
    expect(sourceToHref('HUG:carte_cytochromes_2020')).toBe('https://www.pharmacoclin.ch/')
  })

  it('CBIP → cbip.be (chapitre interactions)', () => {
    expect(sourceToHref('CBIP:interactions_chap1_2024')).toContain('cbip.be')
  })

  it('FDA / EMA / ANSM → null (pas d\'URL stable)', () => {
    expect(sourceToHref('FDA:Vivitrol_label_2023')).toBeNull()
    expect(sourceToHref('EMA:EPAR_xyz')).toBeNull()
    expect(sourceToHref('ANSM:RCP_xyz')).toBeNull()
  })
})

describe('severityClass', () => {
  it('mappe red → bg-red-600', () => {
    expect(severityClass('red')).toContain('red')
  })
  it('mappe amber → amber', () => {
    expect(severityClass('amber')).toContain('amber')
  })
})
