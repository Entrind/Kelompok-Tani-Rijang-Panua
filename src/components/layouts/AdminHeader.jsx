// src/components/layout/AdminHeader.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { auth } from '../../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-toastify';
import { CircleUserRound, LayoutDashboard, UsersRound, Settings } from 'lucide-react';

const toTitleCase = (s) =>
  typeof s === 'string' ? s.replace(/\b\w/g, (c) => c.toUpperCase()) : '';

const readAdminFromStorage = () => {
  try {
    const raw = localStorage.getItem('admin');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const AdminHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isLoginPage = location.pathname === '/admin/login';
  const isAdminRoute = location.pathname.startsWith('/admin');

  const [admin, setAdmin] = useState(readAdminFromStorage());
  const [open, setOpen] = useState(false);      // dropdown profil
  // const [navOpen, setNavOpen] = useState(false); // mobile nav
  const menuRef = useRef(null);

  // Sinkronkan dgn auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        setAdmin(null);
        try {
          localStorage.removeItem('admin');
        } catch {
          /* ignore */
        }
      } else {
        const stored = readAdminFromStorage();
        if (stored && stored.uid === u.uid) {
          setAdmin(stored);
        } else {
          setAdmin({ uid: u.uid, email: u.email, role: 'admin' });
        }
      }
    });
    return () => unsub();
  }, []);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth).catch(() => {});
      localStorage.removeItem('admin');
      setAdmin(null);
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

  if (!isAdminRoute) return null; // jangan render di route publik

  const role = (admin?.role || '').toLowerCase();
  const isSuperadmin = role === 'superadmin';

  // styling helper utk NavLink
  const linkBase =
    'inline-flex items-center gap-2 px-3 py-1 rounded hover:bg-white/20 transition';
  const linkActive = 'bg-white/20';

  return (
    <header className="bg-lime-800 text-white py-3 px-4 sm:px-6 shadow">
      <div className="max-w-full h-10 mx-auto flex items-center justify-between gap-3">
        {/* Logo / Title */}
        <div
          className="font-bold text-lg cursor-pointer"
          onClick={() => navigate('/')}
          title="Beranda"
        >
          Kelompok Tani Rijang Panua
        </div>

        {/* Mobile: tombol toggle nav */}
        {/* {!isLoginPage && admin && (
          <button
            className="md:hidden inline-flex items-center justify-center rounded px-2 py-1 hover:bg-white/20"
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Toggle navigation"
            title="Menu"
          > */}
            {/* simple hamburger */}
            {/* <span className="block w-5 h-0.5 bg-white mb-1"></span>
            <span className="block w-5 h-0.5 bg-white mb-1"></span>
            <span className="block w-5 h-0.5 bg-white"></span>
          </button>
        )} */}

        <div className="flex items-center gap-4">
          {/* Nav Links (Desktop) */}
          {!isLoginPage && admin && (
            <nav className="hidden md:flex items-center gap-2">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : ''}`
                }
              >
                <LayoutDashboard className="hover: text-white" size={18} />
                <span className="hover: text-white text-sm">Dashboard</span>
              </NavLink>

              {isSuperadmin && (
                <>
                  <NavLink
                    to="/admin/admins"
                    className={({ isActive }) =>
                      `${linkBase} ${isActive ? linkActive : ''}`
                    }
                  >
                    <UsersRound className="hover: text-white" size={18} />
                    <span className="hover: text-white text-sm">Manage Admins</span>
                  </NavLink>

                  <NavLink
                    to="/admin/settings"
                    className={({ isActive }) =>
                      `${linkBase} ${isActive ? linkActive : ''}`
                    }
                  >
                    <Settings className="hover: text-white" size={18} />
                    <span className="hover: text-white text-sm">Settings</span>
                  </NavLink>
                </>
              )}
            </nav>
          )}

          {/* Tombol Login (jika belum login, bukan login page) */}
          {!isLoginPage && !admin && (
            <button
              onClick={() => navigate('/admin/login')}
              className="px-3 py-1 rounded bg-white text-lime-800 hover:bg-lime-100 transition"
            >
              Login
            </button>
          )}

          {/* Dropdown Profil (Desktop & Mobile) */}
          {!isLoginPage && admin && (
            <div className="relative" ref={menuRef}>
              <button
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/20 transition"
                onClick={() => setOpen((v) => !v)}
                title={admin.nama || admin.email || 'Admin'}
              >
                {/* Badge role */}
                {admin.role && (
                  <span className="hidden sm:inline text-xs bg-white/20 px-2 py-0.5 rounded">
                    {toTitleCase(admin.role)}
                  </span>
                )}
                <span className="hidden sm:inline text-sm">
                  {admin.nama || admin.email || 'Admin'}
                </span>
                <CircleUserRound size={22} className="text-white" />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-52 bg-white border rounded-md shadow-lg z-50">
                  <button
                    onClick={handleGoProfile}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
      </div>
        

      {/* Nav Links (Mobile Drawer)
      {!isLoginPage && admin && navOpen && (
        <div className="md:hidden mt-3 px-1">
          <nav className="flex flex-col gap-1 bg-lime-900 rounded p-2">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `px-3 py-2 rounded text-sm hover:bg-white/10 ${isActive ? 'bg-white/20' : ''}`
              }
              onClick={() => setNavOpen(false)}
            >
              <span className="inline-flex items-center gap-2">
                <LayoutDashboard size={18} />
                Dashboard
              </span>
            </NavLink>

            {isSuperadmin && (
              <>
                <NavLink
                  to="/admin/manage-admins"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded text-sm hover:bg-white/10 ${isActive ? 'bg-white/20' : ''}`
                  }
                  onClick={() => setNavOpen(false)}
                >
                  <span className="inline-flex items-center gap-2">
                    <UsersRound size={18} />
                    Manage Admins
                  </span>
                </NavLink>

                <NavLink
                  to="/admin/settings"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded text-sm hover:bg-white/10 ${isActive ? 'bg-white/20' : ''}`
                  }
                  onClick={() => setNavOpen(false)}
                >
                  <span className="inline-flex items-center gap-2">
                    <Settings size={18} />
                    Settings
                  </span>
                </NavLink>
              </>
            )}
          </nav>
        </div>
      )} */}
    </header>
  );
};

export default AdminHeader;
