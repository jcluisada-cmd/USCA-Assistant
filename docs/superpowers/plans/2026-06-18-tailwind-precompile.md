# Tailwind pré-compilé — Plan d'implémentation (chantier 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le CDN runtime `@tailwindcss/browser@4` par une feuille CSS Tailwind pré-générée et servie en statique, sur les 6 pages HTML racine, sans introduire de build sur les pages.

**Architecture:** Un `package.json` racine (dev-only, `@tailwindcss/cli` épinglé) compile `tailwind.input.css` → `shared/tailwind.css` (sur-ensemble unique des classes des 6 pages + JS partagé + volets post-cure). Chaque page remplace ensuite son `<script>` CDN + `<style>` inline par un unique `<link>`, une page par commit, avec validation prod entre chaque. Le CDN reste sur les pages non migrées.

**Tech Stack:** Tailwind CSS v4 (`@tailwindcss/cli`), npm, HTML statique, Service Worker manuel (`sw.js`), Cloudflare Pages.

**Spec de référence:** `docs/superpowers/specs/2026-06-18-tailwind-precompile-design.md`

**Règles projet rappelées:**
- Jamais de réécriture complète de fichier — édition chirurgicale (Edit).
- Bump `CACHE_NAME` dans `sw.js` à **chaque** tranche (fichier servi modifié).
- `commit && push` enchaînés après chaque tranche verte (sauf conflit) — CF Pages redéploie.
- Français partout. Mobile-first.

**Convention de versions SW pour ce chantier:** `usca-v4.45` (actuel) → `v4.46` (Task 1) → `v4.47` (Task 2) → `v4.48` (Task 3) → `v4.49` (Task 4) → `v4.50` (Task 5) → `v4.51` (Task 6) → `v4.52` (Task 7). La version « release » headline de `CLAUDE.md` n'est mise à jour qu'en Task 8 (valeur finale `v4.52`).

---

## File Structure

| Fichier | Rôle | Action |
|---|---|---|
| `package.json` (racine) | Toolchain dev-only : `@tailwindcss/cli` épinglé + script `build:css` | Créer |
| `.gitignore` (racine) | Ignorer `node_modules/` racine | Créer ou modifier |
| `tailwind.input.css` (racine) | Source CSS : `@import`, `@custom-variant dark`, `@source`, safelist | Créer |
| `shared/tailwind.css` | CSS compilée minifiée — **seul fichier servi aux pages** | Générer (commité) |
| `sw.js` | Ajouter `./shared/tailwind.css` à `LOCAL_ASSETS` (1×) ; bump `CACHE_NAME` (chaque tranche) | Modifier |
| `index.html`, `patient/`, `admin/`, `extern/`, `etudiant/`, `pds/` (`index.html`) | Swap `<script>`+`<style>` → `<link>` | Modifier (1 par tranche) |
| `CLAUDE.md`, `CHANGELOG.md` | Documentation de fin de chantier | Modifier (Task 8) |

---

## Task 0 : Pré-audit (lecture seule, aucune modification)

**Files:** lecture seule — `index.html`, `patient/index.html`, `admin/index.html`, `extern/index.html`, `etudiant/index.html`, `pds/index.html`, `shared/*.js`, `.gitignore`

- [ ] **Step 1 : Confirmer les 2 lignes à retirer dans chaque page**

Run (Grep tool ou):
```bash
grep -n "tailwindcss/browser@4\|text/tailwindcss" index.html patient/index.html admin/index.html extern/index.html etudiant/index.html pds/index.html
```
Attendu : pour chaque page, 2 lignes **adjacentes** :
```
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
<style type="text/tailwindcss">@custom-variant dark (&:where(.dark, .dark *));</style>
```
Si une page diffère (lignes non adjacentes, ou directive Tailwind inline supplémentaire), noter l'écart et adapter l'Edit correspondant.

- [ ] **Step 2 : Inventorier les classes dynamiques (candidats safelist)**

