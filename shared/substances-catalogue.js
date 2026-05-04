/**
 * Catalogue des fiches substances poussées au patient.
 *
 * - `slug` correspond au nom de fichier `fiches-substances/fiche_<slug>_patient.html`
 * - `nom` est le libellé affiché (UI patient + admin + toolbox)
 * - `categorie` est utilisé côté admin (checklist groupée) et toolbox (accordions).
 *   Côté patient, on affiche une liste plate triée alphabétiquement.
 *
 * Catégories cliniques (ordre stable pour l'UI) :
 *   1. Dépresseurs du SNC
 *   2. Stimulants
 *   3. Opioïdes
 *   4. Psychodysleptiques
 *   5. Mésusage médicamenteux
 *   6. Tabac
 */
window.SUBSTANCES_CATALOGUE = [
  // ── Dépresseurs du SNC ──
  { slug: 'alcool', nom: 'Alcool', categorie: 'Dépresseurs du SNC' },
  { slug: 'ghb', nom: 'GHB / GBL', categorie: 'Dépresseurs du SNC' },
  // ── Stimulants ──
  { slug: '3mmc', nom: '3-MMC / Cathinones', categorie: 'Stimulants' },
  { slug: 'cocaine', nom: 'Cocaïne', categorie: 'Stimulants' },
  { slug: 'crack', nom: 'Crack', categorie: 'Stimulants' },
  { slug: 'mdma', nom: 'MDMA / Ecstasy', categorie: 'Stimulants' },
  { slug: 'methamphetamine', nom: 'Méthamphétamine', categorie: 'Stimulants' },
  // ── Opioïdes ──
  { slug: 'heroine', nom: 'Héroïne', categorie: 'Opioïdes' },
  { slug: 'opioides_prescription', nom: 'Opioïdes de prescription', categorie: 'Opioïdes' },
  // ── Psychodysleptiques ──
  { slug: 'cannabis', nom: 'Cannabis', categorie: 'Psychodysleptiques' },
  { slug: 'ketamine', nom: 'Kétamine', categorie: 'Psychodysleptiques' },
  { slug: 'lsd', nom: 'LSD', categorie: 'Psychodysleptiques' },
  { slug: 'psilocybine', nom: 'Psilocybine', categorie: 'Psychodysleptiques' },
  // ── Mésusage médicamenteux ──
  { slug: 'bzd_mesusage', nom: 'Benzodiazépines (mésusage)', categorie: 'Mésusage médicamenteux' },
  { slug: 'protoxyde', nom: 'Protoxyde d’azote (N₂O)', categorie: 'Mésusage médicamenteux' },
  // ── Tabac ──
  { slug: 'tabac', nom: 'Tabac / Nicotine', categorie: 'Tabac' }
];
