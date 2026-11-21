import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from '../App.tsx';
import { AppErrorBoundary } from '../components/AppErrorBoundary.tsx';
import { AmountSwitch } from './AmountSwitch.tsx';
import { ReplayControls } from './ReplayControls.tsx';
import { ReplayProvider } from './ReplayProvider.tsx';

const queryClient = new QueryClient();

/** Entry point of replay.html: the same app, running on recorded weather and a simulated clock */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ReplayProvider>
          <AmountSwitch>
            <App />
          </AmountSwitch>
          <ReplayControls />
        </ReplayProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
