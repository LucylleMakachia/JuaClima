import React, { StrictMode, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './index.css';
import { initDarkMode } from "./utils/theme";

import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

initDarkMode();

const ClerkLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading authentication service...</p>
    </div>
  </div>
);

const Root = () => (
  <BrowserRouter>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        appearance={{
          variables: {
            colorPrimary: '#16a34a',
            colorText: '#171717',
          },
        }}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        signInFallbackRedirectUrl="/datasets"
        signUpFallbackRedirectUrl="/datasets"
        signInForceRedirectUrl="/datasets"
        signUpForceRedirectUrl="/datasets"
        afterSignOutUrl="/"
      >
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </BrowserRouter>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<ClerkLoadingFallback />}>
        <Root />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
);
