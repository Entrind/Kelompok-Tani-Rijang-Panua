import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import { Navigate } from "react-router-dom";

export default function RequireAuth({ children }) {
  const [user, setUser] = useState(undefined); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsubscribe();
  }, []);

  if (user === undefined) return null;
  if (user === null) return <Navigate to="/admin/login" replace />;

  return children;
}