Run (Grep tool) sur `**/*.{html,js}` pour les motifs : ``className = ` ``, `classList.add(`, `classList.toggle(`, et toute concaténation de classe. Lister les classes Tailwind littérales assemblées en JS qui pourraient échapper au scan. Conserver cette liste pour la Step safelist de Task 1 (ne l'activer que si une vérif visuelle révèle un manque).

- [ ] **Step 3 : Déterminer la version exacte de `@tailwindcss/cli` à épingler**

Run:
```bash
npm view @tailwindcss/cli version
```
Attendu : une version 4.x stable (ex. `4.1.13`). Noter cette valeur exacte — elle sera figée **sans** `^` dans `package.json`.

- [ ] **Step 4 : Vérifier le `.gitignore` racine**

Run:
```bash
test -f .gitignore && grep -n "node_modules" .gitignore || echo "PAS de .gitignore racine ou node_modules absent"
```
Attendu : noter s'il faut créer `.gitignore` ou seulement y ajouter `node_modules/`.

*(Pas de commit — task de lecture.)*

---

## Task 1 : Toolchain + génération du CSS (aucun changement de rendu)

**Files:**
- Create: `package.json`, `tailwind.input.css`, `shared/tailwind.css` (généré)
- Modify: `.gitignore`, `sw.js`

- [ ] **Step 1 : Créer `.gitignore` racine (ou y ajouter node_modules)**

Si absent, créer `.gitignore` à la racine avec :
```
/node_modules/
```
Si présent sans `node_modules`, ajouter la ligne `/node_modules/`. **Ne pas** ignorer `tailwind.input.css` ni `shared/tailwind.css` (tous deux commités).

- [ ] **Step 2 : Créer `package.json` racine**

Remplacer `<VERSION_EXACTE>` par la valeur de Task 0 Step 3 :
```json
{
  "name": "usca-connect-build",
  "private": true,
  "version": "1.0.0",
  "description": "Toolchain dev-only : pré-compilation Tailwind pour les pages racine USCA Connect",
  "scripts": {
    "build:css": "tailwindcss -i ./tailwind.input.css -o ./shared/tailwind.css --minify"
  },
  "devDependencies": {
    "@tailwindcss/cli": "<VERSION_EXACTE>"
  }
}
```

- [ ] **Step 3 : Créer `tailwind.input.css` racine**

Syntaxe v4 vérifiée sur la doc officielle : `source(none)` désactive l'auto-détection
(sinon Tailwind scannerait tout le projet, dont les bundles minifiés de `metaboscope/`
et `staff/toolbox-app/` → bloat + faux positifs), puis on enregistre les sources
explicitement (les `@source` répertoire suivent les heuristiques Tailwind : .html/.js,
node_modules ignoré).

```css
@import "tailwindcss" source(none);

/* Dark mode piloté par la classe .dark (déplacé depuis les <style> inline des pages) */
@custom-variant dark (&:where(.dark, .dark *));

/* Sources explicites (auto-détection désactivée). metaboscope/ et staff/toolbox-app/
   (sous-apps Vite à styling propre) sont donc volontairement exclus. */
@source "./index.html";
@source "./patient";
@source "./admin";
@source "./extern";
@source "./etudiant";
@source "./pds";
@source "./shared";
@source "./postcure";
@source "./module_post-cure";

/* Safelist : VIDE. Pré-audit (Task 0) : les classes assemblées en JS sont des classes
   CSS custom (active/done/has-file/show/sig-tab…) ou 'hidden' (utility core Tailwind,
   toujours présente). N'ajouter @source inline("…") que si une vérif visuelle révèle
   un manque. */
```

- [ ] **Step 4 : Installer la dépendance**

Run:
```bash
npm install
```
Attendu : `node_modules/` créé (gitignoré), `package-lock.json` créé. Pas d'erreur.

- [ ] **Step 5 : Générer le CSS**

Run:
```bash
npm run build:css
```
Attendu : `shared/tailwind.css` créé sans erreur, message du type `Done in XXXms`.

- [ ] **Step 6 : Vérifier le CSS généré (check déterministe)**

Run:
```bash
ls -l shared/tailwind.css
grep -c "\.dark" shared/tailwind.css
grep -o "\-\-tw-" shared/tailwind.css | head -1
```
Attendu : taille comprise ~5–60 Ko ; au moins une occurrence `.dark` (preuve que le custom-variant dark a compilé) ; présence de variables Tailwind. Si le fichier fait < 2 Ko, le scan n'a rien trouvé → vérifier les `@source`.

- [ ] **Step 7 : Ajouter `shared/tailwind.css` à `LOCAL_ASSETS` + bump SW**

Dans `sw.js` :
- Modifier la 1re ligne : `const CACHE_NAME = 'usca-v4.45';` → `const CACHE_NAME = 'usca-v4.46';`
- Ajouter dans le tableau `LOCAL_ASSETS`, juste après `'./shared/theme.css',` :
```js
  './shared/tailwind.css',
```

- [ ] **Step 8 : Commit + push**

```bash
git add package.json package-lock.json .gitignore tailwind.input.css shared/tailwind.css sw.js
git commit -m "feat(tailwind): toolchain pré-compilé + shared/tailwind.css généré (SW v4.46)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push
```
Note : **aucun changement de rendu** à ce stade (le CDN est encore actif sur les 6 pages). Le CSS est juste mis à disposition + pré-caché.

---

## Task 2 : Migration page pilote — `etudiant/`

**Files:**
- Modify: `etudiant/index.html`, `sw.js`

- [ ] **Step 1 : Swap CDN → link dans `etudiant/index.html`**

Edit — remplacer le bloc 2 lignes :
```html
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
<style type="text/tailwindcss">@custom-variant dark (&:where(.dark, .dark *));</style>
```
par :
```html
<link rel="stylesheet" href="../shared/tailwind.css">
```

- [ ] **Step 2 : Bump SW**

`sw.js` : `const CACHE_NAME = 'usca-v4.46';` → `const CACHE_NAME = 'usca-v4.47';`

- [ ] **Step 3 : Check déterministe — toutes les variantes `dark:` de la page ont compilé**

Vérif générique et exécutable (Git Bash) : lister les classes `dark:` de la page absentes du CSS compilé (on retire d'abord les `\` d'échappement côté CSS) :
```bash
comm -23 \
  <(grep -ohE 'dark:[a-zA-Z0-9:/_.-]+' etudiant/index.html | sort -u) \
  <(sed 's/\\//g' shared/tailwind.css | grep -ohE 'dark:[a-zA-Z0-9:/_.-]+' | sort -u)
```
Attendu : **sortie vide** (toutes les classes `dark:` de la page sont dans `shared/tailwind.css`). Une classe listée = manquante → l'ajouter au safelist (Task 1 Step 3), `npm run build:css`, re-commit `shared/tailwind.css`. (Note : les classes à valeur arbitraire `dark:bg-[#...]` peuvent générer un faux positif d'échappement — la vérif visuelle Step 4 reste l'autorité.)

- [ ] **Step 4 : Vérif visuelle locale (clair + dark)**

Servir le site en local et ouvrir `etudiant/` :
- Démarrer un serveur statique local (preview tool / `npx serve` / équivalent) à la racine du projet.
- Charger `/etudiant/index.html`. Vérifier que la page est correctement stylée (layout, couleurs, typographie) — identique au rendu CDN.
- Basculer le dark mode (toggle thème de la page) → vérifier le rendu dark.
- Capturer 2 screenshots (clair, dark) pour comparaison.

Attendu : rendu visuellement identique au CDN, sans élément non stylé, en clair **et** en dark.

- [ ] **Step 5 : Commit + push**

```bash
git add etudiant/index.html sw.js
git commit -m "feat(tailwind): etudiant/ servi via shared/tailwind.css (pilote, SW v4.47)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push
```

- [ ] **Step 6 : VALIDATION PROD (JC)**

Attendre que JC confirme en prod (`https://usca-connect.pages.dev/etudiant/`, hard refresh) : rendu identique clair + dark. **Ne pas passer à Task 3 avant cette validation.**

---

## Task 3 : Migration `extern/` (classes dynamiques — safelist vigilant)

**Files:**
- Modify: `extern/index.html`, `sw.js` (+ éventuellement `tailwind.input.css` + `shared/tailwind.css` si safelist)

- [ ] **Step 1 : Swap CDN → link dans `extern/index.html`**

Edit — remplacer le bloc 2 lignes (identique à Task 2 Step 1) par :
```html
<link rel="stylesheet" href="../shared/tailwind.css">
```

- [ ] **Step 2 : Bump SW**

`sw.js` : `usca-v4.47` → `usca-v4.48`

- [ ] **Step 3 : Check déterministe — variantes `dark:` + classes dynamiques de extern**

a) Variantes `dark:` (comme Task 2 Step 3, fichier `extern/index.html`) :
```bash
comm -23 \
  <(grep -ohE 'dark:[a-zA-Z0-9:/_.-]+' extern/index.html | sort -u) \
  <(sed 's/\\//g' shared/tailwind.css | grep -ohE 'dark:[a-zA-Z0-9:/_.-]+' | sort -u)
```
b) `extern/` concentre 5 usages de classes dynamiques. Pour **chaque classe littérale** de la liste produite en Task 0 Step 2 pour ce fichier, vérifier sa présence :
```bash
for c in CLASSE_A CLASSE_B CLASSE_C; do grep -q -- "$c" shared/tailwind.css && echo "OK $c" || echo "MANQUE $c"; done
```
(remplacer `CLASSE_A …` par les classes effectivement listées en Task 0). Attendu : toutes `OK`. Toute classe manquante → ajouter au safelist `@source inline(...)` dans `tailwind.input.css`, `npm run build:css`, ajouter `shared/tailwind.css` au commit.

- [ ] **Step 4 : Vérif visuelle locale (clair + dark)**

Comme Task 2 Step 4, sur `/extern/index.html`. Vérifier en particulier les éléments dont les classes sont assignées dynamiquement (badges, états colorés, onglets actifs).

- [ ] **Step 5 : Commit + push**

```bash
git add extern/index.html sw.js
# + tailwind.input.css shared/tailwind.css SI safelist modifié
git commit -m "feat(tailwind): extern/ servi via shared/tailwind.css (SW v4.48)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push
```

- [ ] **Step 6 : VALIDATION PROD (JC)** — `https://usca-connect.pages.dev/extern/`. Ne pas continuer avant validation.

---

## Task 4 : Migration `pds/` (classes dynamiques — safelist vigilant)

**Files:**
- Modify: `pds/index.html`, `sw.js` (+ safelist éventuel)

- [ ] **Step 1 : Swap CDN → link dans `pds/index.html`**

Edit — remplacer le bloc 2 lignes par :
```html
<link rel="stylesheet" href="../shared/tailwind.css">
```

- [ ] **Step 2 : Bump SW** — `usca-v4.48` → `usca-v4.49`

- [ ] **Step 3 : Check déterministe — variantes `dark:` + classes dynamiques de pds**

a) Variantes `dark:` :
```bash
comm -23 \
  <(grep -ohE 'dark:[a-zA-Z0-9:/_.-]+' pds/index.html | sort -u) \
  <(sed 's/\\//g' shared/tailwind.css | grep -ohE 'dark:[a-zA-Z0-9:/_.-]+' | sort -u)
```
b) Classes dynamiques de `pds/` (3 usages repérés Task 0 Step 2, autour des scores Cushman / cartes patient) :
```bash
for c in CLASSE_A CLASSE_B CLASSE_C; do grep -q -- "$c" shared/tailwind.css && echo "OK $c" || echo "MANQUE $c"; done
```
(remplacer par les classes listées en Task 0). Attendu : `dark:` → sortie vide ; classes dynamiques → toutes `OK`. Manque → safelist + `npm run build:css` + re-commit.

