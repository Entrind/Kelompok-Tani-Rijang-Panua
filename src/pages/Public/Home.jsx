import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import CardKelompok from "../../components/cards/CardKelompok";
import { fetchStatistikKelompok } from "../../utils/statistik"; 
import { Link } from "react-router-dom";

const kategoriList = [
  { label: "Gapoktan", warna: "bg-lime-700", nama: "Gapoktan" },
  { label: "Kelompok Tani", warna: "bg-green-700", nama: "Kelompok Tani" },
  { label: "Kelompok Kebun", warna: "bg-amber-700", nama: "Kelompok Kebun" },
  { label: "Kelompok Wanita Tani", warna: "bg-pink-700", nama: "KWT" },
];

export default function Home() {
  const [dataPerKategori, setDataPerKategori] = useState({});
  const [stats, setStats] = useState({ kelompok: 0, anggota: 0, lahan: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const result = {};
      const stat = await fetchStatistikKelompok();

      const kelompokSnap = await getDocs(collection(db, "kelompok_tani"));
      for (const docKelompok of kelompokSnap.docs) {
        const kelompokData = { id: docKelompok.id, ...docKelompok.data() };
        const kategori = kelompokData.kategori || "Kelompok Tani";
        if (!result[kategori]) result[kategori] = [];
        result[kategori].push(kelompokData);
      }

      for (const kategori of kategoriList) {
        if (result[kategori.nama]) {
          result[kategori.nama] = result[kategori.nama]
            .sort((a, b) => (a.nama_kelompok || "").localeCompare(b.nama_kelompok || ""))
            .slice(0, 4);
        }
      }

      setDataPerKategori(result);
      setStats({
        kelompok: stat.jumlahKelompok,
        anggota: stat.totalAnggota,
        lahan: stat.totalLahan,
      });
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
        <div
        className="h-96 bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage:
            "url('https://firebasestorage.googleapis.com/v0/b/kelompok-tani-rijang-panua.firebasestorage.app/o/homepage%2Fsawah.png?alt=media&token=604a6cf2-b4c8-4660-89e2-d977152e8cc8')",
        }}
      >
        <div className="bg-black/50 p-6 rounded-xl">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Sistem Informasi Kelompok Tani</h1>
        </div>
      </div>

      {/* Statistik */}
      <div className="bg-white py-8 px-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-green-700">{stats.kelompok}</p>
          <p className="text-sm text-gray-600">Jumlah Kelompok</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-700">{stats.anggota}</p>
          <p className="text-sm text-gray-600">Total Anggota</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-700">{stats.lahan.toFixed(2)}</p>
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
            <h2 className={`text-xl font-bold ${kat.warna} text-white px-3 py-1 rounded shadow-md`}>{kat.label}</h2>
            <Link
              to={`/kelompoklist?kategori=${kat.nama}`}
              className="text-sm text-blue-700 hover:underline"
            >
              Lihat Semua
            </Link>
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
