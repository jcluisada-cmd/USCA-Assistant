# Intégration MetaboScope → USCA-Connect

> Ce dossier `Export/` contient tout ce qu'il faut pour copier-coller MetaboScope dans
> `C:\Users\jclui\Documents\USCA-Connect\` et l'intégrer comme un sous-module appelé
> en iframe depuis la Toolbox staff (carte « Interactions (MetaboScope) »).
>
> Ce guide est rédigé pour être suivi pas à pas — chaque étape est isolée et reprenable.

---

## Vue d'ensemble

**Stratégie d'intégration : iframe statique** (pattern déjà utilisé par USCA-Connect v4.17 pour les fiches EEG/ECT).

```
USCA-Connect/
├── staff/toolbox.html       ← case "interactions" → iframe vers metaboscope
├── sw.js                    ← pré-cache index.html metaboscope + bump version
└── metaboscope/             ← (NOUVEAU) sous-dossier autonome, copié depuis Export/
    ├── dist/                ← build statique servi à l'iframe
    │   ├── index.html       ← chemins relatifs ./assets/...
    │   ├── assets/index-*.js
    │   ├── assets/index-*.css
    │   ├── favicon.svg
    │   └── icons/
    ├── src/                 ← sources React/Vite/TS pour modifications futures
    ├── public/, tests/, scripts/
    ├── package.json, vite.config.ts, etc.
    ├── DATA_SCHEMA.md
    └── INSTRUCTIONS_PROJET_METABOSCOPE.md
```

**Décisions de conception cristallisées (à connaître avant tout patch) :**

1. **Vite `base: './'`** — tous les chemins assets dans `dist/index.html` sont relatifs.
   L'app est portable : peut être servie depuis n'importe quel sous-chemin
   (`/metaboscope/`, `/staff/metaboscope/`, etc.). Pas besoin d'ajuster la config si
   JC déplace le dossier.

2. **Service worker MetaboScope DÉSACTIVÉ** dans le build d'export.
   Raison : USCA-Connect a déjà son SW (`sw.js`), et empiler deux SW concurrents au
   sein du même origin casse la cohérence offline et le scope. Le SW USCA gère seul
   le pré-cache + cache-first des assets MetaboScope.

3. **BrowserRouter conservé** (pas de migration HashRouter).
   Tant que l'iframe charge initialement `./metaboscope/dist/index.html`, la navigation
   client-side React Router fonctionne sans adaptation. Voir §Limites connues plus bas
   pour le cas du deep-link au reload.

4. **Pas d'intégration backend / pas de partage de session.**
   MetaboScope reste une PWA strictement read-only et stateless (le panier comparateur
   et le flag DisclaimerGate vivent dans le `localStorage` de l'iframe, séparé de
   USCA-Connect). C'est cohérent avec les invariants MetaboScope (« Pas de données
   patient », CLAUDE.md §2).

---

## Étape 1 — Copier le dossier `metaboscope/`

Depuis `C:\Users\jclui\Documents\MetaboScope\Export\`, copier le dossier
`metaboscope/` complet vers la racine de USCA-Connect :

```powershell
Copy-Item `
  -Path 'C:\Users\jclui\Documents\MetaboScope\Export\metaboscope' `
  -Destination 'C:\Users\jclui\Documents\USCA-Connect\metaboscope' `
  -Recurse -Force
```

**Vérification post-copie :**

```powershell
Get-ChildItem 'C:\Users\jclui\Documents\USCA-Connect\metaboscope\dist' | Format-Table Name
# doit afficher : assets, icons, _headers, _redirects, favicon.svg, index.html
```

---

## Étape 2 — Patch `staff/toolbox.html`

**But :** rediriger la carte « Interactions (MetaboScope) » et l'item de bottom nav
vers un iframe pointant sur le build MetaboScope, en réutilisant le pattern
`selEegFiche` déjà en place pour les fiches EEG (toolbox.html v4.17).

### 2.1 Localisation des modifs

3 emplacements dans `staff/toolbox.html` :

| Emplacement | Ligne approx (v4.21) | Action |
|---|---|---|
| Composant `InterCheck` (ancien comparateur léger) | 822-859 | À conserver en fallback si JC veut, sinon à supprimer. Recommandation : **conserver** comme `InterCheckLite` au cas où le SW MetaboScope tomberait. |
| `case "interactions"` du switch principal | ~1579 | **Remplacer** le retour `<InterCheck/>` par un iframe vers MetaboScope. |
| Bottom nav `moreItems` + grille des petites cartes home | ~1467, ~1511 | Inchangés (les `nav("interactions")` continuent à pointer sur le bon case). |

