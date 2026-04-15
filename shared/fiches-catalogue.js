/**
 * Catalogue des fiches traitements patients
 * Utilisé par l'admin (checklist) et le patient (affichage)
 */
window.FICHES_CATALOGUE = [
  // ── Sevrage / Maintien ──
  { slug: 'aotal', nom: 'Acamprosate (Aotal)', categorie: 'Sevrage / Maintien' },
  { slug: 'baclofene', nom: 'Baclof\u00e8ne', categorie: 'Sevrage / Maintien' },
  { slug: 'nalmefene', nom: 'Nalm\u00e9f\u00e8ne (Selincro)', categorie: 'Sevrage / Maintien' },
  { slug: 'naltrexone', nom: 'Naltrexone (Revia)', categorie: 'Sevrage / Maintien' },
  { slug: 'topiramate', nom: 'Topiramate (Epitomax)', categorie: 'Sevrage / Maintien' },
  { slug: 'nac', nom: 'N-Ac\u00e9tylcyst\u00e9ine (NAC)', categorie: 'Sevrage / Maintien' },
  // ── TSO (Traitements de Substitution) ──
  { slug: 'buprenorphine', nom: 'Bupr\u00e9norphine (Subutex)', categorie: 'TSO' },
  { slug: 'methadone', nom: 'M\u00e9thadone', categorie: 'TSO' },
  { slug: 'naloxone', nom: 'Naloxone (kit d\u2019urgence)', categorie: 'TSO' },
  // ── Benzodiazépines ──
  { slug: 'valium', nom: 'Diaz\u00e9pam (Valium)', categorie: 'Benzodiaz\u00e9pines' },
  { slug: 'seresta', nom: 'Oxaz\u00e9pam (S\u00e9resta)', categorie: 'Benzodiaz\u00e9pines' },
  { slug: 'prazepam', nom: 'Praz\u00e9pam (Lysanxia)', categorie: 'Benzodiaz\u00e9pines' },
  // ── Psychotropes ──
  { slug: 'sertraline', nom: 'Sertraline (Zoloft)', categorie: 'Psychotropes' },
  { slug: 'venlafaxine', nom: 'Venlafaxine (Effexor)', categorie: 'Psychotropes' },
  { slug: 'vortioxetine', nom: 'Vortioxetine (Brintellix)', categorie: 'Psychotropes' },
  { slug: 'methylphenidate', nom: 'M\u00e9thylph\u00e9nidate (Ritaline)', categorie: 'Psychotropes' },
  { slug: 'aripiprazole', nom: 'Aripiprazole (Abilify)', categorie: 'Psychotropes' },
  // ── Hypnotiques / Sédatifs ──
  { slug: 'theralene', nom: 'Alim\u00e9mazine (Th\u00e9ral\u00e8ne)', categorie: 'Hypnotiques / S\u00e9datifs' },
  { slug: 'tercian', nom: 'Cyam\u00e9mazine (Tercian)', categorie: 'Hypnotiques / S\u00e9datifs' },
  { slug: 'quviviq', nom: 'Daridorexant (Quviviq)', categorie: 'Hypnotiques / S\u00e9datifs' }
];
