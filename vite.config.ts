import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // three.js lives in its own lazy chunk for the 3D room, which is expected to be large.
  build: { chunkSizeWarningLimit: 1000 },
  css: {
    // XP.css ships one selector the minifier rejects; skip it instead of failing the build.
    lightningcss: { errorRecovery: true },
  },
})