- [ ] **Step 4 : Vérif visuelle locale (clair + dark)** sur `/pds/index.html`. Vérifier les cartes patient et l'affichage Cushman.

- [ ] **Step 5 : Commit + push**

```bash
git add pds/index.html sw.js
git commit -m "feat(tailwind): pds/ servi via shared/tailwind.css (SW v4.49)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push
```

- [ ] **Step 6 : VALIDATION PROD (JC)** — `https://usca-connect.pages.dev/pds/`. Ne pas continuer avant validation.

---

## Task 5 : Migration `patient/`

**Files:**
- Modify: `patient/index.html`, `sw.js`

- [ ] **Step 1 : Swap CDN → link dans `patient/index.html`** — remplacer le bloc 2 lignes par :
```html
<link rel="stylesheet" href="../shared/tailwind.css">
```

- [ ] **Step 2 : Bump SW** — `usca-v4.49` → `usca-v4.50`

- [ ] **Step 3 : Check déterministe — variantes `dark:` de la page**

```bash
comm -23 \
  <(grep -ohE 'dark:[a-zA-Z0-9:/_.-]+' patient/index.html | sort -u) \
  <(sed 's/\\//g' shared/tailwind.css | grep -ohE 'dark:[a-zA-Z0-9:/_.-]+' | sort -u)
```
Attendu : sortie vide. La vérif visuelle Step 4 couvre le rouge du bouton craving pleine largeur.

