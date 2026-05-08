# MétaboScope — rapport multi-sources 2026-04-29

Audit pré-généré dans `data_hug_cbip/metaboscope_audit_cbip_vs_hug_*` croisé avec 147 molécules JSON MétaboScope.

## Statistiques globales

- **Union CBIP × HUG** : 508 molécules
- **CBIP** : 465 · **HUG** : 245
- **Recouvrement CBIP ∩ HUG** : 202
- **CBIP-only** : 263 · **HUG-only** : 43
- **MétaboScope JSON existants** : 147
- **Recouvrement audit × JSON** : 57 (déjà couverts)
- **Candidats ingestion v1.1** : 451 (présents dans audit, absents du JSON)

## Divergences par catégorie

| Catégorie | Cas |
|---|---|
| molecule_absente_hug | 263 |
| voie_cbip_seule | 475 |
| fiabilite_faible | 334 |
| voie_hug_seule | 382 |
| fiabilite_moyen | 110 |
| molecule_absente_cbip | 43 |
| fiabilite_élevé | 64 |
| puissance_discordante | 30 |

## Molécules high-severity (30 divergences sur 27 molécules)

Conflits de puissance CBIP ≠ HUG sur des inducteurs/inhibiteurs cliniquement majeurs.
**À arbitrer manuellement avant ingestion v1.1.**

| Molécule | Type | Voie | Action proposée |
|---|---|---|---|
| amiodarone | puissance_discordante | CYP2C9 | review_manuel_prioritaire |
| amiodarone | puissance_discordante | CYP2D6 | review_manuel_prioritaire |
| atazanavir | puissance_discordante | CYP3A4/5 | review_manuel_prioritaire |
| bosentan | puissance_discordante | CYP2C9 | review_manuel_prioritaire |
| bosentan | puissance_discordante | CYP3A4/5 | review_manuel_prioritaire |
| carbamazépine | puissance_discordante | CYP1A2 | review_manuel_prioritaire |
| carbamazépine | puissance_discordante | Pgp | review_manuel_prioritaire |
| ciprofloxacine | puissance_discordante | CYP1A2 | review_manuel_prioritaire |
| clopidogrel | puissance_discordante | CYP2B6 | review_manuel_prioritaire |
| darunavir | puissance_discordante | CYP3A4/5 | review_manuel_prioritaire |
| diltiazem | puissance_discordante | CYP3A4/5 | review_manuel_prioritaire |
| éfavirenz | puissance_discordante | CYP3A4/5 | review_manuel_prioritaire |
| enzalutamide | puissance_discordante | CYP2C19 | review_manuel_prioritaire |
| érythromycine | puissance_discordante | Pgp | review_manuel_prioritaire |
| ésoméprazole | puissance_discordante | CYP2C19 | review_manuel_prioritaire |
| fluconazole | puissance_discordante | CYP3A4/5 | review_manuel_prioritaire |
| fluvastatine | puissance_discordante | CYP2C9 | review_manuel_prioritaire |
| imatinib | puissance_discordante | CYP3A4/5 | review_manuel_prioritaire |
| ledipasvir | puissance_discordante | Pgp | review_manuel_prioritaire |
| moclobémide | puissance_discordante | CYP2D6 | review_manuel_prioritaire |
| modafinil | puissance_discordante | CYP2C19 | review_manuel_prioritaire |
| oméprazole | puissance_discordante | CYP2C19 | review_manuel_prioritaire |
| propafénone | puissance_discordante | Pgp | review_manuel_prioritaire |
| rifabutine | puissance_discordante | CYP3A4/5 | review_manuel_prioritaire |
| rifampicine | puissance_discordante | CYP2C8 | review_manuel_prioritaire |
| roxithromycine | puissance_discordante | CYP3A4/5 | review_manuel_prioritaire |
| saquinavir | puissance_discordante | CYP3A4/5 | review_manuel_prioritaire |
| tipranavir | puissance_discordante | CYP3A4/5 | review_manuel_prioritaire |
| vérapamil | puissance_discordante | CYP3A4/5 | review_manuel_prioritaire |
| voriconazole | puissance_discordante | CYP2B6 | review_manuel_prioritaire |

## Candidats à ingestion v1.1 (échantillon — 451 total)

Molécules présentes dans CBIP/HUG mais absentes du JSON MétaboScope. À ingérer en v1.1 sous `src/data/molecules/molecules_extension_cbip_hug.json`, en respectant les invariants `§9` du `CLAUDE.md` (sources HUG/CBIP avec préfixes corrects, niveau de preuve `IVH-O`).

