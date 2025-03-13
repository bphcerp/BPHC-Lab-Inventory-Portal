import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import './index.css'
import LoginPage from './pages/LoginPage'
import Layout from './layouts/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import ConsumablesPage from './pages/ConsumablesPage'
import OutPage from './pages/OutPage'
import AddVendorPage from './pages/AddVendorPage'
import AddPeoplePage from './pages/AddPeoplePage'
import Dashboard from './pages/Dashboard'
import Report from './pages/Report'
import AddCategoryTypePage from './pages/AddCategoryTypePage'
import ConsumableHistoryPage from './pages/ConsumableHistory'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Help from './pages/Help'
import AdminPage from './pages/AddAdmin'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_OAUTH_CID}>
    <ToastContainer />
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProtectedRoute homePage={true} />} />
          <Route path='/login' element={<LoginPage />} />
          
          {/* Dashboard routes - accessible by all authenticated users */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path='/dashboard' element={<Dashboard />} />
          </Route>
          
          {/* Admin-only routes */}
          <Route element={<ProtectedRoute requiredRole="admin"><Layout /></ProtectedRoute>}>
          <Route path='/consumables' element={<ConsumablesPage />} />
            <Route path='/out' element={<OutPage />} />
            <Route path='/history' element={<ConsumableHistoryPage />} />
            <Route path='/report' element={<Report />} />
            <Route path='/help' element={<Help />} />
            <Route path='/vendors' element={<AddVendorPage />} />
            <Route path='/people' element={<AddPeoplePage />} />
            <Route path='/category' element={<AddCategoryTypePage />} />
            <Route path='/admin' element={<AdminPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  </GoogleOAuthProvider>
)
