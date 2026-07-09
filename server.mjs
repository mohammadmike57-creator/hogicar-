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
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8'
};

function shouldProxy(pathname) {
  return pathname.startsWith('/api/')
    || pathname.startsWith('/uploads/')
    || pathname === '/robots.txt'
    || pathname === '/sitemap.xml'
    || /^\/sitemap-[a-z]+\.xml$/i.test(pathname);
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
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

  res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
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
  const filePath = requestedPath.startsWith(distDir) ? requestedPath : path.join(distDir, 'index.html');

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': contentTypes[ext] || 'application/octet-stream',
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
