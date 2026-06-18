import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Sous-app Toolbox V1 — build Vite (remplace Babel in-browser).
//   base: './'  → assets résolus en relatif : l'app est servie en iframe
//                 depuis /staff/toolbox-app/dist/ par USCA-Connect.
//   Pas de PWA ici : c'est le sw.js de USCA-Connect qui pré-cache le build.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', emptyOutDir: true, sourcemap: false },
})
