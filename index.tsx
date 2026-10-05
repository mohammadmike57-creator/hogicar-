import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';

import ErrorBoundary from './components/ErrorBoundary';
import { cleanReloadMarker, isChunkLoadError, reloadForNewVersion } from './utils/chunkReload';

cleanReloadMarker();

// Vite fires this when a page's JavaScript or CSS file can't be preloaded, which happens when
// a new version was deployed while this tab was open. Reload to pick up the new build.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForNewVersion()) event.preventDefault();
});

// Trusted Types Policy for third-party scripts (GTM, Clarity, etc)
if (typeof window !== 'undefined' && (window as any).trustedTypes && (window as any).trustedTypes.createPolicy) {
  try {
    (window as any).trustedTypes.createPolicy('default', {
      createHTML: (s: string) => s,
      createScriptURL: (s: string) => s,
      createScript: (s: string) => s,
    });
  } catch (e) {
    console.warn('Trusted Types policy already exists or failed to create.');
  }
}

// IMMEDIATE BYPASS FOR STATIC FILES (SITEMAP, ROBOTS)
// This must run before ANY React initialization to prevent the SPA from taking over.
(function() {
  // Clear any existing service workers that might be causing "Content unavailable" errors
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister().then(success => {
          if (success) console.log('[SPA] Unregistered stale service worker');
        });
      }
    }).catch(err => console.warn('[SPA] Failed to get service worker registrations', err));
  }

  const pathname = window.location.pathname.toLowerCase();
  const search = window.location.search || "";
  
  if (pathname.endsWith('.xml') || pathname.endsWith('.txt')) {
    // If we are already in the fallback loop, don't redirect again
    if (!search.includes('spa_fallback=1')) {
      const sep = search ? '&' : '?';
      console.log('[SPA BYPASS] Redirecting to server-side route:', pathname);
      window.location.replace(pathname + search + sep + 'spa_fallback=1');
      return;
    } else {
      // PROXY FAILED - DO NOT redirect to Render domain as it should not be used publicly.
      console.error('[SPA BYPASS] Static file failed to load from server even after bypass.');
      return;
    }
  }
})();

const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = '<div style="color:red; padding:20px;">Root element not found</div>';
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <HelmetProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </HelmetProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (error) {
    rootElement.innerHTML = `
      <div style="color: red; padding: 20px; font-family: sans-serif; white-space: pre-wrap; background: #fee;">
        <h2>React failed to start</h2>
        <pre>${error instanceof Error ? error.stack : String(error)}</pre>
      </div>
    `;
  }

  // Log unexpected errors for debugging, but never paint raw error text over the page.
  window.addEventListener('error', (event) => {
    console.error('[SPA] Runtime error:', event.error || event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[SPA] Unhandled promise rejection:', event.reason);
    if (isChunkLoadError(event.reason)) reloadForNewVersion();
  });
}
