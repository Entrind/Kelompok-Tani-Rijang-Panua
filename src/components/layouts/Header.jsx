import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-lime-800 text-white py-4 px-6 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-xl">
            <Link to="/" className="font-bold">Kelompok Tani Rijang Panua</Link>
        </h1>

        <nav className="space-x-4 text-sm">
          <Link to="/" className="hover:underline">Beranda</Link>
          <Link to="/tambah" className="hover:underline">Tambah</Link>
          <Link to="/admin" className="hover:underline">Admin</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