- [ ] **Step 4 : Vérif visuelle locale (clair + dark)** sur `/patient/index.html`. Vérifier les 9 cartes + le bouton craving rouge.

- [ ] **Step 5 : Commit + push**

```bash
git add patient/index.html sw.js
git commit -m "feat(tailwind): patient/ servi via shared/tailwind.css (SW v4.50)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push
```

- [ ] **Step 6 : VALIDATION PROD (JC)** — `https://usca-connect.pages.dev/patient/`. Ne pas continuer avant validation.

---

## Task 6 : Migration `admin/` (attention : iframe Toolbox)

**Files:**
- Modify: `admin/index.html`, `sw.js`

- [ ] **Step 1 : Swap CDN → link dans `admin/index.html`** — remplacer le bloc 2 lignes par :
```html
<link rel="stylesheet" href="../shared/tailwind.css">
```

- [ ] **Step 2 : Bump SW** — `usca-v4.50` → `usca-v4.51`

- [ ] **Step 3 : Check déterministe — variantes `dark:` de la page**

```bash
comm -23 \
  <(grep -ohE 'dark:[a-zA-Z0-9:/_.-]+' admin/index.html | sort -u) \
  <(sed 's/\\//g' shared/tailwind.css | grep -ohE 'dark:[a-zA-Z0-9:/_.-]+' | sort -u)
```
Attendu : sortie vide.

