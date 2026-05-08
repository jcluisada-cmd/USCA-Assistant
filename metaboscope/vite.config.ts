import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration Vite — variante "portable / iframe"
//
// Différences avec la config canonique du repo MetaboScope :
//   1. base: './'        → assets résolus en relatif. L'app peut être servie
//                          depuis n'importe quel sous-chemin (ex: USCA-Connect/metaboscope/).
//   2. PWA désactivée    → vite-plugin-pwa NON inclus. Lorsque MetaboScope est
//                          intégré en iframe dans USCA-Connect, c'est le sw.js
//                          de USCA-Connect qui pré-cache les assets MetaboScope.
//                          Empiler deux service workers concurrents casserait
//                          la cohérence offline et le scope.
//
// Les routes React Router fonctionnent en relatif. Le HashRouter n'est PAS
// utilisé ici : BrowserRouter reste compatible tant que l'iframe est servi
// depuis un sous-chemin stable et que le serveur fait du fallback SPA
// (USCA-Connect le fait déjà via _redirects / Cloudflare Pages).
//
// Si JC veut développer / lancer ce build en standalone hors USCA-Connect,
// il peut soit utiliser ce config tel quel (l'app marche aussi en standalone
// sans PWA), soit réintroduire VitePWA en repartant de la config du repo
// MetaboScope d'origine.

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
})
