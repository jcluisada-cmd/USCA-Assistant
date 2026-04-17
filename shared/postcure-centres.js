/**
 * USCA Connect — Liste partagée des centres de post-cure
 * Utilisée par le module post-cure (dossier d'admission) et par le dashboard admin
 * (sélection de destination lors de la sortie).
 *
 * Source de vérité : copie synchronisée avec module_post-cure/index.html (STRUCTS).
 * Si tu modifies cette liste, pense à mettre à jour l'autre.
 */
window.POSTCURE_CENTRES = {
  epinettes:    { nom: "Clinique des Épinettes",           ville: "Paris 17ème" },
  montevideo:   { nom: "Clinique Montevideo",              ville: "Clamart (92)" },
  abbaye:       { nom: "Clinique l'Abbaye",                ville: "Viry-Châtillon (91)" },
  gilbert_raby: { nom: "Centre Gilbert Raby",              ville: "Meulan (78)" },
  concorde:     { nom: "Clinique La Concorde",             ville: "Alfortville (94)" },
  calme:        { nom: "C.A.L.M.E. Illiers-Combray",       ville: "Illiers-Combray (28)" },
  mgen:         { nom: "MGEN La Verrière",                 ville: "Le Mesnil-Saint-Denis (78)" },
  villebouzin:  { nom: "Clinique du Château de Villebouzin", ville: "Longpont-sur-Orge (91)" },
  manhes:       { nom: "CH F.H. Manhès",                   ville: "Fleury-Mérogis (91)" },
  platanes:     { nom: "Clinique des Platanes",            ville: "Épinay-sur-Seine (93)" },
  heloise:      { nom: "Clinique la Nouvelle Héloïse",     ville: "Montmorency (95)" },
  belair:       { nom: "Clinique Château du Bel-Air",      ville: "Crosne (91)" },
  pages:        { nom: "Clinique Villa Des Pages",         ville: "Le Vésinet (78)" },
  parc:         { nom: "Clinique Médicale du Parc",        ville: "Saint-Ouen-l'Aumône (95)" }
};
