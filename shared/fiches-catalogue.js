/**
 * Catalogue des fiches traitements patients
 * Utilisé par l'admin (checklist) et le patient (affichage)
 */
window.FICHES_CATALOGUE = [
  // ── Sevrage / Maintien ──
  { slug: 'aotal', nom: 'Acamprosate (Aotal)', categorie: 'Sevrage / Maintien' },
  { slug: 'baclofene', nom: 'Baclofène', categorie: 'Sevrage / Maintien' },
  { slug: 'nalmefene', nom: 'Nalméfène (Selincro)', categorie: 'Sevrage / Maintien' },
  { slug: 'naltrexone', nom: 'Naltrexone (Revia)', categorie: 'Sevrage / Maintien' },
  { slug: 'topiramate', nom: 'Topiramate (Epitomax)', categorie: 'Sevrage / Maintien' },
  { slug: 'nac', nom: 'N-Acétylcystéine (NAC)', categorie: 'Sevrage / Maintien' },
  // ── TSO (Traitements de Substitution) ──
  { slug: 'buprenorphine', nom: 'Buprénorphine (Subutex)', categorie: 'TSO' },
  { slug: 'methadone', nom: 'Méthadone', categorie: 'TSO' },
  { slug: 'naloxone', nom: 'Naloxone (kit d’urgence)', categorie: 'TSO' },
  // ── Benzodiazépines ──
  { slug: 'alprazolam', nom: 'Alprazolam (Xanax)', categorie: 'Benzodiazépines' },
  { slug: 'bromazepam', nom: 'Bromazépam (Lexomil)', categorie: 'Benzodiazépines' },
  { slug: 'valium', nom: 'Diazépam (Valium)', categorie: 'Benzodiazépines' },
  { slug: 'seresta', nom: 'Oxazépam (Séresta)', categorie: 'Benzodiazépines' },
  { slug: 'prazepam', nom: 'Prazépam (Lysanxia)', categorie: 'Benzodiazépines' },
  // ── Psychotropes ──
  { slug: 'agomelatine', nom: 'Agomélatine (Valdoxan)', categorie: 'Psychotropes' },
  { slug: 'aripiprazole', nom: 'Aripiprazole (Abilify)', categorie: 'Psychotropes' },
  { slug: 'lamotrigine', nom: 'Lamotrigine (Lamictal)', categorie: 'Psychotropes' },
  { slug: 'lithium', nom: 'Lithium (Téralithe)', categorie: 'Psychotropes' },
  { slug: 'methylphenidate', nom: 'Méthylphénidate (Ritaline)', categorie: 'Psychotropes' },
  { slug: 'propranolol', nom: 'Propranolol (Avlocardyl)', categorie: 'Psychotropes' },
  { slug: 'quetiapine', nom: 'Quétiapine (Xeroquel)', categorie: 'Psychotropes' },
  { slug: 'sertraline', nom: 'Sertraline (Zoloft)', categorie: 'Psychotropes' },
  { slug: 'venlafaxine', nom: 'Venlafaxine (Effexor)', categorie: 'Psychotropes' },
  { slug: 'vortioxetine', nom: 'Vortioxetine (Brintellix)', categorie: 'Psychotropes' },
  // ── Hypnotiques / Sédatifs ──
  { slug: 'theralene', nom: 'Alimémazine (Théralène)', categorie: 'Hypnotiques / Sédatifs' },
  { slug: 'tercian', nom: 'Cyamémazine (Tercian)', categorie: 'Hypnotiques / Sédatifs' },
  { slug: 'quviviq', nom: 'Daridorexant (Quviviq)', categorie: 'Hypnotiques / Sédatifs' },
  { slug: 'atarax', nom: 'Hydroxyzine (Atarax)', categorie: 'Hypnotiques / Sédatifs' },
  { slug: 'zopiclone', nom: 'Zopiclone (Imovane)', categorie: 'Hypnotiques / Sédatifs' }
];