- [ ] **Step 4 : Vérif visuelle locale (clair + dark)** sur `/admin/index.html`. **Vérifier explicitement** que l'iframe Toolbox (qui a son propre styling Vite) est **inchangée** : le `<link>` racine ne doit pas altérer l'intérieur de l'iframe (contexte isolé). Vérifier les 3 onglets (Dashboard, Toolbox, Planning).

- [ ] **Step 5 : Commit + push**

```bash
git add admin/index.html sw.js
git commit -m "feat(tailwind): admin/ servi via shared/tailwind.css (SW v4.51)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push
```

- [ ] **Step 6 : VALIDATION PROD (JC)** — `https://usca-connect.pages.dev/admin/`. Ne pas continuer avant validation.

---

## Task 7 : Migration `index.html` (racine — chemin sans `../`)

**Files:**
- Modify: `index.html`, `sw.js`

- [ ] **Step 1 : Swap CDN → link dans `index.html`**

Edit — remplacer le bloc 2 lignes par (⚠️ chemin **sans** `../`) :
```html
<link rel="stylesheet" href="shared/tailwind.css">
```

- [ ] **Step 2 : Bump SW** — `usca-v4.51` → `usca-v4.52`

- [ ] **Step 3 : Check déterministe — variantes `dark:` de la page**

```bash
comm -23 \
  <(grep -ohE 'dark:[a-zA-Z0-9:/_.-]+' index.html | sort -u) \
  <(sed 's/\\//g' shared/tailwind.css | grep -ohE 'dark:[a-zA-Z0-9:/_.-]+' | sort -u)
```
Attendu : sortie vide.

