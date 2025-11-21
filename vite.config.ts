import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Cast process to any to avoid TS errors in some environments
  const env = loadEnv(mode, (process as any).cwd(), '')

  return {
    plugins: [react()],
    define: {
      // Define 'process.env' as an object so accessing process.env.API_KEY works at runtime.
      // We map the build-time env var to the client-side process.env object.
      'process.env': {
        API_KEY: env.API_KEY,
        NODE_ENV: mode,
      }
    }
  }
})