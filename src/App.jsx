// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import Home from './pages/Public/Home';
import KelompokList from './pages/Public/KelompokList';
import DetailPublik from './pages/Public/Detail';
import Admin from './pages/Admin/Admin';
import Detail from './pages/Admin/Detail';
import AdminLogin from './pages/Auth/Login';
import Header from './components/layouts/Header';
import Footer from './components/layouts/Footer';
import RequireAuth from './components/auth/RequireAuth';

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Komponen pembungkus agar bisa pakai useLocation
function AppLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/admin/login";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      {!isLoginPage && <Header />}
      <main className="flex-1">
        <Routes>
          {/* Halaman publik */}
          <Route path="/" element={<Home />} />
          <Route path="/kelompoklist" element={<KelompokList />} />
          <Route path="/detail/:id" element={<DetailPublik />} />

          {/* Halaman admin login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Halaman admin, dilindungi oleh RequireAuth */}
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
        </Routes>
      </main>
      {!isLoginPage && <Footer />}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
