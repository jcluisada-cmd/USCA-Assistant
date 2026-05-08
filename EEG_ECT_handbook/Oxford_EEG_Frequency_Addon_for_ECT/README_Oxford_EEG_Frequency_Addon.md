# Add-on Oxford EEG Frequency — éléments pertinents pour USCA Connect EEG/ECT

## Verdict

Le livre **The Oxford Handbook of EEG Frequency** n’est pas un manuel clinique d’interprétation EEG. Il est surtout orienté recherche : analyses fréquentielles, oscillations, puissance spectrale, connectivité, méthodes temps-fréquence, cognition, psychiatrie expérimentale et stimulation cérébrale.

Pour le projet **EEG/ECT destiné à un interne de psychiatrie**, la majorité du PDF est donc **peu utile** ou **trop avancée**.

J’ai retenu uniquement les éléments non redondants et réellement exploitables en fiches PWA :

1. **Chapitre 1 — Methods for Collecting EEG Data for Frequency Analyses in Humans**
2. **Chapitre 17 — Frequency Characteristics of Sleep**

---

## Pourquoi ces chapitres sont pertinents

### 1. Chapitre 1 — Méthodes et bases fréquentielles

Fichier extrait :

```txt
chapters/01_Oxford_Ch01_Methods_for_Collecting_EEG_Data_for_Frequency_Analyses.pdf
```

Intérêt pour le projet :

- définit clairement **fréquence**, **puissance** et **phase**
- rappelle les bandes principales :
  - delta
  - theta
  - alpha
  - beta
  - gamma
- explique de façon courte la base physiologique du signal EEG
- rappelle l’intérêt majeur de l’EEG :
  - excellente résolution temporelle
  - faible résolution spatiale
- résume les artefacts fréquents :
  - EMG
  - mouvements oculaires
  - bruit électrique
- peut enrichir la fiche : **“Comprendre un EEG en 10 minutes”**

Utilisation recommandée :

- ne pas créer une fiche séparée complète
- extraire 1 encadré très court dans la fiche technique :
  - “Fréquence = cycles/seconde”
  - “Puissance = amplitude au carré”
  - “Phase = position dans le cycle”
  - “EEG = très bon pour le quand, mauvais pour le où”

---

### 2. Chapitre 17 — Fréquences du sommeil

Fichier extrait :

```txt
chapters/17_Oxford_Ch17_Frequency_Characteristics_of_Sleep.pdf
```

Intérêt pour le projet :

Ce chapitre est pertinent pour l’ECT car un interne doit éviter de confondre :

- somnolence physiologique
- sommeil N1/N2/N3
- variants bénins du sommeil
- ralentissement pathologique
- encéphalopathie
- activité épileptiforme

Il complète utilement les fiches déjà prévues sur :

- EEG normal
- artefacts
- activité épileptiforme
- ICU EEG

Utilisation recommandée :

Créer une mini-fiche PWA :

```txt
Sommeil, somnolence et variants bénins à ne pas surinterpréter
```

Contenu à intégrer :

- N1 : theta 4-7 Hz, disparition/atténuation de l’alpha, mouvements oculaires lents
- N2 : complexes K et fuseaux de sommeil
- N3 : activité lente delta 0,5-2 Hz, haute amplitude
- REM : bas voltage, fréquences mixtes, mouvements oculaires rapides, atonie EMG
- vertex sharp transients : normal en N1/N2
- POST : variant bénin occipital du sommeil
- sawtooth waves : REM, ne pas confondre avec activité épileptiforme

---

## Images extraites

### 1. Figure 17.2 — Sleep stages + power spectra

Fichier :

```txt
images_png/fig_17_2_sleep_stages_tracings_power_spectra.png
```

Utilité :

Image très intéressante pour la PWA. Elle montre côte à côte :

- éveil
- NREM 1
- NREM 2
- SWS / N3
- REM

Avec :

- tracés EEG
- EOG
- EMG
- spectres de puissance

Intégration recommandée :

Fiche :

```txt
Sommeil et somnolence : reconnaître le normal
```

Message pédagogique :

- plus le sommeil NREM s’approfondit, plus les fréquences lentes dominent
- l’éveil montre une activité alpha
- N1 est dominé par theta et mouvements oculaires lents
- N2 montre complexes K et fuseaux
- N3 montre des ondes lentes
- REM ressemble à un EEG d’éveil bas voltage mais avec mouvements oculaires rapides et atonie

---

### 2. Figure 17.4 — Vertex, POST, sawtooth waves

Fichier :

```txt
images_png/fig_17_4_vertex_POST_sawtooth_waves.png
```

Utilité :

Très bonne image pour éviter les faux positifs EEG.

Elle illustre :

- vertex sharp transients en NREM 1
- positive occipital sharp transients / POST en NREM 2
- sawtooth waves en REM

Intégration recommandée :

Fiche :

```txt
Variants bénins du sommeil à ne pas confondre avec de l’épileptiforme
```

Message pédagogique :

