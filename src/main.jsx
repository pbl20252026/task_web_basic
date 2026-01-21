import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import HandTracker from './components/HandTracker/HandTracker.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HandTracker>
      <App />,
    </HandTracker>
  </StrictMode>,
)
