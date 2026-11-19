import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    // Everything under /api (including the Sanadak chat) goes to the Express server (numrati-server)
    server: {
      proxy: { '/api': { target: env.NUMRATI_API ?? 'http://localhost:4000', changeOrigin: true } },
    },
  }
})
