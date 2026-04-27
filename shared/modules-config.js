// shared/modules-config.js
// Source de vérité de l'inventaire des modules masquables P5.
// Ajouter ici un module = il apparaît dans la matrix Comptes et l'edit mode,
// visible par défaut pour tous les rôles (absence de ligne BDD = visible).

window.MODULES_CONFIG = [
  // Onglets (bottom nav admin)
  { id: 'tab_toolbox',                label: 'Onglet Toolbox',                  strate: 'Onglets'   },
  { id: 'tab_planning',               label: 'Onglet Planning',                 strate: 'Onglets'   },

  // Dashboard (vue Patients)
  { id: 'dashboard_entrees_sorties',  label: 'Sorties prévues + liste attente', strate: 'Dashboard' },
  { id: 'dashboard_patients_list',    label: 'Liste chambres + détail patient', strate: 'Dashboard' },
  { id: 'dashboard_mes_eleves',       label: 'Mes élèves / Mon externe',        strate: 'Dashboard' },

  // Détail patient (boutons et accordions)
  { id: 'patient_craving',            label: 'Journal craving',                 strate: 'Patient'   },
  { id: 'patient_fiches',             label: 'Fiches traitements',              strate: 'Patient'   },
  { id: 'patient_permissions',        label: 'Permissions',                     strate: 'Patient'   },
  { id: 'patient_messages',           label: 'Messages patient/équipe',         strate: 'Patient'   },
  { id: 'patient_evenements',         label: 'Planifier un événement',          strate: 'Patient'   },
  { id: 'patient_sortie',             label: 'Annoncer sortie + exports',       strate: 'Patient'   },
  { id: 'patient_postcure',           label: 'Dossier post-cure',               strate: 'Patient'   },

  // Toolbox (cartes d'accueil JSX)
  { id: 'toolbox_protocoles',         label: 'Protocoles USCA (hub)',           strate: 'Toolbox'   },
  { id: 'toolbox_elsa',               label: 'ELSA (hub)',                      strate: 'Toolbox'   },
  { id: 'toolbox_postcure',           label: 'Dossier post-cure',               strate: 'Toolbox'   },
  { id: 'toolbox_traitements',        label: 'Fiches patient + expert',         strate: 'Toolbox'   },
  { id: 'toolbox_scores',             label: 'Scores + convertisseurs',         strate: 'Toolbox'   },
  { id: 'toolbox_interactions',       label: 'Interactions',                    strate: 'Toolbox'   },
];

window.MODULES_ROLES = ['medecin', 'ide', 'psychologue', 'pharmacien', 'secretaire'];

// Labels FR pour l'UI (utilisés dans popover edit mode + matrix Comptes)
window.MODULES_ROLE_LABELS = {
  medecin:     'Médecin',
  ide:         'IDE',
  psychologue: 'Psychologue',
  pharmacien:  'Pharmacien',
  secretaire:  'Secrétaire',
};
