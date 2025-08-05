import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, query as firestoreQuery, orderBy, where } from "firebase/firestore";
import CardKelompok from "../../components/cards/CardKelompok";
import { useLocation } from "react-router-dom";

const kategoriOptions = ["Semua", "Gapoktan", "Kelompok Tani", "Kelompok Kebun", "KWT"];

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function KelompokList() {
  const query = useQuery();
  const defaultKategori = query.get("kategori") || "Semua";
  const [kelompokList, setKelompokList] = useState([]);
  const [kategori, setKategori] = useState(defaultKategori);

  useEffect(() => {
    const fetchData = async () => {
      let q = firestoreQuery(collection(db, "kelompok_tani"), orderBy("nama_kelompok"));
      if (kategori !== "Semua") {
        q = firestoreQuery(
          collection(db, "kelompok_tani"),
          where("kategori", "==", kategori),
          orderBy("nama_kelompok")
        );
      }
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setKelompokList(data);
    };
    fetchData();
  }, [kategori]);

  return (
    <div className="min-h-screen px-4 py-8">
      <h1 className="text-2xl font-bold mb-4 text-center">Daftar Kelompok</h1>

      {/* Filter Kategori */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {kategoriOptions.map((k) => (
          <button
            key={k}
            onClick={() => setKategori(k)}
            className={`px-4 py-2 rounded-full border ${
              kategori === k ? "bg-green-700 text-white" : "bg-white text-gray-700"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Grid Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {kelompokList.length === 0 ? (
          <p className="col-span-full text-center text-gray-500">Tidak ada data kelompok.</p>
        ) : (
          kelompokList.map((item) => <CardKelompok key={item.id} kelompok={item} />)
        )}
      </div>
    </div>
  );
}
