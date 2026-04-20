# AI PDF → HTML — Conversion automatique des ressources Toolbox

> Spec rédigée le 20 avril 2026 — à implémenter dans une prochaine session.
> Chantier indépendant, activable quand JC est prêt.
> Référencé depuis `CLAUDE.md` §7. Lire ce fichier uniquement quand on attaque le chantier.

---

## 1. OBJECTIF

Un workflow **totalement automatique** pour convertir les PDFs déposés dans `ressources_doc/` et `fiches-traitements/fiches_expert/` en HTML fit-for-app, sans intervention humaine :

1. JC dépose un PDF dans `ressources_doc/<sous-dossier>/` ou `fiches-traitements/fiches_expert/`
2. JC commit + push
3. Une GitHub Action détecte le nouveau PDF
4. Un LLM convertit le PDF en HTML (selon la CSS USCA + few-shot à partir des fiches déjà converties)
5. Le HTML est committé à côté du PDF + `ressources_doc/index.json` est regénéré
6. Une PR est ouverte pour review clinique avant merge
7. Une fois mergée, la ressource apparaît dans la Toolbox

**Le PDF original est conservé** (archive fidèle du document source).

---

## 2. POURQUOI L'IA PLUTÔT QU'UN OUTIL CLASSIQUE

Les outils `pdftohtml`, `pdf2htmlEX`, `mutool` font du **layout pixel-parfait mais fragile** : ils reproduisent les coordonnées absolues du PDF, ça ne se redimensionne pas, les tableaux sont disloqués, et le HTML pèse 10-30× le PDF. Inutilisable pour une app mobile-first.

Un LLM à qui on fournit la CSS USCA et quelques exemples (few-shot) produit du HTML **sémantique**, responsive, qui respecte le design system.

| Critère | Outil classique | LLM (Mistral / Gemini Flash) |
|---|---|---|
| Qualité sémantique | ⭐⭐ (positions absolues) | ⭐⭐⭐⭐ (comprend la structure) |
| Adaptation CSS USCA | ❌ | ✅ (on lui donne la CSS cible) |
| Tableaux propres, responsive | ❌ | ✅ |
| Coût | 0 € | ~0,001 à 0,01 € par fiche (Flash Lite) |
| Latence | quelques secondes | 5–15 secondes |
| Maintenance | élevée (CSS fragile) | faible (prompt = source de vérité) |

---

## 3. POURQUOI C'EST PILE LE BON PARI POUR USCA

- **La CSS est déjà faite** — `shared/ressource-doc.css` contient tout le design system (variables, tables responsive, cartes, alertes, dark mode, print).
- **Des fiches de référence existent** — 12 HTMLs convertis à la main (4 ressources + 8 fiches expert antipsychotiques) → matériau idéal pour few-shot prompter.
- **Le contenu est structuré** — tableaux, encarts, alertes, posologies : c'est pile le type de contenu où un LLM excelle en reformatage.
- **JC est seul dev** — un outil zéro-intervention par fichier = levier de temps énorme.

---

## 4. ARCHITECTURE

### 4.1. Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│  JC : git add ressources_doc/fiches/nouveau.pdf && push │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  GitHub Action .github/workflows/pdf2html.yml           │
│                                                         │
│  1. Détecte les PDF ajoutés/modifiés dans :             │
│     - ressources_doc/**/*.pdf                           │
│     - fiches-traitements/fiches_expert/*.pdf            │
│                                                         │
│  2. Pour chaque nouveau PDF :                           │
│     python scripts/convert-pdf-to-html.py <pdf>         │
│                                                         │
│  3. Regénère ressources_doc/index.json                  │
│     python scripts/regen-ressources-manifest.py         │
│                                                         │
│  4. git checkout -b ressources-auto/<timestamp>         │
│  5. git commit + push                                   │
│  6. gh pr create                                        │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  JC review la PR, merge si OK → déploiement Cloudflare  │
└─────────────────────────────────────────────────────────┘
```

### 4.2. Script `scripts/convert-pdf-to-html.py`

```python
# Signature (à implémenter)
python scripts/convert-pdf-to-html.py <input.pdf> [--output <out.html>] [--vision]
```

**Étapes internes :**
1. **Extraction** : `pdfplumber` (texte + tableaux structurés) ou passage direct du PDF en mode vision si `--vision`
2. **Prompt** : few-shot template qui inclut :
   - Le contenu de `shared/ressource-doc.css` (pour que le LLM connaisse les classes disponibles)
   - 2 exemples de fiches déjà converties (1 fiche expert + 1 fiche ressources comme `comparatif_antipsychotiques_v2.html`)
   - Les instructions de design (mobile-first, dark mode via CSS variables, classes sémantiques `.card`, `.alert`, `.t-scroll`, etc.)
3. **Appel API** : Mistral Large ou Gemini Flash Lite
4. **Post-traitement** :
   - Validation HTML (parser, pas d'erreur critique)
   - Vérification que `<link rel="stylesheet" href="../../shared/ressource-doc.css">` est bien présent
   - Normalisation (indent, DOCTYPE)
5. **Écriture** du `.html` à côté du `.pdf`

### 4.3. Script `scripts/regen-ressources-manifest.py`

Scanne `ressources_doc/{fiches,articles,recos,algos}/` et regénère `index.json` :
- **type** = inféré du sous-dossier (`fiches` → `fiche`, `articles` → `article`, etc.)
- **titre** = déduit du nom de fichier (kebab-case → "Mots capitalisés") ou extrait du `<title>` du HTML généré
- **meta** = `"Fiche USCA · <année>"` par défaut
- **fichier** = chemin relatif au dossier `ressources_doc/`
- **date** = date du dernier commit Git touchant ce fichier
- **tag** = 💡 *à renseigner à la main* (voir §7 pour idée d'inférence)

Règle d'or : **préserve les entrées existantes** (si une entrée a été éditée à la main avec un `tag` ou `meta` spécifique, on ne l'écrase pas — on ne fait qu'ajouter les nouvelles).

### 4.4. GitHub Action `.github/workflows/pdf2html.yml`

```yaml
name: PDF → HTML auto-convert
on:
  push:
    branches: [main]
    paths:
      - 'ressources_doc/**/*.pdf'
      - 'fiches-traitements/fiches_expert/*.pdf'

