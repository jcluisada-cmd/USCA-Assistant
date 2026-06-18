# Spec — Tailwind pré-compilé (chantier 3 de la modernisation incrémentale)

> **Date** : 2026-06-18
> **Auteur** : Dr JC Luisada + Claude
> **Statut** : validé (design), en attente relecture spec avant plan
> **Périmètre** : remplacer le CDN runtime `@tailwindcss/browser@4` par une feuille
> CSS Tailwind pré-générée et servie en statique, sur les 6 pages HTML racine.
> **Hors périmètre** : chantier 4 (Workbox) — cycle brainstorm/spec/plan séparé ultérieur.

---

## 1. Contexte & problème

Six pages HTML racine chargent Tailwind via le CDN runtime
`https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4` :

- `index.html` (racine)
- `patient/index.html`
- `admin/index.html`
- `extern/index.html`
- `etudiant/index.html`
- `pds/index.html`

Chaque page comporte aussi une unique directive inline :

```html
<style type="text/tailwindcss">@custom-variant dark (&:where(.dark, .dark *));</style>
```

Le runtime CDN **recompile le CSS dans le navigateur à chaque chargement** (scan du
DOM + génération des règles), et télécharge un gros bundle JS. C'est le coût qu'on
supprime.

**Constats d'exploration (état au 2026-06-18) :**

- **Aucun** `@theme`, `@apply`, `tailwind.config` personnalisé. Thème Tailwind v4 par
  défaut. La seule personnalisation est le `@custom-variant dark` (dark mode piloté par
  la classe `.dark`, pas par media query).
- **Risque classes dynamiques = faible.** Zéro classe Tailwind interpolée du type
  `bg-${x}-500`. ~15 usages de classes en chaîne JS, toutes **littérales** (donc
  scannables par le CLI v4 qui lit aussi les `.js`). Concentrés sur `extern/` (5),
  `pds/` (3), `module_post-cure/` (2), et quelques `shared/*.js`.
