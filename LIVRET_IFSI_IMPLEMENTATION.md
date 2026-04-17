# LIVRET IFSI — Module étudiante IDE

> Feature d'implémentation pour **USCA Connect**
> À dropper dans `C:\Users\jclui\OneDrive\Documents\GitHub\USCA-Assistant\`
> Dernière mise à jour : 17 avril 2026

---

## 1. OBJECTIF

Intégrer un module **« Mon livret de stage »** dans USCA Connect pour les étudiantes infirmières (ESI) en stage à l'USCA/ELSA, en version interactive du livret papier actuel (`Livret_étudiants_IFSI_.docx`).

**Ce que ça remplace** : le PDF/Word distribué en début de stage, rempli à la main, corrigé de façon hétérogène par les membres de l'équipe disponibles.

**Ce que ça apporte** :
- Auto-correction avec explication clinique contextualisée USCA.
- Renvoi systématique vers les ressources réelles (Toolbox, fiches traitements, Référentiel USCA, recos HAS).
- Progression trackée, visible pour la tutrice IDE.
- Études de cas structurées avec validation tuteur.
- Export PDF portfolio en fin de stage.

**Ce que ça ne fait PAS** :
- Remplacer l'entretien hebdomadaire avec la tutrice IDE.
- Devenir un outil d'évaluation institutionnelle IFSI (reste interne USCA).
- Gamification infantilisante (pas de badges, pas de niveaux, pas d'étoiles).

---

## 2. PRINCIPES DIRECTEURS (non négociables)

1. **Intégré à USCA Connect** — pas d'app séparée. Nouveau dossier `etudiant/` au même niveau que `patient/` et `admin/`.
2. **Stack identique** — HTML5 + Tailwind CSS via CDN + Supabase SDK via CDN + jsPDF. Pas de bundler, pas de npm, pas de build.
3. **Mobile-first** — les étudiantes consultent principalement sur smartphone.
4. **Réutilisation** — le module renvoie vers les ressources existantes (Toolbox, 20 fiches traitements, scores, PDFs du projet). Pas de duplication de contenu clinique.
5. **Charte graphique V2** — indigo `#4F46E5` / émeraude `#10B981` / rouge `#EF4444` / slate `#F8FAFC`. Même dark mode que le reste de l'app.
6. **Langue** — français partout.
7. **Ton** — professionnel, sobre, non infantilisant (ce sont des adultes en formation).

---

## 3. PHASAGE

La cible est un **module complet intégré** : dashboard étudiante dédié avec persistance Supabase, vue tuteur accessible à toutes les IDE, études de cas avec workflow de validation, export PDF portfolio. Le découpage en phases est technique (pour livrer proprement), pas fonctionnel (pas de version bridée).

| Phase | Livrable | Priorité |
|---|---|---|
| **P1** | Socle fonctionnel : migration Supabase v15, auth et redirection rôle `etudiant_ide`, dashboard étudiante (accueil + lexique + chapitres substances + tableaux), persistance progression, export PDF basique | **Commencer ici** |
| **P2** | Vue tuteur : tous les profils IDE voient leurs étudiantes, progression par chapitre, case « vu avec le tuteur » | Après validation P1 |
| **P3** | Études de cas : bibliothèque de 10 cas pré-rédigés + mode cas vécu anonymisé + workflow soumission/validation | Après P2 |
| **P4** | Bilan de stage + commentaire tuteur signé + export PDF portfolio complet | Après P3 |

**Ne pas tout implémenter d'un coup.** Stopper après P1 et attendre validation de JC avant de continuer.

---

## 4. ARCHITECTURE FICHIERS

### Nouveaux fichiers (P1)

```
USCA-Assistant/
├── etudiant/
│   └── index.html                        ← Dashboard étudiante (SPA)
├── shared/
│   ├── livret-ifsi-contenu.js            ← Questions + réponses + explications (JSON)
│   └── livret-ifsi-pdf.js                ← Génération PDF export
├── migrations/
│   └── supabase-migration-v15.sql        ← Tables etudiants_stages + etudiant_progression
```

### Fichiers modifiés (P1)