jobs:
  convert:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2  # pour détecter les PDFs ajoutés vs précédent commit
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install pdfplumber mistralai   # ou google-generativeai
      - name: Détecter les nouveaux PDFs
        id: detect
        run: |
          echo "pdfs=$(git diff --name-only HEAD^ HEAD | grep '\.pdf$' || true)" >> $GITHUB_OUTPUT
      - name: Convertir
        if: steps.detect.outputs.pdfs != ''
        env:
          MISTRAL_API_KEY: ${{ secrets.MISTRAL_API_KEY }}
        run: |
          for pdf in ${{ steps.detect.outputs.pdfs }}; do
            python scripts/convert-pdf-to-html.py "$pdf"
          done
          python scripts/regen-ressources-manifest.py
      - name: Créer la PR
        if: steps.detect.outputs.pdfs != ''
        uses: peter-evans/create-pull-request@v6
        with:
          branch: ressources-auto/${{ github.run_id }}
          title: "Auto-conversion PDF → HTML (${{ github.run_id }})"
          body: |
            PDFs convertis automatiquement. **Relire cliniquement avant merge.**
            - [ ] Posologies exactes
            - [ ] Équivalences cohérentes
            - [ ] Pas d'hallucination LLM
```

---

## 5. LE PROMPT TEMPLATE

**Élément-clé du succès.** À ranger dans `scripts/prompts/pdf2html.txt`.

Structure attendue :

```
Tu es un expert en conversion de fiches pharmacologiques PDF vers HTML.
Tu dois produire un HTML autonome, responsive, fit-for-app mobile-first USCA.

CSS OBLIGATOIRE : <link rel="stylesheet" href="../../shared/ressource-doc.css">
(Ne génère PAS de <style>, utilise les classes prédéfinies ci-dessous.)

CLASSES DISPONIBLES (définies dans shared/ressource-doc.css) :
- Structure : .wrap (container centré), .card (bloc bordé), .t-scroll (wrapper tableau scrollable mobile)
- Typographie : h1/h2/h3 ont des styles prédéfinis ; .h-sub pour sous-titre de h2
- Tables : <table> + <th>/<td> stylés ; tr.sub-head (vert), tr.sub-head-warm (orange), tr.sub-head-alert (rouge) pour les sous-entêtes
- Colonnes numériques : td.num, td.hl (mise en valeur teal)
- Alertes : .alert (default orange), .alert.crit (rouge), .alert.info (teal)
- Pastilles : .pill.teal / .amber / .red / .slate

STRUCTURE ATTENDUE :
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>[TITRE] · USCA</title>
  <link rel="stylesheet" href="../../shared/ressource-doc.css">
</head>
<body>
<div class="wrap">
  <header class="doc-head"><h1>[TITRE EN MAJUSCULES]</h1><p class="meta">[sous-titre · classe · équivalences]</p></header>
  <div class="card">
    <h2>[Section 1]</h2>
    <div class="t-scroll"><table>...</table></div>
  </div>
  <!-- autant de .card que de sections -->
  <footer class="src">Sources : [...]. Usage clinique — ne se substitue pas aux RCP officiels.</footer>
