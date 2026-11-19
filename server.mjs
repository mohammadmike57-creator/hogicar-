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
  'Content-Security-Policy': `upgrade-insecure-requests; default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://*.stripe.com https://*.clarity.ms https://*.doubleclick.net https://*.googleadservices.com https://*.google-analytics.com https://*.google.com ${AFFILIATE_CSP}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; img-src 'self' data: https: https://*.googletagmanager.com https://*.google-analytics.com https://*.doubleclick.net ${AFFILIATE_CSP}; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.sentry.io https://*.googletagmanager.com https://*.stripe.com https://hogicar-backend.onrender.com https://*.clarity.ms https://*.google-analytics.com https://*.analytics.google.com https://*.doubleclick.net https://*.google.com https://*.googleadservices.com ${AFFILIATE_CSP}; frame-src 'self' https://*.stripe.com https://accounts.google.com ${AFFILIATE_CSP}; object-src 'none'; base-uri 'self';`,
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

// ---------------------------------------------------------------- server-side SEO
// Each page is sent with its own title, description, canonical, hreflang, structured data and readable text
// from the backend (/api/seo/head), merged into index.html, so search engines and AI tools that do not run
// JavaScript read the real page. The app replaces all of it once it runs. Safety first: a slow (over 1.5 s)
// or failing backend, or any error here, serves the plain index.html exactly as before, and SEO_SSR=off
// turns the whole feature off without a deploy.

const SEO_ENABLED = String(process.env.SEO_SSR || 'on').toLowerCase() !== 'off';
const SEO_TTL_MS = 5 * 60 * 1000;
const SEO_TIMEOUT_MS = 1500;
const seoCache = new Map();
const NON_PAGE_PREFIXES = ['/api/', '/uploads/', '/assets/', '/logos/', '/icons/', '/images/', '/brands/', '/wallet/'];

function isPageRoute(pathname) {
  if (NON_PAGE_PREFIXES.some(p => pathname.startsWith(p))) return false;
  const last = pathname.split('/').pop() || '';
  return !last.includes('.');
}

async function fetchSeoHead(pagePath) {
  const hit = seoCache.get(pagePath);
  if (hit && Date.now() - hit.at < SEO_TTL_MS) return hit.data;
  try {
    const target = new URL('/api/seo/head', backendOrigin);
    target.searchParams.set('path', pagePath);
    const headers = { accept: 'application/json' };
    if (proxySecret) headers['x-hogicar-proxy-key'] = proxySecret;
    const response = await fetch(target, { signal: AbortSignal.timeout(SEO_TIMEOUT_MS), headers });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || typeof data.status !== 'number' || typeof data.head !== 'string') return null;
    if (seoCache.size > 2000) seoCache.delete(seoCache.keys().next().value);
    seoCache.set(pagePath, { at: Date.now(), data });
    return data;
  } catch {
    return null;
  }
}

