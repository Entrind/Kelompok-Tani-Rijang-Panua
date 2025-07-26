import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Admin from './pages/Admin/Admin';
import Tambah from './pages/Admin/Tambah';
import Detail from "./pages/admin/Detail";
import Header from './components/layouts/Header';
import Footer from './components/layouts/Footer';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
        <Header />
        <main className="flex-1">
          <Routes>
            {/* Halaman publik */}
            <Route path="/" element={<Home />} />

            {/* Halaman Admin */}
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/tambah" element={<Tambah />} />
            <Route path="/admin/detail/:id" element={<Detail />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
