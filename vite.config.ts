import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// On the homepage, index.html paints a static boot shell (scripts/generate-boot-shell.mjs).
// Start the app's JavaScript right after that first paint instead of alongside it, so the
// shell is never held back by script downloads. Other routes load the app straight away.
const loadAppAfterFirstPaint = (): Plugin => ({
  name: 'load-app-after-first-paint',
  apply: 'build',
  enforce: 'post',
  transformIndexHtml(html) {
    const entry = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
    if (!entry || !html.includes('boot-shell-tpl')) return html;
    const preloads = [...html.matchAll(/<link rel="modulepreload" crossorigin href="([^"]+)">/g)].map(m => m[1]);
    const loader = `<script>(function(){var e=${JSON.stringify(entry[1])},p=${JSON.stringify(preloads)};function go(){for(var i=0;i<p.length;i++){var l=document.createElement('link');l.rel='modulepreload';l.crossOrigin='';l.href=p[i];document.head.appendChild(l)}var s=document.createElement('script');s.type='module';s.crossOrigin='';s.src=e;document.head.appendChild(s)}if(document.getElementById('boot-shell')){requestAnimationFrame(function(){setTimeout(go,0)})}else{go()}})();</script>`;
    return html
      .replace(entry[0], '')
      .replace(/\s*<link rel="modulepreload" crossorigin href="[^"]+">/g, '')
      .replace('</body>', `  ${loader}\n  </body>`);
  },
});

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
        loadAppAfterFirstPaint(),
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
