import React from 'react';

const TaniCard = ({ kelompok }) => {
  return (
    <div className="bg-white border rounded-xl shadow-md p-4 hover:shadow-lg transition-all duration-200">
      <h2 className="text-lg font-semibold text-green-700 mb-1">{kelompok.nama}</h2>
      <p className="text-sm text-gray-600">👤 Ketua: {kelompok.ketua}</p>
      <p className="text-sm text-gray-600">👥 Anggota: {kelompok.jumlah_anggota}</p>
      <p className="text-sm text-gray-600">🌾 Luas: {kelompok.luas}</p>
    </div>
  );
};

export default TaniCard;
