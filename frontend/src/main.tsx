import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import './index.css'
import LoginPage from './pages/LoginPage'
import Layout from './layouts/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import ConsumablesPage from './pages/ConsumablesPage'
import OutPage from './pages/OutPage' // Import the new OUT page component
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_OAUTH_CID}>
    <ToastContainer />
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProtectedRoute homePage={true} />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path='/consumables' element={<ConsumablesPage />} />
            <Route path='/out' element={<OutPage />} /> {/* New route for OUT page */}
          </Route>
          <Route path='/login' element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  </GoogleOAuthProvider>
)
