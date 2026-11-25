import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/__tests__/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/test/**',
        'src/main.jsx',
        'src/assets/**',
        'src/charting_library/**',
        '**/node_modules/**',
      ],
      // Scoped to tested folders — extend coverage as more tests are added
      thresholds: {
        'src/calculation/**': {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      // BUG FIX: 'autoUpdate' force-reloads the page the instant a new
      // service worker is detected, with no guard against doing so
      // mid-render. On stage this produced a recurring reload loop (and,
      // as a side effect, assets like the header logo — a single static
      // SVG — getting torn down and repainted mid-fetch, rendering only
      // the paths received before the connection was cut). 'prompt' still
      // updates the service worker, it just stops forcing an unconditional
      // page reload to do it.
      registerType: 'prompt',
      includeAssets: ['vite.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Trevolt',
        short_name: 'Trevolt',
        description: "Trade forex, metals, indices and options with tight spreads, lots and pips, leverage up to 1:100 and clear risk controls. A fast, modern forex and CFD app",
        theme_color: '#ffffff',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      // ⬇️ Add this block
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024 // 5 MB
      }
    })
  ],
  server: { host: true },
  optimizeDeps: {
    // Exclude local feature modules from Vite's pre-bundler so HMR changes are
    // always reflected immediately. Without this, Vite can serve a stale cached
    // entry (the ?t= timestamp variant) that doesn't include new named exports,
    // causing "does not provide an export named X" errors during hot reload.
    exclude: [
      './src/features/futuresTrading/datafeed/CustomDatafeed.js',
      './src/features/futuresTrading/broker/BrokerAdapter.js',
      './src/features/futuresTrading/broker/useBrokerAdapter.js',
      './src/features/futuresTrading/broker/BrokerStateManager.js',
      './src/features/futuresTrading/broker/apiWrappers.js',
    ],
  },
  css: {
    devSourcemap: true,
  },
  build: {
    sourcemap: false,
  },
  // optimizeDeps: {
  //   include: ['html2canvas']
  // }
})
