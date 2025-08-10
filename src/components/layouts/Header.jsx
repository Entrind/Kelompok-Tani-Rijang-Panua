import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'react-toastify';
import { CircleUserRound } from 'lucide-react';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isLoginPage = location.pathname === '/admin/login';
  const isAdminRoute = location.pathname.startsWith('/admin');

  const adminStr =
    typeof window !== 'undefined' ? localStorage.getItem('admin') : null;
  const admin = adminStr ? JSON.parse(adminStr) : null;

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    try {
      await signOut(auth).catch(() => {});
      localStorage.removeItem('admin');
      toast.success('Berhasil logout');
      navigate('/admin/login');
    } catch (err) {
      console.error(err);
      toast.error('Gagal logout');
    }
  };

  const handleGoProfile = () => {
    setOpen(false);
    navigate('/admin/profile');
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  //Sembunyikan seluruh header di halaman login admin
  if (isLoginPage) return null;

  return (
    <header className="bg-lime-800 text-white py-4 px-6 shadow-md">
      <div className="max-w-full mx-auto flex justify-between items-center">
        <div
          className="font-bold cursor-pointer"
          onClick={() => navigate('/')}
          title="Beranda"
        >
          Kelompok Tani Rijang Panua
        </div>

        <nav className="space-x-4 text-sm">
          <Link to="/" className="hover:underline">Beranda</Link>
          <Link to="/kelompoklist" className="hover:underline">Kelompok</Link>
          <Link to="/admin" className="hover:underline">Admin</Link>
        </nav>

         {/* Dropdown hanya ditampilkan pada route admin (kecuali halaman login) */}
        {isAdminRoute && !isLoginPage && admin && (
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-lime-700 border-none transition"
              onClick={() => setOpen((v) => !v)}
              title={admin.nama || admin.email || 'Admin'}
            >
              <span className="hidden sm:inline text-sm text-white">
                {admin.nama || admin.email || 'Admin'}
              </span>
              <CircleUserRound size={22} className="text-white" />
            </button>

            {/* Dropdown */}
            {open && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-50">
                <button
                  onClick={handleGoProfile}
                  className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
