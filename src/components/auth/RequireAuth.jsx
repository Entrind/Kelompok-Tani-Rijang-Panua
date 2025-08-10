// src/components/auth/RequireAuth.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { auth, db } from "../../firebase"; // pastikan export db (Firestore) di sini
import { doc, getDoc } from "firebase/firestore";

/**
 * Props:
 *  - roles?: string[]   → daftar role yang diizinkan (contoh: ["superadmin", "admin"])
 *  - fallback?: ReactNode → UI saat loading (opsional)
 */
export default function RequireAuth({ children, roles, fallback }) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const from = useMemo(() => ({ from: location }), [location]);

  useEffect(() => {
    let isMounted = true;

    const readCached = () => {
      try {
        const raw = localStorage.getItem("admin");
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return typeof parsed?.role === "string" ? parsed : null;
      } catch {
        return null;
      }
    };

    const writeCached = (obj) => {
      try {
        localStorage.setItem("admin", JSON.stringify(obj));
      } catch {
        /* ignore */
      }
    };

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!isMounted) return;
      setUser(u);

      if (!u) {
        // logout: bersihkan cache & selesai
        try { localStorage.removeItem("admin"); } catch {
          /* ignore */
        }
        setRole(null);
        setChecking(false);
        return;
      }

      // 1) coba ambil role dari custom claims (kalau kamu set pakai Admin SDK)
      try {
        const token = await getIdTokenResult(u, true);
        const claimRole =
          token?.claims?.role || token?.claims?.roles?.[0] || null;
        if (claimRole) {
          setRole(claimRole);
          writeCached({ uid: u.uid, email: u.email, role: claimRole });
          setChecking(false);
          return;
        }
      } catch {
        // lanjut ke Firestore/localStorage
      }

      // 2) coba ambil dari Firestore (mis. koleksi "admins/{uid}")
      try {
        const snap = await getDoc(doc(db, "admins", u.uid));
        if (snap.exists()) {
          const data = snap.data();
          const fsRole = data?.role || data?.roles?.[0] || null;
          if (fsRole) {
            setRole(fsRole);
            writeCached({ uid: u.uid, email: u.email, role: fsRole });
            setChecking(false);
            return;
          }
        }
      } catch {
        // lanjut ke cache
      }

      // 3) fallback ke cache localStorage biar tidak blank
      const cached = readCached();
      if (cached?.uid === u.uid && cached?.role) {
        setRole(cached.role);
      } else {
        setRole(null);
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
    return fallback ?? (
      <div className="p-6 text-center">Memeriksa sesi...</div>
    );
  }

  // Belum login → arahkan ke login, simpan "from" agar bisa redirect balik
  if (!user) {
    return <Navigate to="/admin/login" replace state={from} />;
  }

  // Cek role jika roles disediakan
  if (Array.isArray(roles) && roles.length > 0) {
    if (!role) {
      // user ada tapi belum punya role terdefinisi → bisa diarahkan ke halaman 403/unauthorized
      return <Navigate to="/admin" replace />;
    }
    if (!roles.includes(role)) {
      // role tidak diizinkan
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
}
