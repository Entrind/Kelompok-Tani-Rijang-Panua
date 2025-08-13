// src/components/cards/CardKelompok.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, Users, Landmark, ScrollText, HandCoins, Wheat } from 'lucide-react';

const CardKelompok = ({ kelompok }) => {
  const navigate = useNavigate();
  const isGapoktan = (kelompok.kategori || "") === "Gapoktan";

  // Display jumlah: anggota (non-gapoktan) vs kelompok (gapoktan)
  const jumlahLabel = isGapoktan ? "Kelompok" : "Anggota";
  const jumlahValue = isGapoktan
    ? (kelompok.jumlah_kelompok_gapoktan || 0)
    : (kelompok.jumlah_anggota || 0);

  // Display lahan: lahan gapoktan vs lahan kelompok biasa
  const lahanValue = isGapoktan
    ? (parseFloat(kelompok.total_lahan_gapoktan) || 0)
    : (parseFloat(kelompok.total_lahan) || 0);

  // Pengurus: sudah di-enrich (gapoktan) atau berasal dari doc (non-gapoktan)
  const ketua = kelompok.ketua || "-";
  const sekretaris = kelompok.sekretaris || "-";
  const bendahara = kelompok.bendahara || "-";

  return (
    <div
      className="bg-white shadow hover:shadow-md p-4 rounded-lg cursor-pointer transition"
      onClick={() => navigate(`/detail/${kelompok.id}`)}
    >
      <h2 className="text-lg font-bold mb-2">{kelompok.nama_kelompok}</h2>

      <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
        <Landmark size={16} /> Kategori: <strong>{kelompok.kategori || "Kelompok Tani"}</strong>
      </p>

      <p className="text-sm text-gray-600 flex items-center gap-1">
        <UserRound size={16} /> Ketua: <strong>{ketua}</strong>
      </p>
      <p className="text-sm text-gray-600 flex items-center gap-1">
        <ScrollText size={16} /> Sekretaris: <strong>{sekretaris}</strong>
      </p>
      <p className="text-sm text-gray-600 flex items-center gap-1">
        <HandCoins size={16} /> Bendahara: <strong>{bendahara}</strong>
      </p>

      <p className="text-sm text-gray-600 flex items-center gap-1">
        <Users size={16} /> {jumlahLabel}: <strong>{jumlahValue}</strong>
      </p>
      <p className="text-sm text-gray-600 flex items-center gap-1">
        <Wheat size={16} /> Lahan: <strong>{lahanValue.toFixed(2)} Ha</strong>
      </p>
    </div>
  );
};

export default CardKelompok;
