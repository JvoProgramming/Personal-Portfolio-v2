import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { canShowRoom } from './lib/env'

// Start downloading the 3D room alongside the rest of the app instead of after it.
if (window.location.pathname === '/' && canShowRoom()) {
  void import('./room/RoomGate')
  void import('./room/Room')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
