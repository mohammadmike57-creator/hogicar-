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
        {
          name: 'async-css',
          transformIndexHtml(html) {
            return html.replace(
              /<link rel="stylesheet" crossorigin href="(.*?)">/g,
              '<link rel="preload" href="$1" as="style" onload="this.rel=\'stylesheet\'"><noscript><link rel="stylesheet" href="$1"></noscript>'
            );
          }
        }
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
                if (id.includes('react')) return 'vendor-core';
                if (id.includes('lucide-react')) return 'vendor-icons';
                if (id.includes('recharts')) return 'vendor-charts';
                if (id.includes('framer-motion')) return 'vendor-animation';
                if (id.includes('stripe')) return 'vendor-stripe';
                if (id.includes('date-fns') || id.includes('lodash')) return 'vendor-utils';
                return 'vendor-others';
              }
            },
          },
        },
        chunkSizeWarningLimit: 800,
        sourcemap: false,
        minify: 'esbuild',
        treeshake: true,
      },
      esbuild: {
        drop: ['console', 'debugger'],
      }
    };
});
