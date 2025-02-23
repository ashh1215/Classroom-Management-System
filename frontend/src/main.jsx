import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// import './index.css'

// Check if we can find the root element
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Failed to find the root element')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)