// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import Home from './pages/Public/Home';
import KelompokList from './pages/Public/KelompokList';
import DetailPublik from './pages/Public/Detail';

import Admin from './pages/Admin/Admin';
import Detail from './pages/Admin/Detail';
import Profile from './pages/Admin/Profile';

import ManageAdmins from './pages/Admin/ManageAdmins';
import AdminSettings from './pages/Admin/AdminSettings';

import AdminLogin from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';

import Header from './components/layouts/Header';
import AdminHeader from './components/layouts/AdminHeader';
import Footer from './components/layouts/Footer';

import RequireAuth from './components/auth/RequireAuth';

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Komponen pembungkus agar bisa pakai useLocation
function AppLayout({ children }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      {/* Header dinamis */}
      {isAdminRoute ? <AdminHeader /> : <Header />}
      <main className="flex-1">{children}</main>
      {!isAdminRoute && <Footer />}
      <ToastContainer position="top-right" />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          {/* Publik */}
          <Route path="/" element={<Home />} />
          <Route path="/kelompoklist" element={<KelompokList />} />
          <Route path="/detail/:id" element={<DetailPublik />} />
          
          {/* Auth */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/forgot-password" element={<ForgotPassword />} />

          {/* Admin Protected */}
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <Admin />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/detail/:id"
            element={
              <RequireAuth>
                <Detail />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/admins"
            element={
              <RequireAuth roles={['superadmin']}>
                <ManageAdmins />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <RequireAuth roles={['superadmin']}>
                <AdminSettings />
              </RequireAuth>
            }
          />
        </Routes>
      </AppLayout>
    </Router>
  );
}
