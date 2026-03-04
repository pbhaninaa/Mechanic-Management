import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import mkcert from 'vite-plugin-mkcert'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env files based on the current mode
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [
      vue(),
      vueDevTools(),
      mkcert(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    define: {
      // Make env variables accessible in your code
      __VITE_API_URL__: JSON.stringify(env.VITE_API_URL),
      __VITE_APP_ENV__: JSON.stringify(env.VITE_APP_ENV),
    },
    server: {
      https: true,
      host: '0.0.0.0',
      // Use Vite default port (5173) - no custom port to avoid workplace firewall issues
    }
  }
})
