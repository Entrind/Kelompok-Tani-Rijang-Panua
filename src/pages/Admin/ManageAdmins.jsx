import React from 'react';

export default function ManageAdmins() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Manajemen Admin</h1>
      <p className="text-gray-600">Hanya superadmin yang bisa mengakses halaman ini.</p>
      {/* TODO: CRUD admin di sini */}
    </div>
  );
}