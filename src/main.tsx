import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { initCsrfToken } from './utils/security.ts';
import { LanguageProvider } from './utils/i18n.tsx';
import './index.css';

// Initialize CSRF security token
initCsrfToken().catch(err => console.error("CSRF token preload error:", err));

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Couture AI Atelier Service Worker registered successfully:', reg.scope);
      })
      .catch(err => {
        console.warn('Couture AI Atelier Service Worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
);
