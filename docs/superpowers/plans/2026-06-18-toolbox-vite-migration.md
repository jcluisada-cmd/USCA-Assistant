# Migration Toolbox V1 vers Vite — Plan d'implémentation

> **For agentic workers:** port mécanique 1:1. Pas de TDD (la Toolbox n'a pas de tests unitaires ; le code est copié tel quel). Vérification de chaque tâche = **build vert + parité visuelle + absence de requête CDN runtime**. Steps en cases à cocher.

**Goal:** Remplacer Babel-in-browser de la Toolbox par un build Vite, sans changer le comportement.

**Architecture:** Sous-app Vite isolée `staff/toolbox-app/` calquée sur `metaboscope/`. React/ReactDOM bundlés. `dist/` commité, servi en iframe par l'admin. Seuls `admin/index.html` (1 ligne) et `sw.js` sont touchés hors du nouveau dossier.

**Tech Stack:** Vite 5, @vitejs/plugin-react 4, React 18 (JS, pas TS).

**Référence spec:** `docs/superpowers/specs/2026-06-18-toolbox-vite-migration-design.md`

**Source à porter:** `staff/toolbox.html` (1805 lignes). Découpage :
- l.1-33 : head (meta, CDN à supprimer, scripts setup) → `index.html`
- l.34-99 : `<style>` → `src/styles.css`
- l.102 : `<div id="root">` → `index.html`
- l.104 `<script type="text/babel">` ; l.105 `const {…}=React` → remplacé par import
- l.107-1753 : icônes `I` + composants + `App` → `src/App.jsx`
- l.1755 `ReactDOM.createRoot(...).render(<App/>)` → `src/main.jsx`
- l.1758-1802 : scripts post-montage (embedded, dark, SW) → `index.html`

---

### Task 1: Scaffold de la sous-app Vite

**Files:**
- Create: `staff/toolbox-app/package.json`
- Create: `staff/toolbox-app/vite.config.js`
- Create: `staff/toolbox-app/.gitignore`

- [ ] **Step 1: `package.json`**

```json
{
  "name": "usca-toolbox",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^5.4.11"
  }
}
```

- [ ] **Step 2: `vite.config.js`** (base relative → iframe servable sous n'importe quel sous-chemin)

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', emptyOutDir: true, sourcemap: false },
})
```

- [ ] **Step 3: `.gitignore`** (dist VOLONTAIREMENT commité)

```
node_modules/
*.tsbuildinfo
.vite/
# dist/ est volontairement NON ignoré : build statique commité pour Cloudflare Pages.
```

- [ ] **Step 4: Commit**

```bash
git add staff/toolbox-app/package.json staff/toolbox-app/vite.config.js staff/toolbox-app/.gitignore
git commit -m "chore(toolbox): scaffold sous-app Vite isolee"
```

---

### Task 2: Installer les dépendances

**Files:** aucun (génère `staff/toolbox-app/node_modules/`, gitignored)

- [ ] **Step 1: install**

Run: `cd staff/toolbox-app && npm install`
Expected: `node_modules/` créé, 0 vulnérabilité bloquante, exit 0.

---

### Task 3: Porter le CSS

**Files:**
- Create: `staff/toolbox-app/src/styles.css`

- [ ] **Step 1: Copier le bloc `<style>`**

Copier le contenu **entre** `<style>` et `</style>` de `staff/toolbox.html` (lignes 34-98, sans les balises) dans `src/styles.css`. Aucune modification.

- [ ] **Step 2: Commit**

```bash
git add staff/toolbox-app/src/styles.css
git commit -m "feat(toolbox): port CSS vers src/styles.css"
```

---

### Task 4: Porter le composant React (App.jsx)

**Files:**
- Create: `staff/toolbox-app/src/App.jsx`

- [ ] **Step 1: En-tête imports** (remplace la ligne 105 `const {…} = React`)

Première ligne du fichier :

```jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react'
```

- [ ] **Step 2: Coller le code des composants**

Copier **tel quel** les lignes 107-1753 de `staff/toolbox.html` (icônes `I`, tous les composants, le composant `App`) à la suite de l'import. **Aucune ligne de logique modifiée.**

- [ ] **Step 3: Export**

Dernière ligne du fichier :

```jsx
export default App
```

- [ ] **Step 4: Vérifier l'absence d'autres globaux à importer**

Run: `grep -nE "ReactDOM|jspdf|jsPDF|supabase\\.createClient" staff/toolbox-app/src/App.jsx`
Expected: aucune occurrence de `ReactDOM` (il va dans main.jsx) ni d'import manquant. Les accès `window.parent.*` restent (runtime, normaux).

- [ ] **Step 5: Commit**

```bash
git add staff/toolbox-app/src/App.jsx
git commit -m "feat(toolbox): port composant React vers src/App.jsx (1:1)"
```

---

### Task 5: Point d'entrée (main.jsx)

**Files:**
- Create: `staff/toolbox-app/src/main.jsx`

- [ ] **Step 1: Écrire main.jsx** (remplace la ligne 1755)

```jsx
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(<App />)
```

- [ ] **Step 2: Commit**

```bash
git add staff/toolbox-app/src/main.jsx
git commit -m "feat(toolbox): point d'entree Vite (main.jsx)"
```

---

### Task 6: index.html (head + setup + post-montage, chemins absolus)

**Files:**
- Create: `staff/toolbox-app/index.html`

- [ ] **Step 1: Écrire index.html**

Reprend le head SANS les 3 `<script>` CDN React/ReactDOM/Babel (lignes 14-17, supprimés), avec chemins **absolus** pour les refs hors bundle, et le `<script type="module" src="/src/main.jsx">` à la fin du body.

```html
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<meta name="theme-color" content="#102a43">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="USCA">
<title>USCA Toolbox — Pitié-Salpêtrière</title>
<script>
  // alias parent's Supabase client into iframe scope (same-origin)
  try { window.sb = window.parent && window.parent.sb; } catch (_) {}
