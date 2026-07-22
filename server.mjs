import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, deflateSync, brotliCompressSync } from 'node:zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const backendOrigin = process.env.BACKEND_ORIGIN || 'https://hogicar-backend.onrender.com';
const port = Number(process.env.PORT || 3000);

const fileCache = new Map();
const compressedCache = new Map();

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
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
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

function compress(data, encoding) {
  if (encoding === 'br') return brotliCompressSync(data);
  if (encoding === 'gzip') return gzipSync(data);
  if (encoding === 'deflate') return deflateSync(data);
  return data;
}

function send(res, status, body, headers = {}, req = null, filePath = null) {
  let finalBody = body;
  const finalHeaders = { ...securityHeaders, ...headers };

  if (req && body && body.length > 1024) {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    let encoding = '';
    
    if (acceptEncoding.includes('br')) encoding = 'br';
    else if (acceptEncoding.includes('gzip')) encoding = 'gzip';
    else if (acceptEncoding.includes('deflate')) encoding = 'deflate';

    if (encoding) {
      const cacheKey = filePath ? `${filePath}:${encoding}` : null;
      if (cacheKey && compressedCache.has(cacheKey)) {
        finalBody = compressedCache.get(cacheKey);
      } else {
        finalBody = compress(body, encoding);
        if (cacheKey) compressedCache.set(cacheKey, finalBody);
      }
      finalHeaders['Content-Encoding'] = encoding;
    }
    
    finalHeaders['Content-Length'] = Buffer.byteLength(finalBody);
    finalHeaders['Vary'] = 'Accept-Encoding';
  }

  res.writeHead(status, finalHeaders);
  res.end(finalBody);
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
  
  // Ensure the requested path stays within the dist directory
  const safeRequestedPath = requestedPath.startsWith(distDir) ? requestedPath : path.join(distDir, 'index.html');
  
  // Identify if this request looks like a static asset that should not fallback to SPA
  const isStaticRequest = normalizedPath !== '/' && (
    /\.(ico|png|jpg|jpeg|gif|svg|webp|woff2?|js|css|json|txt|xml|webmanifest|map|pdf|mp4|webm)$/i.test(normalizedPath) ||
    normalizedPath.startsWith('/assets/') ||
    normalizedPath.startsWith('/uploads/') ||
    normalizedPath.startsWith('/logos/') ||
    normalizedPath.startsWith('/icons/') ||
    ['/favicon.ico', '/site.webmanifest', '/manifest.webmanifest', '/robots.txt', '/apple-touch-icon.png'].includes(normalizedPath)
  );

  // If it's a static request but the file doesn't exist, return 404 instead of SPA fallback
  if (isStaticRequest && !existsSync(safeRequestedPath)) {
    send(res, 404, 'Not Found', { 'Content-Type': 'text/plain' });
    return;
  }

  const filePath = isStaticRequest ? safeRequestedPath : (existsSync(safeRequestedPath) ? safeRequestedPath : path.join(distDir, 'index.html'));

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      let contentType = contentTypes[ext] || 'application/octet-stream';
      
      const cacheHeaders = {};
      if (['.js', '.css', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.woff', '.woff2'].includes(ext)) {
        if (filePath.includes('/assets/') || filePath.includes('\\assets\\')) {
          cacheHeaders['Cache-Control'] = 'public, max-age=31536000, immutable';
        } else {
          cacheHeaders['Cache-Control'] = 'public, max-age=86400'; // 1 day
        }
      }

      if (normalizedPath === '/llms.txt') {
        contentType = 'text/markdown';
      } else if (normalizedPath === '/robots.txt') {
        contentType = 'text/plain; charset=utf-8';
      }

      const headers = {
        'Content-Type': contentType,
        ...cacheHeaders
      };

      // For static assets, we read and compress if appropriate
      if (fileStat.size > 1024 && ['.html', '.js', '.css', '.json', '.svg', '.txt'].includes(ext)) {
        let body = fileCache.get(filePath);
        if (!body) {
          body = await readFile(filePath);
          fileCache.set(filePath, body);
        }
        send(res, 200, body, headers, req, filePath);
      } else {
        res.writeHead(200, {
          ...securityHeaders,
          ...headers,
          'Content-Length': fileStat.size
        });
        createReadStream(filePath).pipe(res);
      }
      return;
    }
  } catch (e) {
    console.error('Static serve error:', e);
  }

  const html = await readFile(path.join(distDir, 'index.html'));
  send(res, 200, html, { 'Content-Type': contentTypes['.html'] }, req);
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
