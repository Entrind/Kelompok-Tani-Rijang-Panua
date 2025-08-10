// src/pages/Admin/Profile.jsx
import React from 'react';

export default function Profile() {
  const adminStr =
    typeof window !== 'undefined' ? localStorage.getItem('admin') : null;
  const admin = adminStr ? JSON.parse(adminStr) : null;

  return (
    <div className="max-w-screen-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Profil Admin</h1>
      {!admin ? (
        <p className="text-gray-600">Data admin tidak ditemukan.</p>
      ) : (
        <div className="bg-white rounded-md border p-4 space-y-2">
          <p>
            <span className="text-gray-500">Nama:</span>{' '}
            <span className="font-semibold">{admin.nama || '-'}</span>
          </p>
          <p>
            <span className="text-gray-500">Email:</span>{' '}
            <span className="font-semibold">{admin.email || '-'}</span>
          </p>
          <p>
            <span className="text-gray-500">Role:</span>{' '}
            <span className="font-semibold">{admin.role || 'admin'}</span>
          </p>

          <div className="pt-4">
            {/* Nanti bisa diarahkan ke halaman ubah password / forgot password */}
            <a
              href="/admin/forgot-password"
              className="inline-block text-sm text-blue-600 hover:underline"
            >
              Lupa/Ganti Password
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