- `shared/auth.js` — ajouter redirection `/etudiant/index.html` si `profile.role === 'etudiant_ide'`.
- `shared/supabase.js` — ajouter helpers CRUD pour `etudiants_stages` et `etudiant_progression`.
- `admin/index.html` — formulaire création étudiante (nom, prénom, promo, dates, IDE tutrice) dans la gestion des comptes.
- `staff/toolbox.html` — ajouter une carte « Livret IFSI (aperçu soignant) » dans la Toolbox pour que les IDE et médecins puissent consulter le contenu pédagogique en lecture (utile pour préparer un entretien avec l'étudiante).
- `sw.js` — incrémenter `CACHE_NAME` (v3.64 → v3.65) et ajouter les nouveaux fichiers à la liste des URLs cachées.

### Fichiers modifiés (P2)

- `admin/index.html` — ajouter onglet « Mes étudiantes » (visible pour tout profil `role = 'ide'`).

---

## 5. PHASE 1 — SOCLE FONCTIONNEL (à implémenter en premier)

### 5.1. Migration Supabase v15

**Exécuter AVANT tout code frontend** le script `migrations/supabase-migration-v15.sql` (contenu détaillé en section 7.1).

Vérifier dans Supabase :
- Tables `etudiants_stages` et `etudiant_progression` créées.
- RLS activée, policies OK.
- Index créés.

### 5.2. Création des comptes étudiantes (admin)

Dans `admin/index.html`, section gestion des comptes, ajouter un formulaire dédié « Nouvelle étudiante IDE » :

| Champ | Obligatoire | Note |
|---|---|---|
| Prénom, Nom | Oui | |
| Email AP-HP ou générique | Oui | Pour login Supabase Auth |
| Mot de passe temporaire | Oui | L'étudiante pourra le changer |
| IFSI d'origine | Oui | Texte libre |
| Promo (année) | Oui | Ex : « 2024-2027 » |
| Année de formation | Oui | 1, 2 ou 3 |
| Date début stage | Oui | |
| Date fin stage | Oui | Défaut : début + 5 semaines |
| IDE tutrice | Oui | Select parmi les profils `role = 'ide'` |

À la création :
1. Créer le compte Supabase Auth (`auth.users`) via admin API (ou la Cloudflare Function existante).
2. Créer le profil dans `profiles` avec `role = 'etudiant_ide'`.
3. Créer le stage dans `etudiants_stages` avec `tuteur_id = profile.id de l'IDE`.

### 5.3. Login et redirection

- L'étudiante se logue via l'onglet Soignant de `index.html` (même parcours qu'une IDE ou un médecin).
- Dans `shared/auth.js`, après succès du login, vérifier `profile.role` :
  - `etudiant_ide` → redirection `/etudiant/index.html`
  - `ide`, `medecin`, `psychologue`, etc. → redirection habituelle vers `/admin/index.html`
- Auto-redirect au chargement de `/etudiant/index.html` si pas de session → retour à `/index.html`.

### 5.4. Structure de la page `etudiant/index.html`

Single-page application, vanilla JS (pas de framework), Tailwind CDN, même squelette que `patient/index.html`.

**Header fixe** :
- Logo USCA.
- Titre « Mon livret de stage » + prénom étudiante.
- Barre de progression globale (% de questions répondues sur total).
- Menu (avatar) : nom IDE tutrice, dates de stage, déconnexion.

**Navigation par onglets** (tabs horizontaux, scrollable sur mobile) :

```
[Accueil] [Lexique] [Alcool] [Tabac] [Cannabis] [Cocaïne] [MDMA] [Cathinones/NPS] [GHB] [Héroïne] [Médicaments] [TSO] [Motivation] [Questionnaires]
```

L'onglet **[Cas cliniques]** n'est PAS visible en P1 (il arrive en P3). L'onglet **[Bilan]** n'est pas visible non plus (P4).

**Section Accueil** :
- Bandeau de bienvenue : « Bienvenue, [Prénom]. Stage du [date] au [date], tutrice : [Prénom Nom IDE]. »
- Présentation du service (texte repris du livret : ELSA, USCA, équipe, planning).
- Objectifs du stage.
- Liste des chapitres avec progression par chapitre (X/Y questions répondues, barre de progression).
- Bouton « Commencer / Reprendre » → dernier onglet visité.
- Bouton « Exporter ma progression en PDF ».

### 5.5. Types de questions supportés

Le moteur doit gérer 6 types :

| Type | Comportement |
|---|---|
| `fill_in` | Champ texte libre. Auto-correction tolérante (comparaison normalisée : casse, accents, espaces, ponctuation ignorés ; mots-clés attendus signalés). Affichage « Votre réponse est correcte / partielle / à revoir ». |
| `qcm_single` | Radio, choix unique. Correction immédiate au clic. |
| `qcm_multi` | Checkboxes. Validation par bouton « Valider ». |
| `vrai_faux` | Deux boutons Vrai/Faux. Correction immédiate. |
| `table_fill` | Tableau avec cellules éditables. Validation cellule par cellule. |
| `texte_libre` | Pas de correction automatique (réflexion personnelle, étude de cas courte). Juste enregistré. |

### 5.6. Comportement d'une question

Chaque question est une carte avec :

1. **Énoncé** en haut.
2. **Zone de saisie** (selon type).
3. **Bouton primaire** « Vérifier ma réponse » (ou « Enregistrer » pour texte libre).
4. Au clic, révèle une zone inférieure contenant :
   - **Réponse attendue** (encart émeraude si correct, ambre si partiel, gris-rouge si à revoir — jamais d'écart punitif).
   - **Explication clinique contextualisée USCA** (paragraphe pédagogique, ton sobre).
   - **Référence** : lien vers fiche Toolbox / fiche traitement / PDF HAS dans le projet / section Référentiel USCA.
5. **Case à cocher** « ✓ Vu avec ma tutrice » (bascule `vu_tuteur = true` dans la table).

### 5.7. Persistance Supabase

À chaque saisie de réponse :
- `debounce` 500 ms pour éviter le spam d'upsert.
- `supabase.from('etudiant_progression').upsert({...}, { onConflict: 'stage_id,question_id' })`
- Indicateur discret « Enregistré » en haut (fondu 2 s).

Au chargement de la page :
- Récupérer `etudiant_progression` filtré par `stage_id`.
- Pré-remplir tous les champs.
- Calculer la progression par chapitre.

En cas de perte réseau : localStorage de secours (queue d'upserts à rejouer au retour en ligne).

### 5.8. Export PDF basique (jsPDF)

Bouton accueil → génère un PDF A4 contenant :
- Page de garde : identité étudiante (depuis `etudiants_stages`), dates de stage, IDE tutrice, logo USCA.
- Sommaire.
- Une page par chapitre, questions + réponses saisies par l'étudiante (pas les réponses attendues — c'est son livret à elle, pas un corrigé).
- Footer USCA Pitié-Salpêtrière + n° de page.

Format graphique identique aux PDFs post-cure existants (police 9pt, titres 14pt, marges 20mm, barre latérale colorée pour sections).

Le PDF portfolio complet (avec commentaire tuteur + bilan) arrive en P4.

### 5.9. Carte « Livret IFSI (aperçu soignant) » dans la Toolbox

Dans `staff/toolbox.html`, ajouter une petite carte dans la section outils. Cliquable par tout soignant (médecin, IDE, psy). Ouvre `/etudiant/index.html?preview=1` en lecture seule : permet à la tutrice IDE de parcourir le contenu pédagogique avant un entretien avec une étudiante, ou à un médecin de comprendre ce que travaillent les étudiantes. Pas de saisie possible en mode preview.

---

## 6. CONTENU PÉDAGOGIQUE — STRUCTURE JSON

Fichier `shared/livret-ifsi-contenu.js` :

```javascript
// shared/livret-ifsi-contenu.js
// Contenu pédagogique du livret IFSI USCA
// IMPORTANT : les réponses et explications doivent être validées par l'équipe médicale

const LIVRET_IFSI = {
  meta: {
    version: "1.0",
    derniere_maj: "2026-04-17",
    redige_par: "Équipe USCA/ELSA"
  },

  presentation: {
    service: "ELSA — Équipe de Liaison et de Soins en Addictologie...",
    localisation: "3e étage, bâtiment La Force",
    equipe: [ /* reprendre liste du livret */ ],
    activites: [ /* ... */ ]
  },

  lexique: [
    {
      id: "elsa",
      acronyme: "ELSA",
      definition: "Équipe de Liaison et de Soins en Addictologie",
      contexte: "Unité hospitalière dédiée à l'accompagnement addictologique des patients hospitalisés dans tous les services de l'hôpital. Concept issu de la circulaire DHOS 2008.",
      lien_toolbox: "/staff/toolbox.html#elsa-accueil"
    },
    {
      id: "usca",
      acronyme: "USCA",
      definition: "Unité de Soins Complexes en Addictologie",
      contexte: "À la Pitié-Salpêtrière : 8 lits de sevrage programmé de 12 jours, en chambres doubles majoritairement.",
      lien_toolbox: null
    },
    { id: "csapa", acronyme: "CSAPA", definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "caarud", acronyme: "CAARUD", definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "cjc", acronyme: "CJC", definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "oh", acronyme: "OH", definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "aa", acronyme: "AA", definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "rdr", acronyme: "RDR / RdRD", definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "tso", acronyme: "TSO", definition: "À compléter", contexte: "À compléter", lien_toolbox: "/staff/toolbox.html#tso" },
    { id: "thc", acronyme: "THC", definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "cbd", acronyme: "CBD", definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "ghb", acronyme: "GHB", definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "slam", acronyme: "SLAM", definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "ptsd", acronyme: "PTSD / TSPT", definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "cpoa", acronyme: "CPOA", definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "ts", acronyme: "TS", definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "cmp", acronyme: "CMP / CMPP", definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "tdah", acronyme: "TDAH", definition: "À compléter", contexte: "À compléter", lien_toolbox: "/staff/toolbox.html#tdah" },
    { id: "aspdt", acronyme: "ASPDT", definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "aah", acronyme: "AAH", definition: "À compléter", contexte: "À compléter", lien_toolbox: null },
    { id: "ald", acronyme: "ALD", definition: "À compléter", contexte: "À compléter", lien_toolbox: null }
  ],

  chapitres: [
    {
      id: "alcool",
      titre: "Alcool",
      icone: "🍷",
      sections: [
        {
          titre: "Équivalences et seuils",
          questions: [
            {
              id: "alcool_verre_gr",
              type: "fill_in",
              enonce: "1 verre standard d'alcool = ? g d'alcool pur",
              reponse_attendue: "10 g",
              mots_cles: ["10", "dix"],
              explication: "Le verre standard OMS contient 10 g d'alcool pur. Cela correspond à 25 cl de bière à 5°, 10 cl de vin à 12°, 3 cl d'alcool fort à 40°.",
              reference: { label: "HAS 2021 — Repérage TUS", path: "/mnt/project/HAS_2021__Fiche_outil_repérage_TUS.pdf" }
            },
            {
              id: "alcool_limite_conduite",
              type: "fill_in",
              enonce: "Limite légale d'alcoolémie au volant (permis normal) : ? g/L de sang",
              reponse_attendue: "0,5 g/L",
              mots_cles: ["0.5", "0,5"],
              explication: "0,5 g/L sang = 0,25 mg/L air expiré. Pour les jeunes conducteurs (permis < 3 ans) et les transports en commun : 0,2 g/L.",
              reference: null
            },
            {
              id: "alcool_air_expire",
              type: "qcm_single",
              enonce: "0,5 g/L de sang équivaut à quelle valeur à l'éthylotest (air expiré) ?",
              choix: [
                { id: "a", label: "0,25 mg/L" },
                { id: "b", label: "0,50 mg/L" },
                { id: "c", label: "1 mg/L" }
              ],
              reponse_attendue: "a",
              explication: "Le rapport est de 1 à 2000 environ : 1 g/L sang ≈ 0,5 mg/L air expiré.",
              reference: null
            },
            {
              id: "alcool_verres_equivalents",
              type: "qcm_single",
              enonce: "0,5 g/L de sang correspond approximativement à combien de verres standards chez un adulte moyen ?",
              choix: [
                { id: "a", label: "Un" },
                { id: "b", label: "Deux" },
                { id: "c", label: "Quatre" }
              ],
              reponse_attendue: "b",
              explication: "Deux verres standards chez un homme de 70 kg à jeun. Variable selon poids, sexe, alimentation.",
              reference: null
            },
            {
              id: "alcool_elimination",
              type: "fill_in",
              enonce: "Vitesse d'élimination de l'alcool : ? g/L par heure",
              reponse_attendue: "0,10 à 0,15 g/L/h",
              mots_cles: ["0,1", "0.1", "0,15", "0.15"],
              explication: "Élimination hépatique linéaire (cinétique d'ordre zéro au-delà d'un certain seuil), environ 0,10-0,15 g/L/h. Non accéléré par le café, la douche ou l'exercice.",
              reference: null
            },
            {
              id: "alcool_oms_limites",
              type: "qcm_single",
              enonce: "Repères de consommation à moindre risque (Santé publique France, 2017)",
              choix: [
                { id: "a", label: "2 verres/jour maximum" },
                { id: "b", label: "Pas plus de 10 verres/semaine, pas plus de 2 verres/jour, 2 jours sans alcool/semaine" },
                { id: "c", label: "4 verres/jour maximum" }
              ],
              reponse_attendue: "b",
              explication: "Les repères français (2017) retiennent un double plafond : 10/semaine ET 2/jour, avec des jours sans. Il n'y a pas de seuil de consommation « sans risque ».",
              reference: null
            },
            {
              id: "alcool_equiv_biere",
              type: "fill_in",
              enonce: "3 bières de 33 cl à 5° = ? verres standards",
              reponse_attendue: "3 verres",
              mots_cles: ["3", "trois"],
              explication: "33 cl à 5° ≈ 13 g d'alcool ≈ 1,3 verre standard. 3 bières ≈ 4 verres en pratique (arrondi clinique : 3 bières = 3 verres).",
              reference: null
            },
            {
              id: "alcool_equiv_vin",
              type: "fill_in",
              enonce: "75 cl de vin rouge à 12° = ? verres standards",
              reponse_attendue: "7 à 8 verres",
              mots_cles: ["7", "8", "sept", "huit"],
              explication: "Une bouteille de vin à 12° contient environ 72 g d'alcool pur = 7 à 8 verres standards.",
              reference: null
            },
            {
              id: "alcool_equiv_cidre",
              type: "fill_in",
              enonce: "25 cl de cidre à 5° = ? verres standards",
              reponse_attendue: "1 verre",
              mots_cles: ["1", "un"],
              explication: null,
              reference: null
            },
            {
              id: "alcool_equiv_aperitif",
              type: "fill_in",
              enonce: "75 cl d'un apéritif à 18° = ? verres standards",
              reponse_attendue: "11 verres",
              mots_cles: ["11", "onze"],
              explication: null,
              reference: null
            }
          ]
        },
        {
          titre: "Complications de la consommation chronique",
          questions: [
            {
              id: "alcool_neuro_reversible",
              type: "texte_libre",
              enonce: "Troubles neurologiques réversibles liés à l'alcool : nom(s) et signes",
              reponse_attendue: "Encéphalopathie de Gayet-Wernicke (réversible si traitée précocement par vitamine B1 IV) : triade confusion + ophtalmoplégie + ataxie. Polynévrite alcoolique sensitivomotrice des membres inférieurs. Partiellement réversibles avec abstinence + vitaminothérapie.",
              explication: "Point clé USCA : toute suspicion de Gayet-Wernicke → vitamine B1 IV 500 mg x 3/jour avant toute perfusion glucosée. La glucose peut précipiter l'encéphalopathie en épuisant les réserves de B1.",
              reference: { label: "Référentiel USCA 2.2", path: "/mnt/project/Référentiel_USCA_2_2.pdf" }
            },
            {
              id: "alcool_neuro_irreversible",
              type: "texte_libre",
              enonce: "Troubles neurologiques irréversibles liés à l'alcool : nom(s) et signes",
              reponse_attendue: "Syndrome de Korsakoff : amnésie antérograde massive, fabulations, fausses reconnaissances, désorientation temporo-spatiale. Conséquence d'un Gayet-Wernicke non ou mal traité. Atteinte des corps mamillaires (IRM). Encéphalopathie hépatique chronique possible.",
              explication: "Le Korsakoff est la séquelle du Gayet-Wernicke non traité. D'où l'impératif de prévention systématique par B1 chez tout patient alcoolodépendant en sevrage.",
              reference: null
            },
            {
              id: "alcool_complications_autres",
              type: "table_fill",
              enonce: "Autres complications de l'alcoolisme chronique — compléter chaque ligne",
              colonnes: ["Organe", "Complications"],
              lignes: [
                { id: "neuro", cellules: ["Neurologique", ""], reponse_attendue: "Atrophie cérébelleuse, neuropathie périphérique, épilepsie de sevrage, démence alcoolique" },
                { id: "orl", cellules: ["ORL", ""], reponse_attendue: "Cancers des VADS (bouche, pharynx, larynx, œsophage) — potentialisés par le tabac" },
                { id: "hepato", cellules: ["Hépatique", ""], reponse_attendue: "Stéatose, hépatite alcoolique aiguë, cirrhose, carcinome hépatocellulaire" },
                { id: "gastro", cellules: ["Gastro-entérologique", ""], reponse_attendue: "Gastrite, pancréatite aiguë et chronique, œsophagite, varices œsophagiennes (si HTP), syndrome de Mallory-Weiss" }
              ],
              explication: "Liaison hépato = ~15 % de l'activité ELSA. Connaître ces complications est essentiel.",
              reference: null
            }
          ]
        },
        {
          titre: "Sevrage alcool",
          questions: [
            {
              id: "alcool_sevrage_complic1",
              type: "texte_libre",
              enonce: "Première complication du sevrage alcool brutal : nom et signes",
              reponse_attendue: "Crise comitiale de sevrage (convulsions tonico-cloniques généralisées) — survient typiquement dans les 6 à 48h après la dernière prise.",
              explication: null,
              reference: null
            },
            {
              id: "alcool_sevrage_complic2",
              type: "texte_libre",
              enonce: "Deuxième complication du sevrage alcool brutal : nom et signes",
              reponse_attendue: "Delirium tremens (DT) : confusion, agitation, hallucinations (zoopsies classiques), tremblements intenses, sueurs profuses, tachycardie, fièvre, déshydratation. Urgence vitale. Survient typiquement à J2-J4.",
              explication: null,
              reference: null
            },
            {
              id: "alcool_score_sevrage",
              type: "texte_libre",
              enonce: "Score d'évaluation de la gravité du sevrage : nom et principaux critères",
              reponse_attendue: "Score de Cushman (français) ou CIWA-Ar (international). Cushman : 7 items (pouls, PAS, FR, tremblements, sueurs, agitation, troubles sensoriels), cotés 0 à 3. Total 0-21. Seuil d'intervention BZD : ≥ 7.",
              explication: "À l'USCA, le score de Cushman est coté régulièrement pendant la phase aiguë du sevrage (J1-J4).",
              reference: { label: "Toolbox — Scores", path: "/staff/toolbox.html#cushman" }
            },
            {
              id: "alcool_sevrage_traitements",
              type: "texte_libre",
              enonce: "Traitements du sevrage alcoolique (au moins 3 éléments)",
              reponse_attendue: "1. Benzodiazépines (diazépam/Valium ou oxazépam/Séresta si insuffisance hépatique) en dose de charge puis décroissance. 2. Vitamine B1 (thiamine) 500 mg IV puis relais PO, prévention Gayet-Wernicke. 3. Hydratation (per os privilégiée). 4. Vitamines B6, PP. 5. Surveillance score Cushman, paramètres vitaux. 6. Magnésium si carence.",
              explication: "À l'USCA : diazépam en première intention, oxazépam si insuffisance hépatique (métabolisme glucuronoconjugué direct, pas de métabolite actif). Jamais de perfusion glucosée sans B1 préalable.",
              reference: { label: "Référentiel USCA 2.2 — protocole sevrage", path: "/mnt/project/Référentiel_USCA_2_2.pdf" }
            }
          ]
        },
        {
          titre: "Maintien de l'abstinence / consommation contrôlée",
          questions: [
            {
              id: "alcool_tableau_traitements",
              type: "table_fill",
              enonce: "Traitements pour abstinence ou consommation contrôlée — compléter les indications",
              colonnes: ["Médicament", "Indications", "Mécanisme / particularités"],
              lignes: [
                { id: "aotal", cellules: ["Aotal (acamprosate)", "", ""], reponse_attendue: "Indication : maintien de l'abstinence après sevrage. Mécanisme : modulation glutamatergique. 2 cp x 3/jour. Bien toléré." },
                { id: "revia", cellules: ["Révia (naltrexone)", "", ""], reponse_attendue: "Indication : maintien de l'abstinence OU réduction de consommation. Mécanisme : antagoniste opioïde (diminue le renforcement). CI : traitement opioïde en cours. 50 mg/jour." },
                { id: "selincro", cellules: ["Selincro (nalméfène)", "", ""], reponse_attendue: "Indication : réduction de consommation chez patients à haut risque (>60 g/j H, >40 g/j F). Prise « à la demande » 1-2h avant exposition. Antagoniste μ + agoniste partiel κ." },
                { id: "esperal", cellules: ["Esperal (disulfirame)", "", ""], reponse_attendue: "Indication : maintien de l'abstinence (aversion). Mécanisme : inhibe l'acétaldéhyde déshydrogénase → effet antabuse si consommation. Nombreuses CI cardiovasculaires." },
                { id: "baclofene", cellules: ["Baclofène", "", ""], reponse_attendue: "Indication : réduction de consommation / maintien abstinence (AMM depuis 2018). Mécanisme : agoniste GABA-B. Titration progressive. Dose max 80 mg/j (cadre AMM). Au-delà = hors AMM." }
              ],
              explication: "Le choix dépend de l'objectif (abstinence vs réduction), des comorbidités et des préférences du patient. Décision partagée.",
              reference: { label: "Toolbox — Fiches traitements", path: "/staff/toolbox.html#fiches" }
            }
          ]
        },
        {
          titre: "Étude de cas — alcool",
          questions: [
            {
              id: "alcool_cas_clinique",
              type: "texte_libre",
              enonce: "Décrire une situation clinique rencontrée (liaison, urgences ou USCA) et expliquer les différentes étapes de la prise en charge. Respecter l'anonymisation : pas de prénom, pas d'âge exact, pas de numéro de chambre.",
              reponse_attendue: null,
              explication: "Canevas attendu : (1) motif d'intervention, (2) évaluation initiale (consommation, ATCD, comorbidités), (3) score de Cushman / signes cliniques, (4) décision thérapeutique (sevrage, orientation…), (5) suivi et orientation.",
              reference: null
            }
          ]
        }
      ]
    },

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
            { id: "tabac_test", type: "fill_in", enonce: "Test d'évaluation de la dépendance tabagique", reponse_attendue: "Test de Fagerström (6 items)", mots_cles: ["fagerström", "fagerstrom"], explication: "Score 0-10. Dépendance forte ≥ 7.", reference: { label: "Toolbox — Scores", path: "/staff/toolbox.html#fagerstrom" } }
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
            { id: "tabac_equiv_roule", type: "fill_in", enonce: "1 cigarette de tabac roulé = ? cigarettes industrielles", reponse_attendue: "≈ 2 à 3 cigarettes industrielles", mots_cles: ["2", "3", "deux", "trois"], explication: null, reference: null },
            { id: "tabac_equiv_joint", type: "fill_in", enonce: "1 joint de THC = ? cigarettes industrielles", reponse_attendue: "≈ 3 à 5 cigarettes (en termes d'exposition aux goudrons)", mots_cles: ["3", "5"], explication: "Attention : le joint expose à la fois aux goudrons du tabac et au THC. Mode d'inhalation plus profond que la cigarette.", reference: null },
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
            { id: "cannabis_urinaire", type: "fill_in", enonce: "Temps de positivité des tests urinaires au cannabis", reponse_attendue: "Consommation occasionnelle : 3-7 jours. Consommation chronique intensive : jusqu'à 1 mois ou plus (stockage dans le tissu adipeux).", mots_cles: ["30", "mois", "semaines"], explication: null, reference: null },
            { id: "cannabis_pec", type: "texte_libre", enonce: "Prises en charge proposées pour le cannabis", reponse_attendue: "Pas de pharmacothérapie spécifique validée. TCC, entretien motivationnel, thérapies familiales (ados). Gestion symptomatique du sevrage (anxiolytiques courte durée, hypnotiques courte durée, mélatonine). Approches complémentaires USCA : hypnose, acupuncture, TRV.", explication: null, reference: null },
            { id: "cannabis_rdr", type: "texte_libre", enonce: "Conseils de réduction des risques", reponse_attendue: "Éviter le mélange avec le tabac (préférer vapo), ne pas consommer en conduisant, ne pas consommer avant 21 ans (maturation cérébrale), éviter si ATCD psychotique perso ou familial, espacer les consommations, ne pas mélanger avec d'autres produits.", explication: null, reference: null }
          ]
        }
      ]
    },

    {
      id: "cocaine",
      titre: "Cocaïne",
      icone: "❄️",
      sections: [
        {
          titre: "Cocaïne — vrai / faux",
          questions: [
            { id: "coc_fatigue", type: "vrai_faux", enonce: "La cocaïne permet de résister à la fatigue", reponse_attendue: "vrai", explication: "Stimulant puissant, inhibe la recapture de dopamine/NA. Mais effet transitoire, « descente » épuisante.", reference: null },
            { id: "coc_intellect", type: "vrai_faux", enonce: "La cocaïne permet de briller intellectuellement", reponse_attendue: "faux", explication: "Sensation subjective de performance mais les fonctions exécutives sont en réalité altérées en phase d'intoxication comme en phase de descente.", reference: null },
            { id: "coc_agressivite", type: "vrai_faux", enonce: "La cocaïne peut rendre agressif", reponse_attendue: "vrai", explication: "Risque d'agitation, idées paranoïaques, impulsivité, passages à l'acte. Majoré en cas de polyconsommation (alcool ++).", reference: null }
          ]
        },
        {
          titre: "Cocaïne — complications",
          questions: [
            { id: "coc_cv", type: "texte_libre", enonce: "Principal risque cardiovasculaire", reponse_attendue: "Syndrome coronarien aigu (infarctus) par spasme coronaire ± thrombose. Y compris chez sujet jeune sans ATCD. Toute douleur thoracique chez consommateur de cocaïne = urgence cardiologique.", explication: "Autres : troubles du rythme, HTA sévère, dissection aortique, AVC.", reference: null },
            { id: "coc_alcool", type: "texte_libre", enonce: "Risque spécifique du mélange cocaïne + alcool", reponse_attendue: "Formation de cocaéthylène (métabolite hépatique), plus cardiotoxique que la cocaïne seule, demi-vie plus longue. Majore le risque cardiovasculaire et la toxicité hépatique.", explication: null, reference: null },
            { id: "coc_baser", type: "texte_libre", enonce: "Que signifie « baser la cocaïne » ?", reponse_attendue: "Transformer la cocaïne chlorhydrate (poudre) en base libre (« crack » ou « free-base »), fumable. Procédé : mélange avec bicarbonate ou ammoniaque + chauffage. Effet plus rapide, plus intense, mais plus court → potentiel addictif majoré.", explication: null, reference: null },
            { id: "coc_rdr", type: "texte_libre", enonce: "Conseils de réduction des risques", reponse_attendue: "Matériel à usage unique (paille, embout, kit base), ne pas partager le matériel (risque VHC), éviter le mélange avec alcool, hydratation, doses fractionnées, tester le produit, éviter injection.", explication: null, reference: { label: "SFA 2025 — Guide cocaïne", path: "/mnt/project/SFA_2025__Guide_sur_les_usages_de_cocaïne.pdf" } }
          ]
        }
      ]
    },

    {
      id: "mdma",
      titre: "Ecstasy / MDMA",
      icone: "💊",
      sections: [
        {
          titre: "MDMA",
          questions: [
            { id: "mdma_dependance", type: "vrai_faux", enonce: "On peut être dépendant à l'ecstasy", reponse_attendue: "vrai", explication: "Dépendance psychologique possible (moins fréquente que pour cocaïne/opioïdes). Tolérance rapide. Usage répété → déplétion sérotoninergique.", reference: null },
            { id: "mdma_diff", type: "texte_libre", enonce: "Différence entre ecstasy et MDMA", reponse_attendue: "MDMA (3,4-méthylènedioxyméthamphétamine) = molécule pure. « Ecstasy » = comprimé vendu comme contenant de la MDMA, mais contenu souvent incertain (MDMA en concentrations variables, ou autres produits : caféine, amphétamines, MDA, cathinones…).", explication: null, reference: null },
            { id: "mdma_bruxisme", type: "texte_libre", enonce: "Qu'est-ce que le bruxisme ?", reponse_attendue: "Contractions involontaires des muscles masticateurs → grincement/serrement des dents. Effet fréquent de la MDMA et des stimulants en général.", explication: null, reference: null }
          ]
        }
      ]
    },

    {
      id: "cathinones",
      titre: "Cathinones / NPS",
      icone: "💎",
      sections: [
        {
          titre: "Cathinones et chemsex",
          questions: [
            { id: "cath_type", type: "qcm_single", enonce: "Les cathinones sont principalement :", choix: [{ id: "a", label: "Stimulants" }, { id: "b", label: "Hypnotiques" }], reponse_attendue: "a", explication: "Cathinones = dérivés synthétiques de la cathinone (stimulant naturel du khat). Effets type amphétamines/cocaïne.", reference: null },
            { id: "cath_exemples", type: "texte_libre", enonce: "Quelques exemples de cathinones", reponse_attendue: "3-MMC (3-méthylméthcathinone), 4-MMC (mephédrone), 3-CMC, alpha-PVP, MDPV…", explication: null, reference: null },
            { id: "cath_utilisations", type: "texte_libre", enonce: "Utilisations principales des cathinones", reponse_attendue: "Contexte festif (dancefloors), chemsex (souvent associé à GHB, ICE, kétamine), usages solitaires (isolement, dépression). Voies : sniff, per os, injection (slam).", explication: null, reference: null },
            { id: "cath_chemsex", type: "texte_libre", enonce: "Chemsex et Slam : définition et différence", reponse_attendue: "Chemsex = usage de drogues (cathinones, GHB, crystal meth, ICE, kétamine) dans un contexte sexuel, principalement chez HSH. Slam = chemsex avec injection intraveineuse des produits (sous-ensemble du chemsex, risques majorés : overdose, VIH/VHC/VHB, septicémies).", explication: null, reference: null }
          ]
        }
      ]
    },

    {
      id: "ghb",
      titre: "GHB / GBL",
      icone: "💧",
      sections: [
        {
          titre: "GHB / GBL",
          questions: [
            { id: "ghb_diff", type: "texte_libre", enonce: "Différence entre GHB et GBL", reponse_attendue: "GHB (acide gamma-hydroxybutyrique) = molécule active. GBL (gamma-butyrolactone) = précurseur, transformé en GHB in vivo par les lactonases hépatiques. GBL plus puissant à dose égale, action plus rapide.", explication: null, reference: null },
            { id: "ghb_ghole", type: "texte_libre", enonce: "Qu'est-ce que le G-hole ?", reponse_attendue: "Surdosage en GHB/GBL → perte de conscience brutale, coma, dépression respiratoire. Fenêtre thérapeutique étroite entre effet recherché et overdose. Aucun antagoniste. Aggravé par l'association à l'alcool ou aux dépresseurs.", explication: "Urgence vitale. Surveillance en réa si nécessaire. Pas de naloxone efficace.", reference: null }
          ]
        }
      ]
    },

    {
      id: "heroine",
      titre: "Héroïne",
      icone: "💉",
      sections: [
        {
          titre: "Héroïne",
          questions: [
            { id: "hero_dep", type: "vrai_faux", enonce: "On peut être dépendant à l'héroïne", reponse_attendue: "vrai", explication: "Pouvoir addictif majeur (agoniste μ puissant). Dépendance physique installée en quelques semaines d'usage régulier.", reference: null },
            { id: "hero_forme", type: "texte_libre", enonce: "Formes et voies de consommation", reponse_attendue: "Poudre brune (brown sugar) ou blanche. Voies : sniff, inhalation (« chasser le dragon »), injection IV (principale). Injection = risque max (overdose, VIH, VHC).", explication: null, reference: null },
            { id: "hero_speedball", type: "fill_in", enonce: "Mélange héroïne + cocaïne =", reponse_attendue: "Speedball", mots_cles: ["speedball", "speed-ball"], explication: "Association particulièrement risquée : cocaïne masque les signes d'overdose aux opioïdes, et inversement.", reference: null },
            { id: "hero_iv", type: "texte_libre", enonce: "Principaux risques liés à l'injection IV", reponse_attendue: "Overdose (dépression respiratoire), infections : VIH, VHC, VHB (matériel partagé), septicémies, endocardites, abcès cutanés, cellulites, phlébites, emboles pulmonaires septiques.", explication: null, reference: null },
            { id: "hero_overdose", type: "texte_libre", enonce: "Traitement d'une overdose opioïde", reponse_attendue: "Naloxone (Narcan, Prenoxad, Nalscue IN). Antagoniste compétitif des récepteurs opioïdes. Dose : 0,4 à 2 mg IM/IV/SC, répétable. Action rapide (2-5 min) mais courte (30-90 min) → risque de rebond si opioïde longue durée.", explication: "À l'USCA / ELSA, former les patients et proches à l'usage de la naloxone nasale (RdR).", reference: null },
            { id: "hero_rdr", type: "texte_libre", enonce: "Conseils de réduction des risques", reponse_attendue: "Ne pas consommer seul, matériel à usage unique (kit injection CAARUD), rotation des points d'injection, test du produit, doses fractionnées, disposer de naloxone, TSO si dépendance installée, dépistage VIH/VHC/VHB régulier, vaccination VHB.", explication: null, reference: null }
          ]
        }
      ]
    },

    {
      id: "medicaments",
      titre: "Médicaments à risque de dépendance",
      icone: "💊",
      sections: [
        {
          titre: "Benzodiazépines et opioïdes",
          questions: [
            {
              id: "med_tableau",
              type: "table_fill",
              enonce: "Compléter le tableau",
              colonnes: ["Classe", "Indications", "Principaux médicaments", "Syndrome de sevrage"],
              lignes: [
                { id: "bzd_hypno", cellules: ["BZD hypnotiques", "", "", ""], reponse_attendue: "Insomnie. Ex : zolpidem (Stilnox), zopiclone (Imovane), lormétazépam (Noctamide). Sevrage : rebond d'insomnie, anxiété, cauchemars, tremblements, crises comitiales." },
                { id: "bzd_anxio", cellules: ["BZD anxiolytiques", "", "", ""], reponse_attendue: "Anxiété. Ex : alprazolam (Xanax), oxazépam (Séresta), bromazépam (Lexomil), diazépam (Valium). Sevrage : anxiété de rebond, tremblements, insomnie, crises comitiales (si sevrage brutal)." },
                { id: "morph", cellules: ["Morphiniques et dérivés", "", "", ""], reponse_attendue: "Douleur. Ex : morphine, oxycodone, tramadol, codéine, fentanyl. Sevrage : syndrome neurovégétatif (mydriase, rhinorrhée, larmoiement, sueurs, piloérection, myalgies, diarrhée, bâillements, irritabilité, craving)." }
              ],
              explication: null,
              reference: { label: "HAS 2015 — Arrêt BZD", path: "/mnt/project/HAS_2015__Fiche_Arrêt_BZD.pdf" }
            }
          ]
        }
      ]
    },

    {
      id: "tso",
      titre: "Traitements de substitution (TSO)",
      icone: "🏥",
      sections: [
        {
          titre: "TSO",
          questions: [
            { id: "tso_definition", type: "texte_libre", enonce: "Qu'est-ce qu'un traitement de substitution ?", reponse_attendue: "Traitement médicamenteux prescrit aux personnes dépendantes aux opioïdes, consistant à remplacer l'opioïde illicite (héroïne) par un opioïde médicamenteux, à longue durée d'action, administré par voie orale, permettant de stabiliser le patient, de supprimer le craving et le syndrome de sevrage, et de prévenir l'overdose. Deux molécules : méthadone et buprénorphine.", explication: null, reference: { label: "HAS 2022 — Fiche TSO", path: "/mnt/project/HAS_2022__Fiche_TSO.pdf" } },
            { id: "tso_antagoniste", type: "fill_in", enonce: "Antagoniste des opioïdes", reponse_attendue: "Naloxone (courte durée, urgence) et naltrexone (longue durée, prévention de rechute)", mots_cles: ["naloxone", "naltrexone"], explication: null, reference: null },
            { id: "tso_elsa_hopital", type: "texte_libre", enonce: "Informations à récupérer par l'ELSA et règles lors d'une ouverture de stock à l'hôpital pour un TSO", reponse_attendue: "Infos : identité prescripteur habituel (médecin traitant, CSAPA, CAARUD), dernière prescription (photo/fax), dernière dispensation pharmacie (date, dose), galénique habituelle, dose habituelle, ancienneté. Règles : appel du prescripteur et/ou de la pharmacie, double vérification de la dose, prescription hospitalière conforme, dispensation contrôlée, organiser la continuité à la sortie.", explication: null, reference: null },
            {
              id: "tso_tableau",
              type: "table_fill",
              enonce: "Compléter le tableau TSO",
              colonnes: ["Molécule", "Indications", "Prescription hors hôpital", "Formes et voies"],
              lignes: [
                { id: "metha", cellules: ["Méthadone", "", "", ""], reponse_attendue: "Dépendance opioïdes modérée à sévère. Primo-prescription : CSAPA ou établissement de santé uniquement. Relais ville possible après stabilisation (médecin de ville formé). Sirop (flacon unidose) ou gélules. Voie orale exclusivement. Délivrance pharmacie : 14 jours max." },
                { id: "bupre", cellules: ["Buprénorphine (Subutex, génériques)", "", "", ""], reponse_attendue: "Dépendance opioïdes. Primo-prescription possible par tout médecin (pas de cadre CSAPA obligatoire). Comprimés sublinguaux. Délivrance pharmacie : 28 jours max. Agoniste partiel μ + antagoniste κ." },
                { id: "suboxone", cellules: ["Suboxone (buprénorphine + naloxone)", "", "", ""], reponse_attendue: "Même indication que Subutex. Association buprénorphine + naloxone. Naloxone inactive par voie sublinguale mais active en cas d'injection (détournement) → effet aversif. Mêmes règles de prescription que Subutex." }
              ],
              explication: null,
              reference: null
            }
          ]
        }
      ]
    },

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

    {
      id: "questionnaires",
      titre: "Questionnaires en addictologie",
      icone: "📋",
      sections: [
        {
          titre: "Outils d'évaluation",
          questions: [
            {
              id: "quest_tableau",
              type: "table_fill",
              enonce: "Pour chaque questionnaire : utilisé pendant ton stage ? indication ? population concernée ?",
              colonnes: ["Questionnaire", "Utilisé ?", "Indication", "Population"],
              lignes: [
                { id: "audit", cellules: ["AUDIT (Alcool)", "", "", ""], reponse_attendue: "10 items. Repérage consommation à risque, nocive, dépendance à l'alcool. Tout adulte. Seuils H ≥ 8 / F ≥ 7." },
                { id: "rpib", cellules: ["RPIB", "", "", ""], reponse_attendue: "Repérage Précoce et Intervention Brève. Démarche complète de dépistage + intervention motivationnelle. Tout adulte consultant (médecine générale, urgences)." },
                { id: "depado", cellules: ["DEP-ADO", "", "", ""], reponse_attendue: "Grille de dépistage cannabis et autres substances chez adolescents. 7 items. Évalue sévérité de l'usage." },
                { id: "canditox", cellules: ["CANDITOX", "", "", ""], reponse_attendue: "Test de dépendance au cannabis. À compléter." },
                { id: "fagerstrom", cellules: ["Fagerström", "", "", ""], reponse_attendue: "Test de dépendance à la nicotine. 6 items. Score 0-10. Dépendance forte ≥ 7." },
                { id: "hyperemese", cellules: ["Hyperémèse cannabique", "", "", ""], reponse_attendue: "Critères de diagnostic du syndrome d'hyperémèse cannabique (CHS) : consommation cannabique chronique, vomissements cycliques, soulagement par douches chaudes. À confirmer dans le DSM/CIM." }
              ],
              explication: null,
              reference: { label: "Toolbox — Scores", path: "/staff/toolbox.html#scores" }
            }
          ]
        }
      ]
    }
  ]
};

// Export global pour usage dans etudiant/index.html
if (typeof window !== 'undefined') {
  window.LIVRET_IFSI = LIVRET_IFSI;
}
```

**Note importante** : le contenu ci-dessus est un premier jet structurel. Les réponses marquées « À rédiger » et toutes les autres doivent être **relues et validées par JC avant publication**. Certaines réponses ont été rédigées sur la base du Référentiel USCA et des recos HAS du projet, d'autres restent à compléter.

---

## 7. PHASE 2 — VUE TUTEUR IDE

**Modèle tuteur** : TOUS les profils `role = 'ide'` sont tuteurs par défaut. Pas de flag supplémentaire. L'assignation d'une IDE à une étudiante se fait via le champ `tuteur_id` de la table `etudiants_stages` (chaque étudiante a UNE tutrice désignée en début de stage), mais toute IDE peut consulter la progression de n'importe quelle étudiante (pour assurer la continuité quand la tutrice référente est absente).

### 7.1. Migration SQL (`migrations/supabase-migration-v15.sql`)

> **Note** : cette migration est exécutée dès la P1 (les tables sont nécessaires à la persistance). Elle est présentée ici pour regrouper tout ce qui concerne le modèle de données.

```sql
-- v15 : module étudiantes IDE en stage
-- Toutes les IDE (role = 'ide') sont tutrices par défaut : pas de flag spécifique.

-- Table des stages
CREATE TABLE etudiants_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ifsi_origine TEXT,
  promo TEXT,
  annee_formation INT CHECK (annee_formation BETWEEN 1 AND 3),
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  tuteur_id UUID REFERENCES profiles(id), -- IDE référente désignée à l'admission
  statut TEXT DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'abandonne')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Progression : une ligne par question répondue
CREATE TABLE etudiant_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID REFERENCES etudiants_stages(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  chapitre_id TEXT NOT NULL,
  reponse_etudiant TEXT,
  reponse_json JSONB, -- pour QCM multi, tableaux
  vu_tuteur BOOLEAN DEFAULT false,
  vu_par UUID REFERENCES profiles(id), -- quelle IDE a coché « vu »
  vu_le TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(stage_id, question_id)
);

-- RLS
ALTER TABLE etudiants_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE etudiant_progression ENABLE ROW LEVEL SECURITY;

-- L'étudiante voit son propre stage
CREATE POLICY "etudiant_voit_son_stage" ON etudiants_stages
  FOR SELECT USING (auth.uid() = user_id);

-- Toute IDE voit tous les stages (pour continuité pédagogique quand la tutrice référente est absente)
CREATE POLICY "ide_voit_tous_stages" ON etudiants_stages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ide')
  );

-- Médecins voient aussi (encadrement global du stage)
CREATE POLICY "medecin_voit_tous_stages" ON etudiants_stages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'medecin')
  );

-- Admin : tout
CREATE POLICY "admin_tout_voir_stages" ON etudiants_stages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- L'étudiante gère sa progression (lecture + upsert)
CREATE POLICY "etudiant_gere_sa_progression" ON etudiant_progression
  FOR ALL USING (
    EXISTS (SELECT 1 FROM etudiants_stages WHERE id = stage_id AND user_id = auth.uid())
  );

-- Toute IDE voit toutes les progressions
CREATE POLICY "ide_voit_progression" ON etudiant_progression
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ide')
  );

-- Toute IDE peut cocher « vu » (UPDATE restreint aux colonnes vu_tuteur/vu_par/vu_le via trigger ou contrôle applicatif)
CREATE POLICY "ide_valide_progression" ON etudiant_progression
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ide')
  );

-- Médecins : lecture progression
CREATE POLICY "medecin_voit_progression" ON etudiant_progression
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'medecin')
  );

CREATE INDEX idx_progression_stage ON etudiant_progression(stage_id);
CREATE INDEX idx_progression_chapitre ON etudiant_progression(stage_id, chapitre_id);
CREATE INDEX idx_stages_tuteur ON etudiants_stages(tuteur_id);
CREATE INDEX idx_stages_statut ON etudiants_stages(statut);
```

### 7.2. Vue « Mes étudiantes » dans `admin/index.html`

Nouvel onglet dans le dashboard soignant, visible dès que `profile.role === 'ide'`.

**Liste principale** :
- Deux sections : « Mes étudiantes » (celles dont `tuteur_id = moi`) et « Toutes les étudiantes en stage » (vue globale, statut `en_cours`).
- Pour chaque étudiante : prénom nom, IFSI, année, dates, barre de progression globale, badge « X questions à revoir avec elle » (= questions répondues mais `vu_tuteur = false`).

**Vue détail d'une étudiante** (clic sur sa carte) :
- En-tête : identité, dates, tutrice référente.
- Progression par chapitre (accordéons dépliables).
- Dans chaque chapitre : liste des questions répondues, filtrable (`Toutes` / `Non vues` / `Vues`).
- Pour chaque question : énoncé, réponse de l'étudiante, réponse attendue, bouton « ✓ Marquer comme vu » (met à jour `vu_tuteur = true, vu_par = auth.uid(), vu_le = now()`).
- Zone commentaire libre (table optionnelle `progression_commentaires` — à prévoir si besoin, sinon skip en P2).

**Ne PAS inclure en P2** : les études de cas (arrivent en P3), le bilan final (P4).

### 7.3. Vue médecin

Les médecins (`role = 'medecin'`) ont aussi accès à la vue « Étudiantes en stage » en lecture seule, pour suivre la formation pendant le stage et échanger avec l'équipe IDE.

---

## 8. PHASE 3 — ÉTUDES DE CAS

Cette phase ajoute l'onglet **[Cas cliniques]** au dashboard étudiante + les études de cas dans la vue IDE existante (section 7.2, étendue).

### 8.1. Table études de cas

```sql
-- Ajouter dans migrations/supabase-migration-v16.sql

CREATE TABLE etudes_cas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID REFERENCES etudiants_stages(id) ON DELETE CASCADE NOT NULL,
  titre TEXT NOT NULL,
  type_cas TEXT CHECK (type_cas IN ('pre_redige', 'vecu_stage')),
  cas_catalogue_id TEXT, -- si type_cas = 'pre_redige', id du cas dans la bibliothèque JSON
  contexte TEXT CHECK (contexte IN ('liaison', 'urgences', 'usca', 'autre')),
  substance_principale TEXT,
  contenu_json JSONB, -- {motif, evaluation, cat_immediate, orientation, rdr, reflexion}
  statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'soumis', 'valide', 'a_revoir')),
  commentaire_tuteur TEXT,
  valide_par UUID REFERENCES profiles(id),
  valide_le TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE etudes_cas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "etudiant_gere_ses_cas" ON etudes_cas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM etudiants_stages WHERE id = stage_id AND user_id = auth.uid())
  );
CREATE POLICY "ide_voit_et_valide_cas" ON etudes_cas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ide')
  );
CREATE POLICY "medecin_voit_cas" ON etudes_cas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'medecin')
  );

CREATE INDEX idx_etudes_cas_stage ON etudes_cas(stage_id);
CREATE INDEX idx_etudes_cas_statut ON etudes_cas(statut);
```

### 8.2. Bibliothèque de cas pré-rédigés (`shared/livret-ifsi-cas.js`)

10 cas types suggérés, à valider avec JC :

1. Liaison hépato — cirrhose alcoolique décompensée demandant un sevrage
2. Liaison urgences — intoxication aiguë MDMA + cocaïne + alcool
3. USCA — sevrage alcool simple avec ATCD DT
4. USCA — sevrage opioïdes et introduction méthadone
5. Liaison urgences — overdose héroïne avec naloxone
6. Liaison psychiatrie — patient TDAH + cocaïne, majoration de l'impulsivité
7. Liaison médecine — chemsex avec cathinones et GHB
8. USCA — patient borderline + alcool, gestion de la crise
9. Liaison obstétrique — grossesse + TSO (méthadone ou BHD ?)
10. Liaison urgences — refus de soins chez un patient alcoolique en pré-DT

Format de chaque cas dans le JSON :

```javascript
{
  id: "cas_hepato_cirrhose",
  titre: "Cirrhose alcoolique décompensée",
  contexte: "liaison",
  substance: "Alcool",
  vignette: "Un patient de la cinquantaine, connu pour une cirrhose alcoolique Child-Pugh B, est hospitalisé en hépatologie pour décompensation œdémato-ascitique. Il déclare consommer 1 L de vin/jour depuis 30 ans. Il demande à arrêter...",
  questions: [
    { id: "motif", label: "Motif d'intervention ELSA", indice: "..." },
    { id: "evaluation", label: "Éléments à évaluer lors du premier entretien", indice: "..." },
    { id: "cat", label: "CAT immédiate (48 premières heures)", indice: "..." },
    { id: "orientation", label: "Orientation à la sortie d'hépato", indice: "..." },
    { id: "rdr", label: "Messages de réduction des risques", indice: "..." }
  ],
  corrige: { /* réponses attendues pour auto-correction ou débriefing */ }
}
```

### 8.3. Onglet étudiante « Cas cliniques »

Deux sections :

**A. Cas proposés** — bibliothèque des 10 cas. L'étudiante choisit, lit la vignette, répond aux 5 questions. Bouton « Voir le corrigé » révèle les points clés attendus.

**B. Mes cas vécus** — l'étudiante peut rédiger un cas rencontré pendant son stage.

- Bouton « Rédiger un nouveau cas vécu » ouvre un formulaire structuré (5 champs correspondant aux 5 questions + champ « Contexte » + champ « Substance principale »).
- **Bandeau rouge persistant en haut du formulaire** : rappel d'anonymisation obligatoire — pas de prénom, pas d'âge exact (dire « la trentaine », « la soixantaine »), pas de numéro de chambre, pas de date précise (dire « en début de stage », « semaine dernière »), pas de détail identifiant (profession précise, ville, etc.).
- Statuts : `brouillon` (modifiable par l'étudiante) → `soumis` (envoyé à la tutrice, plus modifiable) → `valide` ou `a_revoir` (avec commentaire).
- Si `a_revoir` : l'étudiante voit le commentaire, peut repasser en brouillon pour modifier, puis re-soumettre.

### 8.4. Workflow validation IDE

Extension de la vue « Mes étudiantes » (section 7.2) :

- Badge sur la carte de l'étudiante : « X cas à valider » (statut `soumis`).
- Dans la vue détail, nouvel onglet « Études de cas » listant tous les cas de cette étudiante.
- Pour chaque cas `soumis` : affichage complet + champ commentaire + 3 boutons :
  - **Valider** → statut `valide`, `valide_par = moi`, `valide_le = now()`.
  - **Demander reprise** → statut `a_revoir`, commentaire obligatoire.
  - **Ouvrir en anonymisation** → vérification des règles d'anonymisation (si problème, passe en `a_revoir` avec commentaire type « anonymisation insuffisante, reformuler… »).

Toute IDE peut valider, pas seulement la tutrice référente (permet continuité quand la tutrice est absente).

---

## 9. PHASE 4 — BILAN ET PORTFOLIO PDF

### 9.1. Auto-évaluation fin de stage

Dans le dashboard étudiante, nouvel onglet **[Bilan]** (visible uniquement quand `date_fin < aujourd'hui + 7 jours` ou bouton manuel « Ouvrir le bilan »). Trois champs texte libre :
- Acquis principaux pendant le stage.
- Points restant flous / à approfondir.
- Situation clinique la plus marquante (anonymisée).

### 9.2. Commentaire tuteur

Nouvelle table :

```sql
CREATE TABLE bilans_stage (
  stage_id UUID PRIMARY KEY REFERENCES etudiants_stages(id) ON DELETE CASCADE,
  auto_eval_acquis TEXT,
  auto_eval_a_approfondir TEXT,
  auto_eval_situation_marquante TEXT,
  commentaire_tuteur TEXT,
  tuteur_signataire_id UUID REFERENCES profiles(id),
  signe_le TIMESTAMPTZ,
  portfolio_genere_le TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bilans_stage ENABLE ROW LEVEL SECURITY;
-- L'étudiante édite son auto-éval ; les IDE éditent le commentaire tuteur
-- (policies similaires aux précédentes)
```

Depuis la vue « Mes étudiantes » du dashboard IDE, onglet « Bilan » : champ texte + bouton « Signer et finaliser » → verrouille le commentaire, enregistre `tuteur_signataire_id` et `signe_le`. Toute IDE peut signer (pas uniquement la tutrice référente).

### 9.3. Export PDF portfolio

Bouton « Exporter mon portfolio » visible dans l'onglet Bilan de l'étudiante, accessible uniquement une fois le commentaire tuteur signé. Génère un PDF A4 complet :

- Page de garde : identité étudiante, dates stage, IDE tutrice référente, IDE signataire du bilan, logo USCA.
- Sommaire.
- Par chapitre : questions + réponses étudiante. Les réponses attendues peuvent être mises en annexe (case cochable à l'export).
- Études de cas validées (uniquement les statuts `valide`).
- Bilan : auto-évaluation étudiante + commentaire tuteur signé.
- Footer USCA Pitié-Salpêtrière + numérotation.

Format graphique identique aux PDFs post-cure.

---

## 10. UI / UX — QUELQUES POINTS CRITIQUES

### 10.1. Charte visuelle

Respecter V2 :
- Primaire : indigo `#4F46E5` (boutons d'action, navigation)
- Succès : émeraude `#10B981` (réponse correcte, validation tuteur)
- Alerte : rouge `#EF4444` (mais usage très parcimonieux — pas pour signaler une erreur à l'étudiante, trop punitif ; préférer ambre pour « à compléter »)
- Fond : slate `#F8FAFC`
- Ambre pour « partiel / à compléter » : `#F59E0B`

### 10.2. Ton rédactionnel

- Pas de « Bravo ! », pas de « Tu as réussi ! » — ton sobre.
- Pour une réponse juste : « Réponse correcte. » + explication.
- Pour une réponse approximative : « Réponse partielle — compléter avec : … ».
- Pour une réponse incorrecte : « Réponse attendue : … » (sans ton moralisateur).
- Les explications cliniques commencent toujours par le fond pédagogique, pas par un jugement.

### 10.3. Accessibilité mobile

- Tout doit tenir en portrait sur iPhone SE (largeur 375px).
- Onglets scrollables horizontalement si trop nombreux.
- Tap target minimum 44x44 px.
- Typographie : taille de base 16px, pas moins.

### 10.4. Dark mode

Compatibilité obligatoire avec le dark mode USCA Connect. Utiliser les variables CSS existantes de `shared/theme.css`.

---

## 11. RÈGLES DE DÉVELOPPEMENT (rappel PROJET.md)

- ❌ Ne JAMAIS réécrire un fichier en entier (édits chirurgicaux uniquement).
- ❌ Ne JAMAIS exposer la `service_role` key côté client.
- ❌ Ne JAMAIS bloquer l'accès soignant existant.
- ✅ Incrémenter `CACHE_NAME` dans `sw.js` à CHAQUE modification de fichier servi.
- ✅ Ajouter les nouveaux fichiers (`etudiant/index.html`, `shared/livret-ifsi-*.js`) à la liste des URLs précachées dans `sw.js`.
- ✅ Faire un commit propre par phase, dire « Push ! » à JC.
- ✅ Client Git : GitHub Desktop (pas de commande `git` en CLI).
- ✅ Français partout (UI, commentaires, données).

---

## 12. QUESTIONS OUVERTES À TRANCHER AVANT P1

Ces questions doivent recevoir une réponse de JC avant de commencer le code :

1. **Comptes étudiantes** : comment sont créés les emails des étudiantes ? Email AP-HP personnel, email IFSI d'origine, ou convention interne type `etudiant.prenom.nom@usca.local` (non envoyé, juste identifiant) ?
2. **Contenu pédagogique** : relu/validé par JC seul avant publication, ou relecture partagée avec les 3 IDE (Di Cicco / Vatan-Jallier / Bonnamy) ?
3. **Cas pré-rédigés** (P3) : la liste de 10 proposée te convient ou à ajuster ?
4. **Anonymisation des cas vécus** : simple validation IDE, ou double regard médecin obligatoire en plus ?
5. **Portfolio** : usage strict interne USCA ou transmissible à l'IFSI d'origine comme preuve de compétences ?
6. **Devenir du livret papier** : substitution complète ou cohabitation (les étudiantes récalcitrantes à l'outil numérique gardent le papier) ?
7. **Accueil nouvelle étudiante** : le livret commence rempli (accueil pré-rempli avec présentation du service), ou totalement vierge et elle lit la présentation en premier onglet ?

---

## 13. LIVRABLES ATTENDUS DE CLAUDE CODE — PHASE 1

À la fin de la P1, les éléments suivants doivent exister et fonctionner :

### Base de données
- [x] `migrations/supabase-migration-v15.sql` exécutée sur Supabase
- [x] Tables `etudiants_stages` et `etudiant_progression` créées avec RLS active
- [x] Policies testées : une étudiante ne voit que son stage, toute IDE voit tout

### Frontend
- [x] `shared/livret-ifsi-contenu.js` avec la structure JSON complète (réponses à compléter par JC pour les items « À rédiger »)
- [x] `shared/livret-ifsi-pdf.js` (génération PDF jsPDF basique)
- [x] `etudiant/index.html` : SPA fonctionnelle avec 14 onglets (accueil + lexique + 8 substances + médicaments + TSO + motivation + questionnaires), auto-correction des 6 types de questions, barre de progression, export PDF
- [x] Carte « 📘 Livret IFSI (aperçu soignant) » ajoutée dans `staff/toolbox.html` (mode `?preview=1`)
- [x] `shared/supabase.js` : helpers CRUD pour `etudiants_stages` et `etudiant_progression`

### Auth et redirection
- [x] `shared/auth.js` : redirection `etudiant_ide` → `/etudiant/index.html`
- [x] Formulaire création étudiante dans `admin/index.html` (nom, prénom, email, mot de passe, IFSI, promo, année, dates, IDE tutrice)
- [x] Création synchrone du compte Auth + profil + stage à l'admission

### Technique
- [x] `sw.js` mis à jour (CACHE_NAME bumpé à v3.65, nouveaux fichiers précachés)
- [x] Test mobile : tout fonctionne sur iPhone SE (portrait)
- [x] Test dark mode : tout lisible
- [x] Un commit propre avec message descriptif

### Commit P1 attendu
```
feat: module Livret IFSI P1 — socle fonctionnel

- Migration Supabase v15 : tables etudiants_stages + etudiant_progression + RLS
- Nouveau dossier etudiant/ avec dashboard SPA
- Contenu pédagogique JSON (shared/livret-ifsi-contenu.js) — 14 chapitres
- Auto-correction des 6 types de questions (fill_in, qcm, vrai/faux, tableaux, texte libre)
- Persistance Supabase (upsert debounced 500ms, fallback localStorage)
- Auth : redirection rôle etudiant_ide → /etudiant/index.html
- Création étudiante depuis l'admin avec assignation IDE tutrice
- Export PDF basique (jsPDF)
- Carte Livret IFSI dans la Toolbox (mode preview pour soignants)
- SW v3.65
```

---

## 14. APRÈS P1 — POINT DE CONTRÔLE AVEC JC

Ne PAS enchaîner sur P2 sans validation de JC. Présenter en démo :
- Création d'une étudiante de test depuis l'admin.
- Login de cette étudiante et parcours complet d'un chapitre (ex : Alcool).
- Vérification que la progression est bien persistée (déconnexion / reconnexion).
- Export PDF d'exemple.
- Affichage mobile + dark mode.

Attendre les retours de JC, itérer si besoin, puis seulement démarrer P2 (vue tuteur IDE dans `admin/index.html`).

---

**Fin du document d'implémentation.**
