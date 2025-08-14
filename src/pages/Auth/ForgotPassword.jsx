import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  const handleSendReset = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.warn('Masukkan email terlebih dahulu');
      return;
    }
    setSending(true);

    try {
      // actionCodeSettings agar redirect balik ke login
      const actionCodeSettings = {
        url: 'https://kelompok-tani-rijang-panua.web.app/admin/login',
        handleCodeInApp: false,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      toast.success('Email reset terkirim. Cek inbox/spam Anda.');
      navigate('/admin/login');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengirim email reset. Pastikan email valid & terdaftar.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen w-screen h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-sm w-full bg-white p-6 rounded-md shadow">
        <h2 className="text-2xl font-bold mb-1 text-center">Lupa Password</h2>
        <p className="text-sm text-gray-600 mb-4 text-center">
          Masukkan email Anda. Kami akan mengirimkan tautan reset password.
        </p>
        <form onSubmit={handleSendReset}>
          <input
            type="email"
            placeholder="Email"
            className="w-full bg-white border px-3 py-2 rounded mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-green-700 text-white font-bold py-2 rounded hover:bg-green-800 transition"
          >
            {sending ? 'Mengirim...' : 'Kirim Tautan Reset'}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link to="/admin/login" className="text-sm text-blue-700 hover:underline">
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
