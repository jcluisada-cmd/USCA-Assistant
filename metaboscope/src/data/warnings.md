# MétaboScope — Avertissements et points notables sur les données

**Version base : v1.0 — 147 molécules — 13 fichiers JSON — avril 2026**

Ce document recense par ordre de priorité clinique et technique toutes les remarques,
limitations et zones d'incertitude identifiées sur les données de la base MétaboScope.
Il est destiné au pharmacien clinicien référent et à tout contributeur futur de la base.

---

## 1. Contre-indications absolues et alertes urgence

Ces interactions sont codées dans les `interactions_specifiques` comme priorité maximale.
Elles doivent être signalées en **rouge** dans l'UI sans exception.

| Couple | Risque | Molécule(s) | Preuve |
|---|---|---|---|
| Poppers + inhibiteurs PDE5 (sildénafil, tadalafil, vardénafil, avanafil) | Hypotension sévère / décès | `aut_poppers` | IVH-C |
| IMAO irréversibles + ISRS/IRSNa/tramadol/triptans | Syndrome sérotoninergique fatal | multiples `atd_*` | IVH-C |
| Agomélatine + fluvoxamine | AUC agomélatine ×60 | `atd_agomelatine` | IVH-C |
| Ibogaïne + méthadone non sevrée | QTc cumulé → torsade de pointes | `hal_ibogaine` | CAS |
| Valproate + femme en âge de procréer sans contraception | Tératogène majeur (PNDS 2024) | `aco_valproate` | IVH-C |
| Oxybate Na + alcool | Dépression respiratoire / décès (FDA boxed warning) | `ghb_oxybate_na` | IVH-C |
| Nitazènes (iso/méto/proto/éto/flunitazène) + naloxone dose standard | Résistance relative — doses 0,8-4 mg IV + perfusion | `nps_opi_*` | CAS |
| Xylazine + naloxone seule | Naloxone INEFFICACE sur composante xylazine | `nps_opi_xylazine` | CAS |
| Carbamazépine + porteur HLA-B\*1502 (Asie du Sud-Est) | SJS / syndrome de Lyell | `aco_carbamazepine` | IVH-C |
| GHB/GBL + alcool | Voies ADH/ALDH saturées — dépression respiratoire fatale | `ghb_*` | IVH-C |
| Cocaïne + alcool | Formation cocaéthylène — cardiotoxicité ×18-25 | `pst_cocaethylene` | IVH-C |

---

## 2. Incohérences dans les codes d'alerte PD (à corriger avant v1.1)

Les codes d'alerte PD sont définis dans le vocabulaire contrôlé du schéma v2.
Les variantes suivantes coexistent dans la base et **doivent être normalisées** :

| Code non-standard (à supprimer) | Code canonique | Occurrences |
|---|---|---|
| `dépendance-documented` | `dependance-documented` | 16 |
| `sédation` | `sedation` | 12 |
| `sédation-profonde` | `sedation-profonde` | 2 |
| `dépendance-mu-opioide` | `dependance-mu-opioide` | 2 |
| `hépatotox` | `hepatotox` | 2 |
| `mésusage-documented` | `mesusage-documented` | 3 |

> **Action requise** : passe de normalisation `sed -i` ou script Python sur tous les fichiers
> avant le build de production. Alternativement, normaliser côté TypeScript dans `pdAlertLabel()`.

Les codes hors vocabulaire contrôlé suivants sont également présents et non définis
dans `2026-04-27-metaboscope-modules.md` (pas de label UI associé) :

`tachycardie`, `HTA`, `psychose-vulnérable`, `SEP`, `hyperthermie`, `rhabdomyolyse`,
`hypotension-orthostatique`, `fœtotoxicité-grossesse`, `hyperprolactinémie`, `akathisie`,
`SMN`, `mort-subite`, `binge-pattern`, `soumission-chimique`, `CV-HTA`, `données-très-limitées`,
`psychose-cannabinoïde`, `mydriase`, `bronchospasme-voie-inhalée`, `agitation-extrême`,
`IRA`, `ischémie-myocardique`, `coma`, `impulsivité`, `excited-delirium`

