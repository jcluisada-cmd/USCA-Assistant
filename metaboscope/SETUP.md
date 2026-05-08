# SETUP.md — Démarrage MetaboScope

> À exécuter une seule fois pour initialiser le projet React/Vite/PWA.

## Prérequis

- Node.js ≥ 18 installé (vérifier : `node -v`)
- npm ≥ 9 (`npm -v`)
- Git Portable configuré

## 1. Scaffolding Vite + React + TypeScript

Depuis `C:\Users\4070521\Documents\` (le parent, PAS MetaboScope lui-même) :

```bash
# Si le dossier MetaboScope existe déjà avec juste CLAUDE.md/.gitignore :
cd MetaboScope
npm create vite@latest . -- --template react-ts
# Répondre "y" si Vite demande d'écrire dans un dossier non vide
npm install
```

## 2. Dépendances principales

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

npm install dexie
npm install -D vite-plugin-pwa
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

## 3. tailwind.config.ts — palette USCA

Remplacer le contenu généré par :

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0f1e33',
          800: '#1e3a5f',
          700: '#1e4976',
        },
        teal: {
          600: '#0d9488',
          500: '#14b8a6',
          400: '#2dd4bf',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
```

## 4. vite.config.ts — PWA

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'MétaboScope',
        short_name: 'MétaboScope',
        description: 'Aide à la décision — métabolisme & interactions médicamenteuses',
        theme_color: '#1e3a5f',
        background_color: '#0f1e33',
        display: 'standalone',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^\/src\/data\/molecules\/.+\.json$/,
            handler: 'CacheFirst',
            options: { cacheName: 'molecules-data', expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
      },
    }),
  ],
})
```

## 5. vitest.config.ts

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
})
```

```ts
// tests/setup.ts
import '@testing-library/jest-dom'
```

## 6. Copier les JSON molécules

```bash
mkdir -p src/data/molecules
# Copier les 4 fichiers JSON validés ici :
# molecules_opioides_tso.json
# molecules_antidepresseurs.json
# molecules_antipsychotiques.json
# molecules_thymoregulateurs_anticonvulsivants.json
```

## 7. Script de validation JSON

```bash
mkdir scripts
```

Créer `scripts/validate-molecules.js` — Claude Code peut le générer à la demande.

## 8. Premier lancement

```bash
npm run dev
# → http://localhost:5173
```

## 9. Vérifier l'état git

```bash
git status
git add CLAUDE.md DATA_SCHEMA.md .gitignore package.json src/
git commit -m "init: scaffold MetaboScope React/Vite/PWA"
git remote add origin https://github.com/TON_USERNAME/MetaboScope.git
git push -u origin main
```