### 2.2 Snippet à appliquer

**Remplacer la ligne 1579 :**

```jsx
case "interactions": return <InterCheck onBack={()=>nav("home")}/>;
```

**Par :**

```jsx
case "interactions": {
  // Iframe MetaboScope — pattern aligné sur selEegFiche (v4.17).
  // Le path est relatif à staff/toolbox.html, donc "../metaboscope/..." pour
  // remonter à la racine puis descendre dans metaboscope/dist/.
  // Le thème (clair/sombre) n'est pas propagé : MetaboScope a son propre thème navy
  // qui reste cohérent en clair comme en sombre. À câbler en v1.1 si besoin.
  const metaboscopePath = '../metaboscope/dist/index.html';
  return <div className="fade-in">
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
      <button onClick={()=>nav("home")} title="Retour" style={{display:"flex",alignItems:"center",justifyContent:"center",width:32,height:32,borderRadius:8,background:C.n[100],border:"none",cursor:"pointer",flexShrink:0}}>{I.chevL(C.n[600])}</button>
      <span style={{fontSize:14,fontWeight:800,color:C.n[800],flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Interactions · MetaboScope</span>
      <button onClick={()=>window.open(metaboscopePath,'_blank')} title="Ouvrir dans un nouvel onglet" style={{display:"flex",alignItems:"center",justifyContent:"center",width:32,height:32,borderRadius:8,background:C.t[50],border:`1px solid ${C.t[300]}`,cursor:"pointer",flexShrink:0,fontSize:14,fontWeight:700,color:C.t[700]}}>↗</button>
    </div>
    <iframe className="fiche-iframe" src={metaboscopePath} style={{width:"100%",border:"none",height:"calc(100vh - 180px)",borderRadius:12}} title="MetaboScope"/>
  </div>;
}
```

> Note : le pattern `selEegFiche` existant (toolbox.html ligne 1583) utilise
> `../eeg_ect/fiche_${slug}.html` depuis le même fichier — c'est exactement la
> même logique de remontée d'un niveau, donc le `../metaboscope/dist/index.html`
> est cohérent avec ce qui marche déjà en production USCA-Connect.

### 2.3 Variante : conserver `InterCheck` lite + offrir un toggle

Si JC veut un fallback ultra-léger (l'ancien comparateur basé sur la table
`INTERACTIONS` interne, qui marche même hors ligne en cas de pépin MetaboScope),
laisser `InterCheck` en place et ajouter un bouton de switch dans le header de
l'iframe. **Pas recommandé v1** — alourdit l'UI, et le build MetaboScope est
robuste. À reconsidérer seulement si retours d'usage le demandent.

---

## Étape 3 — Patch `sw.js`

**But :**
- Bumper la version de cache pour invalider l'ancienne (`v4.24` → `v4.25`).
- Ajouter `metaboscope/dist/index.html` + `favicon.svg` + `icons/icon.svg` au
  pré-cache `LOCAL_ASSETS`. Les assets hashés (`assets/index-XXXXX.js`,
  `.css`) seront cachés automatiquement à la première requête via la stratégie
  cache-first déjà en place dans le `fetch` listener (ligne 154-166 de `sw.js`).

### 3.1 Snippet — bump version

**Ligne 1 de `sw.js` :**

```js
const CACHE_NAME = 'usca-v4.24';
```

**Devient :**

```js
const CACHE_NAME = 'usca-v4.25';
```

### 3.2 Snippet — ajout au pré-cache

**Dans le tableau `LOCAL_ASSETS` (lignes 8-68 de `sw.js`), ajouter en fin de liste juste avant `'./icon-192.png'` :**

```js
  // ── MetaboScope (sous-app React/Vite intégrée en iframe) ──
  // Seuls index.html + favicon + icon sont pré-cachés. Les bundles JS/CSS hashés
  // (./metaboscope/dist/assets/index-*.{js,css}) sont cachés au runtime via la
  // stratégie cache-first déjà en place dans le fetch listener.
  // À chaque rebuild de MetaboScope (npm run build dans metaboscope/), bumper
  // CACHE_NAME ci-dessus pour forcer la ré-installation et purger l'ancien index.
  './metaboscope/dist/index.html',
  './metaboscope/dist/favicon.svg',
  './metaboscope/dist/icons/icon.svg',
```

### 3.3 Détail du commentaire de version

Mettre à jour `CLAUDE.md` (header v4.25) avec une note du genre :

