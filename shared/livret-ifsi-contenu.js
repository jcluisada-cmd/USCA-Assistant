/**
 * USCA Connect — Contenu pédagogique Livret IFSI
 * Chargé par etudiant/index.html (P1-B) et staff/toolbox.html (mode preview, P1-C)
 *
 * ⚠ NOTES IMPORTANTES
 * - Les items marqués "À rédiger" / "À compléter" doivent être complétés par l'équipe médicale.
 *   L'UI affichera un badge ambre "Contenu à valider" pour ces items.
 * - Les chemins PDF `/mnt/project/...` sont issus du document d'implémentation initial
 *   et doivent être remplacés par des URLs réelles (ex. `/fiches-traitements/xxx.pdf`)
 *   ou mis à null si le PDF n'est pas encore hébergé.
 * - Le contenu doit être validé par JC avant publication.
 */

const LIVRET_IFSI = {
  meta: {
    version: "1.0",
    derniere_maj: "2026-04-17",
    redige_par: "Équipe USCA/ELSA"
  },

  presentation: {
    service: "ELSA — Équipe de Liaison et de Soins en Addictologie. USCA — Unité de Soins Complexes en Addictologie (8 lits de sevrage programmé de 12 jours).",
    localisation: "3e étage, bâtiment La Force — Pitié-Salpêtrière",
    equipe: [],
    activites: []
  },

  lexique: [
    { id: "elsa",   acronyme: "ELSA",       definition: "Équipe de Liaison et de Soins en Addictologie", contexte: "Unité hospitalière dédiée à l'accompagnement addictologique des patients hospitalisés dans tous les services de l'hôpital. Concept issu de la circulaire DHOS 2008.", lien_toolbox: "/staff/toolbox.html#elsa-accueil" },
    { id: "usca",   acronyme: "USCA",       definition: "Unité de Soins Complexes en Addictologie", contexte: "À la Pitié-Salpêtrière : 8 lits de sevrage programmé de 12 jours, en chambres doubles majoritairement.", lien_toolbox: null },
    { id: "csapa",  acronyme: "CSAPA",      definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "caarud", acronyme: "CAARUD",     definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "cjc",    acronyme: "CJC",        definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "oh",     acronyme: "OH",         definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "aa",     acronyme: "AA",         definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "rdr",    acronyme: "RDR / RdRD", definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "tso",    acronyme: "TSO",        definition: "À compléter", contexte: "À compléter", lien_toolbox: "/staff/toolbox.html#tso" },
    { id: "thc",    acronyme: "THC",        definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "cbd",    acronyme: "CBD",        definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "ghb",    acronyme: "GHB",        definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "slam",   acronyme: "SLAM",       definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "ptsd",   acronyme: "PTSD / TSPT",definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "cpoa",   acronyme: "CPOA",       definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "ts",     acronyme: "TS",         definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "cmp",    acronyme: "CMP / CMPP", definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "tdah",   acronyme: "TDAH",       definition: "À compléter", contexte: "À compléter", lien_toolbox: "/staff/toolbox.html#tdah" },
    { id: "aspdt",  acronyme: "ASPDT",      definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "aah",    acronyme: "AAH",        definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "ald",    acronyme: "ALD",        definition: "À compléter", contexte: "À compléter", lien_toolbox: null }
  ],

  chapitres: [
    // ══════════════ ALCOOL ══════════════
    {
      id: "alcool",
      titre: "Alcool",
      icone: "🍷",
      sections: [
        {
          titre: "Équivalences et seuils",
          questions: [
            { id: "alcool_verre_gr", type: "fill_in", enonce: "1 verre standard d'alcool = ? g d'alcool pur", reponse_attendue: "10 g", mots_cles: ["10","dix"], explication: "Le verre standard OMS contient 10 g d'alcool pur. Cela correspond à 25 cl de bière à 5°, 10 cl de vin à 12°, 3 cl d'alcool fort à 40°.", reference: { label: "HAS 2021 — Repérage TUS", path: null } },
            { id: "alcool_limite_conduite", type: "fill_in", enonce: "Limite légale d'alcoolémie au volant (permis normal) : ? g/L de sang", reponse_attendue: "0,5 g/L", mots_cles: ["0.5","0,5"], explication: "0,5 g/L sang = 0,25 mg/L air expiré. Pour les jeunes conducteurs (permis < 3 ans) et les transports en commun : 0,2 g/L.", reference: null },
            { id: "alcool_air_expire", type: "qcm_single", enonce: "0,5 g/L de sang équivaut à quelle valeur à l'éthylotest (air expiré) ?", choix: [{id:"a",label:"0,25 mg/L"},{id:"b",label:"0,50 mg/L"},{id:"c",label:"1 mg/L"}], reponse_attendue: "a", explication: "Le rapport est de 1 à 2000 environ : 1 g/L sang ≈ 0,5 mg/L air expiré.", reference: null },
            { id: "alcool_verres_equivalents", type: "qcm_single", enonce: "0,5 g/L de sang correspond approximativement à combien de verres standards chez un adulte moyen ?", choix: [{id:"a",label:"Un"},{id:"b",label:"Deux"},{id:"c",label:"Quatre"}], reponse_attendue: "b", explication: "Deux verres standards chez un homme de 70 kg à jeun. Variable selon poids, sexe, alimentation.", reference: null },
            { id: "alcool_elimination", type: "fill_in", enonce: "Vitesse d'élimination de l'alcool : ? g/L par heure", reponse_attendue: "0,10 à 0,15 g/L/h", mots_cles: ["0,1","0.1","0,15","0.15"], explication: "Élimination hépatique linéaire (cinétique d'ordre zéro au-delà d'un certain seuil), environ 0,10-0,15 g/L/h. Non accéléré par le café, la douche ou l'exercice.", reference: null },
            { id: "alcool_oms_limites", type: "qcm_single", enonce: "Repères de consommation à moindre risque (Santé publique France, 2017)", choix: [{id:"a",label:"2 verres/jour maximum"},{id:"b",label:"Pas plus de 10 verres/semaine, pas plus de 2 verres/jour, 2 jours sans alcool/semaine"},{id:"c",label:"4 verres/jour maximum"}], reponse_attendue: "b", explication: "Les repères français (2017) retiennent un double plafond : 10/semaine ET 2/jour, avec des jours sans. Il n'y a pas de seuil de consommation « sans risque ».", reference: null },
            { id: "alcool_equiv_biere", type: "fill_in", enonce: "3 bières de 33 cl à 5° = ? verres standards", reponse_attendue: "3 verres", mots_cles: ["3","trois"], explication: "33 cl à 5° ≈ 13 g d'alcool ≈ 1,3 verre standard.", reference: null },
            { id: "alcool_equiv_vin", type: "fill_in", enonce: "75 cl de vin rouge à 12° = ? verres standards", reponse_attendue: "7 à 8 verres", mots_cles: ["7","8","sept","huit"], explication: "Une bouteille de vin à 12° contient environ 72 g d'alcool pur = 7 à 8 verres standards.", reference: null },
            { id: "alcool_equiv_cidre", type: "fill_in", enonce: "25 cl de cidre à 5° = ? verres standards", reponse_attendue: "1 verre", mots_cles: ["1","un"], explication: null, reference: null },
            { id: "alcool_equiv_aperitif", type: "fill_in", enonce: "75 cl d'un apéritif à 18° = ? verres standards", reponse_attendue: "11 verres", mots_cles: ["11","onze"], explication: null, reference: null }
          ]
        },
        {
          titre: "Complications de la consommation chronique",
          questions: [
            { id: "alcool_neuro_reversible", type: "texte_libre", enonce: "Troubles neurologiques réversibles liés à l'alcool : nom(s) et signes", reponse_attendue: "Encéphalopathie de Gayet-Wernicke (réversible si traitée précocement par vitamine B1 IV) : triade confusion + ophtalmoplégie + ataxie. Polynévrite alcoolique sensitivomotrice des membres inférieurs. Partiellement réversibles avec abstinence + vitaminothérapie.", explication: "Point clé USCA : toute suspicion de Gayet-Wernicke → vitamine B1 IV 500 mg x 3/jour avant toute perfusion glucosée. Le glucose peut précipiter l'encéphalopathie en épuisant les réserves de B1.", reference: { label: "Référentiel USCA 2.2", path: null } },
            { id: "alcool_neuro_irreversible", type: "texte_libre", enonce: "Troubles neurologiques irréversibles liés à l'alcool : nom(s) et signes", reponse_attendue: "Syndrome de Korsakoff : amnésie antérograde massive, fabulations, fausses reconnaissances, désorientation temporo-spatiale. Conséquence d'un Gayet-Wernicke non ou mal traité. Atteinte des corps mamillaires (IRM). Encéphalopathie hépatique chronique possible.", explication: "Le Korsakoff est la séquelle du Gayet-Wernicke non traité. D'où l'impératif de prévention systématique par B1 chez tout patient alcoolodépendant en sevrage.", reference: null },
            { id: "alcool_complications_autres", type: "table_fill", enonce: "Autres complications de l'alcoolisme chronique — compléter chaque ligne", colonnes: ["Organe","Complications"], lignes: [
              { id: "neuro",   cellules: ["Neurologique",""],           reponse_attendue: "Atrophie cérébelleuse, neuropathie périphérique, épilepsie de sevrage, démence alcoolique" },
              { id: "orl",     cellules: ["ORL",""],                    reponse_attendue: "Cancers des VADS (bouche, pharynx, larynx, œsophage) — potentialisés par le tabac" },
              { id: "hepato",  cellules: ["Hépatique",""],              reponse_attendue: "Stéatose, hépatite alcoolique aiguë, cirrhose, carcinome hépatocellulaire" },
              { id: "gastro",  cellules: ["Gastro-entérologique",""],   reponse_attendue: "Gastrite, pancréatite aiguë et chronique, œsophagite, varices œsophagiennes (si HTP), syndrome de Mallory-Weiss" }
            ], explication: "Liaison hépato = ~15 % de l'activité ELSA. Connaître ces complications est essentiel.", reference: null }
          ]
        },
        {
          titre: "Sevrage alcool",
          questions: [
            { id: "alcool_sevrage_complic1", type: "texte_libre", enonce: "Première complication du sevrage alcool brutal : nom et signes", reponse_attendue: "Crise comitiale de sevrage (convulsions tonico-cloniques généralisées) — survient typiquement dans les 6 à 48h après la dernière prise.", explication: null, reference: null },
            { id: "alcool_sevrage_complic2", type: "texte_libre", enonce: "Deuxième complication du sevrage alcool brutal : nom et signes", reponse_attendue: "Delirium tremens (DT) : confusion, agitation, hallucinations (zoopsies classiques), tremblements intenses, sueurs profuses, tachycardie, fièvre, déshydratation. Urgence vitale. Survient typiquement à J2-J4.", explication: null, reference: null },
            { id: "alcool_score_sevrage", type: "texte_libre", enonce: "Score d'évaluation de la gravité du sevrage : nom et principaux critères", reponse_attendue: "Score de Cushman (français) ou CIWA-Ar (international). Cushman : 7 items (pouls, PAS, FR, tremblements, sueurs, agitation, troubles sensoriels), cotés 0 à 3. Total 0-21. Seuil d'intervention BZD : ≥ 7.", explication: "À l'USCA, le score de Cushman est coté régulièrement pendant la phase aiguë du sevrage (J1-J4).", reference: { label: "Toolbox — Scores", path: "/staff/toolbox.html#cushman" } },
            { id: "alcool_sevrage_traitements", type: "texte_libre", enonce: "Traitements du sevrage alcoolique (au moins 3 éléments)", reponse_attendue: "1. Benzodiazépines (diazépam/Valium ou oxazépam/Séresta si insuffisance hépatique) en dose de charge puis décroissance. 2. Vitamine B1 (thiamine) 500 mg IV puis relais PO, prévention Gayet-Wernicke. 3. Hydratation (per os privilégiée). 4. Vitamines B6, PP. 5. Surveillance score Cushman, paramètres vitaux. 6. Magnésium si carence.", explication: "À l'USCA : diazépam en première intention, oxazépam si insuffisance hépatique (métabolisme glucuronoconjugué direct, pas de métabolite actif). Jamais de perfusion glucosée sans B1 préalable.", reference: { label: "Référentiel USCA 2.2 — protocole sevrage", path: null } }
          ]
        },
        {
          titre: "Maintien de l'abstinence / consommation contrôlée",
          questions: [
            { id: "alcool_tableau_traitements", type: "table_fill", enonce: "Traitements pour abstinence ou consommation contrôlée — compléter les indications", colonnes: ["Médicament","Indications","Mécanisme / particularités"], lignes: [
              { id: "aotal",     cellules: ["Aotal (acamprosate)","",""],      reponse_attendue: "Indication : maintien de l'abstinence après sevrage. Mécanisme : modulation glutamatergique. 2 cp x 3/jour. Bien toléré." },
              { id: "revia",     cellules: ["Révia (naltrexone)","",""],       reponse_attendue: "Indication : maintien de l'abstinence OU réduction de consommation. Mécanisme : antagoniste opioïde (diminue le renforcement). CI : traitement opioïde en cours. 50 mg/jour." },
              { id: "selincro",  cellules: ["Selincro (nalméfène)","",""],     reponse_attendue: "Indication : réduction de consommation chez patients à haut risque (>60 g/j H, >40 g/j F). Prise « à la demande » 1-2h avant exposition. Antagoniste μ + agoniste partiel κ." },
              { id: "esperal",   cellules: ["Esperal (disulfirame)","",""],    reponse_attendue: "Indication : maintien de l'abstinence (aversion). Mécanisme : inhibe l'acétaldéhyde déshydrogénase → effet antabuse si consommation. Nombreuses CI cardiovasculaires." },
              { id: "baclofene", cellules: ["Baclofène","",""],                reponse_attendue: "Indication : réduction de consommation / maintien abstinence (AMM depuis 2018). Mécanisme : agoniste GABA-B. Titration progressive. Dose max 80 mg/j (cadre AMM). Au-delà = hors AMM." }
            ], explication: "Le choix dépend de l'objectif (abstinence vs réduction), des comorbidités et des préférences du patient. Décision partagée.", reference: { label: "Toolbox — Fiches traitements", path: "/staff/toolbox.html#fiches" } }
          ]
        },
        {
          titre: "Étude de cas — alcool",
          questions: [
            { id: "alcool_cas_clinique", type: "texte_libre", enonce: "Décrire une situation clinique rencontrée (liaison, urgences ou USCA) et expliquer les différentes étapes de la prise en charge. Respecter l'anonymisation : pas de prénom, pas d'âge exact, pas de numéro de chambre.", reponse_attendue: null, explication: "Canevas attendu : (1) motif d'intervention, (2) évaluation initiale (consommation, ATCD, comorbidités), (3) score de Cushman / signes cliniques, (4) décision thérapeutique (sevrage, orientation…), (5) suivi et orientation.", reference: null }
          ]
        }
      ]
    },

    // ══════════════ TABAC ══════════════
    {
      id: "tabac",
      titre: "Tabac",
      icone: "🚬",
      sections: [
        {
          titre: "Dépendances au tabac",
          questions: [
            { id: "tabac_dep_physique", type: "texte_libre", enonce: "Dépendance physique au tabac : définition et signes", reponse_attendue: "À rédiger par l'équipe", explication: null, reference: null },
            { id: "tabac_dep_psy", type: "texte_libre", enonce: "Dépendance psychologique au tabac", reponse_attendue: "À rédiger", explication: null, reference: null },
            { id: "tabac_dep_comp", type: "texte_libre", enonce: "Dépendance comportementale au tabac", reponse_attendue: "À rédiger", explication: null, reference: null },
            { id: "tabac_test", type: "fill_in", enonce: "Test d'évaluation de la dépendance tabagique", reponse_attendue: "Test de Fagerström (6 items)", mots_cles: ["fagerström","fagerstrom"], explication: "Score 0-10. Dépendance forte ≥ 7.", reference: { label: "Toolbox — Scores", path: "/staff/toolbox.html#fagerstrom" } }
          ]
        },
        {
          titre: "Traitements nicotiniques de substitution (TNS)",
          questions: [
            { id: "tns_buts", type: "texte_libre", enonce: "Buts des TNS", reponse_attendue: "À rédiger", explication: null, reference: null },
            { id: "tns_prescripteurs", type: "texte_libre", enonce: "Qui peut prescrire les TNS ?", reponse_attendue: "À rédiger", explication: "Depuis 2016, prescription élargie : médecins, sages-femmes, IDE, masseurs-kinés, chirurgiens-dentistes, médecins du travail.", reference: null },
            { id: "tns_formes", type: "texte_libre", enonce: "Différentes formes de TNS avec dosages", reponse_attendue: "Patchs (24h ou 16h, plusieurs dosages), gommes (2 mg, 4 mg), pastilles/comprimés à sucer, inhaleur, spray buccal. Dosages adaptés à la consommation.", explication: null, reference: null },
            { id: "tns_sous_dosage", type: "texte_libre", enonce: "Symptômes de sous-dosage en TNS", reponse_attendue: "Craving, irritabilité, insomnie, difficulté à arrêter de fumer en complément.", explication: null, reference: null },
            { id: "tns_sur_dosage", type: "texte_libre", enonce: "Symptômes de surdosage en TNS", reponse_attendue: "Nausées, céphalées, palpitations, insomnie, goût métallique.", explication: null, reference: null }
          ]
        },
        {
          titre: "Complications et équivalences",
          questions: [
            { id: "tabac_complications", type: "texte_libre", enonce: "Complications liées à la consommation de tabac", reponse_attendue: "À rédiger — cardiovasculaires, respiratoires, cancers (poumon, VADS, vessie, pancréas…)", explication: null, reference: null },
            { id: "tabac_equiv_roule", type: "fill_in", enonce: "1 cigarette de tabac roulé = ? cigarettes industrielles", reponse_attendue: "≈ 2 à 3 cigarettes industrielles", mots_cles: ["2","3","deux","trois"], explication: null, reference: null },
            { id: "tabac_equiv_joint", type: "fill_in", enonce: "1 joint de THC = ? cigarettes industrielles", reponse_attendue: "≈ 3 à 5 cigarettes (en termes d'exposition aux goudrons)", mots_cles: ["3","5"], explication: "Attention : le joint expose à la fois aux goudrons du tabac et au THC. Mode d'inhalation plus profond que la cigarette.", reference: null },
            { id: "tabac_co_testeur", type: "texte_libre", enonce: "Intérêt du CO-testeur", reponse_attendue: "Mesure du monoxyde de carbone dans l'air expiré (ppm). Reflète la consommation des 24 dernières heures. Outil de motivation au sevrage, objectivation du bénéfice à l'arrêt (normalisation en 48h).", explication: null, reference: null }
          ]
        },
        {
          titre: "Étude de cas — tabac",
          questions: [
            { id: "tabac_cas", type: "texte_libre", enonce: "Décrire une situation clinique (liaison, urgences, USCA) et la prise en charge tabac", reponse_attendue: null, explication: null, reference: null }
          ]
        }
      ]
    },

    // ══════════════ CANNABIS ══════════════
    {
      id: "cannabis",
      titre: "Cannabis",
      icone: "🌿",
      sections: [
        {
          titre: "Cannabis — connaissances",
          questions: [
            { id: "cannabis_principes_actifs", type: "texte_libre", enonce: "Principes actifs du cannabis", reponse_attendue: "THC (delta-9-tétrahydrocannabinol) = psychoactif principal. CBD (cannabidiol) = non psychoactif, propriétés anxiolytiques/anticonvulsivantes. Plus de 100 cannabinoïdes identifiés.", explication: null, reference: null },
            { id: "cannabis_formes", type: "texte_libre", enonce: "Modes de consommation (3 formes principales)", reponse_attendue: "Herbe (feuilles/fleurs séchées), résine (haschich), huile/concentrés. Voies : inhalation (joint, bang, vaporisateur) principalement, per os (space cake, infusions).", explication: null, reference: null },
            { id: "cannabis_effets", type: "texte_libre", enonce: "Effets recherchés", reponse_attendue: "Détente, euphorie, altération de la perception du temps et des sens, rires, socialisation, stimulation de l'appétit, sédation.", explication: null, reference: null },
            { id: "cannabis_risques", type: "texte_libre", enonce: "Risques sur la santé", reponse_attendue: "Court terme : anxiété, attaque de panique, pharmacopsychose, troubles cognitifs aigus. Chronique : troubles cognitifs (mémoire, attention), trouble psychotique induit, syndrome amotivationnel, dépendance (~9 % des consommateurs, 17 % si début à l'adolescence), complications respiratoires (si fumé).", explication: null, reference: null },
            { id: "cannabis_sevrage", type: "texte_libre", enonce: "Symptômes de sevrage cannabique", reponse_attendue: "Irritabilité, anxiété, troubles du sommeil (insomnie, cauchemars), diminution de l'appétit, sueurs, céphalées. Pic à J2-J4, durée 1-2 semaines. DSM-5 reconnaît formellement le syndrome de sevrage cannabique.", explication: null, reference: null },
            { id: "cannabis_urinaire", type: "fill_in", enonce: "Temps de positivité des tests urinaires au cannabis", reponse_attendue: "Consommation occasionnelle : 3-7 jours. Consommation chronique intensive : jusqu'à 1 mois ou plus (stockage dans le tissu adipeux).", mots_cles: ["30","mois","semaines"], explication: null, reference: null },
            { id: "cannabis_pec", type: "texte_libre", enonce: "Prises en charge proposées pour le cannabis", reponse_attendue: "Pas de pharmacothérapie spécifique validée. TCC, entretien motivationnel, thérapies familiales (ados). Gestion symptomatique du sevrage (anxiolytiques courte durée, hypnotiques courte durée, mélatonine). Approches complémentaires USCA : hypnose, acupuncture, TRV.", explication: null, reference: null },
            { id: "cannabis_rdr", type: "texte_libre", enonce: "Conseils de réduction des risques", reponse_attendue: "Éviter le mélange avec le tabac (préférer vapo), ne pas consommer en conduisant, ne pas consommer avant 21 ans (maturation cérébrale), éviter si ATCD psychotique perso ou familial, espacer les consommations, ne pas mélanger avec d'autres produits.", explication: null, reference: null }
          ]
        }
      ]
    },

    // ══════════════ COCAÏNE ══════════════
    {
      id: "cocaine",
      titre: "Cocaïne",
      icone: "❄️",
      sections: [
        {
          titre: "Cocaïne — vrai / faux",
          questions: [
            { id: "coc_fatigue",     type: "vrai_faux", enonce: "La cocaïne permet de résister à la fatigue",        reponse_attendue: "vrai", explication: "Stimulant puissant, inhibe la recapture de dopamine/NA. Mais effet transitoire, « descente » épuisante.", reference: null },
            { id: "coc_intellect",   type: "vrai_faux", enonce: "La cocaïne permet de briller intellectuellement",    reponse_attendue: "faux", explication: "Sensation subjective de performance mais les fonctions exécutives sont en réalité altérées en phase d'intoxication comme en phase de descente.", reference: null },
            { id: "coc_agressivite", type: "vrai_faux", enonce: "La cocaïne peut rendre agressif",                    reponse_attendue: "vrai", explication: "Risque d'agitation, idées paranoïaques, impulsivité, passages à l'acte. Majoré en cas de polyconsommation (alcool ++).", reference: null }
          ]
        },
        {
          titre: "Cocaïne — complications",
          questions: [
            { id: "coc_cv",     type: "texte_libre", enonce: "Principal risque cardiovasculaire", reponse_attendue: "Syndrome coronarien aigu (infarctus) par spasme coronaire ± thrombose. Y compris chez sujet jeune sans ATCD. Toute douleur thoracique chez consommateur de cocaïne = urgence cardiologique.", explication: "Autres : troubles du rythme, HTA sévère, dissection aortique, AVC.", reference: null },
            { id: "coc_alcool", type: "texte_libre", enonce: "Risque spécifique du mélange cocaïne + alcool", reponse_attendue: "Formation de cocaéthylène (métabolite hépatique), plus cardiotoxique que la cocaïne seule, demi-vie plus longue. Majore le risque cardiovasculaire et la toxicité hépatique.", explication: null, reference: null },
            { id: "coc_baser",  type: "texte_libre", enonce: "Que signifie « baser la cocaïne » ?", reponse_attendue: "Transformer la cocaïne chlorhydrate (poudre) en base libre (« crack » ou « free-base »), fumable. Procédé : mélange avec bicarbonate ou ammoniaque + chauffage. Effet plus rapide, plus intense, mais plus court → potentiel addictif majoré.", explication: null, reference: null },
            { id: "coc_rdr",    type: "texte_libre", enonce: "Conseils de réduction des risques", reponse_attendue: "Matériel à usage unique (paille, embout, kit base), ne pas partager le matériel (risque VHC), éviter le mélange avec alcool, hydratation, doses fractionnées, tester le produit, éviter injection.", explication: null, reference: { label: "SFA 2025 — Guide cocaïne", path: null } }
          ]
        }
      ]
    },

    // ══════════════ MDMA ══════════════
    {
      id: "mdma",
      titre: "Ecstasy / MDMA",
      icone: "💊",
      sections: [
        {
          titre: "MDMA",
          questions: [
            { id: "mdma_dependance", type: "vrai_faux",  enonce: "On peut être dépendant à l'ecstasy", reponse_attendue: "vrai", explication: "Dépendance psychologique possible (moins fréquente que pour cocaïne/opioïdes). Tolérance rapide. Usage répété → déplétion sérotoninergique.", reference: null },
            { id: "mdma_diff",       type: "texte_libre", enonce: "Différence entre ecstasy et MDMA", reponse_attendue: "MDMA (3,4-méthylènedioxyméthamphétamine) = molécule pure. « Ecstasy » = comprimé vendu comme contenant de la MDMA, mais contenu souvent incertain (MDMA en concentrations variables, ou autres produits : caféine, amphétamines, MDA, cathinones…).", explication: null, reference: null },
            { id: "mdma_bruxisme",   type: "texte_libre", enonce: "Qu'est-ce que le bruxisme ?", reponse_attendue: "Contractions involontaires des muscles masticateurs → grincement/serrement des dents. Effet fréquent de la MDMA et des stimulants en général.", explication: null, reference: null }
          ]
        }
      ]
    },

    // ══════════════ CATHINONES / NPS ══════════════
    {
      id: "cathinones",
      titre: "Cathinones / NPS",
      icone: "💎",
      sections: [
        {
          titre: "Cathinones et chemsex",
          questions: [
            { id: "cath_type",          type: "qcm_single",  enonce: "Les cathinones sont principalement :", choix: [{id:"a",label:"Stimulants"},{id:"b",label:"Hypnotiques"}], reponse_attendue: "a", explication: "Cathinones = dérivés synthétiques de la cathinone (stimulant naturel du khat). Effets type amphétamines/cocaïne.", reference: null },
            { id: "cath_exemples",      type: "texte_libre", enonce: "Quelques exemples de cathinones", reponse_attendue: "3-MMC (3-méthylméthcathinone), 4-MMC (mephédrone), 3-CMC, alpha-PVP, MDPV…", explication: null, reference: null },
            { id: "cath_utilisations",  type: "texte_libre", enonce: "Utilisations principales des cathinones", reponse_attendue: "Contexte festif (dancefloors), chemsex (souvent associé à GHB, ICE, kétamine), usages solitaires (isolement, dépression). Voies : sniff, per os, injection (slam).", explication: null, reference: null },
            { id: "cath_chemsex",       type: "texte_libre", enonce: "Chemsex et Slam : définition et différence", reponse_attendue: "Chemsex = usage de drogues (cathinones, GHB, crystal meth, ICE, kétamine) dans un contexte sexuel, principalement chez HSH. Slam = chemsex avec injection intraveineuse des produits (sous-ensemble du chemsex, risques majorés : overdose, VIH/VHC/VHB, septicémies).", explication: null, reference: null }
          ]
        }
      ]
    },

    // ══════════════ GHB / GBL ══════════════
    {
      id: "ghb",
      titre: "GHB / GBL",
      icone: "💧",
      sections: [
        {
          titre: "GHB / GBL",
          questions: [
            { id: "ghb_diff",  type: "texte_libre", enonce: "Différence entre GHB et GBL", reponse_attendue: "GHB (acide gamma-hydroxybutyrique) = molécule active. GBL (gamma-butyrolactone) = précurseur, transformé en GHB in vivo par les lactonases hépatiques. GBL plus puissant à dose égale, action plus rapide.", explication: null, reference: null },
            { id: "ghb_ghole", type: "texte_libre", enonce: "Qu'est-ce que le G-hole ?", reponse_attendue: "Surdosage en GHB/GBL → perte de conscience brutale, coma, dépression respiratoire. Fenêtre thérapeutique étroite entre effet recherché et overdose. Aucun antagoniste. Aggravé par l'association à l'alcool ou aux dépresseurs.", explication: "Urgence vitale. Surveillance en réa si nécessaire. Pas de naloxone efficace.", reference: null }
          ]
        }
      ]
    },

    // ══════════════ HÉROÏNE ══════════════
    {
      id: "heroine",
      titre: "Héroïne",
      icone: "💉",
      sections: [
        {
          titre: "Héroïne",
          questions: [
            { id: "hero_dep",        type: "vrai_faux",  enonce: "On peut être dépendant à l'héroïne", reponse_attendue: "vrai", explication: "Pouvoir addictif majeur (agoniste μ puissant). Dépendance physique installée en quelques semaines d'usage régulier.", reference: null },
            { id: "hero_forme",      type: "texte_libre", enonce: "Formes et voies de consommation", reponse_attendue: "Poudre brune (brown sugar) ou blanche. Voies : sniff, inhalation (« chasser le dragon »), injection IV (principale). Injection = risque max (overdose, VIH, VHC).", explication: null, reference: null },
            { id: "hero_speedball",  type: "fill_in",    enonce: "Mélange héroïne + cocaïne =", reponse_attendue: "Speedball", mots_cles: ["speedball","speed-ball"], explication: "Association particulièrement risquée : cocaïne masque les signes d'overdose aux opioïdes, et inversement.", reference: null },
            { id: "hero_iv",         type: "texte_libre", enonce: "Principaux risques liés à l'injection IV", reponse_attendue: "Overdose (dépression respiratoire), infections : VIH, VHC, VHB (matériel partagé), septicémies, endocardites, abcès cutanés, cellulites, phlébites, emboles pulmonaires septiques.", explication: null, reference: null },
            { id: "hero_overdose",   type: "texte_libre", enonce: "Traitement d'une overdose opioïde", reponse_attendue: "Naloxone (Narcan, Prenoxad, Nalscue IN). Antagoniste compétitif des récepteurs opioïdes. Dose : 0,4 à 2 mg IM/IV/SC, répétable. Action rapide (2-5 min) mais courte (30-90 min) → risque de rebond si opioïde longue durée.", explication: "À l'USCA / ELSA, former les patients et proches à l'usage de la naloxone nasale (RdR).", reference: null },
            { id: "hero_rdr",        type: "texte_libre", enonce: "Conseils de réduction des risques", reponse_attendue: "Ne pas consommer seul, matériel à usage unique (kit injection CAARUD), rotation des points d'injection, test du produit, doses fractionnées, disposer de naloxone, TSO si dépendance installée, dépistage VIH/VHC/VHB régulier, vaccination VHB.", explication: null, reference: null }
          ]
        }
      ]
    },

    // ══════════════ MÉDICAMENTS À RISQUE ══════════════
    {
      id: "medicaments",
      titre: "Médicaments à risque de dépendance",
      icone: "💊",
      sections: [
        {
          titre: "Benzodiazépines et opioïdes",
          questions: [
            { id: "med_tableau", type: "table_fill", enonce: "Compléter le tableau", colonnes: ["Classe","Indications","Principaux médicaments","Syndrome de sevrage"], lignes: [
              { id: "bzd_hypno",  cellules: ["BZD hypnotiques","","",""],          reponse_attendue: "Insomnie. Ex : zolpidem (Stilnox), zopiclone (Imovane), lormétazépam (Noctamide). Sevrage : rebond d'insomnie, anxiété, cauchemars, tremblements, crises comitiales." },
              { id: "bzd_anxio",  cellules: ["BZD anxiolytiques","","",""],        reponse_attendue: "Anxiété. Ex : alprazolam (Xanax), oxazépam (Séresta), bromazépam (Lexomil), diazépam (Valium). Sevrage : anxiété de rebond, tremblements, insomnie, crises comitiales (si sevrage brutal)." },
              { id: "morph",      cellules: ["Morphiniques et dérivés","","",""],  reponse_attendue: "Douleur. Ex : morphine, oxycodone, tramadol, codéine, fentanyl. Sevrage : syndrome neurovégétatif (mydriase, rhinorrhée, larmoiement, sueurs, piloérection, myalgies, diarrhée, bâillements, irritabilité, craving)." }
            ], explication: null, reference: { label: "HAS 2015 — Arrêt BZD", path: null } }
          ]
        }
      ]
    },

    // ══════════════ TSO ══════════════
    {
      id: "tso",
      titre: "Traitements de substitution (TSO)",
      icone: "🏥",
      sections: [
        {
          titre: "TSO",
          questions: [
            { id: "tso_definition",   type: "texte_libre", enonce: "Qu'est-ce qu'un traitement de substitution ?", reponse_attendue: "Traitement médicamenteux prescrit aux personnes dépendantes aux opioïdes, consistant à remplacer l'opioïde illicite (héroïne) par un opioïde médicamenteux, à longue durée d'action, administré par voie orale, permettant de stabiliser le patient, de supprimer le craving et le syndrome de sevrage, et de prévenir l'overdose. Deux molécules : méthadone et buprénorphine.", explication: null, reference: { label: "HAS 2022 — Fiche TSO", path: null } },
            { id: "tso_antagoniste",  type: "fill_in",    enonce: "Antagoniste des opioïdes", reponse_attendue: "Naloxone (courte durée, urgence) et naltrexone (longue durée, prévention de rechute)", mots_cles: ["naloxone","naltrexone"], explication: null, reference: null },
            { id: "tso_elsa_hopital", type: "texte_libre", enonce: "Informations à récupérer par l'ELSA et règles lors d'une ouverture de stock à l'hôpital pour un TSO", reponse_attendue: "Infos : identité prescripteur habituel (médecin traitant, CSAPA, CAARUD), dernière prescription (photo/fax), dernière dispensation pharmacie (date, dose), galénique habituelle, dose habituelle, ancienneté. Règles : appel du prescripteur et/ou de la pharmacie, double vérification de la dose, prescription hospitalière conforme, dispensation contrôlée, organiser la continuité à la sortie.", explication: null, reference: null },
            { id: "tso_tableau",      type: "table_fill", enonce: "Compléter le tableau TSO", colonnes: ["Molécule","Indications","Prescription hors hôpital","Formes et voies"], lignes: [
              { id: "metha",    cellules: ["Méthadone","","",""],                                 reponse_attendue: "Dépendance opioïdes modérée à sévère. Primo-prescription : CSAPA ou établissement de santé uniquement. Relais ville possible après stabilisation (médecin de ville formé). Sirop (flacon unidose) ou gélules. Voie orale exclusivement. Délivrance pharmacie : 14 jours max." },
              { id: "bupre",    cellules: ["Buprénorphine (Subutex, génériques)","","",""],       reponse_attendue: "Dépendance opioïdes. Primo-prescription possible par tout médecin (pas de cadre CSAPA obligatoire). Comprimés sublinguaux. Délivrance pharmacie : 28 jours max. Agoniste partiel μ + antagoniste κ." },
              { id: "suboxone", cellules: ["Suboxone (buprénorphine + naloxone)","","",""],       reponse_attendue: "Même indication que Subutex. Association buprénorphine + naloxone. Naloxone inactive par voie sublinguale mais active en cas d'injection (détournement) → effet aversif. Mêmes règles de prescription que Subutex." }
            ], explication: null, reference: null }
          ]
        }
      ]
    },

    // ══════════════ MOTIVATION ══════════════
    {
      id: "motivation",
      titre: "Motivation au changement",
      icone: "🔄",
      sections: [
        {
          titre: "Étapes de Prochaska et DiClemente",
          questions: [
            { id: "motiv_etapes", type: "texte_libre", enonce: "Citer et décrire les étapes du cycle de Prochaska et DiClemente", reponse_attendue: "1. Précontemplation : pas de conscience du problème. 2. Contemplation : ambivalence, envisage le changement. 3. Préparation/Détermination : décision prise, prépare les moyens. 4. Action : change effectivement (ici : sevrage, réduction). 5. Maintien : consolidation du changement. 6. Rechute (possible à toute étape) : retour à la consommation, puis redémarrage du cycle. L'entretien motivationnel adapte l'approche à l'étape.", explication: "Modèle transversal à toutes les addictions. Fondamental pour calibrer l'intervention clinique.", reference: null }
          ]
        }
      ]
    },

    // ══════════════ QUESTIONNAIRES ══════════════
    {
      id: "questionnaires",
      titre: "Questionnaires en addictologie",
      icone: "📋",
      sections: [
        {
          titre: "Outils d'évaluation",
          questions: [
            { id: "quest_tableau", type: "table_fill", enonce: "Pour chaque questionnaire : utilisé pendant ton stage ? indication ? population concernée ?", colonnes: ["Questionnaire","Utilisé ?","Indication","Population"], lignes: [
              { id: "audit",      cellules: ["AUDIT (Alcool)","","",""],            reponse_attendue: "10 items. Repérage consommation à risque, nocive, dépendance à l'alcool. Tout adulte. Seuils H ≥ 8 / F ≥ 7." },
              { id: "rpib",       cellules: ["RPIB","","",""],                      reponse_attendue: "Repérage Précoce et Intervention Brève. Démarche complète de dépistage + intervention motivationnelle. Tout adulte consultant (médecine générale, urgences)." },
              { id: "depado",     cellules: ["DEP-ADO","","",""],                   reponse_attendue: "Grille de dépistage cannabis et autres substances chez adolescents. 7 items. Évalue sévérité de l'usage." },
              { id: "canditox",   cellules: ["CANDITOX","","",""],                  reponse_attendue: "Test de dépendance au cannabis. À compléter." },
              { id: "fagerstrom", cellules: ["Fagerström","","",""],                reponse_attendue: "Test de dépendance à la nicotine. 6 items. Score 0-10. Dépendance forte ≥ 7." },
              { id: "hyperemese", cellules: ["Hyperémèse cannabique","","",""],     reponse_attendue: "Critères de diagnostic du syndrome d'hyperémèse cannabique (CHS) : consommation cannabique chronique, vomissements cycliques, soulagement par douches chaudes." }
            ], explication: null, reference: { label: "Toolbox — Scores", path: "/staff/toolbox.html#scores" } }
          ]
        }
      ]
    }
  ]
};

// Export global
if (typeof window !== 'undefined') {
  window.LIVRET_IFSI = LIVRET_IFSI;
}
