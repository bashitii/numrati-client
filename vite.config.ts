import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { assistantApi } from './server/assistant.ts'

export default defineConfig(({ mode }) => {
  // Reads GEMINI_API_KEY from .env (server only, never sent to the browser)
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), assistantApi(env.GEMINI_API_KEY)],
    // Everything under /api goes to the Express server (Capstone2-server), except /api/chat
    // which the assistant plugin above answers first.
    server: {
      proxy: { '/api': { target: env.NUMRATI_API ?? 'http://localhost:4000', changeOrigin: true } },
    },
  }
})
