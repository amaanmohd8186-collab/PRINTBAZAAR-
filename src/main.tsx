// @ts-nocheck
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App.tsx';
import './index.css';

// Defensive Global Patch for JSON.parse to prevent 'undefined' string parse errors across all browsers/SDKs
(function() {
  const originalParse = JSON.parse;
  JSON.parse = function(text, reviver) {
    if (text === undefined) return undefined;
    if (typeof text === 'string') {
      const trimmed = text.trim();
      if (trimmed === 'undefined' || trimmed === '') {
        return undefined;
      }
    }
    return originalParse(text, reviver);
  };
})();

// Register service worker for Android Web App support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => {
        // SW registered
      })
      .catch(error => {
        console.error('SW registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* @ts-ignore - conflict between next-themes and react 19 types */}
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light">
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
