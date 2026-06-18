# Spec — Migration Toolbox V1 vers Vite (port 1:1)

> **Date** : 2026-06-18
> **Statut** : validé en brainstorming, prêt pour le plan d'implémentation
> **Auteur** : Dr JC Luisada + Claude
> **Périmètre** : Étape 1 du chantier de modernisation incrémentale de la stack USCA Connect.

---

## 1. Contexte & motivation

La Toolbox V1 (`staff/toolbox.html`) est la **seule** page de l'app qui transpile son React **dans le navigateur via Babel standalone**. À chaque ouverture, le navigateur doit :

- télécharger + parser **~3,0 Mo** de Babel (le compilateur complet) ;
- transpiler **1 652 lignes de JSX** au runtime avant le moindre affichage ;
- puis monter React.

Ce mécanisme est **lent** (latence ~500 ms, pire sur mobile / Wi-Fi AP-HP) **et fragile**. Le 2026-06-16/17, la sortie de `@babel/standalone@8.0.0/8.0.1` (version majeure, breaking) a basculé l'URL CDN non épinglée de Babel 7.x → 8.x, cassant la transpilation → **écran blanc total de la Toolbox sur tous les navigateurs**. Corrigé en urgence par l'épinglage `@babel/standalone@7.29.7` (commit `d01c715`, v4.43).

L'épinglage est un pansement. La **cause racine** est la dépendance à un compilateur au runtime. Cette spec la supprime.

## 2. Objectif

Remplacer Babel-in-browser par un **build Vite**, **sans changer le comportement** de la Toolbox. Résultat attendu :

- plus aucun téléchargement de Babel ni transpilation au runtime → **ouverture quasi instantanée** ;
- React/ReactDOM **bundlés** → plus aucune dépendance CDN au runtime → **l'écran blanc du 18 juin devient structurellement impossible** ;
- iso-fonctionnalité stricte : aucun changement visuel ni fonctionnel.

## 3. Décisions cadrées (brainstorming 2026-06-18)

| Décision | Choix retenu |
|---|---|
| Ampleur du port | **Port 1:1 en JavaScript** — pas de TypeScript, pas de découpage du monolithe, pas de refonte visuelle |
| Organisation | **Approche A** — sous-app Vite isolée dans `staff/toolbox-app/`, calquée sur `metaboscope/` |
| Build / déploiement | **`dist/` commité** (pas de CI). `npm run build` lancé **par Claude** à chaque modif → seamless pour JC |
| Dépendances | React/ReactDOM **bundlés** (fin du CDN unpkg) |
| Ancien fichier | `staff/toolbox.html` **supprimé après validation visuelle** |

## 4. Architecture cible

```
staff/
├── toolbox.html              ← SUPPRIMÉ une fois le build validé
└── toolbox-app/              ← sous-app Vite isolée (calquée sur metaboscope/)
    ├── package.json          ← react, react-dom, vite, @vitejs/plugin-react
    ├── vite.config.js        ← base:'./', plugins:[react()], build.outDir:'dist'
    ├── .gitignore            ← node_modules/ ignoré ; dist/ VOLONTAIREMENT commité
    ├── index.html            ← <div id=root> + scripts setup + <style>/styles.css + import main.jsx
    ├── src/
    │   ├── main.jsx          ← imports React + montage createRoot (ex-lignes 104-105 + 1754)
    │   ├── App.jsx           ← le bloc JSX de 1652 lignes, COPIÉ TEL QUEL
    │   └── styles.css        ← le contenu de <style> actuel (lignes 33-99), importé par main
    └── dist/                 ← BUILD commité : index.html + assets/index-[hash].{js,css}
```

Versions des dépendances alignées sur `metaboscope/package.json` : `react@^18.3.1`, `react-dom@^18.3.1`, `vite@^5.4.11`, `@vitejs/plugin-react@^4.3.4`. (Pas de TypeScript, Tailwind, Dexie ni router — non utilisés par la Toolbox.)

## 5. Le port du code (1:1, aucune logique modifiée)

- **`src/App.jsx`** = copier-coller **exact** du bloc `<script type="text/babel">` actuel (icônes `I`, tous les composants, le composant `App`). Aucune ligne de logique modifiée.
- **`src/main.jsx`** :
  - `import React, { useState, useMemo, useCallback, useEffect } from 'react'` + `import { createRoot } from 'react-dom/client'` (remplace le `const { … } = React` global, ligne 105) ;
  - `import App from './App.jsx'` + `import './styles.css'` ;
  - `createRoot(document.getElementById('root')).render(<App />)` (ex-ligne 1754).
  - **Pas de `React.StrictMode`** : on ne l'ajoute pas, pour garantir un comportement strictement identique à l'actuel.
- Les `<script>` de **setup** (alias `window.sb`, chargement `modules-config.js` + `module-visibility.js`, init `moduleVisibility.apply`) et de **post-montage** (mode `embedded`, dark mode + reload sur `postMessage`/`storage`, enregistrement Service Worker) restent **inline dans `index.html`**, hors bundle — exactement comme aujourd'hui (lignes 17-31 et 1757-1801).

## 6. Intégration (les seuls fichiers touchés hors `toolbox-app/`)

