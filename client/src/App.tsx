import React from 'react';
import { App as AppMain } from './AppMain';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/Toast';
import ErrorBoundary from '@/components/ErrorBoundary';
import { initializeTestFabricationOrderDb } from '@/services/fabricationOrderTestDb';

function App() {
  React.useEffect(() => {
    initializeTestFabricationOrderDb().catch((error) => {
      console.error('[APEX test DB] Failed to initialize fabrication orders', error);
    });
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LocalizationProvider>
          <ToastProvider>
            <AppMain />
          </ToastProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
