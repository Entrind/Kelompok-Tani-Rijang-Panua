import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import CardKelompok from "../components/cards/CardKelompok";
// import Link from "next/link";

const kategoriList = [
  { label: "Gapoktan", warna: "bg-lime-700", nama: "Gapoktan" },
  { label: "Kelompok Tani", warna: "bg-green-700", nama: "Kelompok Tani" },
  { label: "Kelompok Kebun", warna: "bg-amber-700", nama: "Kelompok Kebun" },
  { label: "Kelompok Wanita Tani", warna: "bg-pink-700", nama: "KWT" },
];

export default function Home() {
  const [dataPerKategori, setDataPerKategori] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const result = {};
      for (const kategori of kategoriList) {
        const q = query(
          collection(db, "kelompok_tani"),
          where("kategori", "==", kategori.nama)
        );
        const snap = await getDocs(q);

        // Sort by nama_kelompok (case-insensitive) lalu ambil 4 teratas
        const sorted = snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) =>
            (a.nama_kelompok || "").toLowerCase().localeCompare((b.nama_kelompok || "").toLowerCase())
          )
          .slice(0, 4);

        result[kategori.nama] = sorted;
      }
      setDataPerKategori(result);
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="h-64 bg-[url('/images/sawah.jpg')] bg-cover bg-center flex items-center justify-center">
        <div className="bg-black/50 p-6 rounded-xl">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Sistem Informasi Kelompok Tani</h1>
        </div>
      </div>

      {/* Statistik */}
      <div className="bg-white py-8 px-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-green-700">12</p>
          <p className="text-sm text-gray-600">Jumlah Kelompok</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-700">1021</p>
          <p className="text-sm text-gray-600">Total Anggota</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-700">278</p>
          <p className="text-sm text-gray-600">Hektar Lahan</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-700">4</p>
          <p className="text-sm text-gray-600">Kategori</p>
        </div>
      </div>

      {/* Card per kategori */}
      {kategoriList.map((kat) => (
        <div key={kat.nama} className="py-8 px-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xl font-bold ${kat.warna} text-white px-3 py-1 rounded`}>{kat.label}</h2>
            {/* <Link href="/kelompoklist" className="text-sm text-blue-700 hover:underline">Lihat Semua</Link> */}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(dataPerKategori[kat.nama] || []).map((item) => (
              <CardKelompok key={item.id} kelompok={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
