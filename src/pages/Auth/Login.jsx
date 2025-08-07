import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const adminRef = doc(db, "admins", uid);
      const adminSnap = await getDoc(adminRef);

      if (!adminSnap.exists()) {
        toast.error("Akun ini bukan admin!");
        return;
      }

      // Simpan ke localStorage
      localStorage.setItem("admin", JSON.stringify({
        uid,
        email,
        nama: adminSnap.data().nama,
        role: adminSnap.data().role
      }));

      toast.success("Login berhasil!");
      navigate("/admin");
    } catch (err) {
      console.error(err);
      toast.error("Email atau password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-sm w-full bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Login Admin</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            className="w-full bg-white border px-3 py-2 rounded mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full bg-white border px-3 py-2 rounded mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white py-2 rounded hover:bg-green-800 transition"
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
