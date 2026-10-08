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

// Direct visits to /search: start the car search request from the HTML, in parallel with the app's
// JavaScript, instead of after it. Builds the same URL as utils/loadCars.ts for the first page
// (Search.tsx defaults: page 0, size 20, sort "Price: Low to High"); loadCars picks it up.
// Skipped when this tab already holds the results (a refresh after a search).
const earlySearchFetch = (apiBase: string): Plugin => ({
  name: 'early-search-fetch',
  transformIndexHtml(html) {
    const script = `<script>(function(){try{if(location.pathname!=='/search')return;var q=new URLSearchParams(location.search);var p=q.get('pickup');if(!p)return;var t=new Date(),e=new Date(t);e.setDate(t.getDate()+3);var iso=function(x){return x.toISOString().split('T')[0]};var d=q.get('dropoff')||p,pd=q.get('pickupDate')||iso(t),dd=q.get('dropoffDate')||iso(e),st=q.get('startTime')||'10:00',et=q.get('endTime')||'10:00';try{var m=JSON.parse(sessionStorage.getItem('hogicar_prefetched_results_meta')||'null');var sig=[p.trim().toUpperCase(),d.trim().toUpperCase(),pd,dd,st,et].join('|');if(m&&m.signature===sig&&m.status!=='failed')return}catch(x){}var u=${JSON.stringify(apiBase)}+'/api/search/all?pickup='+p+'&dropoff='+d+'&pickupDate='+pd+'&dropoffDate='+dd+'&startTime='+st+'&endTime='+et+'&page=0&size=20&sort='+encodeURIComponent('Price: Low to High');var r=fetch(u,{credentials:'omit',cache:'no-cache'});r.catch(function(){});window.__hcEarlySearch={url:u,res:r}}catch(x){}})();</script>`;
    return html.replace('<head>', `<head>\n    ${script}`);
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
        earlySearchFetch(env.VITE_API_BASE_URL || env.VITE_API_URL || ''),
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
                // Recharts and everything it pulls in (redux, immer, d3, decimal.js...) only load with the dashboards.
                if (/node_modules\/(recharts|victory-vendor|d3-[^/]+|internmap|immer|@reduxjs|redux|redux-thunk|react-redux|reselect|decimal\.js-light|es-toolkit|eventemitter3|tiny-invariant|use-sync-external-store)\//.test(id)) return 'vendor-charts';
                if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return 'vendor-animation';
                if (id.includes('stripe')) return 'vendor-stripe';
                if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-core';
                // Anything else (QR codes, flags, ...) is bundled with the page that actually uses it.
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
