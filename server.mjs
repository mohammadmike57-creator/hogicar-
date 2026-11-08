import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, deflateSync, brotliCompressSync } from 'node:zlib';
import { randomBytes } from 'node:crypto';
import { handleAiAssistant, isAiConfigured } from './server/aiAssistant.mjs';

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

// Affiliate network tags (Awin's MasterTag and its resources by default). Add sources for further
// networks with AFFILIATE_CSP_SOURCES (space separated), e.g. "https://www.anrdoezrs.net".
const AFFILIATE_CSP = (process.env.AFFILIATE_CSP_SOURCES || 'https://*.dwin1.com https://*.awin1.com')
  .split(/\s+/).filter(src => /^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$)[^\s;'"]*$/.test(src)).join(' ');

const securityHeaders = {
  'Content-Security-Policy': `upgrade-insecure-requests; default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://*.stripe.com https://*.clarity.ms https://*.doubleclick.net https://*.googleadservices.com https://*.google-analytics.com https://*.google.com ${AFFILIATE_CSP}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; img-src 'self' data: https: https://*.googletagmanager.com https://*.google-analytics.com https://*.doubleclick.net ${AFFILIATE_CSP}; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.googletagmanager.com https://*.stripe.com https://hogicar-backend.onrender.com https://*.clarity.ms https://*.google-analytics.com https://*.analytics.google.com https://*.doubleclick.net https://*.google.com https://*.googleadservices.com ${AFFILIATE_CSP}; frame-src 'self' https://*.stripe.com https://accounts.google.com ${AFFILIATE_CSP}; object-src 'none'; base-uri 'self';`,
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
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

// Strict script policy: only scripts carrying this page's one-time nonce (and what they load) may run, so a
// script injected into a page cannot. Browsers without nonce support fall back to 'unsafe-inline' https:.
// It is sent as report-only (violations are logged by the backend, nothing is blocked) until
// CSP_STRICT_SCRIPTS=enforce is set, after the reports show Google Tag Manager's tags all work with it.
const strictScripts = (process.env.CSP_STRICT_SCRIPTS || 'report').toLowerCase();
const strictScriptPolicy = nonce =>
  `script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' https:; object-src 'none'; base-uri 'self'`;

/** Adds a fresh nonce to the page's script tags and the matching policy headers. */
function withScriptNonce(body, headers) {
  const nonce = randomBytes(18).toString('base64');
  const html = String(body)
    .replace(/<script(?![^>]*\bnonce=)/gi, `<script nonce="${nonce}"`)
    .replace(/<link(?![^>]*\bnonce=)([^>]*\brel=["']?modulepreload)/gi, `<link nonce="${nonce}"$1`);
  if (strictScripts === 'enforce') {
    headers['Content-Security-Policy'] = headers['Content-Security-Policy']
      .replace(/script-src [^;]*;/, `${strictScriptPolicy(nonce).split(';')[0]};`);
  } else if (strictScripts !== 'off') {
    headers['Content-Security-Policy-Report-Only'] = `${strictScriptPolicy(nonce)}; report-uri /api/public/csp-report`;
  }
  return Buffer.from(html);
}

function send(res, status, body, headers = {}, req = null, filePath = null) {
  let finalBody = body;
  const finalHeaders = { ...securityHeaders, ...headers };
  const isHtml = !!body && String(finalHeaders['Content-Type'] || '').startsWith('text/html');
  if (isHtml) {
    finalBody = withScriptNonce(body, finalHeaders);
  }

  if (req && body && body.length > 1024) {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    let encoding = '';
    
    if (acceptEncoding.includes('br')) encoding = 'br';
    else if (acceptEncoding.includes('gzip')) encoding = 'gzip';
    else if (acceptEncoding.includes('deflate')) encoding = 'deflate';

    if (encoding) {
      // Pages carry a new nonce each time, so only other files use the compressed cache.
      const cacheKey = filePath && !isHtml ? `${filePath}:${encoding}` : null;
      if (cacheKey && compressedCache.has(cacheKey)) {
        finalBody = compressedCache.get(cacheKey);
      } else {
        finalBody = compress(isHtml ? finalBody : body, encoding);
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

const MAX_PROXY_BODY = 26 * 1024 * 1024;

const proxySecret = (process.env.PROXY_SHARED_SECRET || '').length >= 16 ? process.env.PROXY_SHARED_SECRET : '';

async function proxyToBackend(req, res, url) {
  const target = new URL(url.pathname + url.search, backendOrigin);
  const headers = new Headers(req.headers);
  headers.set('host', target.host);
  // The visitor's address for the backend's rate limits: the last X-Forwarded-For entry is the one our own
  // load balancer added (earlier entries can be written by anyone). Proven with PROXY_SHARED_SECRET.
  headers.delete('x-hogicar-client-ip');
  headers.delete('x-hogicar-proxy-key');
  if (proxySecret) {
    const fwd = String(req.headers['x-forwarded-for'] || '').split(',').map(s => s.trim()).filter(Boolean);
    headers.set('x-hogicar-client-ip', fwd.length ? fwd[fwd.length - 1] : (req.socket.remoteAddress || ''));
    headers.set('x-hogicar-proxy-key', proxySecret);
  }
  headers.set('accept-encoding', 'identity');
  // Not supported by fetch (a request carrying it used to fail with a server error).
  headers.delete('expect');

  // Uploads are capped just above the backend's own 25 MB limit, so a huge request cannot fill the memory.
  const declared = Number(req.headers['content-length'] || 0);
  if (declared > MAX_PROXY_BODY) {
    req.resume();
    send(res, 413, 'Request too large', { 'Content-Type': contentTypes['.txt'], Connection: 'close' });
    return;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_PROXY_BODY) {
      send(res, 413, 'Request too large', { 'Content-Type': contentTypes['.txt'], Connection: 'close' });
      req.destroy();
      return;
    }
    chunks.push(chunk);
  }

  let response;
  try {
    response = await fetch(target, {
      method: req.method,
      headers,
      body: chunks.length ? Buffer.concat(chunks) : undefined,
      redirect: 'manual'
    });
  } catch (error) {
    console.error('[frontend-server] backend unreachable', error?.cause?.code || error?.message);
    send(res, 502, 'Service temporarily unavailable', { 'Content-Type': contentTypes['.txt'] });
    return;
  }

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

      // The HTML page must always be revalidated so browsers never keep an old page that
      // points at JavaScript files removed by a newer deploy.
      if (ext === '.html') cacheHeaders['Cache-Control'] = 'no-cache';

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
  send(res, 200, html, { 'Content-Type': contentTypes['.html'], 'Cache-Control': 'no-cache' }, req);
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const typoRedirect = sitemapTypoTarget(url.pathname, url.search);
    if (typoRedirect) {
      send(res, 301, '', { Location: typoRedirect });
      return;
    }

    if (url.pathname === '/api/ai/assistant') {
      await handleAiAssistant(req, res);
      return;
    }

    if (url.pathname === '/api/ai/status') {
      send(res, 200, JSON.stringify({ enabled: isAiConfigured() }), { 'Content-Type': contentTypes['.json'], 'Cache-Control': 'no-store' });
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
