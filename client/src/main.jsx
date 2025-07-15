import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import 'leaflet/dist/leaflet.css';
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'


const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const container = document.getElementById('root')
const root = createRoot(container)
root.render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ClerkProvider>
  </StrictMode>
)