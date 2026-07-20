import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const backendOrigin = process.env.BACKEND_ORIGIN || 'https://hogicar-backend.onrender.com';
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp'
};

function shouldProxy(pathname) {
  return pathname.startsWith('/api/')
    || pathname.startsWith('/uploads/')
    || pathname === '/robots.txt'
    || /^\/sitemap(?:-[^/]+)?\.[a-z0-9]+$/i.test(pathname);
}

function sitemapTypoTarget(pathname, search) {
  const match = pathname.match(/^(\/sitemap(?:-[^/]+)?)\.xm$/i);
  return match ? `${match[1]}.xml${search}` : null;
}

const securityHeaders = {
  'Content-Security-Policy': "upgrade-insecure-requests; default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://*.stripe.com https://*.clarity.ms https://*.doubleclick.net https://*.googleadservices.com https://*.google-analytics.com https://*.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.googletagmanager.com https://*.stripe.com https://hogicar-backend.onrender.com https://*.clarity.ms https://*.google-analytics.com https://*.analytics.google.com https://*.doubleclick.net https://*.google.com https://*.googleadservices.com; frame-src https://*.stripe.com; object-src 'none'; require-trusted-types-for 'script'; trusted-types *;",
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...securityHeaders, ...headers });
  res.end(body);
}

async function proxyToBackend(req, res, url) {
  const target = new URL(url.pathname + url.search, backendOrigin);
  const headers = new Headers(req.headers);
  headers.set('host', target.host);
  headers.set('accept-encoding', 'identity');

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const response = await fetch(target, {
    method: req.method,
    headers,
    body: chunks.length ? Buffer.concat(chunks) : undefined,
    redirect: 'manual'
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');
  responseHeaders.delete('transfer-encoding');

  res.writeHead(response.status, Object.fromEntries(responseHeaders.entries()));
  if (response.body) {
    for await (const chunk of response.body) {
      res.write(chunk);
    }
  }
  res.end();
}

async function serveStatic(req, res, url) {
  const decodedPath = decodeURIComponent(url.pathname);
  const normalizedPath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
  const requestedPath = path.join(distDir, normalizedPath);
  let filePath = requestedPath.startsWith(distDir) ? requestedPath : path.join(distDir, 'index.html');

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      let contentType = contentTypes[ext] || 'application/octet-stream';
      
      const cacheHeaders = {};
      if (['.js', '.css', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.woff', '.woff2'].includes(ext)) {
        if (normalizedPath.includes('/assets/') || normalizedPath.startsWith('/assets/')) {
          cacheHeaders['Cache-Control'] = 'public, max-age=31536000, immutable';
        } else {
          cacheHeaders['Cache-Control'] = 'public, max-age=3600';
        }
      }

      // Special case for llms.txt as requested for agentic browsing
      if (normalizedPath === '/llms.txt') {
        contentType = 'text/markdown';
      } else if (normalizedPath === '/robots.txt') {
        contentType = 'text/plain; charset=utf-8';
      }

      res.writeHead(200, {
        ...securityHeaders,
        ...cacheHeaders,
        'Content-Type': contentType,
        'Content-Length': fileStat.size
      });
      createReadStream(filePath).pipe(res);
      return;
    }
  } catch {
    // Fall through to SPA shell.
  }

  const html = await readFile(path.join(distDir, 'index.html'));
  send(res, 200, html, { 'Content-Type': contentTypes['.html'] });
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const typoRedirect = sitemapTypoTarget(url.pathname, url.search);
    if (typoRedirect) {
      send(res, 301, '', { Location: typoRedirect });
      return;
    }

    if (shouldProxy(url.pathname)) {
      await proxyToBackend(req, res, url);
      return;
    }

    await serveStatic(req, res, url);
  } catch (error) {
    console.error('[frontend-server] request failed', error);
    send(res, 500, 'Internal Server Error', { 'Content-Type': contentTypes['.txt'] });
  }
}).listen(port, () => {
  console.log(`[frontend-server] listening on ${port}, proxying backend to ${backendOrigin}`);
});