Ces codes apparaissent dans les fiches mais ne sont pas référencés dans `PD_LABELS`.
Ils s'afficheront avec le label brut (fallback `{ label: code, severity: 'neutral' }`).

---

## 3. Zones grises — 28 molécules sur 147

Les molécules suivantes ont `zone_grise: true`, signifiant que leur profil métabolique
repose exclusivement sur des données in vitro, animales, ou des analogies structurelles.
**Aucune recommandation posologique ne peut être déduite de ces fiches.**

### Niveau de preuve AN (analogie structurelle pure — plus faible)

| Molécule | Raison |
|---|---|
| `nps_2mmc` | Données in vitro limitées — analogie 3-MMC |
| `nps_4cec` | Aucune donnée in vivo humaine |
| `nps_nep` | Données forensiques très limitées |
| `nps_bzd_flubromazolam` | Quasi-absence de données — niveau preuve AN |
| `nps_cb_hhc` | Métabolisme humain entièrement inféré par analogie THC |
| `nps_cb_thcp` | Affinité CB1 33×THC documentée in vitro seulement |
| `nps_lsd_allad` | Aucune PK humaine publiée |

### Niveau de preuve IVT (in vitro seulement)

| Molécule | Principale limite |
|---|---|
| `can_cbn` (CBN) | Données humaines absentes |
| `nps_opi_protonitazepyne` | Données in vitro 2023 seulement (PMC:12886327) |
| `nps_opi_etonitazene` | Pas de cas cliniques distincts disponibles |
| `nps_opi_flunitazene` | Données forensiques quasi-absentes |
| `aut_mitragynine` | IC50 CYP3A4/2D6 uniquement in vitro (PMC:3807987) |

### Zones grises spécifiques importantes

- **`nps_opi_xylazine`** : les voies CYP2D6/CYP3A4 sont **suspectées chez l'animal uniquement**.
  La formation de 2,6-xylidine chez l'homme reste **controversée**. Toutes les données
  métaboliques sont classées IVA.

- **`nps_cb_mdmb4enpinaca` et `nps_cb_adbbutinaca`** : le composé parent est **indétectable
  dans les urines** (hydrolyse rapide). Le dépistage urinaire immunoassay cannabis est
  systématiquement faux négatif. LC-MS/MS obligatoire.

- **`aut_kava`** : le mécanisme de l'hépatotoxicité idiosyncrasique reste débattu en 2026
  (époxyde méthysticine via CYP2E1 vs autre mécanisme). Les interactions CYP sont
  documentées **in vitro uniquement** à des concentrations potentiellement supracliniques.

- **`nps_phenth_4fa`** : neurotoxicité (hémorragies cérébrales intracrâniennes) documentée
  dans des cas médico-légaux, mais mécanisme exact (HTA soutenue vs effet direct) non
  résolu cliniquement.

---

## 4. Molécules à source unique — robustesse insuffisante

Les molécules suivantes n'ont **qu'une seule source** dans `sources_principales`.
Elles sont prioritaires pour cross-validation lors de la v1.1.

| Molécule | Source unique | Priorité veille |
|---|---|---|
| `aco_ethosuximide` | FDA:label-ethosuximide | Faible |
| `bzd_bromazepam` | ANSM:RCP-bromazepam | Moyenne |
| `opi_6_mam` | Mise_à_jour_référentiel | **Haute** — source interne non primaire |
| `nps_opi_brorphine` | EMCDDA:NPS-opioides-2024 | Haute |
| `nps_bzd_clonazolam` | EMCDDA:NPS-benzo-2024 | Haute |
| `nps_bzd_flubromazolam` | EMCDDA:NPS-benzo-2024 | Haute |
| `nps_cb_thcp` | EMCDDA:NPS-cannabinoides-2024 | Haute |
| `nps_lsd_1plsd` | EMCDDA:NPS-psychedelics-2024 | Haute |
| `nps_lsd_allad` | EMCDDA:NPS-psychedelics-2024 | Haute |
| `nps_phenth_4fa` | EMCDDA:NPS-phenyethylamines-2024 | **Haute** — PMIDs forensiques absents |
| `aut_phenibut` | EMCDDA:drug-profile-phenibut | Haute |
| `aut_kava` | ANSM:suspension-kava-2003 | Moyenne — données 20 ans |
| `aut_poppers` | ANSM:alerte-poppers-PDE5 | Moyenne |

