import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from '../App.tsx';
import { AppErrorBoundary } from '../components/AppErrorBoundary.tsx';
import { MockDataProvider } from './MockDataProvider.tsx';
import { MockDataUI } from './MockDataUI.tsx';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MockDataProvider>
          <App />
          <MockDataUI />
        </MockDataProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
