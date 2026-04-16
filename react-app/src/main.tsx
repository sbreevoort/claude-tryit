import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ApplicationPortal from './ApplicationPortal'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApplicationPortal />
  </StrictMode>,
)