> **Note sur `opi_6_mam`** : le 6-MAM (6-monoacétylmorphine) est un marqueur forensique
> critique de consommation d'héroïne. Sa fiche repose sur "Mise_à_jour_référentiel" —
> source interne non primaire. À sourcer par PMID forensique dédié en priorité.

---

## 5. Pharmacogénétique — récapitulatif par niveau CPIC

### Niveau A — 27 entrées (recommandations actionnables)

| Molécule | Gène | Phénotype | Action |
|---|---|---|---|
| `atd_escitalopram` | CYP2C19 | PM | Réduire dose 50% (max 10 mg) |
| `atd_escitalopram` | CYP2C19 | RM/UM | Envisager alternative |
| `atd_citalopram` | CYP2C19 | PM | Réduire dose 50% |
| `atd_citalopram` | CYP2C19 | RM/UM | Envisager alternative |
| `atd_sertraline` | CYP2C19 | PM | Dose standard ou réduite |
| `atd_sertraline` | CYP2C19 | RM/UM | Surveiller efficacité |
| `atd_paroxetine` | CYP2D6 | PM | Réduire dose initiale 50% |
| `atd_amitriptyline` | CYP2D6 | PM | Réduire dose initiale 50% |
| `atd_amitriptyline` | CYP2D6 | UM | Éviter ou augmenter dose |
| `atd_amitriptyline` | CYP2C19 | PM | Réduire dose initiale 50% |
| `atd_clomipramine` | CYP2D6 | PM | Réduire dose initiale 50% |
| `atd_clomipramine` | CYP2C19 | PM | Réduire dose initiale 50% |
| `atd_imipramine` | CYP2D6 | PM | Réduire dose initiale 50% |
| `atd_imipramine` | CYP2C19 | PM | Réduire dose initiale 50% |
| `opi_tramadol` | CYP2D6 | PM | Éviter — analgésie insuffisante |
| `opi_tramadol` | CYP2D6 | UM | Éviter — risque toxicité opioïde |
| `opi_codeine` | CYP2D6 | PM | Éviter — analgésie insuffisante |
| `opi_codeine` | CYP2D6 | UM | **Contre-indiqué allaitement** — toxicité néonatale |
| `aco_lamotrigine` | HLA-B\*1502 | porteur | SJS/TEN — CI si Asie du Sud-Est |
| `aco_carbamazepine` | HLA-B\*1502 | porteur | SJS/TEN — génotypage obligatoire |
| `aco_carbamazepine` | HLA-A\*3101 | porteur | DRESS — génotypage si disponible |
| `aco_oxcarbazepine` | HLA-B\*1502 | porteur | SJS — CI si Asie du Sud-Est |
| `aco_phenytoine` | CYP2C9 | PM ou IM | Réduire dose initiale |
| `aco_phenytoine` | HLA-B\*1502 | porteur | SJS — CI si Asie du Sud-Est |
| `pst_atomoxetine` | CYP2D6 | PM | AUC ×5-10 ; t1/2 21h ; réduire dose |
| `pst_atomoxetine` | CYP2D6 | UM | Envisager alternative |
| `pst_atomoxetine` | CYP2D6 | NM | Posologie standard |

### Niveau B — 11 entrées (données modérées)

`atd_vortioxetine` (CYP2D6 PM), `atd_fluoxetine` (CYP2D6 PM), `atd_venlafaxine`
(CYP2D6 PM/UM), `ant_opi_naltrexone` (OPRM1 G), `opi_tso_methadone` (OPRM1 G),
`opi_morphine` (OPRM1 G), `opi_oxycodone` (CYP2D6 PM/UM), `atp_risperidone`
(CYP2D6 PM/UM), `atp_aripiprazole` (CYP2D6 PM), `atp_brexpiprazole` (CYP2D6 PM),
`atp_haloperidol` (CYP2D6 PM).

