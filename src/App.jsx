import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './pages/Public/Home';
import KelompokList from './pages/Public/KelompokList';
import DetailPublik from './pages/Public/Detail';
import Admin from './pages/Admin/Admin';
import Detail from "./pages/Admin/Detail";
import AdminLogin from './pages/Auth/Login';
import Header from './components/layouts/Header';
import Footer from './components/layouts/Footer';

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
        <Header />
        <main className="flex-1">
          <Routes>
            {/* Halaman publik */}
            <Route path="/" element={<Home />} />
            <Route path="/kelompoklist" element={<KelompokList />} />
            <Route path="/detail/:id" element={<DetailPublik />} />

            {/* Halaman Admin */}
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/detail/:id" element={<Detail />} />
            <Route path="/admin/login" element={<AdminLogin />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
