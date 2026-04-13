# USCA Assistant — Guide de déploiement

## Contenu du dossier
```
usca-pwa/
├── index.html      ← L'application complète
├── manifest.json   ← Manifeste PWA (icône, nom, mode standalone)
├── sw.js           ← Service Worker (cache hors-ligne)
└── DEPLOY.md       ← Ce fichier
```

## Option 1 : Test local immédiat (PC AP-HP)

Double-cliquer sur `index.html` → fonctionne dans le navigateur.

⚠️ Le mode hors-ligne et l'installation PWA ne fonctionnent qu'avec un serveur HTTPS.

Pour tester avec un serveur local (si Node.js portable est installé) :
```powershell
cd usca-pwa
npx serve .
```
→ Ouvrir http://localhost:3000

---

## Option 2 : Déploiement GitHub Pages (recommandé — gratuit)

### Étape 1 : Créer un dépôt GitHub
1. Aller sur https://github.com/new
2. Nom du dépôt : `usca-assistant` (ou au choix)
3. Visibilité : **Private** (recommandé) ou Public
4. Créer le dépôt

### Étape 2 : Pousser les fichiers
Depuis le PC AP-HP (Git Portable) :
```powershell
cd usca-pwa
git init
git add .
git commit -m "USCA Assistant v1.0"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/usca-assistant.git
git push -u origin main
```

### Étape 3 : Activer GitHub Pages
1. Sur GitHub → Settings → Pages
2. Source : **Deploy from a branch**
3. Branch : `main`, dossier `/ (root)`
4. Save

→ L'app sera accessible à : `https://TON_USERNAME.github.io/usca-assistant/`

### Étape 4 : Installer sur téléphone
1. Ouvrir l'URL sur le navigateur du téléphone (Chrome ou Safari)
2. **Android** : le navigateur propose "Ajouter à l'écran d'accueil" (ou via le menu ⋮)
3. **iPhone** : Safari → bouton partage (↑) → "Sur l'écran d'accueil"

→ L'app apparaît comme une icône sur l'écran d'accueil, s'ouvre en plein écran, fonctionne hors-ligne.

---

## Option 3 : Déploiement Netlify (alternative gratuite)

1. Aller sur https://app.netlify.com
2. Glisser-déposer le dossier `usca-pwa/` sur la zone de drop
3. URL générée automatiquement (ex: `random-name.netlify.app`)
4. Renommer en `usca-pitie.netlify.app` dans les paramètres

---

## Option 4 : Domaine personnalisé

Quand le domaine de l'unité sera transféré :
1. Ajouter un enregistrement CNAME pointant vers `TON_USERNAME.github.io`
2. Configurer le domaine dans GitHub Pages → Settings → Pages → Custom domain

---

## Mises à jour

Modifier `index.html` localement, puis :
```powershell
git add .
git commit -m "Mise à jour vX.X"
git push
```
GitHub Pages se met à jour en ~1 minute.

Pour forcer le rafraîchissement du cache sur les téléphones :
- Modifier le numéro de version dans `sw.js` (ligne 1 : `CACHE_NAME`)
- Les utilisateurs verront la mise à jour au prochain lancement

---

## Sécurité

- **Aucune donnée patient** n'est stockée ou transmise
- L'app fonctionne 100% côté client (navigateur)
- Les checklists (séjour J1-J12) sont en mémoire de session uniquement
- Dépôt privé GitHub = accès restreint au code source
- HTTPS obligatoire (assuré par GitHub Pages / Netlify)