### Zones grises pharmacogénétiques importantes

- **MDMA → MBI CYP2D6** : fenêtre de 10 jours post-exposition (`ent_mdma`).
  Tout génotypage CYP2D6 réalisé dans cette fenêtre est **non interprétable**.
  Le phénocopie transforme tout EM en PM fonctionnel.

- **Bupropion → phénocopie CYP2D6** : inhibition compétitive puissante.
  Impact sur tramadol/codéine/atomoxétine/antidépresseurs CYP2D6-dépendants.

- **Ibogaïne → CYP2D6 PM** : risque cardiotoxique majoré (↑ ibogaïne parent → ↑ QTc).
  Génotypage CYP2D6 **recommandé pré-cure** selon `hal_ibogaine`.

- **AKR1C4 (naltrexone → 6β-naltrexol)** : variants S145C et L311V documentés
  dans la littérature mais non accessibles in extenso. Classés zone grise dans
  `ant_opi_naltrexone`. Aucun guideline CPIC disponible.

- **OPRM1 A118G** : prévalence EU ~10-15%, niveau CPIC B, **aucune recommandation
  posologique actionnable** selon les guidelines opioïdes CPIC 2021.

---

## 6. Profil QT — récapitulatif par catégorie CredibleMeds

### QT-KR (Known Risk — risque connu de TdP) — 11 molécules

`atd_escitalopram`, `atd_citalopram`, `opi_tso_methadone`, `atp_haloperidol`,
`atp_chlorpromazine`, `atp_cyamemazine`, `atp_levomepromazine`, `atp_amisulpride`,
`atp_sulpiride`, `atp_tiapride`, `hal_ibogaine`

> ⚠️ En co-prescription ≥2 molécules QT-KR : alerte rouge systématique dans le Module 2.
> Ibogaïne + méthadone = CI absolue (double QT-KR + compétition PK).

### QT-PR (Possible Risk) — 13 molécules

`atd_venlafaxine`, `opi_tso_buprenorphine`, `opi_tramadol`, `opi_tapentadol`,
`atp_clozapine`, `atp_olanzapine`, `atp_risperidone`, `atp_paliperidone`,
`atp_quetiapine`, `atp_aripiprazole`, `atp_brexpiprazole`, `atp_cariprazine`,
`atp_lurasidone`

### QT-CR (Conditional Risk) — 18 molécules

`atd_mirtazapine`, `atd_amitriptyline`, `atd_clomipramine`, `atd_imipramine`,
`anc_baclofene`, `atp_loxapine`, `thy_lithium`, `aco_lamotrigine`, `aco_topiramate`,
`aut_hydroxyzine`, `pst_methylphenidate`, `pst_lisdexamfetamine`, `pst_dexamfetamine`,
`pst_atomoxetine`, `pst_cocaine_seule`, `pst_cocaethylene`, `pst_crack_aeme`, `ent_mdma`

### QT-zone-grise — 2 molécules

`nps_3cmc`, `nps_mephedrone` — classification CredibleMeds non disponible,
signalée comme zone grise dans la base.

> **Note** : aucune molécule des sessions 11-13 (NPS opioïdes, NPS BZD, autres) n'est
> classée par CredibleMeds. Le QT pour les nitazènes, xylazine, bromazolam, kratom
> reste zone grise faute de données ECG systématiques.

---

## 7. Points notables par fichier

### `molecules_antidepresseurs.json` (14 molécules)

- **Tianeptine** (`atd_tianeptine`) : entrée "antidépresseur" — ne pas confondre avec
  `nps_tianeptine_mesusage` (session 12, mésusage opioïde). Les deux IDs sont distincts
  et intentionnels.
- **Paroxétine** : inhibiteur CYP2D6 MBI (mécanisme-based, irréversible) — distinct de
  la fluoxétine qui est compétitive. Cette distinction est critique pour la fenêtre de
  sevrage avant tramadol/codéine.