</script>
<script src="/shared/modules-config.js"></script>
<script src="/shared/module-visibility.js"></script>
<script>
(function() {
  try {
    const profile = window.parent && window.parent.currentProfile;
    if (profile && window.moduleVisibility) {
      window.moduleVisibility.apply(profile);
    }
  } catch (e) { console.warn('[toolbox] moduleVisibility init failed:', e); }
})();
</script>
</head>
<body>
<div id="root"></div>
<script type="module" src="/src/main.jsx"></script>
<script>
// Mode embarqué : masquer la navigation V1 quand chargé dans l'iframe staff
if (new URLSearchParams(window.location.search).has('embedded')) {
  const style = document.createElement('style');
  style.textContent = '.bottom-nav, .top-bar { display: none !important; } .content { padding-top: 8px; padding-bottom: 16px; } .fiche-iframe { height: calc(100vh - 56px) !important; }';
  document.head.appendChild(style);
}
// Dark mode : l'iframe lit le localStorage partagé (même domaine)
(function() {
  function applyToolboxDark(dark) {
    if (dark) { document.documentElement.classList.add('dark'); }
    else { document.documentElement.classList.remove('dark'); }
  }
  if (localStorage.getItem('usca_theme') === 'dark') applyToolboxDark(true);
  function saveViewThenReload() {
    try {
      if (window.__uscaToolboxState) {
        sessionStorage.setItem('usca-tb-view', JSON.stringify(window.__uscaToolboxState()));
      }
    } catch(e) {}
    window.location.reload();
  }
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'usca-theme') saveViewThenReload();
  });
  window.addEventListener('storage', function(e) {
    if (e.key === 'usca_theme') saveViewThenReload();
  });
})();
// Register Service Worker (chemin absolu : index.html est sous /staff/toolbox-app/dist/)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', {scope: '/'}).catch(()=>{});
}
</script>
</body>
</html>
```

> Note Vite : en dev, `<script type="module" src="/src/main.jsx">` est résolu depuis la racine du projet `toolbox-app/`. Au build, Vite remplace cette balise par les assets hashés et, avec `base:'./'`, les réécrit en relatif dans `dist/index.html`. Les chemins absolus `/shared/...`, `/sw.js` ne sont PAS touchés par Vite (hors `src/`) et pointent vers la racine du site servi.

- [ ] **Step 2: Commit**

```bash
git add staff/toolbox-app/index.html
git commit -m "feat(toolbox): index.html (head sans CDN, chemins absolus, setup + post-montage)"
```

---

### Task 7: Build et vérification du dist

**Files:**
- Create (généré): `staff/toolbox-app/dist/`

- [ ] **Step 1: Build**

Run: `cd staff/toolbox-app && npm run build`
Expected: exit 0 ; `dist/index.html` + `dist/assets/index-[hash].js` + `dist/assets/index-[hash].css` créés. Aucune erreur de compilation JSX.

- [ ] **Step 2: Vérifier que le dist ne référence plus de CDN**

Run: `grep -rE "unpkg|@babel/standalone" staff/toolbox-app/dist/ || echo "OK: aucune ref CDN"`
Expected: `OK: aucune ref CDN`.

- [ ] **Step 3: Commit du dist**

```bash
git add staff/toolbox-app/dist
git commit -m "build(toolbox): premier build Vite commite"
```

---

### Task 8: Preview locale + parité visuelle

**Files:** aucun

- [ ] **Step 1: Lancer la preview**

Run: `cd staff/toolbox-app && npm run preview` (sert `dist/` sur un port local).

- [ ] **Step 2: Vérification visuelle** (manuelle / capture)

Ouvrir la preview et vérifier l'affichage des onglets : Protocoles USCA, Ressources, Fiches Traitements/Substances, Dossier post-cure, Scores, EEG/ECT, Interactions (MetaboScope), ELSA, Feedback. Vérifier bascule dark mode. Comparer à l'ancienne Toolbox.
Expected: rendu identique, aucune erreur console bloquante (les warnings `window.parent.*` en standalone hors admin sont attendus).

> Note : la parité totale (accès `window.parent.db` etc.) se valide en Task 10 dans l'admin. La preview standalone valide le rendu et le montage React.

---

### Task 9: Intégration admin + Service Worker

**Files:**
- Modify: `admin/index.html:1072`
- Modify: `sw.js` (LOCAL_ASSETS + CACHE_NAME)

- [ ] **Step 1: Rebrancher l'iframe admin**

Dans `admin/index.html` ligne 1072, remplacer :

```js
document.getElementById('admin-toolbox-iframe').src = '../staff/toolbox.html?embedded=true';
```

par :

```js
document.getElementById('admin-toolbox-iframe').src = '../staff/toolbox-app/dist/index.html?embedded=true';
```

- [ ] **Step 2: Mettre à jour le pré-cache SW**

Dans `sw.js`, dans `LOCAL_ASSETS`, remplacer `'./staff/toolbox.html',` par `'./staff/toolbox-app/dist/index.html',`.

- [ ] **Step 3: Bump CACHE_NAME**

Dans `sw.js` ligne 1, remplacer `const CACHE_NAME = 'usca-v4.43';` par `const CACHE_NAME = 'usca-v4.44';`.

- [ ] **Step 4: Commit**

```bash
git add admin/index.html sw.js
git commit -m "feat(toolbox): admin charge le build Vite + SW pre-cache + bump v4.44"
```

---

### Task 10: Validation dans l'admin + suppression de l'ancien fichier

**Files:**
- Delete: `staff/toolbox.html`

- [ ] **Step 1: Valider l'intégration réelle**

Servir le projet localement (serveur statique racine) et ouvrir l'admin → onglet Toolbox. Vérifier : chargement de l'iframe, onglets fonctionnels, dark mode synchronisé depuis le parent, accès `window.parent.*` (ex. ajout liste d'attente ELSA), restauration de vue au reload, aucune requête `unpkg.com` dans l'onglet réseau.
Expected: comportement identique à l'ancienne Toolbox.

- [ ] **Step 2: Supprimer l'ancien fichier** (après confirmation visuelle)

Run: `git rm staff/toolbox.html`

- [ ] **Step 3: Vérifier l'absence de référence résiduelle**

Run: `grep -rn "staff/toolbox.html" --include="*.html" --include="*.js" . | grep -v "toolbox-app"`
Expected: aucune occurrence (toutes les refs pointent vers `toolbox-app/dist/index.html`).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(toolbox): supprime l'ancien toolbox.html (remplace par build Vite)"
```

---

### Task 11: Documentation & clôture

**Files:**
- Modify: `CHANGELOG.md`, `CLAUDE.md` (en-tête version), `sw.js` (déjà bumpé)

- [ ] **Step 1: CHANGELOG** — ajouter une ligne v4.44 (Toolbox migrée vers Vite, fin de Babel in-browser).
- [ ] **Step 2: CLAUDE.md** — mettre à jour l'en-tête « Version courante » et le Service Worker en v4.44.
- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md CLAUDE.md
git commit -m "docs(v4.44): Toolbox migree vers Vite (fin Babel in-browser)"
```

---

## Critères d'acceptation (rappel spec §12)

- [ ] `npm run build` produit `dist/` sans erreur.
- [ ] Toolbox buildée iso-fonctionnelle (checklist Task 8 + Task 10).
- [ ] Aucune requête runtime `unpkg.com` / `@babel/standalone`.
- [ ] `admin/index.html` + `sw.js` mis à jour, `CACHE_NAME` bumpé.
- [ ] Offline OK après 1er chargement.
- [ ] `staff/toolbox.html` supprimé.