- [ ] **Step 4 : Vérif visuelle locale (clair + dark)** sur `/index.html`. Vérifier les onglets Patient/Soignant, le splash, le formatage DDN.

- [ ] **Step 5 : Commit + push**

```bash
git add index.html sw.js
git commit -m "feat(tailwind): index.html servi via shared/tailwind.css — fin migration CDN (SW v4.52)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push
```

- [ ] **Step 6 : VALIDATION PROD (JC)** — `https://usca-connect.pages.dev/`. Après validation : **plus aucune référence à `@tailwindcss/browser` dans le code servi.**

- [ ] **Step 7 : Vérif finale — zéro résidu CDN**

Run:
```bash
grep -rn "tailwindcss/browser" --include="*.html" .
```
Attendu : **aucun résultat** (hors `staff/toolbox.html` legacy si encore présent — à ignorer, hors périmètre). Si une page racine ressort, elle n'a pas été migrée.

---

## Task 8 : Documentation de fin de chantier

**Files:**
- Modify: `CLAUDE.md`, `CHANGELOG.md`
- Create: mémoire projet

- [ ] **Step 1 : Mettre à jour `CLAUDE.md`**

- En-tête « Version courante » : passer à `v4.52` + résumé 1 ligne du chantier (Tailwind pré-compilé, CDN runtime retiré des 6 pages racine).
- §2 Stack technique : remplacer « HTML5 + Tailwind CSS via CDN (`@tailwindcss/browser@4`) » par une mention « Tailwind v4 pré-compilé (`shared/tailwind.css` généré via `@tailwindcss/cli`, `npm run build:css`) ; sous-apps Vite exceptées ».
- §2 Service Worker : `usca-v4.52`.
- §8 Conventions : ajouter une règle « **Après ajout/retrait de classes Tailwind sur une page racine, relancer `npm run build:css` et committer `shared/tailwind.css`** ». Adapter la ligne « Pas de bundler » (toujours vraie pour les pages ; le CLI Tailwind est un outil de pré-compilation dev-only, pas un bundler de pages).
- §7 À faire : cocher/retirer la ligne « Toolbox — performances & dark mode instantané » partie Tailwind, et noter le chantier 3 livré.

- [ ] **Step 2 : Mettre à jour `CHANGELOG.md`**

Ajouter 1 ligne en tête :
```
- v4.52 (2026-06-18) — Tailwind pré-compilé : CDN runtime @tailwindcss/browser retiré des 6 pages racine, remplacé par shared/tailwind.css (généré via @tailwindcss/cli épinglé, npm run build:css). Fin de la recompilation CSS in-browser. SW usca-v4.52.
```

- [ ] **Step 3 : Mémoire projet**

Créer `memory/project_tailwind_precompile.md` (type project) résumant : migration livrée, mécanisme (package.json racine + cli épinglé, un CSS sur-ensemble), commande de régénération, risque safelist, lien `[[project_toolbox_vite_migration]]` (même chantier de modernisation incrémentale). Ajouter la ligne d'index dans `memory/MEMORY.md`.

- [ ] **Step 4 : Commit + push**

```bash
git add CLAUDE.md CHANGELOG.md
git commit -m "docs(v4.52): chantier 3 Tailwind pré-compilé livré (CHANGELOG + CLAUDE.md)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push
```

---

## Notes d'exécution

- **Entre chaque tranche (Tasks 2→7)** : attendre la validation prod de JC avant la suivante. Le CDN reste actif sur les pages non migrées → aucune régression possible sur le reste.
- **Si une classe manque** (vérif visuelle) : safelist dans `tailwind.input.css` → `npm run build:css` → re-commit `shared/tailwind.css` dans la même tranche.
- **Rollback d'une tranche** : `git revert <commit>` de la tranche (le swap est isolé par page) ; le CDN n'a jamais été supprimé globalement, donc revenir au `<script>` CDN d'une page est trivial.
- **Ne pas toucher** `staff/toolbox.html` (legacy), `metaboscope/`, `staff/toolbox-app/` — hors périmètre, styling propre.
```
