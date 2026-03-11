import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './src/index.css';

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
      <div style="color: red; padding: 20px; font-family: sans-serif; white-space: pre-wrap;">
        <h2>React failed to start</h2>
        <pre>${error instanceof Error ? error.stack : String(error)}</pre>
      </div>
    `;
  }
}
