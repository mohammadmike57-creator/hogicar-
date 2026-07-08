import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// IMMEDIATE BYPASS FOR STATIC FILES (SITEMAP, ROBOTS)
// This must run before ANY React initialization to prevent the SPA from taking over.
(function() {
  const pathname = window.location.pathname.toLowerCase();
  const search = window.location.search || "";
  
  if (pathname.endsWith('.xml') || pathname.endsWith('.txt')) {
    // If we are already in the fallback loop, don't redirect again
    if (!search.includes('spa_fallback=1')) {
      const sep = search ? '&' : '?';
      console.log('[SPA BYPASS] Redirecting to server-side route:', pathname);
      window.location.replace(pathname + search + sep + 'spa_fallback=1');
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
        <BrowserRouter>
          <App />
        </BrowserRouter>
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

  window.addEventListener('error', (event) => {
    const errorDiv = document.createElement('div');
    errorDiv.style.color = 'red';
    errorDiv.style.padding = '10px';
    errorDiv.style.borderTop = '1px solid red';
    errorDiv.textContent = `Global error: ${event.message}`;
    rootElement.appendChild(errorDiv);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const errorDiv = document.createElement('div');
    errorDiv.style.color = 'red';
    errorDiv.style.padding = '10px';
    errorDiv.style.borderTop = '1px solid red';
    errorDiv.textContent = `Unhandled promise: ${event.reason}`;
    rootElement.appendChild(errorDiv);
  });
}
