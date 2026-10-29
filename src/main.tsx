import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import './index.css'
import App from './App.tsx'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!publishableKey) throw new Error('Falta VITE_CLERK_PUBLISHABLE_KEY en .env.local')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{ variables: { colorPrimary: '#7c3aed' } }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)