</div>
</body>
</html>

EXEMPLES DE FICHES DÉJÀ CONVERTIES (few-shot) :
---
[INSÉRER ICI LE CONTENU DE fiche_aripiprazole.html]
---
[INSÉRER ICI LE CONTENU DE comparatif_antipsychotiques_v2.html]
---

RÈGLES :
- Préserve TOUTES les données chiffrées exactement (posologies, t½, équivalences, % effets indésirables)
- Reformate les tableaux en <table>, jamais en <div> flex
- Pour les alertes critiques (rouge) : <div class="alert crit">
- Pour les encadrés pédagogiques : <div class="alert info">
- Ne dois PAS inventer de contenu absent du PDF — si une section est manquante, omets-la
- Ne traduis PAS les noms de spécialités (Largactil®, Zyprexa®…)
- Utilise les caractères typographiques français : « », –, ½, ±, ≥, ≤, ≈, ↑, ↓, +++, etc.

À CONVERTIR — contenu PDF extrait :
[INSÉRER ICI LE TEXTE EXTRAIT DU PDF VIA PDFPLUMBER]
```

---

## 6. CHOIX DU MODÈLE LLM

| Option | Avantages | Inconvénients | Recommandation |
|---|---|---|---|
| **Mistral Large / Medium** (API Mistral) | Français, RGPD EU, serveurs France | ~0,003 à 0,01 €/fiche | ✅ **Recommandé pour USCA / AP-HP** |
| **Gemini 2.5 Flash Lite** (API Google) | Vision native (comprend images/graphiques), rapide, très bon marché | Serveurs US | Alternative si besoin vision |
| **Claude Haiku 4.5** (API Anthropic) | Très bon en reformatage sémantique, vision | Serveurs US | Alternative qualité max |

**Décision proposée** : Mistral Large pour la v1 (aligné RGPD/AP-HP). Éventuellement ajouter un flag `--vision` qui bascule sur Gemini Flash ou Claude Haiku si le PDF contient des graphiques (radar chart, schémas) à décrire.

---

## 7. TAGS THÉMATIQUES — INFÉRENCE AUTO

Le champ `tag` de `index.json` est le seul champ difficile à déduire automatiquement. Options :

1. **Rien** : tag par défaut = `"Général"`, JC corrige dans la PR si besoin.
2. **Heuristique par nom de fichier** : si le filename contient `"bzd"` / `"benzodiaz"` → tag BZD, si contient `"opioi"` / `"tso"` / `"buprenorphine"` / `"methadone"` → tag Opioïdes, etc.
3. **LLM** : demander au LLM de proposer le tag en fin de conversion → écrit dans le frontmatter du HTML ou dans un fichier `.meta.json`.

**Recommandation v1** : option 2 (heuristique filename) + option 1 en fallback. Option 3 si l'heuristique est trop limitante en pratique.

---

## 8. LIMITES CONNUES & MITIGATIONS

### 8.1. Contenu visuel complexe (radar chart, schémas)

- **Problème** : un LLM textuel ne peut pas reproduire un radar chart depuis un PDF.
- **Mitigation v1** : on accepte de perdre le visuel, le LLM produit un tableau de valeurs équivalent. C'est déjà ce que j'ai fait pour `antipsychotiques_etoiles.html` (bars ASCII à la place du radar SVG).
- **Mitigation v2** : passer au modèle vision (Gemini Flash / Claude Haiku) qui peut décrire l'image et générer un `<svg>` ou un rendu CSS.

### 8.2. Qualité clinique — hallucinations LLM

- **Problème** : un LLM peut inventer une posologie ou une CI absente du PDF source.
- **Mitigation obligatoire** : commit sur branche `ressources-auto/<timestamp>` + PR + review humaine avant merge sur `main`. **Jamais** de merge auto sur `main`.
- **Mitigation complémentaire** : ajouter dans la PR description une checklist à cocher (voir §4.4).

### 8.3. Source de vérité — édition manuelle écrasée

- **Problème** : si JC corrige à la main un HTML généré, la prochaine regen écrase sa correction.
- **Mitigation** : deux options au choix :
  - **A. Idempotence** : ne regénérer un HTML que si le PDF source est plus récent ou n'a jamais été converti.
  - **B. Verrou manuel** : un commentaire `<!-- manual-edit: DO NOT REGEN -->` dans le HTML bloque toute regen pour ce fichier.

Décision proposée : **option A par défaut** + option B comme override quand JC veut figer définitivement une fiche.

### 8.4. RGPD / AP-HP

- **Règle absolue** : **JAMAIS** de PDF contenant des données patient (post-cure, courriers) ne doit être converti via l'API.
- **Mitigation technique** : la GitHub Action ne traite QUE les sous-dossiers académiques (`ressources_doc/**`, `fiches-traitements/fiches_expert/**`). Tout autre emplacement est ignoré.
- **Mitigation documentaire** : ajouter un `.md` d'usage dans les dossiers concernés (`postcure/`, etc.) rappelant l'interdiction.

---

## 9. CHECKLIST D'IMPLÉMENTATION

### Phase 1 — MVP local (sans GitHub Action)

- [ ] Créer `scripts/convert-pdf-to-html.py` qui prend un PDF en arg et écrit le HTML
- [ ] Créer `scripts/prompts/pdf2html.txt` avec le prompt template
- [ ] Stocker la clé API en local dans `.env` (non commit) + lire via `python-dotenv`
- [ ] Tester sur les 12 PDFs déjà convertis à la main (comparer sortie vs. HTML de référence)
- [ ] Itérer sur le prompt jusqu'à obtenir un rendu ≥ 90 % équivalent à la main

### Phase 2 — Manifest auto

- [ ] Créer `scripts/regen-ressources-manifest.py`
- [ ] Tester qu'il préserve bien les entrées existantes avec tags/meta personnalisés
- [ ] Ajouter l'inférence heuristique des tags par filename

### Phase 3 — GitHub Action

- [ ] Ajouter `.github/workflows/pdf2html.yml`
- [ ] Configurer le secret `MISTRAL_API_KEY` dans les Settings du repo
- [ ] Tester avec un PDF de test dans une branche dédiée
- [ ] Vérifier que la PR est bien ouverte avec la checklist de review

### Phase 4 — Mode vision (optionnel)

- [ ] Ajouter `--vision` au script qui bascule sur Gemini Flash ou Claude Haiku
- [ ] Tester sur `antipsychotiques_etoiles.pdf` (radar charts) pour voir si rendu SVG est acceptable

### Phase 5 — Documentation

- [ ] Mettre à jour les `_TYPE.txt` des sous-dossiers `ressources_doc/` : mentionner que la conversion est automatique
- [ ] Mettre à jour `CLAUDE.md` §3 (architecture) + §7 (retrait de la todo "GitHub Action regénérer index.json" qui devient caduque)

---

## 10. ESTIMATION EFFORT & COÛT

- **Effort dev** : ~4-6 h pour la phase 1 (script + prompt iteration) · ~2 h pour phase 2 · ~1 h pour phase 3
- **Coût récurrent** : ~0,01 €/PDF converti avec Mistral Large · 10 PDFs/mois → **~0,10 €/mois**
- **Dépendances** : `pdfplumber`, `mistralai` (ou `google-generativeai`), `python-dotenv`, `PyYAML` (pour le manifest)

---

## 11. DÉCISION FINALE

**Feu vert recommandé.** Avec la CSS USCA déjà en place et 12 HTMLs de référence, ce chantier a un ROI très élevé.

**Questions ouvertes à trancher au démarrage** :

1. Mistral Large ou Gemini Flash Lite ? → **Mistral recommandé** (RGPD)
2. Few-shot avec 2 exemples ou 4 ? → commencer avec 2, augmenter si qualité insuffisante
3. Branche auto `ressources-auto/<id>` ou directement une PR depuis `main` ? → **branche dédiée + PR**
4. Inférer le tag thématique via LLM ou heuristique filename ? → **heuristique v1, LLM v2** si besoin
5. Que faire des PDFs « INCAS » et « benzodiazépines étoiles » volontairement gardés en PDF ? → ajouter une liste `.no-convert` à la racine de `ressources_doc/` qui liste les filenames à skipper

---

## 12. RÉFÉRENCES UTILES

- Fiches HTML de référence (à utiliser en few-shot) :
  - `fiches-traitements/fiches_expert/fiche_aripiprazole.html` (fiche expert complète : mécanisme + pharmaco + indications + tolérance)
  - `ressources_doc/fiches/comparatif_antipsychotiques_v2.html` (tableau comparatif multi-colonnes complexe)
  - `ressources_doc/fiches/benzodiazepines_equivalences_diazepam_v2.html` (table simple avec sous-entêtes par classe de demi-vie)
- CSS de référence : `shared/ressource-doc.css`
- Docs Mistral API : https://docs.mistral.ai
- Docs Gemini API : https://ai.google.dev/gemini-api/docs
- `pdfplumber` : https://github.com/jsvine/pdfplumber

---

> **Prochain pas** quand tu veux attaquer : dis-moi « on fait l'AI pdf2html ». On commencera par la Phase 1 (MVP local) sur un seul PDF pour valider le prompt, puis on scalera.
