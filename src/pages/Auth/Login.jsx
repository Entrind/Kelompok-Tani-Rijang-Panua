import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react"; // gunakan lucide-react untuk ikon

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
    <div className="min-h-screen w-screen h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-sm w-full bg-white p-6 rounded-md shadow">
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

          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full bg-white border px-3 py-2 rounded pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <label className="flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                className="mr-2 bg-white border-gray-300 rounded focus:ring-green-500"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              Ingat saya
            </label>
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline"
              onClick={() => toast.info("Hubungi admin untuk reset password.")}
            >
              Lupa password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white font-bold py-2 rounded hover:bg-green-800 transition"
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
