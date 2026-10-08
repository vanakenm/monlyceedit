import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// base relative : le site peut être servi depuis n'importe quel sous-dossier
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