```markdown
> v4.25 — Intégration MetaboScope (carte Interactions Toolbox).
> 1. **Sous-app `metaboscope/`** : copie du build statique React/Vite (dist/) +
>    sources, stack autonome (~1.6 MB sources, ~600 KB dist). Sert de back-end
>    en lecture seule pour la carte Interactions (MetaboScope) du toolbox.
> 2. **Pattern iframe** appliqué (cohérent avec EEG/ECT v4.17) : nouveau snippet
>    dans le case "interactions" du switch principal de toolbox.html — bouton
>    retour + ↗ ouvrir dans un nouvel onglet + iframe height calc(100vh - 180px).
> 3. **SW bump v4.24 → v4.25** : pré-cache de metaboscope/dist/index.html
>    + favicon + icons. Assets hashés laissés en cache-first runtime.
```

---

## Étape 4 — Test local

```powershell
# Servir USCA-Connect en local pour vérifier
Set-Location 'C:\Users\jclui\Documents\USCA-Connect'

# Option A : serveur Python (le plus simple)
python -m http.server 8080

# Option B : serveur Node si tu préfères
npx http-server -p 8080 -c-1
```

Puis ouvrir `http://localhost:8080/staff/toolbox.html` :

- [ ] La carte « Interactions » de la home affiche le sous-titre `(MetaboScope)`.
- [ ] Cliquer sur la carte → l'iframe s'ouvre et affiche le DisclaimerGate
      MetaboScope (si premier lancement) ou la home MetaboScope.
- [ ] Le bouton ← (gauche) revient à la home Toolbox.
- [ ] Le bouton ↗ (droite) ouvre MetaboScope dans un nouvel onglet
      (URL = `http://localhost:8080/metaboscope/dist/index.html`).
- [ ] Recherche d'une molécule (ex: « fluoxétine ») → fiche s'ouvre dans l'iframe.
- [ ] Onglet Atlas → liste CYP/UGT/Transporteurs s'affiche.
- [ ] Onglet Comparateur → on peut sélectionner 2 molécules et voir les cartes PD.
- [ ] DevTools → Application → Service Workers : `usca-v4.25` actif et `controlling`.
- [ ] DevTools → Application → Cache Storage → `usca-v4.25` : contient
      `./metaboscope/dist/index.html` + `favicon.svg` + `icons/icon.svg`.
- [ ] DevTools → Network : couper offline → recharger → MetaboScope reste
      navigable (les assets JS/CSS doivent venir du cache).

---

## Étape 5 — Commit + push USCA-Connect

```powershell
Set-Location 'C:\Users\jclui\Documents\USCA-Connect'
git status                          # vérifier les changements attendus
git add metaboscope staff/toolbox.html sw.js CLAUDE.md
git commit -m "feat(toolbox): intègre MetaboScope en iframe (carte Interactions)"
git push
```

Cloudflare Pages re-déploie automatiquement. Le SW USCA des navigateurs déjà
installés détectera le bump `v4.25` au prochain `fetch` et installera la nouvelle
version (rechargement éventuel pour basculer).

---

## Développer / rebuilder MetaboScope dans USCA-Connect

JC peut maintenant **modifier MetaboScope directement depuis USCA-Connect** :

```powershell
Set-Location 'C:\Users\jclui\Documents\USCA-Connect\metaboscope'
npm install              # 14 sec, première fois seulement
npm run dev              # http://localhost:5173, hot reload
```

