import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { compression } from 'vite-plugin-compression2'
import { VitePWA } from 'vite-plugin-pwa'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [
    vue(),

    // Importa automáticamente SOLO los componentes de Vuetify que se usan (tree-shaking).
    vuetify({ autoImport: true }),

    // PWA: la app se instala y funciona sin conexión. Después de la primera visita
    // los archivos salen de la caché del dispositivo (≈ 0 KB de red en visitas siguientes).
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Generador QR',
        short_name: 'QR',
        description: 'Crea códigos QR gratis para enlaces, Wi‑Fi, WhatsApp, correo, SMS y contactos.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f4f5fa',
        theme_color: '#4338ca',
        categories: ['utilities', 'productivity'],
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallbackDenylist: [/^\/health$/],
      },
    }),

    // Pre-comprime los archivos en el build (brotli + gzip). Nginx los sirve tal cual,
    // sin gastar CPU comprimiendo en cada petición.
    compression({
      algorithms: ['brotliCompress', 'gzip'],
      include: /\.(js|mjs|css|html|svg|json|webmanifest|txt)$/,
      threshold: 512,
      skipIfLargerOrEqual: true,
    }),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
  },

  build: {
    // El target por defecto de Vite ("baseline-widely-available") cubre Chrome, Edge,
    // Firefox y Safari de los últimos ~2,5 años, en escritorio y móvil.
    assetsInlineLimit: 2048,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 400,
    rolldownOptions: {
      output: {
        // Librerías en archivos separados: al publicar cambios en la app, los
        // navegadores solo vuelven a descargar el código propio (unos pocos KB).
        codeSplitting: {
          groups: [
            { name: 'framework', test: /node_modules[\\/](vuetify|vue|@vue)[\\/]/, priority: 2 },
            { name: 'vendor', test: /node_modules[\\/]/, priority: 1 },
          ],
        },
      },
    },
  },

  server: {
    port: 5173,
  },
})