- **alfentanil** — fiabilité : élevé · sources : CBIP, HUG
- **apixaban** — fiabilité : élevé · sources : CBIP, HUG
- **atorvastatine** — fiabilité : élevé · sources : CBIP, HUG
- **carvédilol** — fiabilité : élevé · sources : CBIP, HUG
- **ciclosporine** — fiabilité : élevé · sources : CBIP, HUG
- **clarithromycine** — fiabilité : élevé · sources : CBIP, HUG
- **colchicine** — fiabilité : élevé · sources : CBIP, HUG
- **dabigatran** — fiabilité : élevé · sources : CBIP, HUG
- **diénogest** — fiabilité : élevé · sources : CBIP, HUG
- **digoxine** — fiabilité : élevé · sources : CBIP, HUG
- **docétaxel** — fiabilité : élevé · sources : CBIP, HUG
- **dutastéride** — fiabilité : élevé · sources : CBIP, HUG
- **édoxaban** — fiabilité : élevé · sources : CBIP, HUG
- **ergotamine** — fiabilité : élevé · sources : CBIP, HUG
- **étoposide** — fiabilité : élevé · sources : CBIP, HUG
- **fexofénadine** — fiabilité : élevé · sources : CBIP, HUG
- **finastéride** — fiabilité : élevé · sources : CBIP, HUG
- **flurbiprofène** — fiabilité : élevé · sources : CBIP, HUG
- **galantamine** — fiabilité : élevé · sources : CBIP, HUG
- **glimépiride** — fiabilité : élevé · sources : CBIP, HUG
- **granisétron** — fiabilité : élevé · sources : CBIP, HUG
- **isradipine** — fiabilité : élevé · sources : CBIP, HUG
- **itraconazole** — fiabilité : élevé · sources : CBIP, HUG
- **kétoconazole** — fiabilité : élevé · sources : CBIP, HUG
- **létrozole** — fiabilité : élevé · sources : CBIP, HUG
- **lidocaïne** — fiabilité : élevé · sources : CBIP, HUG
- **lopéramide** — fiabilité : élevé · sources : CBIP, HUG
- **maraviroc** — fiabilité : élevé · sources : CBIP, HUG
- **méthylprednisolone** — fiabilité : élevé · sources : CBIP, HUG
- **métoprolol** — fiabilité : élevé · sources : CBIP, HUG
- **mifépristone** — fiabilité : élevé · sources : CBIP, HUG
- **millepertuis** — fiabilité : élevé · sources : CBIP, HUG
- **nébivolol** — fiabilité : élevé · sources : CBIP, HUG
- **oxybutynine** — fiabilité : élevé · sources : CBIP, HUG
- **paclitaxel** — fiabilité : élevé · sources : CBIP, HUG
- **piroxicam** — fiabilité : élevé · sources : CBIP, HUG
- **réboxétine** — fiabilité : élevé · sources : CBIP, HUG
- **rivaroxaban** — fiabilité : élevé · sources : CBIP, HUG
- **saxagliptine** — fiabilité : élevé · sources : CBIP, HUG
- **simvastatine** — fiabilité : élevé · sources : CBIP, HUG
- **siponimod** — fiabilité : élevé · sources : CBIP, HUG
- **sirolimus** — fiabilité : élevé · sources : CBIP, HUG
- **sofosbuvir** — fiabilité : élevé · sources : CBIP, HUG
- **sufentanil** — fiabilité : élevé · sources : CBIP, HUG
- **sulfaméthoxazole** — fiabilité : élevé · sources : CBIP, HUG
- **tacrolimus** — fiabilité : élevé · sources : CBIP, HUG
- **tadalafil** — fiabilité : élevé · sources : CBIP, HUG
- **tamsulosine** — fiabilité : élevé · sources : CBIP, HUG
- **testostérone** — fiabilité : élevé · sources : CBIP, HUG
- **timolol** — fiabilité : élevé · sources : CBIP, HUG
- **tizanidine** — fiabilité : élevé · sources : CBIP, HUG
- **toltérodine** — fiabilité : élevé · sources : CBIP, HUG
- **torasémide** — fiabilité : élevé · sources : CBIP, HUG
- **triazolam** — fiabilité : élevé · sources : CBIP, HUG
- **vincristine** — fiabilité : élevé · sources : CBIP, HUG
- **acénocoumarol** — fiabilité : moyen · sources : CBIP, HUG
- **amlodipine** — fiabilité : moyen · sources : CBIP, HUG
- **artéméther** — fiabilité : moyen · sources : CBIP, HUG
- **bortézomib** — fiabilité : moyen · sources : CBIP, HUG
- **bromocriptine** — fiabilité : moyen · sources : CBIP, HUG

_… et 391 de plus. Voir `data_hug_cbip/metaboscope_audit_cbip_vs_hug_complete.json` pour la liste exhaustive._

## Recouvrement avec JSON MétaboScope existant

Molécules de l'audit déjà présentes dans le JSON MétaboScope. Pour ces molécules, considérer l'ajout des sources HUG/CBIP en multi-source (`source: string[]`) sur les cellules concordantes — voir `§9.4` de la spec.

acide valproïque, agomélatine, alprazolam, amisulpride, amitriptyline, aripiprazole, atomoxétine, buprénorphine, bupropion, caféine, cannabidiol, carbamazépine, cariprazine, chlorpromazine, citalopram, clobazam, clomipramine, clonazépam, clozapine, codéine, diazépam, duloxétine, escitalopram, éthanol, éthosuximide, fentanyl, fluoxétine, guanfacine, halopéridol, imipramine, kétamine, lévomépromazine, méthadone, midazolam, mirtazapine, modafinil, morphine, naloxone, olanzapine, oxcarbazépine, oxycodone, palipéridone, paroxétine, pérampanel, phénobarbital, phénytoïne, quétiapine, rispéridone, sertraline, tetrahydrocannabinol

_… et 7 de plus._