- **`admin/index.html`** : l'iframe charge `../staff/toolbox-app/dist/index.html?embedded=true` au lieu de `../staff/toolbox.html?embedded=true`. **Une ligne** (admin/index.html:1072).
- **`sw.js`** : dans `LOCAL_ASSETS`, remplacer `./staff/toolbox.html` par `./staff/toolbox-app/dist/index.html`. Les bundles hashés (`assets/index-*.js/css`) sont cachés **au runtime** via la stratégie cache-first existante — **exactement le pattern déjà en place pour MetaboScope** (sw.js:67-70). Bump `CACHE_NAME`.

## 7. Points d'attention techniques (pour le plan)

Le nouvel `index.html` est à `/staff/toolbox-app/dist/` (2 niveaux plus profond que `/staff/`). Les références à des fichiers **hors bundle** doivent passer en **chemins absolus** pour rester valides :

- `modules-config.js` / `module-visibility.js` : `../shared/…` → **`/shared/…`** ;
- enregistrement Service Worker : `../sw.js` → **`/sw.js`** (scope `/` conservé) ;
- `manifest.json` et `apple-touch-icon` : passer en absolu (`/manifest.json`) ou retirer du sous-app (l'iframe n'a pas besoin de son propre manifest) ;
- `base: './'` dans `vite.config.js` garantit que les assets **du bundle** (JS/CSS hashés) sont résolus en relatif et fonctionnent sous n'importe quel sous-chemin.

Comportement runtime inchangé : les accès `window.parent.sb`, `window.parent.db`, `window.parent.supabase`, `window.parent.currentProfile`, `window.parent.loadListeAttente` et l'exposition `window.__uscaToolboxState` fonctionnent à l'identique (runtime, pas de re-câblage).

## 8. Workflow build / dev

- **Dev** : `cd staff/toolbox-app && npm run dev` → test local sur `http://localhost:5173`.
- **Prod** : `npm run build` → `dist/` régénéré → commit de `dist/` **+** sources → push.
- **C'est Claude qui lance ces commandes** à chaque modif de la Toolbox. JC ne lance rien tant qu'il passe par Claude pour les modifications.
- Garde-fou optionnel (hors périmètre, à décider plus tard) : hook git pre-commit qui rebuild automatiquement si `src/` a changé, pour éviter toute désynchronisation `dist/`↔sources en cas d'édition manuelle hors Claude.

## 9. Validation / non-régression

Port 1:1 ⇒ iso-fonctionnel par construction. Avant de supprimer l'ancien `toolbox.html`, vérifier sur le build local :

1. Affichage **onglet par onglet** : Protocoles USCA, Ressources, Fiches Traitements/Substances, Dossier post-cure, Scores, EEG/ECT, Interactions (MetaboScope), ELSA, Feedback.
2. **Dark mode** : bascule clair/sombre (via `postMessage` du parent) et persistance.
3. **Intégration admin** : ouverture dans l'iframe, accès `window.parent.*` (ex. ajout liste d'attente ELSA), restauration de vue au reload.
4. **Réseau** : plus aucune requête vers `unpkg.com` ni `@babel/standalone` dans l'onglet réseau.
5. **Offline** : la Toolbox s'ouvre hors-ligne après un premier chargement online.

Suppression de `staff/toolbox.html` **uniquement après confirmation visuelle de JC** que la version buildée est identique.

## 10. Risques & mitigations

| Risque | Mitigation |
|---|---|
| `dist/` désynchronisé des sources (build oublié) | Claude lance `npm run build` à chaque modif ; hook pre-commit possible plus tard (§8) |
| Chemins relatifs cassés par la profondeur du dossier | Chemins absolus pour les refs hors bundle (§7) ; test local avant commit |
| Comportement subtilement différent (double-render) | Pas de `StrictMode` ; build prod = même sémantique que l'actuel |
| `node_modules` absent sur poste verrouillé AP-HP | `npm install` documenté ; sources réinstallables, `dist/` commité reste servi sans build |
| 1er chargement offline impossible (bundles hashés cachés au runtime) | Acceptable et identique à MetaboScope ; 1er chargement online requis |

## 11. Hors périmètre (YAGNI — étapes ultérieures du chantier)

Cette spec couvre **uniquement** la Toolbox. Explicitement reportés :

- **TypeScript** et découpage du monolithe `App.jsx` (étape 1b éventuelle, après stabilisation).
- **Tailwind pré-compilé** à la place du CDN browser (étape 2, transversale à toutes les pages).
- **Workbox** pour générer le Service Worker (étape 3).
- Migration des autres pages (`patient/`, `admin/`, `pds/`…) vers Vite (étape 4, seulement si justifiée).

## 12. Critères d'acceptation

- [ ] `npm run build` produit `staff/toolbox-app/dist/` sans erreur.
- [ ] La Toolbox buildée s'affiche et se comporte à l'identique de l'ancienne (checklist §9).
- [ ] Aucune requête runtime vers `unpkg.com` / `@babel/standalone`.
- [ ] `admin/index.html` charge le nouveau build ; `sw.js` pré-cache le nouvel `index.html` ; `CACHE_NAME` bumpé.
- [ ] Fonctionnement offline après premier chargement.
- [ ] `staff/toolbox.html` supprimé après validation visuelle de JC.
