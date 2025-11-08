import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { authHelpers } from './lib/supabase'
import { useAuthStore } from './lib/store'

// Initialize auth session
authHelpers.getCurrentUser().then((user) => {
  if (user) {
    useAuthStore.getState().setUser(user)
  }
})

// Listen for auth changes
authHelpers.onAuthStateChange((event, session) => {
  if (session?.user) {
    useAuthStore.getState().setUser(session.user)
  } else {
    useAuthStore.getState().logout()
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