// Tags in index.html that each page replaces with its own.
const SEO_TAG_PATTERNS = [
  /<title\b[^>]*>[\s\S]*?<\/title>\s*/gi,
  /<meta\s[^>]*name=["'](?:description|keywords|robots|googlebot|twitter:[^"']+)["'][^>]*>\s*/gi,
  /<meta\s[^>]*property=["'](?:og|article):[^"']+["'][^>]*>\s*/gi,
  /<link\s[^>]*rel=["']canonical["'][^>]*>\s*/gi,
  /<link\s[^>]*rel=["']alternate["'][^>]*hreflang=[^>]*>\s*/gi,
];

// The app removes tags marked data-ssr and adds its own once it runs (see SEOMetadata).
function markServerTags(head) {
  return head.replace(/<(title|meta|link|script)\b(?![^>]*\bdata-ssr\b)/gi, '<$1 data-ssr');
}

const SSR_STYLE = 'max-width:72rem;margin:0 auto;padding:96px 16px 48px;font-family:Inter,system-ui,-apple-system,sans-serif;color:#0f172a;line-height:1.6';

function mergeSeo(indexHtml, seo, isHome) {
  const headEnd = indexHtml.search(/<\/head>/i);
  if (headEnd < 0) return indexHtml;
  let head = indexHtml.slice(0, headEnd);
  let rest = indexHtml.slice(headEnd);
  for (const re of SEO_TAG_PATTERNS) head = head.replace(re, '');
  let html = `${head}${markServerTags(seo.head || '')}\n${rest}`;
  const lang = /^[a-z]{2}(-[A-Za-z]{2})?$/.test(seo.lang || '') ? seo.lang : 'en';
  html = html.replace(/<html\b[^>]*>/i, `<html lang="${lang}"${lang.startsWith('ar') ? ' dir="rtl"' : ''}>`);
  if (!isHome) {
    // The instant-paint copy of the homepage is only used on "/": elsewhere crawlers would read it as this page.
    html = html.replace(/<!-- boot-shell:start[\s\S]*?<!-- boot-shell:end -->/, '');
  } else {
    // On "/" the instant-paint header and hero cover the page; the readable text stays hidden behind it.
    html = html.replace(/<\/head>/i, '<style>body:has(#boot-shell) [data-ssr-body]{display:none}</style>\n</head>');
  }
  if (seo.root) html = html.replace('<div id="root"></div>', () => `<div id="root"><div data-ssr-body style="${SSR_STYLE}">${seo.root}</div></div>`);
  return html;
}

/** True when the page was sent with its SEO; false means "serve the plain index.html as before". */
async function serveSeoPage(req, res, url) {
  if (!SEO_ENABLED) return false;
  try {
    let pagePath;
    try { pagePath = decodeURIComponent(url.pathname); } catch { pagePath = url.pathname; }
    const seo = await fetchSeoHead(pagePath);
    if (!seo) return false;
    if ([301, 302, 307, 308].includes(seo.status) && seo.location) {
      const location = seo.location.startsWith('http') || seo.location.startsWith('/') ? seo.location : `/${seo.location}`;
      send(res, seo.status === 302 || seo.status === 307 ? seo.status : 301, '', { Location: encodeURI(location) + (url.search || ''), 'Cache-Control': 'public, max-age=300' });
      return true;
    }
    const indexHtml = (await readFile(path.join(distDir, 'index.html'))).toString('utf8');
    const headers = { 'Content-Type': contentTypes['.html'], 'Cache-Control': 'no-cache' };
    // Always 200, exactly as before this feature: hosting health checks and every app route must load. A page
    // the backend does not know is kept out of search with noindex instead of a 404 status.
    if (seo.noindex || seo.status === 404 || seo.status === 410) headers['X-Robots-Tag'] = 'noindex, follow';
    send(res, 200, Buffer.from(mergeSeo(indexHtml, seo, pagePath === '/'), 'utf8'), headers, req);
    return true;
  } catch (error) {
    console.error('[frontend-server] SEO merge failed, plain page served', error?.message || error);
    return false;
  }
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const typoRedirect = sitemapTypoTarget(url.pathname, url.search);
    if (typoRedirect) {
      send(res, 301, '', { Location: typoRedirect });
      return;
    }

    // Health checks for the hosting platform: answered straight away, without the backend.
    if (url.pathname === '/healthz' || url.pathname === '/health') {
      send(res, 200, 'ok', { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
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

    if ((req.method === 'GET' || req.method === 'HEAD') && isPageRoute(url.pathname) && !res.headersSent) {
      let decoded = url.pathname;
      try { decoded = decodeURIComponent(url.pathname); } catch { /* keep raw */ }
      const onDisk = decoded !== '/' && existsSync(path.join(distDir, path.normalize(decoded)));
      if (!onDisk && await serveSeoPage(req, res, url)) return;
    }

    await serveStatic(req, res, url);
  } catch (error) {
    console.error('[frontend-server] request failed', error);
    send(res, 500, 'Internal Server Error', { 'Content-Type': contentTypes['.txt'] });
  }
}).listen(port, () => {
  console.log(`[frontend-server] listening on ${port}, proxying backend to ${backendOrigin}`);
});
