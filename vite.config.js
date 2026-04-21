import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimizaciones de producción
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        // Tree Shaking agresivo
        dead_code: true,
        unused: true,
        collapse_vars: true,
        reduce_vars: true,
        sequences: true,
        properties: true,
        unsafe: true,
        conditionals: true,
        comparisons: true,
        evaluate: true,
        booleans: true,
        loops: true,
        hoist_funs: true,
        if_return: true,
        join_vars: true,
        side_effects: true,
      },
      mangle: {
        properties: {
          regex: /^_/, // Solo mangle variables privadas
        },
      },
    },
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false, // Tree Shaking agresivo
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
      output: {
        manualChunks: (id) => {
          // Splitting inteligente
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('tmi.js')) {
              return 'twitch';
            }
            if (id.includes('qrcode')) {
              return 'qr';
            }
            return 'vendor';
          }
          // Componentes lazy-loaded
          if (id.includes('/components/')) {
            if (id.includes('Qrcode')) return 'qr-component';
            if (id.includes('News')) return 'news-component';
          }
        },
        chunkFileNames: (chunkInfo) => {
          // Nombres optimizados para cache
          if (chunkInfo.name === 'vendor') return 'assets/vendor-[hash].js';
          if (chunkInfo.name === 'twitch') return 'assets/twitch-[hash].js';
          if (chunkInfo.name === 'qr') return 'assets/qr-[hash].js';
          return 'assets/[name]-[hash].js';
        },
      },
    },
    // Mejorar cache y optimización
    chunkSizeWarningLimit: 800, // Reducir para forzar splitting
    assetsInlineLimit: 2048, // Reducir para más splitting
    target: 'es2020', // Optimizado para navegadores modernos
  },
  // Optimizaciones de servidor de desarrollo
  server: {
    hmr: {
      overlay: false,
    },
  },
  // Optimizaciones de preview
  preview: {
    port: 4173,
  },
  // Tree Shaking global
  define: {
    'process.env.NODE_ENV': '"production"',
  },
})
