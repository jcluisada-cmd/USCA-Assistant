# DATA_SCHEMA.md — Schéma JSON molécules MetaboScope v2

> Référence normative. Tout JSON molécule doit être conforme à ce schéma.

## Schéma complet

```json
{
  "id": "string — format: classe_abrev_dci (ex: opioid_bup, ap_cloz)",
  "nom_dci": "string",
  "synonymes": ["string — noms commerciaux, synonymes DCI, noms de rue NPS"],
  "classe": "string — ex: Opioïde TSO | Antidépresseur ISRS | Antipsychotique atypique | NPS cathinone | ...",
  "statut_fr": "Liste I | Liste II | Stupéfiants | Non commercialisé en France | Usage hospitalier",

  "phase1_cyp": [
    {
      "isoforme": "CYP2D6",
      "rang": "majeur | mineur | trace",
      "produit": "string — métabolite produit (ou 'inactivation')",
      "preuve": "IVH-C | IVH-O | CAS | FOR | IVA | IVT | AN | ND",
      "source": "PMID:XXXXXXX | DOI:... | FDA:... | StatPearls:..."
    }
  ],

  "phase1_non_cyp": [
    {
      "enzyme": "string — ex: MAO-A, MAO-B, AKR1C4, CES1, CES2, ADH, ALDH2, BChE, FMO3",
      "alias": "string — alias nomenclature (ex: 'dihydrodiol déshydrogénase' pour AKR1C4)",
      "rang": "majeur | mineur | trace",
      "produit": "string",
      "preuve": "IVH-C | IVH-O | CAS | FOR | IVA | IVT | AN | ND",
      "source": "PMID:XXXXXXX | ..."
    }
  ],

  "phase2": [
    {
      "enzyme": "string — ex: UGT1A4, UGT2B7, SULT1A1, NAT2, TPMT, COMT",
      "rang": "majeur | mineur | trace",
      "produit": "string",
      "preuve": "IVH-C | IVH-O | IVT | ...",
      "source": "PMID:XXXXXXX | ..."
    }
  ],

  "transporteurs": [
    {
      "transporteur": "string — ex: P-gp (ABCB1), BCRP (ABCG2), OCT1, MATE1, OATP1B1",
      "role": "substrat | inhibiteur | inducteur",
      "preuve": "IVH-C | IVT | ...",
      "source": "PMID:XXXXXXX | ..."
    }
  ],

  "inhibiteur": [
    {
      "cible": "string — ex: CYP2D6, CYP3A4, MAO-A, P-gp",
      "puissance": "fort | modéré | faible",
      "mecanisme": "compétitif | MBI (mécanisme-based, irréversible) | mixte",
      "preuve": "IVH-C | IVT | ...",
      "source": "PMID:XXXXXXX | FDA:..."
    }
  ],

  "inducteur": [
    {
      "cible": "string",
      "puissance": "fort | modéré | faible",
      "mecanisme": "string — ex: activation PXR, activation CAR",
      "preuve": "IVH-C | IVT | ...",
      "source": "PMID:XXXXXXX | ..."
    }
  ],

  "metabolite_actif": {
    "present": true,
    "nom": "string",
    "activite_relative": "string — ex: '50% de l'activité opioïde maternelle'",
    "demi_vie_h": "number | null"
  },

  "pharmacogenetique": [
    {
      "gene": "CYP2D6 | CYP2C19 | CYP2B6 | CYP2C9 | UGT2B7 | OPRM1 | ABCB1 | ...",
      "variants": ["*1", "*4", "*17", "rs4680", "..."],
      "phenotype": "PM | IM | NM | UM | RM",
      "niveau_cpic": "A | B | C | D | x (DPWG) | non classé",
      "recommandation": "string — VERBATIM CPIC/DPWG si niveau A/B (ex: 'Avoid use of tramadol...')",
      "zone_grise": false,
      "source": "CPIC:doi:... | DPWG:PMID:... | PMID:..."
    }
  ],

  "interactions_specifiques": [
    {
      "avec": "string — DCI de la molécule interagissante",
      "mecanisme": "string — ex: 'inhibition compétitive CYP3A4', 'additivité QT', 'syndrome sérotoninergique'",
      "effet": "string — description clinique de l'effet résultant",
      "timing": "string | null — ex: 'aigu (dose unique)', 'chronique (>7j)', 'fenêtre 10j post-MDMA'",
      "preuve": "IVH-C | CAS | ...",
      "source": "PMID:XXXXXXX | ..."
    }
  ],

  "alertes_pd": [
    // Convention : kebab-case ASCII pur, pas de diacritiques
    // Source de vérité : scripts/validate-molecules.mjs (Set PD_CODES)
    // Liste exhaustive et organisation par sous-domaine : voir CLAUDE.md §6
    "QT-KR | QT-PR | QT-CR | QT-SR",
    "sero | sero-faible | sero-modere",
    "resp",
    "ACB-1 | ACB-2 | ACB-3",
    "seuil-ep | seuil-ep-sevrage",
    "hepatotox | hepatotox-POLG | nephrotox | myocardite",
    "CI-IMAO | CI-fluvoxamine | CI-sildenafil | CI-grossesse | CI-alcool",
    "teratogene | teratogene-Ebstein | teratogene-hydantoine",
    "SJS | SJS-Lyell-HLA-B1502 | DRESS | DRESS-HLA-A3101 | SMN",
    "fenetre-etroite | mesusage-documented",
    "dependance | dependance-documented | dependance-mu-opioide",
    "agranulocytose | akathisie | sedation | sedation-profonde | sialorrhee",
    "metabolique | metabolique-prise-poids | diabete | hyperprolactinemie | thyroide-hypo",
    "SEP | impulsivite | idees-suicidaires | aggressivite-boxed-warning",
    "hypotension-orthostatique | bronchospasme-voie-inhalee",
    "hyponatremie-SIADH | glaucome-aigu | glaucome-angle-ferme",
    "lithiase-renale | acidose-metabolique | perte-poids",
    "troubles-cognitifs | cerebelleux-dose-dependant | hyperplasie-gingivale",
    "titration-lente-obligatoire | troubles-neuropsy-agressivite | troubles-psychiatriques",
    "pancreatite | hyperammonemie",
    "amnesie-anterograde | parasomnies-complexes | somnambulisme",
    "chute-sujet-age | sujet-age-risque-confusion",
    "sevrage-BZD-like | sevrage-possible-si-arret-brutal | soumission-chimique | anesthesie",
    "CV-HTA | HTA-dose-dep | demi-vie-longue | myelopathie-B12"
  ],

  "niveau_preuve_global": "IVH-C | IVH-O | CAS | FOR | IVA | IVT | AN | ND",

  "sources_principales": [
    "PMID:XXXXXXX",
    "DOI:10.xxxx/xxxxx",
    "FDA:label_nom_produit",
    "EMA:EPAR_nom",
    "ANSM:RCP_nom",
    "CredibleMeds:nom_mol",
    "CPIC:doi:...",
    "StatPearls:XXXXXXX"
  ],

  "zone_grise": false,
  "derniere_maj": "YYYY-MM",
  "champ_manquants": [
    "string — ex: 'données phase2 UGT manquantes', 'CPIC CYP2B6 non classé', 'QT-SR CredibleMeds à re-vérifier'"
  ]
}
```

