import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// Global error handler for uncaught errors and rejections
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error)
  // Suppress btoa encoding errors
  if (event.error?.message?.includes('btoa')) {
    event.preventDefault()
  }
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Rejection]', event.reason)
  if (event.reason?.message?.includes('btoa')) {
    event.preventDefault()
  }
})

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found in DOM')

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
