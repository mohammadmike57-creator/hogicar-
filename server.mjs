import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGzip, createBrotliCompress, constants } from 'node:zlib';
import { pipeline } from 'node:stream';

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
  'Content-Security-Policy': "upgrade-insecure-requests; default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://*.stripe.com https://*.clarity.ms https://*.doubleclick.net https://*.googleadservices.com https://*.google-analytics.com https://*.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: https://*.googletagmanager.com https://*.google-analytics.com https://*.doubleclick.net; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.googletagmanager.com https://*.stripe.com https://hogicar-backend.onrender.com https://*.clarity.ms https://*.google-analytics.com https://*.analytics.google.com https://*.doubleclick.net https://*.google.com https://*.googleadservices.com; frame-src https://*.stripe.com; object-src 'none';",
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'Cross-Origin-Resource-Policy': 'cross-origin'
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...securityHeaders, ...headers });
  res.end(body);
}

async function proxyToBackend(req, res, url) {
  const target = new URL(url.pathname + url.search, backendOrigin);
  const headers = new Headers(req.headers);
  headers.set('host', target.host);

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
  // Keep content-encoding if present to allow compressed responses
  responseHeaders.delete('transfer-encoding');
  responseHeaders.delete('content-length'); // Let Node handle content length or chunking

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
          cacheHeaders['Cache-Control'] = 'public, max-age=86400';
        }
      }

      // Special case for llms.txt as requested for agentic browsing
      if (normalizedPath === '/llms.txt') {
        contentType = 'text/markdown';
        cacheHeaders['Cache-Control'] = 'public, max-age=86400';
      } else if (normalizedPath === '/robots.txt') {
        contentType = 'text/plain; charset=utf-8';
        cacheHeaders['Cache-Control'] = 'public, max-age=86400';
      }

      const headers = {
        ...securityHeaders,
        ...cacheHeaders,
        'Content-Type': contentType
      };

      // Compression logic
      const acceptEncoding = req.headers['accept-encoding'] || '';
      const isCompressible = /text|javascript|json|xml|markdown/i.test(contentType);

      if (isCompressible && acceptEncoding.includes('br')) {
        headers['Content-Encoding'] = 'br';
        headers['Vary'] = 'Accept-Encoding';
        res.writeHead(200, headers);
        pipeline(createReadStream(filePath), createBrotliCompress(), res, (err) => {
          if (err) console.error('[br error]', err);
        });
        return;
      } else if (isCompressible && acceptEncoding.includes('gzip')) {
        headers['Content-Encoding'] = 'gzip';
        headers['Vary'] = 'Accept-Encoding';
        res.writeHead(200, headers);
        pipeline(createReadStream(filePath), createGzip(), res, (err) => {
          if (err) console.error('[gzip error]', err);
        });
        return;
      }

      headers['Content-Length'] = fileStat.size;
      res.writeHead(200, headers);
      createReadStream(filePath).pipe(res);
      return;
    }
  } catch {
    // Fall through to SPA shell.
  }

  const html = await readFile(path.join(distDir, 'index.html'));
  send(res, 200, html, { 
    'Content-Type': contentTypes['.html'],
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
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
