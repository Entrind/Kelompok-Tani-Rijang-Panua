import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function PublicHeader() {
  const location = useLocation();
  const isAdminPages = location.pathname.startsWith('/admin');

  // Sembunyikan header publik di halaman admin
  if (isAdminPages) return null;

  const linkBase =
    "hover:text-white px-2 py-1 rounded transition-colors duration-200 hover:bg-white/20";

  return (
    <header className="bg-lime-800 text-white py-3 px-6 shadow">
      <div className="max-w-full h-10 mx-auto flex justify-between items-center">
        <Link
          to="/"
          className="font-bold lg:text-lg hover:text-white"
          title="Beranda"
        >
          Kelompok Tani Rijang Panua
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/kelompoklist" className={linkBase}>
            Kelompok
          </Link>
          <Link to="/admin" className={linkBase}>
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