- **Agomélatine** : CI absolue fluvoxamine (AUC ×60) ET tabac (induction CYP1A2 par
  HAP combustion → perte d'efficacité). Arrêt brutal tabac = remontée concentrations.

### `molecules_opioides_tso.json` (18 molécules)

- **Méthadone** : CYP2B6 = voie MAJEURE (pas CYP3A4 seul). Erreur classique dans la
  littérature grise. QT-KR + fenêtre thérapeutique étroite + ABCB1 C3435T (zone grise).
- **6-MAM** (`opi_6_mam`) : source unique interne — à renforcer avec PMID forensique.
- **Naltrexone** : métabolite actif = **6β-naltrexol** via **AKR1C4** (jamais CYP, jamais
  "6β-naltrexone" — erreur fréquente ChatGPT DR confirmée).
- **Buprénorphine** : inhibiteur Pgp/BCRP — interaction tacrolimus, ciclosporine, rifampicine
  à surveiller en transplantation.

### `molecules_antipsychotiques.json` (18 molécules)

- **Cyamémazine** : CYP2D6 majeur + CYP1A2 majeur (correction erreur 4a-2 : ce n'est pas
  CYP1A2+CYP3A4). QT-KR (pas QT-PR).
- **Clozapine** : alerte arrêt simultané tabac + alcool chronique en < 10 jours → rebond
  concentrations ×2 (désinduction CYP1A2). Potentiellement létal.
- **Cariprazine** : métabolite DDCAR t1/2 ~2-3 semaines — effets persistent longtemps
  après arrêt. Badge `persistance-post-arrêt-3-semaines`.

### `molecules_thymoregulateurs_anticonvulsivants.json` (13 molécules)

- **Valproate** : CI ABSOLUE femme en âge de procréer + inhibiteur UGT1A4 → interaction
  lamotrigine (doubler dose lamotrigine si ajout valproate). Mutation POLG = CI absolue
  (hépatotoxicité fulminante).
- **Phénytoïne** : cinétique non linéaire (Michaelis-Menten saturable) — petites variations
  de dose → grandes variations de concentration. `fenetre-etroite`.
- **Lithium** : `fenetre-etroite-0.6-1.2mmol/L` — aucun métabolisme hépatique, élimination
  rénale exclusive. Interactions IEC/AINS/thiazidiques = toxicité lithique.

### `molecules_bzd_hypnotiques.json` (13 molécules)

- **Clobazam** : PGx CYP2C19 niveau B (DPWG 2021) — PM = ↑ norclobazam 3-5×.
  Interaction CBD documentée (norclobazam ×3 selon FDA Epidiolex).
- **Zolpidem** : statut FR = Liste I assimilé stupéfiant (arrêté 07/01/2017) — **pas**
  Stupéfiants stricto sensu. Erreur corrigée depuis ChatGPT DR 4a-2.
- **Hydroxyzine** : QT-CR + ACB-3 — charge anticholinergique lourde souvent sous-estimée
  en psychiatrie.

### `molecules_psychostimulants.json` (8 molécules)

- **Lisdexamfétamine** : hydrolyse par peptidases érythrocytaires (pas CES1 — erreur
  ChatGPT DR 4a-2 corrigée). Transporteur PEPT1 clé pour la biodisponibilité orale.
- **Modafinil** : amide hydrolyse non-CYP = voie MAJEURE. CYP3A4 mineur. Inducteur CYP3A4
  (impact contraceptifs oraux). Inhibiteur CYP2C19 (↑ escitalopram, citalopram).
- **Bupropion** : phénocopie CYP2D6 PM pendant 7-10 jours. Impact tramadol/codéine/
  atomoxétine. Seuil épileptogène dose-dépendant.

### `molecules_drogues_classiques.json` (14 molécules)

- **Alcool = 3 entités distinctes** (`ent_alcool_aigu`, `ent_alcool_chronique`,
  `ent_alcool_sevrage`) — ne pas fusionner dans le Module 2.
  - Aigu : inhibe CYP2E1
  - Chronique : induit CYP2E1/CYP1A2/CYP3A4 + seuil paracétamol 2 g/j
  - Sevrage : déinduction J5-J21 + thiamine IV obligatoire avant glucose
- **Cocaïne = 3 entités** (`pst_cocaine_seule`, `pst_cocaethylene`, `pst_crack_aeme`).
  Cocaéthylène = cardiotoxicité ×18-25 — métabolite formé en présence d'alcool.
- **MDMA** : MBI CYP2D6 irréversible — fenêtre 10 jours. Sonde dextrométhorphane
  (PMID:18794647). Génotypage non interprétable pendant cette fenêtre.
- **Nicotine ≠ Tabac fumé** : induction CYP1A2 = HAP combustion (tabac fumé), PAS la
  nicotine elle-même. Crucial pour les substituts nicotiniques : pas d'interaction
  CYP1A2 avec les patchs ou gommes.

### `molecules_hallucinogenes_dissociatifs.json` (11 molécules)

- **Ibogaïne** : QT-KR, +67,9 ms en moyenne. Génotypage CYP2D6 pré-cure recommandé.
  CI méthadone non sevrée (double QT-KR). Données issues de cliniques hors France.
- **Mescaline** : 53% excrétée inchangée → accumulation en IRC documentée (PMC:12479620,
  publication 2024). Durée d'action allongée en insuffisance rénale.
- **5-MeO-DMT** : MAO-A majeure + CYP2D6 → bufoténine active. Génotype CYP2D6 module
  l'intensité subjective documentée.
- **Kétamine** : cystite kétaminique documentée en usage chronique — complication non-PK
  à signaler dans le Module 1.

### `molecules_ghb_derives.json` (4 molécules)

- **Oxybate Na** (`ghb_oxybate_na`) : PK NON-LINÉAIRE saturable — dose ×2 → concentration
  ×3,7. CI absolue alcool (FDA boxed warning). Interaction valproate (+25% exposition).
- **GHB/GBL/1,4-BD** partagent les voies ADH/ALDH/SSADH avec l'éthanol — synergie
  respiratoire fatale documentée.
- **1,4-BD** : métabolisme séquentiel ADH puis ALDH — pic plasmatique retardé vs GBL.
  Alcool en compétition ADH → accumulation 1,4-BD.

### `molecules_nps_cathinones.json` (8 molécules)

- **3-MMC** : données pharmacogénétiques CYP2D6 en zone grise malgré données in vitro
  disponibles. Concentrations post-mortem très variables (249-4400 ng/mL).
- **MDPV** : métabolisme par COMT + sulfotransférases — distinct des autres cathinones.
  Rôle CYP2D6/CYP2C19 non confirmé in vivo.
- **α-PVP, MDPV** : données in vitro exclusivement. Pas de PK humaine publiée.
- **3-CMC** : plus toxique que 3-MMC selon données EMCDDA. Cardiotoxicité documentée.

### `molecules_nps_opioides_benzo.json` (12 molécules)

- **Isotonitazène** (`nps_opi_isotonitazene`) : 3 métabolites post-mortem documentés
  en France (ResearchGate:postmortem). Liaison π-hole Trp293 récepteur μ = résistance
  naloxone par mécanisme moléculaire distinct des opioïdes classiques.
- **Protonitazépyne** : données PMC:12886327 (2023) — très récentes. Puissance ~350×
  fentanyl in vitro uniquement — extrapolation clinique impossible.
- **Brorphine** : scaffold phénylpipéridinyl (≠ benzimidazole) — la résistance à la
  naloxone n'est PAS documentée par liaison π-hole. Protocole naloxone différent des
  nitazènes.
- **Étizolam** : seule thiénodiazépine de la base (cycle thiophène ≠ benzène des BZD).
  Seul NPS-BZD avec données PK humaines in vivo (IVH-C). Métabolite α-hydroxy actif
  t1/2 8,2h > parent (3,4h) — fenêtre clinique étendue.
- **Bromazolam** : toxicité cardiovasculaire atypique (hyperthermie + IDM + convulsions,
  CDC:MMWR:mm725253a5) — mécanisme non élucidé en 2026. Au-delà de la sédation GABAergique.
- **Clonazolam** : non classé stupéfiant en France en 2026 — zone grise réglementaire
  à surveiller. Actif dès 0,5 mg (2,5-5× alprazolam).

### `molecules_nps_cannabinoides_autres.json` (8 molécules)

- **MDMB-4en-PINACA, ADB-BUTINACA** : immunoassay cannabis (anticorps anti-THC) =
  **faux négatif systématique**. LC-MS/MS obligatoire pour diagnostic.
- **1P-LSD** : promédicament → LSD. La cinétique de conversion in vivo humain reste
  une zone grise (IVA seulement). Toutes les mises en garde LSD s'appliquent.
- **Tianeptine mésusage** (`nps_tianeptine_mesusage`) : entrée distincte de `atd_tianeptine`.
  L'immunoassay opioïdes standard ne détecte pas la tianeptine — LC-MS/MS spécifique.

### `molecules_autres.json` (6 molécules)

- **N2O** : dosage B12 sérique peut être NORMAL malgré déficit fonctionnel.
  Utiliser homocystéine + acide méthylmalonique. Myélopathie irréversible si
  non traitée rapidement (B12 IM urgente).
- **NAC** : anti-craving cocaïne (modulation glutamatergique) = usage off-label sans AMM
  en France. Mécanisme distinct de la voie GSH/antidote.
- **Mitragynine** : kratom = LC-MS/MS spécifique — faux négatif opioïdes immunoassay
  standard. QT non classé CredibleMeds (zone grise). Interactions TSO (méthadone) en
  zone grise clinique malgré inhibition CYP3A4 in vitro (PMC:3807987).

---

## 8. Champs manquants prioritaires — veille v1.1

Les champs suivants sont absents dans un grand nombre de molécules.
Ils ne remettent pas en cause la fiabilité des données présentes, mais limitent
la complétude du Module 2 (vérificateur de co-prescription).

| Champ | Molécules concernées | Impact fonctionnel |
|---|---|---|
| `inducteur` | 108 molécules | Module 2 — interactions induction |
| `transporteurs` | 92 molécules | Module 2 — interactions transporteurs |
| `inhibiteur` | 90 molécules | Module 2 — interactions inhibition |
| `phase1_non_cyp` | 63 molécules | Fiche molécule — voies non-CYP |
| `pharmacogenetique` | 58 molécules | Module 2 — PGx |
| `phase2` | 47 molécules | Fiche molécule — conjugaison |
| `phase1_cyp` | 32 molécules | Fiche molécule — CYP |

> Les NPS (sessions 11-13) concentrent la majorité de ces absences, reflétant l'état
> réel de la littérature et non un oubli de saisie.

---

## 9. Données à vérifier avant mise en production (v1.0 → v1.0.1)

Actions de maintenance minimales recommandées avant déploiement AP-HP :

1. **Normaliser les codes alerte PD** (section 2) — script Python ou normalisation TypeScript.
2. **Définir les codes hors vocabulaire** dans `PD_LABELS` (section 2) pour éviter l'affichage brut.
3. **Vérifier le statut réglementaire FR** des molécules évolutives :
   - `nps_bzd_clonazolam` (non classé 2026 — classement attendu)
   - `nps_bzd_bromazolam` (non classé 2026 — classement attendu)
   - `nps_cb_hhc` (classé juin 2024 — confirmer arrêté exact)
   - `aut_mitragynine` (procédure ANSM en cours)
4. **Renforcer `opi_6_mam`** avec un PMID forensique primaire.
5. **Ajouter les PMID manquants** pour `nps_phenth_4fa` (hémorragies cérébrales Pays-Bas)
   via cross-validation ChatGPT DR.

---

*Document généré le 2026-04 — MétaboScope v1.0 — USCA/ELSA Pitié-Salpêtrière*
*Mise à jour à chaque ajout ou correction de données dans la base.*