Pour pousser les modifs en production (= mettre à jour l'iframe) :

```powershell
npm run build            # génère metaboscope/dist/
# Bumper sw.js : v4.25 → v4.26 (sinon les anciens index.html cachés persistent)
# Commit + push
```

> **Décision 2026-05-08 : `metaboscope/` dans USCA-Connect = source unique.** Le
> repo MetaboScope d'origine est figé (à archiver sur GitHub) — ne plus y faire
> de modifs. Toutes les molécules, audits, tests et corrections vivent désormais
> dans `USCA-Connect/metaboscope/`. Si la distribution standalone redevient
> nécessaire, ré-extraire `metaboscope/` vers son propre repo prendra ~1h
> (filter-branch + push). Justification complète : pas de backend Supabase/CF
> côté MetaboScope, pas d'équipe externe à synchroniser, et la duplication
> précédente créait un risque de divergence garanti.

**Workflow recommandé (source unique) :**
1. Modifier les sources dans `metaboscope/src/`
2. Valider : `cd metaboscope && npm run validate:molecules && npm test` (les
   invariants qualité — validate-molecules, tests Vitest, `warnings.md` — restent
   en place dans la copie USCA, pas besoin d'aller-retour avec un autre repo)
3. Build : `npm run build` (génère `metaboscope/dist/`)
4. Bump `CACHE_NAME` dans `sw.js` racine USCA-Connect
5. Commit + push tout en un seul commit USCA-Connect

**Garde-fou contre l'oubli de rebuild** (à mettre en place quand le rythme
augmente) : GitHub Action `metaboscope-build.yml` qui détecte un diff dans
`metaboscope/src/**` sans diff correspondant dans `metaboscope/dist/**` et fait
fail le push, ou hook pre-commit local qui vérifie que `dist/index.html` est
plus récent que `src/main.tsx`.

---

## Limites connues / questions ouvertes

### L1. Pas de partage de thème clair/sombre

USCA-Connect a un toggle ☀️/🌙 (`localStorage.usca_theme`) qui se propage aux
fiches EEG via un query param `?theme=dark`. MetaboScope ignore ce paramètre —
son thème navy reste fixe. Pas critique en v1 (le navy est cohérent dans les
deux modes), mais à câbler proprement en v1.1 si JC le souhaite : exposer une
constante `?theme=dark|light` côté MetaboScope dans `App.tsx` et appliquer
classe `dark` sur `<html>`.

### L2. Pas de pré-cache des bundles hashés

Le SW USCA pré-cache `metaboscope/dist/index.html` mais PAS les bundles
`assets/index-XXXXX.js` (le hash change à chaque build, on ne peut pas les
hardcoder). Conséquence : la **première** ouverture de l'iframe en mode hors
ligne **après un nouveau build** échouera, jusqu'à un premier accès en ligne.
Une fois caché au runtime, les utilisations suivantes hors ligne fonctionnent.

Workaround si critique en v1.1 : générer le `LOCAL_ASSETS` à partir d'un manifest
build (Vite peut produire un `manifest.json` dans `dist/`), et injecter les
chemins exacts au moment du build USCA-Connect.

### L3. Deep-link au reload de l'iframe

L'iframe charge initialement `metaboscope/dist/index.html`. La nav React Router
fonctionne client-side. Si l'utilisateur fait F5 alors qu'il est sur une route
profonde (`/search/lithium`), Cloudflare Pages servira un 404 (pas de SPA
fallback configuré pour le sous-arbre `metaboscope/`).

Workaround optionnel v1.1 : ajouter une règle dans `USCA-Connect/_redirects` :
```
/metaboscope/dist/*  /metaboscope/dist/index.html  200
```

Pas urgent : en pratique l'utilisateur reste dans l'iframe sans recharger.

### L4. Validate-molecules / tests pas exécutés en CI USCA

Le repo USCA-Connect n'a pas de CI Node. Les tests et `validate:molecules` se
lancent à la main depuis `metaboscope/`. Si JC modifie un JSON sans valider,
rien ne le bloque côté USCA. Le filet de sécurité reste à exécuter manuellement
ou côté repo MetaboScope d'origine.

---

## Récap : ce que tu copies, ce que tu modifies

| Action | Fichier / dossier |
|---|---|
| **Copier** (nouveau) | `Export/metaboscope/` → `USCA-Connect/metaboscope/` |
| **Modifier** | `USCA-Connect/staff/toolbox.html` (case `"interactions"`) |
| **Modifier** | `USCA-Connect/sw.js` (CACHE_NAME bump + LOCAL_ASSETS append) |
| **Modifier** | `USCA-Connect/CLAUDE.md` (entrée v4.25 en-tête) |
| **Inchangé** | Tout le reste de USCA-Connect |
| **Inchangé** | Le repo MetaboScope d'origine (Export n'est qu'un dérivé) |

---

## Checklist finale

- [ ] `metaboscope/dist/index.html` ouvert directement dans le navigateur
      affiche bien la home MetaboScope (test isolé avant toolbox).
- [ ] Patch toolbox.html appliqué et chemin `../metaboscope/dist/index.html`
      vérifié (relatif au sous-dossier `staff/`).
- [ ] `CACHE_NAME` bumpé dans sw.js + 3 nouveaux assets dans `LOCAL_ASSETS`.
- [ ] Test local OK (cf. §Étape 4).
- [ ] Commit + push USCA-Connect.
- [ ] Vérification post-déploiement Cloudflare Pages (production).

---

*Généré le 2026-05-08 depuis le repo MetaboScope (branche `feat/v1-implementation`,
commit après v1.0.1 v1.0 livré). Stack figée : React 18 · Vite 5 · TS · Tailwind 3.*
