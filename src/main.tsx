import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'
import './styles/tokens.css'
import './styles/global.css'

// オフラインで動かすための Service Worker。新しい版が出たら次回起動時に入れ替える。
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
