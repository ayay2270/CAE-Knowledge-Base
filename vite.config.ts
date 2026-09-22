import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Production builds use the GitHub Pages project path; `vite` / `vite preview` keep `/` for local use.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/CAE-Knowledge-Base/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 43127,
    strictPort: true,
  },
}))
