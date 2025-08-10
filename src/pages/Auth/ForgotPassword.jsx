// src/pages/Auth/ForgotPassword.jsx
import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Email reset password telah dikirim. Periksa inbox/spam Anda.');
    } catch (err) {
      console.error(err);
      // Beberapa error umum: auth/user-not-found, auth/invalid-email
      toast.error('Gagal mengirim email reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-sm w-full bg-white p-6 rounded-md shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Lupa Password</h2>
        <form onSubmit={handleReset}>
          <input
            type="email"
            placeholder="Email Admin"
            className="w-full bg-white border px-3 py-2 rounded mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white font-bold py-2 rounded hover:bg-green-800 transition"
          >
            {loading ? 'Mengirim...' : 'Kirim Link Reset'}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link to="/admin/login" className="text-sm text-blue-600 hover:underline">
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