- **Pas de `package.json` racine.** `metaboscope/` et `staff/toolbox-app/` sont des
  sous-apps Vite isolées à styling propre (`toolbox-app` n'utilise pas Tailwind) → pas
  de toolchain Tailwind réutilisable. Mécanisme dédié requis pour les pages racine.
- `sw.js` : `LOCAL_ASSETS` pré-caché à l'install ; stratégie cache-first pour les
  assets, network-first pour la navigation. Le bundle CDN Tailwind est caché au runtime
  mais recompile quand même à chaque chargement.

---

## 2. Décisions actées (brainstorm)

1. **Mécanisme de build** : `package.json` racine + `@tailwindcss/cli` en
   `devDependency` **épinglé à une version exacte** (pas de `^`/`~`). Motif : figer la
   version élimine la classe d'incident « bump de version casse le rendu » (leçon
   directe de l'écran blanc Babel 8 des 16-17/06). `node_modules/` gitignoré.
2. **Un fichier CSS unique** : `shared/tailwind.css`, sur-ensemble couvrant les 6
   pages, généré en une fois.
3. **Page pilote** : `etudiant/` (livret IFSI) — trafic faible, SPA auto-contenue, le
   moins de classes dynamiques → blast radius minimal.
4. **CDN conservé** sur chaque page tant que sa migration n'est pas validée en prod.
5. **Pas de build sur les pages HTML** : elles ne référencent qu'un `<link>` statique.
   Le CLI tourne uniquement en local, à la demande, sa sortie est commitée.

---

## 3. Architecture cible

### 3.1 Toolchain (dev-only, racine)

**`package.json`** (racine, nouveau) :
```json
{
  "name": "usca-connect-build",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "build:css": "tailwindcss -i ./tailwind.input.css -o ./shared/tailwind.css --minify"
  },
  "devDependencies": {
    "@tailwindcss/cli": "<version exacte épinglée, ex. 4.1.13>"
  }
}
```
> La version exacte sera figée à la dernière 4.x stable au moment de l'install
> (`npm view @tailwindcss/cli version`), sans accent circonflexe.

**`.gitignore`** (racine) : ajouter `node_modules/` (si pas déjà couvert).

**`tailwind.input.css`** (racine, nouveau, commité) :
```css
@import "tailwindcss";

/* Dark mode piloté par la classe .dark (déplacé depuis les <style> inline des pages) */
@custom-variant dark (&:where(.dark, .dark *));

/* Sources scannées — explicitement limitées aux pages racine + JS partagé.
   Exclut volontairement metaboscope/ et staff/toolbox-app/ (sous-apps Vite à
   styling propre) ainsi que node_modules. */
@source "./index.html";
@source "./patient/**/*.{html,js}";
@source "./admin/**/*.{html,js}";
@source "./extern/**/*.{html,js}";
@source "./etudiant/**/*.{html,js}";
@source "./pds/**/*.{html,js}";
@source "./shared/**/*.js";
@source "./postcure/**/*.{html,js}";

/* Safelist : classes assemblées uniquement en JS que le scanner ne capte pas.
   À renseigner pendant l'exécution après inventaire des ~15 usages dynamiques,
   uniquement si la validation visuelle révèle un manque.
   Ex. : @source inline("bg-red-500 bg-emerald-500 ..."); */
```
> Note : `postcure/` est inclus dans le scan car certaines pages racine intègrent ses
> volets ; coût nul si non utilisé. À confirmer pendant l'exécution.

**Sortie** : `shared/tailwind.css` (minifiée, commitée). C'est le **seul** fichier
servi aux pages.

### 3.2 Édition par page (chirurgicale)

Sur chaque page, **2 lignes retirées + 1 ajoutée**, jamais de réécriture complète :

- **Retirer** la ligne `<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>`
- **Retirer** la ligne `<style type="text/tailwindcss">@custom-variant dark (&:where(.dark, .dark *));</style>`
- **Ajouter** (à la place du script) :
  - pages en sous-dossier : `<link rel="stylesheet" href="../shared/tailwind.css">`
  - `index.html` racine : `<link rel="stylesheet" href="shared/tailwind.css">`

> Les 5 pages en sous-dossier sont toutes à profondeur 1 → préfixe `../` uniforme.

### 3.3 Service Worker (`sw.js`)

- **Bump `CACHE_NAME`** à chaque tranche (chaque modif de fichier servi), conforme à la
  règle critique §8 du CLAUDE.md.
- **Ajouter `'./shared/tailwind.css'`** à `LOCAL_ASSETS` **une seule fois** (tranche
  pilote) → pré-cache à l'install, offline natif, plus de recompile runtime.

### 3.4 Compatibilité dark mode

`shared/theme.js` / `shared/theme.css` togglent la classe `.dark`. Comme la CSS est
compilée **avec** `@custom-variant dark (&:where(.dark, .dark *))`, toutes les
utilities `dark:` ciblent la classe `.dark` (et non un `@media`). Le toggle existant
continue de fonctionner à l'identique. Aucun changement requis sur theme.js/theme.css.

---

## 4. Séquencement & validation

Le CSS étant un sur-ensemble complet généré une fois, le déploiement par page se réduit
à un échange `<script CDN>` → `<link>`. **Aucune régénération entre les pages** (sauf
ajout safelist si un manque visuel apparaît).

| Tranche | Contenu | Commit | Validation prod (JC) |
|---|---|---|---|
| **0** | `package.json` + `.gitignore` + `tailwind.input.css` + `npm i` + `npm run build:css` → `shared/tailwind.css` ; ajout à `LOCAL_ASSETS` ; bump SW | 1 commit | (pas de changement de rendu — CDN encore actif partout) |
| **1 — pilote** | swap `etudiant/index.html` ; bump SW | 1 commit | **clair + dark**, rendu identique au CDN |
| **2** | swap `extern/index.html` (safelist soigné) ; bump SW | 1 commit | idem |
| **3** | swap `pds/index.html` (safelist soigné) ; bump SW | 1 commit | idem |
| **4** | swap `patient/index.html` ; bump SW | 1 commit | idem |
| **5** | swap `admin/index.html` (vérifier l'iframe Toolbox inchangée) ; bump SW | 1 commit | idem |
| **6** | swap `index.html` racine ; bump SW | 1 commit | idem |

- `extern/` et `pds/` traités tôt (tranches 2-3) car ils concentrent les classes
  dynamiques → safelist vérifié pendant qu'il reste des pages témoins sur CDN.
- Entre chaque tranche : **JC push + valide en prod** avant la suivante (méthode
  imposée). Toute page non encore migrée reste sur CDN → zéro régression sur le reste.
- Après validation de la tranche 6 : le CDN n'est plus référencé nulle part. Aucun
  fichier à supprimer (le `<script>` a été retiré ligne par ligne).

---

## 5. Pré-audit interne (avant exécution)

Lecture seule, avant la tranche 0 :
- Relire les `<head>` des 6 pages pour confirmer la forme exacte des 2 lignes à retirer
  et l'absence d'autre directive Tailwind inline.
- Inventorier les ~15 usages de classes dynamiques (JS) pour préparer un safelist
  candidat.
- Confirmer qu'aucune page ne dépend d'un comportement runtime spécifique du CDN
  (ex. injection de classes après chargement non couverte par le scan statique).
- Vérifier la dernière version stable `@tailwindcss/cli` à épingler.

---

## 6. ROI attendu

- **Suppression de la compilation CSS in-browser** à chaque chargement → gain
  CPU/main-thread, sensible sur téléphones bas de gamme (contexte hospitalier,
  mobile-first).
- **Bundle runtime → CSS statique** : remplacement du gros bundle
  `@tailwindcss/browser` (centaines de Ko) par une CSS minifiée (~10-30 Ko, classes
  utilisées seulement), pré-cachée par le SW.
- **Élimination d'une dépendance CDN runtime** → supprime une classe entière
  d'incidents « bump de version CDN casse l'app » (cf. Babel 8). CSS commitée =
  rendu déterministe.
- **Offline plus robuste** : plus de compile au runtime, CSS locale pré-cachée.

## 7. Risques & mitigations

| Risque | Probabilité | Mitigation |
|---|---|---|
| Classe dynamique/JS non captée → élément non stylé | Faible | `@source` HTML+JS, safelist `@source inline(...)`, **validation visuelle par page**, CDN conservé jusqu'à validation |
| Oubli de relancer `build:css` après ajout d'une classe | Moyenne (humain) | Commande unique documentée (CLAUDE.md §8 + CHANGELOG) ; régénération triviale. Évolution possible : check pre-commit (hors périmètre) |
| Diff visuel CLI vs runtime | Très faible | Même moteur v4 + thème défaut → quasi-nul ; vérif prod clair+dark par page |
| `node_modules` racine | — | Dev-only, gitignoré ; aligné sur metaboscope/toolbox-app |
| iframe Toolbox (admin) impactée | Faible | La Toolbox est une iframe à styling propre (Vite) ; vérif explicite tranche 5 |

---

## 8. Critères de succès

- Les 6 pages rendent **visuellement identiques** au CDN, en clair et en dark, en prod.
- Plus aucune référence à `@tailwindcss/browser` dans le code servi.
- `shared/tailwind.css` < ~50 Ko minifié, pré-caché, app fonctionnelle offline.
- Régénération documentée et reproductible (`npm run build:css`).
- Aucune réécriture complète de fichier ; un commit par tranche ; SW bumpé à chaque
  tranche.

---

## 9. Documentation à mettre à jour (fin de chantier)

- `CLAUDE.md` §8 : noter la commande `npm run build:css` et la règle « régénérer après
  ajout/retrait de classes Tailwind sur une page racine ». Mettre à jour la mention
  « Tailwind CSS via CDN » de la stack technique (§2) et le SW courant.
- `CHANGELOG.md` : 1 ligne pour la version livrée.
- Mémoires projet : note de migration (analogue à `project_toolbox_vite_migration`).
