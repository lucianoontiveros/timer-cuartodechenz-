import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// Configuración optimizada para streaming con OBS
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimizaciones extremas para streaming
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn', 'console.error'],
        passes: 3,
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
          regex: /^_/,
        },
      },
    },
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
      output: {
        // Chunk minimal para streaming
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          if (id.includes('StreamingApp')) {
            return 'streaming';
          }
          return 'index';
        },
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'vendor') return 'assets/vendor-[hash].js';
          if (chunkInfo.name === 'streaming') return 'assets/streaming-[hash].js';
          return 'assets/[name]-[hash].js';
        },
      },
    },
    // Configuración estricta para streaming
    chunkSizeWarningLimit: 200, // Muy pequeño para streaming
    assetsInlineLimit: 1024, // Reducido al mínimo
    target: 'es2020',
    // CSS crítico inline
    cssCodeSplit: false,
  },
  // Sin servidor de desarrollo para build de streaming
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});
