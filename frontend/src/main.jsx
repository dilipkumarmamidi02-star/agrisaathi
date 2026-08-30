import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { LanguageProvider } from './lib/i18n.jsx'
import { LocationProvider } from './lib/LocationContext'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <LocationProvider><App /></LocationProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
