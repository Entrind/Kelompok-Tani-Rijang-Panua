// src/components/auth/RequireAuth.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * Props:
 *  - roles?: string[]   → ["superadmin", "admin"]
 *  - fallback?: ReactNode
 */
export default function RequireAuth({ children, roles, fallback }) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [active, setActive] = useState(true); // default true

  const from = useMemo(() => ({ from: location }), [location]);

  const readCached = () => {
    try {
      const raw = localStorage.getItem("admin");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const writeCached = (obj) => {
    try {
      localStorage.setItem("admin", JSON.stringify(obj));
    } catch {
      console.error("Gagal menyimpan cache admin:", obj);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!isMounted) return;
      setUser(u);

      if (!u) {
        try { 
          localStorage.removeItem("admin"); 
        } catch {
          console.error("Gagal menghapus cache admin");
        }
        setRole(null);
        setActive(false);
        setChecking(false);
        return;
      }

      // 1) Custom claims (opsional, jika kamu set)
      try {
        const token = await getIdTokenResult(u, true);
        const claimRole = token?.claims?.role || token?.claims?.roles?.[0] || null;
        if (claimRole) {
          setRole(claimRole);
          // active tetap perlu cek Firestore (karena claim biasanya tidak memuat active)
        }
      } catch {
        // lanjut
      }

      // 2) Ambil dari Firestore (wajib untuk cek active & nama)
      try {
        const snap = await getDoc(doc(db, "admins", u.uid));
        if (snap.exists()) {
          const data = snap.data();
          const fsRole = data?.role || data?.roles?.[0] || null;
          const fsActive = data?.active !== false; // default true
          setRole(fsRole);
          setActive(fsActive);

          // Simpan ke cache: nama, email, role, active
          writeCached({
            uid: u.uid,
            email: u.email,
            nama: data?.nama || "",
            role: fsRole,
            active: fsActive,
          });

          setChecking(false);
          return;
        }
      } catch {
        // lanjut
      }

      // 3) Fallback cache
      const cached = readCached();
      if (cached?.uid === u.uid) {
        setRole(cached.role || null);
        setActive(cached.active !== false);
      } else {
        setRole(null);
        setActive(false);
      }
      setChecking(false);
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // UI saat verifikasi
  if (checking) {
    return fallback ?? <div className="p-6 text-center">Memeriksa sesi...</div>;
  }

  // Belum login
  if (!user) {
    return <Navigate to="/admin/login" replace state={from} />;
  }

  // Tidak aktif → tolak
  if (!active) {
    return <Navigate to="/admin/login" replace />;
  }

  // Cek roles (jika disediakan)
  if (Array.isArray(roles) && roles.length > 0) {
    if (!role || !roles.includes(role)) {
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
}
