import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { LocalizationProvider } from './contexts/LocalizationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <LocalizationProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);