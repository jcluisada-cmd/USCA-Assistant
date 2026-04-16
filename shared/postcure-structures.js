/**
 * USCA Connect — Structures de post-cure & données partagées
 * Utilisé par postcure/patient.html et postcure/medecin.html
 */

window.POSTCURE_SUBS = ['Alcool','Tabac','Cannabis','Cocaïne','NPS / 3-MMC','Opiacés','BZD','GHB/GBL','Add. comportementales'];

window.POSTCURE_DEFAULT_ENGAGEMENT = "En tant que patient admis dans cet établissement, je m'engage à respecter le règlement intérieur, à ne pas introduire ni consommer de substances psychoactives (alcool, drogues, médicaments non prescrits), à participer activement aux activités thérapeutiques, et à respecter les autres patients et le personnel soignant.\n\nJe prends acte que le non-respect de ces engagements pourra entraîner une sortie anticipée.";

window.POSTCURE_STRUCTS = {
  epinettes: {
    nom: "Clinique des Épinettes",
    email: "contact@cliniquedesepinettes.com",
    ville: "Paris 17ème",
    tel: "01 84 82 42 42",
    fax: "01 84 82 42 43",
    engagement: "J'ai été informé(e) par le personnel soignant médical et paramédical que la postcure pour un trouble lié à une substance ou un comportement est une étape importante dans le maintien de l'abstinence, la prévention de la rechute et la réadaptation vers une vie autonome.\n\nDans ce sens, dès l'arrivée dans cet établissement et pour toute la durée de mon séjour, je m'engage :\n\n• à ne pas apporter avec moi ou introduire de substances psychoactives (alcool, cannabis, cocaïne, opiacés, poppers, CBD…) dans l'établissement\n• à ne pas consommer quelconques de ces substances ou de médicaments en dehors de ceux qui me seront prescrits\n• à me soumettre à des contrôles inopinés de jour comme de nuit et à respecter le règlement intérieur\n• à ne pas sortir en permission thérapeutique lors du premier week-end d'hospitalisation\n• à m'investir et suivre l'ensemble des activités thérapeutiques définies dans le projet de soins\n• à manifester de la tolérance pour les autres patients en respectant leurs vulnérabilités\n• à respecter le travail de tout le personnel de l'établissement (médical, paramédical, administratif)\n\nJe prends acte que le non-respect d'un seul de ces points pourrait avoir comme conséquence l'interruption de ma postcure et l'exclusion de l'établissement.\n\n⚠ Si vous êtes contrôlé positif à votre arrivée, vous ne serez pas admis en séjour.",
    checklist: ["Dossier complété en intégralité","Volet médical rempli par le médecin","Lettre de motivation du patient","CRH + bilan biologique < 2 mois","Attestation SS + attestation mutuelle (recto-verso)","Carte d'identité / passeport / carte de séjour","Caution 100€ (espèces ou chèque)"]
  },
  montevideo: {
    nom: "Clinique Montevideo",
    email: "admission.montevideo@orpea.net",
    ville: "Clamart (92)",
    tel: "01 41 22 98 88",
    fax: "01 41 22 98 80",
    engagement: "Dans le cadre de votre hospitalisation librement consentie au sein de l'Institut Médical Spécialisé Montevideo, vous avez accepté le contrat de soin avec l'équipe médicale lors de votre admission. Le non-respect de ces engagements peut mettre en péril votre hospitalisation voire donner lieu à des poursuites judiciaires. À ce titre, vous vous engagez :\n\n1 – Respecter votre engagement aux soins.\n2 – Remettre médicaments, boissons alcoolisées et produits toxiques en votre possession lors de votre entrée. Il en est de même lors de vos retours de sorties thérapeutiques.\n3 – Ne pas vous procurer, ni introduire, tout produit prohibé durant votre séjour (directement ou par l'intermédiaire de tiers). L'équipe médicale peut être amenée à effectuer la vérification de vos effets personnels.\n4 – Accepter le cadre des autorisations de sorties thérapeutiques. Différents contrôles alcool et toxiques sont effectués par les soignants à votre retour.\n5 – Respecter le repos et l'intimité de chacun. Votre chambre est un espace personnel, aucun rassemblement n'y est autorisé.\n6 – Ne pas conduire un véhicule lors de vos sorties thérapeutiques, et ne pas consommer d'alcool ou drogues.\n7 – Déposer vos objets de valeur dans le coffre mis à votre disposition.\n8 – La détention d'objets et appareils dangereux (bougies, appareils électriques, couteaux, ciseaux etc.) n'est pas autorisée.\n9 – Ne pas réaliser de transactions commerciales, de commerces de drogues ou de collectes d'argents.\n10 – Il est strictement interdit d'enregistrer, de photographier et filmer dans l'établissement.\n11 – Adopter une attitude et une tenue vestimentaire correctes.\n12 – Ne pas introduire de nourriture périssable.\n13 – Respecter l'espace fumeur : interdit de fumer dans les chambres et locaux communs, y compris cigarettes électroniques.\n14 – Le jardin est accessible de 7h à 22h. Les appareils à musique n'y sont pas autorisés.\n15 – Regagner votre chambre à 23h au plus tard.\n16 – Respecter les horaires (repas, traitements, soins, ateliers).\n\n⚠ Le non-respect peut conduire à une interruption de l'hospitalisation signifiée par le corps médical en accord avec la Direction.",
    checklist: ["Dossier rempli par le médecin adresseur","Dernière ordonnance (fax ou mail)","Pièce d'identité","Carte vitale + mutuelle"]
  },
  abbaye: {
    nom: "Clinique l'Abbaye",
    email: "admission.abbaye@emeis.com",
    ville: "Viry-Châtillon (91)",
    tel: "01 69 12 64 42",
    fax: "01 69 12 64 44",
    engagement: "",
    checklist: ["Dossier rempli par le médecin adresseur","Dernière ordonnance","Pièce d'identité","Carte vitale + mutuelle"]
  },
  gilbert_raby: {
    nom: "Centre Gilbert Raby",
    email: "secretariat-medical.cgr@elan-retrouve.org",
    ville: "Meulan (78)",
    tel: "01 30 99 96 25",
    fax: "01 30 22 08 53",
    engagement: "RÈGLEMENT INTÉRIEUR — RESPECT DES MODALITÉS DE SÉJOUR\n\n1. L'introduction et/ou la consommation de boissons alcoolisées, cannabis, CBD, Poppers, protoxyde d'azote, médicaments sans prescription, ou tout autre produit illicite sont interdits dans l'établissement. Une recherche d'alcoolémie ou de toxique peut être effectuée à tout moment. Vos affaires peuvent être vérifiées avec votre accord et en votre présence. Les produits interdits seront saisis sans possibilité de récupération.\n\n2. Les horaires des activités thérapeutiques doivent être respectés ainsi que les horaires de la prise des médicaments, la présence aux consultations, aux réunions et aux divers rendez-vous.\n\n3. Pour le bon fonctionnement de la vie en collectivité, veillez à la tranquillité des lieux, aux horaires de coucher, à votre hygiène corporelle, à la décence de votre tenue et au respect des locaux. Votre chambre doit être rangée et aérée.\n\n4. Toute sortie thérapeutique nécessite une autorisation médicale et administrative. Si vous souhaitez annuler une sortie ou avancer votre retour, merci d'en informer l'infirmier du service.\n\n5. Votre comportement ne doit pas compromettre l'objectif de votre séjour. Les relations de couple sont déconseillées. Les jeux d'argent ou transactions sont interdits. Toute manifestation de violence ou d'agressivité est susceptible d'entraîner l'interruption de votre séjour.\n\n6. Les visiteurs doivent s'annoncer au personnel infirmier. Les visites d'enfants mineurs ne sont pas autorisées sauf exceptionnellement après une semaine d'hospitalisation, dans un espace dédié sur réservation.\n\n7. Veillez au respect du matériel ; les dégradations volontaires seront à votre charge.\n\n8. Il est strictement interdit de déverrouiller le système de sécurité des fenêtres.\n\n9. Il est interdit de changer la disposition des équipements dans les chambres.\n\n10. Vous vous engagez à ne pas introduire d'objets pouvant servir d'armes (objets coupants, tranchants ou pointus). Ils seront confisqués.\n\n11. Vous vous engagez à respecter les consignes de sécurité affichées dans votre chambre.\n\n12. Nous vous conseillons de ne pas conduire de véhicule pendant la durée de votre hospitalisation.\n\n13. Le Centre Gilbert Raby est un établissement sans tabac : il est strictement interdit de fumer et de vapoter dans tous les bâtiments et les espaces non-fumeurs. Le non-respect vous expose à une interruption de séjour.\n\n14. Des activités artistiques, culturelles et sportives vous seront proposées. L'accès aux agrès est interdit pendant la première semaine d'hospitalisation et en cas de contre-indication médicale.\n\n15. La réception de colis n'est pas autorisée.\n\n16. La présence des animaux n'est pas autorisée dans l'établissement, sauf dans le cadre de la médiation animale en HDJ.\n\n17. Le non-respect d'une des clauses de ce règlement vous expose à une interruption de votre séjour.\n\nJe déclare avoir pris connaissance du règlement de mon séjour au Centre Gilbert Raby et m'engage à le respecter en totalité.",
    checklist: ["Lettre de motivation","Photocopie recto-verso pièce d'identité","Attestation de droits SS à jour","Carte mutuelle recto-verso ou attestation CSS","Fiche personne de confiance remplie","Règlement intérieur signé","Dernière prescription + bilan biologique récent","Copies bilans imagerie (écho hépatique, ECG…) si disponibles"]
  },
  concorde: {
    nom: "Clinique La Concorde",
    email: "secmed-ssr.laconcorde@emeis.com",
    ville: "Alfortville (94)",
    tel: "01 45 18 28 28",
    fax: "01 45 18 28 31",
    engagement: "",
    checklist: ["CRH dernière hospitalisation","Résultats analyses biologiques","Dernière ordonnance","Pièce d'identité","Attestation SS + mutuelle"]
  },
  calme: {
    nom: "C.A.L.M.E. Illiers-Combray",
    email: "",
    ville: "Illiers-Combray (28)",
    tel: "02 37 91 63 33",
    fax: "02 37 91 63 34",
    engagement: "",
    checklist: ["Bilan biologique complet (NFS, plaquettes, transaminases, bilirubine, TP, albumine, iono, calcémie, créatinine, clearance, glycémie, EAL, PAL, lipase)","Copie dernière ordonnance","CRH + comptes rendus antérieurs","Fiche de pré-inscription remplie","Photocopie carte mutuelle / CMU","Attestation SS < 3 mois","Photocopie carte d'identité","Fiche personne de confiance signée","Chèque de caution 985,05€ à l'ordre du CALME","Appeler le vendredi matin pour confirmer (02 37 91 63 33)"]
  },
  mgen: { nom: "MGEN La Verrière", email: "", ville: "Le Mesnil-Saint-Denis (78)", tel: "01 39 38 77 66", engagement: "", checklist: [] },
  villebouzin: { nom: "Clinique du Château de Villebouzin", email: "admissions.villebouzin@emeis.com", ville: "Longpont-sur-Orge (91)", tel: "01 69 63 28 90", engagement: "", checklist: [] },
  manhes: { nom: "CH F.H. Manhès", email: "maria.vieira@ch-manhes.fr", ville: "Fleury-Mérogis (91)", tel: "01 69 25 67 07", engagement: "", checklist: [] },
  "4villes": { nom: "CH des Quatre Villes", email: "sec.ssraddicto@ch4v.fr", ville: "Saint-Cloud (92)", tel: "01 77 70 79 52", engagement: "", checklist: [] },
  platanes: { nom: "Clinique des Platanes", email: "s.carvalho@ramsaygds.fr", ville: "Épinay-sur-Seine (93)", tel: "01 49 21 89 05", engagement: "", checklist: [] },
  heloise: { nom: "Clinique la Nouvelle Héloïse", email: "admissions.nouvelleheloise@emeis.com", ville: "Montmorency (95)", tel: "01 39 36 01 05", engagement: "", checklist: [] },
  belair: { nom: "Clinique Château du Bel-Air", email: "facturation.belair@orpea.net", ville: "Crosne (91)", tel: "01 69 49 11 00", engagement: "", checklist: [] },
  pages: { nom: "Clinique Villa Des Pages", email: "", ville: "Le Vésinet (78)", tel: "01 30 15 96 96", engagement: "", checklist: [] },
  parc: { nom: "Clinique Médicale du Parc", email: "contact@cdp95.fr", ville: "Saint-Ouen-l'Aumône (95)", tel: "01 34 40 41 41", engagement: "", checklist: [] }
};
