import React, { useEffect, useState, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { auth, db } from "../../firebase";
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
  const [active, setActive] = useState(null);

  const from = useMemo(() => ({ from: location }), [location]);

  useEffect(() => {
    let isMounted = true;

    const readCached = () => {
      try {
        const raw = localStorage.getItem("admin");
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed?.role === "string" ? parsed : null;
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
        try { 
          localStorage.removeItem("admin"); 
        } catch {
          /* ignore */
        }
        setRole(null);
        setActive(null);
        setChecking(false);
        return;
      }

      // 1) custom claims (opsional)
      try {
        const token = await getIdTokenResult(u, true);
        const claimRole = token?.claims?.role || token?.claims?.roles?.[0] || null;
        if (claimRole) {
          setRole(claimRole);
        }
      } catch {
        // ignore
      }

      // 2) Firestore admins doc (role + active)
      try {
        const snap = await getDoc(doc(db, "admins", u.uid));
        if (snap.exists()) {
          const data = snap.data();
          const fsRole = data?.role || null;
          const fsActive = data?.active !== false; // default true
          setRole((r) => r || fsRole);
          setActive(fsActive);
          writeCached({ uid: u.uid, email: u.email, role: fsRole, active: fsActive, nama: data?.nama });
          setChecking(false);
          return;
        }
      } catch {
        // ignore
      }

      // 3) fallback cache
      const cached = readCached();
      if (cached?.uid === u.uid) {
        setRole(cached.role || null);
        setActive(cached.active ?? true);
      } else {
        setRole(null);
        setActive(null);
      }
      setChecking(false);
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  if (checking) {
    return fallback ?? <div className="p-6 text-center">Memeriksa sesi...</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={from} />;
  }

  if (active === false) {
    // Akun nonaktif
    return <Navigate to="/admin/login" replace />;
  }

  if (Array.isArray(roles) && roles.length > 0) {
    if (!role || !roles.includes(role)) {
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
}
