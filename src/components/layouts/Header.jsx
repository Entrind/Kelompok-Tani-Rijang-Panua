import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function PublicHeader() {
  const location = useLocation();
  const isAdminPages = location.pathname.startsWith('/admin');

  // Sembunyikan header publik di halaman admin
  if (isAdminPages) return null;

  return (
    <header className="bg-lime-800 text-white py-3 px-6 shadow">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="font-bold">
          Kelompok Tani Rijang Panua
        </div>
        <nav className="space-x-4 text-sm">
          <Link to="/" className="hover:underline">Beranda</Link>
          <Link to="/kelompoklist" className="hover:underline">Kelompok</Link>
          <Link to="/admin" className="hover:underline">Admin</Link>
        </nav>
      </div>
    </header>
  );
}