---

## Règles de remplissage

### Rang isoformes CYP / non-CYP
- `majeur` : contribue > 50% de la clairance métabolique
- `mineur` : contribue 20-50%
- `trace` : contribue < 20% mais cliniquement pertinent (ex: CYP2D6 trace sur méthadone car PM à risque)

### Sources — Format strict

Préfixes autorisés (regex `SOURCE_PREFIX` dans `scripts/validate-molecules.mjs`) :

```
PMID:12345678
DOI:10.1016/j.xxx.2020.01.001
PMC:3696515
NBK:620296
FDA:Vivitrol_prescribing_information_2023
EMA:EPAR_suboxone_2019
ANSM:RCP_methadone_2022
CredibleMeds:methadone_KR
CPIC:doi:10.1002/cpt.1602
DPWG:PMID:21412232
StatPearls:NBK482451
HUG:carte_cytochromes_2020
CBIP:interactions_v2024
EMCDDA:NPS-benzo-2024
```

**⚠️ Sources internes interdites** : `Gemini DR X`, `Plan_de_recherche`, `Mise_à_jour_référentiel`, `Rapport d'Expertise *` etc. Ce sont des artefacts process LLM, pas des sources cliniques sourçables. Si une info ne peut pas être rattachée à un préfixe valide ci-dessus, marquer `zone_grise: true` au niveau cellule plutôt que d'inventer un préfixe.

### PMID non vérifiés
Si un PMID provient d'une source secondaire (ChatGPT DR, rapport Gemini) sans vérification directe :
- Ajouter à `champ_manquants` : `"PMID:XXXXXX à vérifier sur PubMed"`
- Ne PAS mettre en `sources_principales`

### Métabolite actif absent
```json
"metabolite_actif": { "present": false, "nom": null, "activite_relative": null, "demi_vie_h": null }
```

### Pas de pharmacogénétique documentée
```json
"pharmacogenetique": [{ "gene": "ND", "variants": [], "phenotype": "ND", "niveau_cpic": "non classé",
  "recommandation": "Pas de guideline CPIC/DPWG publiée", "zone_grise": false, "source": "ND" }]
```

---

## Corrections définitives (ne jamais revenir en arrière)

| Erreur ancienne | Correction définitive | Source |
|---|---|---|
| 6β-naltrexone | **6β-naltrexol** via **AKR1C4** | FDA Vivitrol label + PMID:21412232 |
| Alcool = 1 entité | **Alcool aigu / chronique / sevrage** = 3 entrées distinctes | — |
| Cocaïne = 1 entité | **Cocaïne / cocaéthylène / crack-AEME** = 3 entrées | — |
| MDMA CYP2D6 compétitif | **MDMA CYP2D6 MBI irréversible**, fenêtre 10j | PMID:15692162 |
| Baclofène sans QT | **Baclofène QT-CR** | CredibleMeds |

---

## Validation JSON

```bash
node scripts/validate-molecules.js
```

Ce script vérifie :
- Conformité au schéma (champs obligatoires présents)
- Absence de `"ND"` dans `sources_principales`
- Absence de `interactions_specifiques: []` vide
- Format des sources (préfixes reconnus)
- Unicité des `id`