- tous les graphoéléments pointus ne sont pas épileptiformes
- le contexte de sommeil est déterminant
- localisation, morphologie, état de vigilance et réactivité doivent être pris en compte

---

### 3. Table 17.1 — Caractéristiques EEG/EOG/EMG du sommeil

Fichiers :

```txt
images_png/table_17_1_sleep_stage_features_part1.png
images_png/table_17_1_sleep_stage_features_part2.png
```

Utilité :

Table utile comme support pour créer une version simplifiée en HTML.

À ne pas intégrer telle quelle si trop dense. Mieux : la transformer en tableau simplifié PWA.

Version recommandée :

| Stade | EEG | EOG | EMG | Piège |
|---|---|---|---|---|
| Éveil | alpha postérieur, beta | clignements/saccades | tonus présent | alpha normal |
| N1 | theta 4-7 Hz, alpha atténué | mouvements lents | tonus diminué | faux ralentissement pathologique |
| N2 | fuseaux, K-complexes | peu d’yeux | tonus diminué | K-complexe vs graphoélément épileptiforme |
| N3 | delta 0,5-2 Hz, >75 µV | absent | bas | ne pas confondre avec encéphalopathie si contexte sommeil |
| REM | bas voltage, mixte | rapides | atonie | sawtooth ≠ crise |

---

## Chapitres non retenus

### Chapitre 2 — Logic behind EEG Frequency Analysis

Non retenu.

Raison :

- très redondant avec le chapitre Technical Aspects déjà extrait
- trop orienté physique/électricité
- peu utile pour l’interne ECT

---

### Chapitres 3 à 6 — oscillations, ERP, temps-fréquence

Non retenus.

Raison :

- méthodologie de recherche
- analyses temps-fréquence
- peu de valeur clinique immédiate pour lecture EEG rapide

---

### Chapitres 8 à 12 — gamma, theta, alpha/beta, asymétrie frontale, sensorimoteur

Non retenus.

Raison :

- intéressant en neurosciences cognitives
- pas prioritaire pour interprétation EEG clinique en ECT
- risque de complexifier inutilement la PWA

---

### Chapitres 13 à 16 — développement, theta/beta ratio, source localization

Non retenus.

Raison :

- pédiatrie/recherche/source modeling
- hors objectif ECT adulte

---

### Chapitre 18 — Schizophrénie

Non retenu malgré son intérêt psychiatrique.

Raison :

- contenu surtout recherche translationnelle
- pas utile pour reconnaître un EEG clinique en ECT
- risque de créer une fiche séduisante mais peu actionnable

---

### Chapitre 19 — Anxiété

Non retenu.

Raison :

- recherche cognitive
- pas utile pour EEG clinique ECT

---

### Chapitres 20-21 — connectivité

Non retenus.

Raison :

- analyses avancées
- hors scope PWA clinique rapide

---

### Chapitre 22 — Brain stimulation approaches

Non retenu.

Raison :

- traite surtout tDCS, tACS, rTMS et stimulation expérimentale
- pas une ressource pratique sur l’ECT
- figure intéressante sur les formes d’onde, mais risque de confusion avec la sismothérapie

---

### Chapitre 23 — Parameterizing neural field potential data

Non retenu.

Raison :

- excellent méthodologiquement
- trop avancé
- inutile pour la finalité pédagogique clinique

---

## Intégration conseillée dans le MASTER_PROMPT_EEG_ECT.md

Ajouter cette section :

```md
# ADD-ON OXFORD EEG FREQUENCY

Utiliser les extraits Oxford uniquement pour enrichir deux fiches :

## 1. Comprendre un EEG en 10 minutes

À partir du chapitre 1 :
- fréquence = cycles par seconde
- puissance = amplitude²
- phase = position dans le cycle
- delta / theta / alpha / beta / gamma
- EEG = excellente résolution temporelle, faible résolution spatiale
- artefacts principaux : EMG, EOG, bruit électrique

## 2. Sommeil, somnolence et variants bénins

À partir du chapitre 17 :
- N1 : theta, alpha atténué, mouvements oculaires lents
- N2 : fuseaux, complexes K
- N3 : delta lent haute amplitude
- REM : bas voltage, mixte, mouvements oculaires rapides, atonie
- vertex sharp transients, POST et sawtooth waves = variants/éléments physiologiques à ne pas surinterpréter

Utiliser prioritairement les images :
- fig_17_2_sleep_stages_tracings_power_spectra.png
- fig_17_4_vertex_POST_sawtooth_waves.png
```

---

## Conclusion

Oui, il y a des éléments pertinents, mais peu.

À intégrer :

1. **Chapitre 1** pour clarifier les notions fréquence/puissance/phase.
2. **Chapitre 17** pour une fiche sommeil/somnolence/variants bénins.
3. **Figure 17.2** pour illustrer les stades de sommeil.
4. **Figure 17.4** pour éviter les faux positifs épileptiformes.

Le reste est trop recherche, trop méthodologique, ou non actionnable pour une PWA EEG/ECT.
