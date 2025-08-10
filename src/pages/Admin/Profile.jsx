import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail, updatePassword } from 'firebase/auth';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';


export default function Profile() {
  const navigate = useNavigate();
  const user = auth.currentUser; // pastikan RequireAuth melindungi halaman ini
  const [loading, setLoading] = useState(true);

  const [nama, setNama] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');

  const [showPwdEmail, setShowPwdEmail] = useState(false);
  const [showPwdCurrent, setShowPwdCurrent] = useState(false);
  const [showPwdNew, setShowPwdNew] = useState(false); 

  // form ganti email
  const [newEmail, setNewEmail] = useState('');
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);

  // form ganti password
  const [currentPasswordForPwd, setCurrentPasswordForPwd] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPwd, setUpdatingPwd] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        setEmail(user.email || '');

        // ambil data admins/{uid}
        const snap = await getDoc(doc(db, 'admins', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setNama(data?.nama || '');
          setRole(data?.role || 'admin');
        } else {
          setNama('');
          setRole('admin');
        }
      } catch (err) {
        console.error(err);
        toast.error('Gagal memuat profil admin');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleUpdateNama = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      await updateDoc(doc(db, 'admins', user.uid), { nama });
      // update cache localStorage agar header ikut berubah
      try {
        const raw = localStorage.getItem('admin');
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.nama = nama;
          localStorage.setItem('admin', JSON.stringify(parsed));
        }
      } catch {
        // ignore error
      }
      toast.success('Nama berhasil diperbarui');
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui nama');
    }
  };

  const reauth = async (email, password) => {
    if (!user) throw new Error('No user');
    const cred = EmailAuthProvider.credential(email, password);
    await reauthenticateWithCredential(user, cred);
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    if (!user || !newEmail || !currentPasswordForEmail) {
      toast.warn('Isi email baru dan password saat ini');
      return;
    }
    setUpdatingEmail(true);
    try {
      await reauth(user.email, currentPasswordForEmail);
      await updateEmail(user, newEmail);

      // optional: update juga field email di admins/{uid}
      await updateDoc(doc(db, 'admins', user.uid), { email: newEmail });

      // update cache localStorage
      try {
        const raw = localStorage.getItem('admin');
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.email = newEmail;
          localStorage.setItem('admin', JSON.stringify(parsed));
        }
      } catch {
        // ignore error
      }

      setEmail(newEmail);
      setNewEmail('');
      setCurrentPasswordForEmail('');
      toast.success('Email berhasil diubah. Silakan login ulang jika diminta.');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengubah email. Pastikan password saat ini benar.');
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!user || !currentPasswordForPwd || !newPassword) {
      toast.warn('Isi password saat ini dan password baru');
      return;
    }
    setUpdatingPwd(true);
    try {
      await reauth(user.email, currentPasswordForPwd);
      await updatePassword(user, newPassword);

      setCurrentPasswordForPwd('');
      setNewPassword('');
      toast.success('Password berhasil diubah');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengubah password. Pastikan password saat ini benar.');
    } finally {
      setUpdatingPwd(false);
    }
  };

  if (loading) return <div className="p-6">Memuat profil...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Tombol kembali */}
      <div className="mb-4">
        <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
            >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">Kembali</span>
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-4">Profil Admin</h1>

      {/* Info dasar */}
      <div className="bg-white rounded-md p-4 shadow mb-5">
        <p className="text-sm text-gray-600">Role</p>
        <p className="font-semibold mb-2">
          <span className="inline-block px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs uppercase">{role}</span>
        </p>
        
        <p className="text-sm text-gray-600">Nama</p>
        <p className="font-semibold mb-2">{nama}</p>
        
        <p className="text-sm text-gray-600">Email (Aktif)</p>
        <p className="font-semibold mb-2">{email}</p>
      </div>

      {/* Edit nama */}
      <form onSubmit={handleUpdateNama} className="bg-white rounded-md p-4 shadow mb-5">
        <h2 className="font-semibold mb-3">Ubah Nama</h2>
        <input
          type="text"
          className="w-full bg-white border rounded px-3 py-2 mb-3"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Nama Admin"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800"
        >
          Simpan Nama
        </button>
      </form>

      {/* Ganti Email */}
      <form onSubmit={handleUpdateEmail} className="bg-white rounded-md p-4 shadow mb-5">
        <h2 className="font-semibold mb-3">Ganti Email</h2>

        <input
            type="email"
            className="w-full bg-white border rounded px-3 py-2 mb-2"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Email baru"
        />

        <div className="relative mb-3">
            <input
            type={showPwdEmail ? 'text' : 'password'}
            className="w-full bg-white border rounded px-3 py-2 pr-10"
            value={currentPasswordForEmail}
            onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
            placeholder="Password saat ini (untuk verifikasi)"
            />
            <button
            type="button"
            onClick={() => setShowPwdEmail((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label="toggle password"
            >
            {showPwdEmail ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
        </div>

        <button
            type="submit"
            disabled={updatingEmail}
            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-50"
        >
            {updatingEmail ? 'Menyimpan...' : 'Simpan Email'}
        </button>
      </form>

      {/* Ganti Password */}
      <form onSubmit={handleUpdatePassword} className="bg-white rounded-md p-4 shadow">
        <h2 className="font-semibold mb-3">Ganti Password</h2>

        <div className="relative mb-2">
            <input
            type={showPwdCurrent ? 'text' : 'password'}
            className="w-full bg-white border rounded px-3 py-2 pr-10"
            value={currentPasswordForPwd}
            onChange={(e) => setCurrentPasswordForPwd(e.target.value)}
            placeholder="Password saat ini"
            />
            <button
            type="button"
            onClick={() => setShowPwdCurrent((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label="toggle password"
            >
            {showPwdCurrent ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
        </div>

        <div className="relative mb-3">
            <input
            type={showPwdNew ? 'text' : 'password'}
            className="w-full bg-white border rounded px-3 py-2 pr-10"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Password baru"
            />
            <button
            type="button"
            onClick={() => setShowPwdNew((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label="toggle password"
            >
            {showPwdNew ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
        </div>

        <button
            type="submit"
            disabled={updatingPwd}
            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-50"
        >
            {updatingPwd ? 'Menyimpan...' : 'Simpan Password'}
        </button>
      </form>
    </div>
  );
}
