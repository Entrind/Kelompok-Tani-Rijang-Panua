// src/components/layout/AdminHeader.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase'; // ✅ pastikan db diimport
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore'; // ✅ subscribe ke admins/{uid}
import { toast } from 'react-toastify';
import { CircleUserRound } from 'lucide-react';

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

const writeAdminToStorage = (obj) => {
  try {
    localStorage.setItem('admin', JSON.stringify(obj));
  } catch {
    /* ignore */
  }
};

const AdminHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isLoginPage = location.pathname === '/admin/login';
  const isAdminRoute = location.pathname.startsWith('/admin');

  const [admin, setAdmin] = useState(readAdminFromStorage());
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Sync dengan auth + Firestore admins/{uid}
  useEffect(() => {
    let unsubAuth;
    let unsubDoc;

    unsubAuth = onAuthStateChanged(auth, (u) => {
      // Jika logout
      if (!u) {
        setAdmin(null);
        try {
          localStorage.removeItem('admin');
        } catch {
            /* ignore */
        }
        if (unsubDoc) {
          unsubDoc();
          unsubDoc = null;
        }
        return;
      }

      // Set nilai minimal dulu (agar tidak blank)
      const stored = readAdminFromStorage();
      const base = {
        uid: u.uid,
        email: u.email || stored?.email || '',
        // fallback nama: yang ada di Firestore (nanti di-override), localStorage, atau displayName
        nama: stored?.nama || u.displayName || '',
        role: stored?.role || 'admin',
      };
      setAdmin(base);

      // 🔁 Subscribe perubahan dokumen admins/{uid}
      const ref = doc(db, 'admins', u.uid);
      unsubDoc = onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            const merged = {
              ...base,
              ...d,
              // pastikan field yang kita pakai konsisten
              nama: d.nama || d.name || base.nama,
              role: d.role || base.role,
            };
            setAdmin(merged);
            writeAdminToStorage(merged);
          } else {
            // jika doc tidak ada, tetap gunakan base
            setAdmin(base);
            writeAdminToStorage(base);
          }
        },
        () => {
          // error snapshot → tetap gunakan base
          setAdmin(base);
          writeAdminToStorage(base);
        }
      );
    });

    return () => {
      if (unsubAuth) unsubAuth();
      if (unsubDoc) unsubDoc();
    };
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

  if (!isAdminRoute) {
    // Jangan render AdminHeader di route publik
    return null;
  }

  return (
    <header className="bg-lime-800 text-white py-4 px-6 shadow">
      <div className="max-w-full mx-auto flex justify-between items-center">
        <div
          className="font-bold cursor-pointer"
          onClick={() => navigate('/')}
          title="Beranda"
        >
          Kelompok Tani Rijang Panua
        </div>

        {/* Jika bukan halaman login dan admin null -> tampilkan tombol Login */}
        {!isLoginPage && !admin && (
          <button
            onClick={() => navigate('/admin/login')}
            className="px-3 py-1 rounded bg-white text-lime-800 hover:bg-lime-100 transition"
          >
            Login
          </button>
        )}

        {/* Dropdown hanya jika admin ada dan bukan halaman login */}
        {!isLoginPage && admin && (
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-lime-700 border-none transition"
              onClick={() => setOpen((v) => !v)}
              title={admin.nama || admin.email || 'Admin'}
            >
              {/* Badge role */}
              {admin.role && (
                <span className="hidden sm:inline text-xs bg-white/20 px-2 py-0.5 rounded">
                  {toTitleCase(admin.role)}
                </span>
              )}
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

export default AdminHeader;
