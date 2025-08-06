import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, Users, Landmark, ScrollText, HandCoins, Wheat } from 'lucide-react';

const CardKelompok = ({ kelompok }) => {
  const navigate = useNavigate();
  
  return (
    <div
      className="bg-white shadow hover:shadow-md p-4 rounded-lg cursor-pointer transition"
      onClick={() => navigate(`/detail/${kelompok.id}`)}
    >
      <h2 className="text-lg font-bold mb-2">{kelompok.nama_kelompok}</h2>

      <p className="text-sm text-gray-600 flex items-center gap-1">
        <Landmark size={16} /> Kategori: <strong>{kelompok.kategori || "Kelompok Tani"}</strong>
      </p>

      <p className="text-sm text-gray-600 flex items-center gap-1">
        <UserRound size={16} /> Ketua: <strong>{kelompok.ketua || "-"}</strong>
      </p>
      <p className="text-sm text-gray-600 flex items-center gap-1">
        <ScrollText size={16} /> Sekretaris: <strong>{kelompok.sekretaris || "-"}</strong>
      </p>
      <p className="text-sm text-gray-600 flex items-center gap-1">
        <HandCoins size={16} /> Bendahara: <strong>{kelompok.bendahara || "-"}</strong>
      </p>

      <p className="text-sm text-gray-600 flex items-center gap-1">
        <Users size={16} /> Anggota: <strong>{kelompok.jumlah_anggota || 0}</strong>
      </p>
      <p className="text-sm text-gray-600 flex items-center gap-1">
        <Wheat size={16} /> Lahan: <strong>{(kelompok.total_lahan || 0).toFixed(2)} Ha</strong>
      </p>
    </div>
  );
};

export default CardKelompok;
