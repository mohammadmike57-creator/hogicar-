import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss(),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('react-router-dom') || id.includes('@remix-run') || id.includes('react-router')) return 'vendor-router';
                if (id.includes('react-helmet-async')) return 'vendor-helmet';
                if (id.includes('axios')) return 'vendor-axios';
                if (id.includes('date-fns')) return 'vendor-date';
                if (id.includes('lucide-react')) return 'vendor-icons';
                if (id.includes('recharts')) return 'vendor-charts';
                if (id.includes('framer-motion')) return 'vendor-animation';
                if (id.includes('stripe')) return 'vendor-stripe';
                return 'vendor-core';
              }
            },
          },
        },
        chunkSizeWarningLimit: 800,
        sourcemap: false,
        minify: 'esbuild',
        target: 'esnext',
        treeshake: true,
      },
      esbuild: {
        drop: ['console', 'debugger'],
      }
    };
});
