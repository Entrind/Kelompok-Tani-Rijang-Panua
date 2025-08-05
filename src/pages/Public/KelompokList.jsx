import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, query as firestoreQuery, orderBy, where } from "firebase/firestore";
import CardKelompok from "../../components/cards/CardKelompok";
import { useSearchParams } from "react-router-dom";

const kategoriOptions = ["Semua", "Gapoktan", "Kelompok Tani", "Kelompok Kebun", "KWT"];

const kategoriOrder = {
  Gapoktan: 1,
  "Kelompok Tani": 2,
  "Kelompok Kebun": 3,
  KWT: 4,
};

export default function KelompokList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramKategori = searchParams.get("kategori");
  const [kategori, setKategori] = useState(paramKategori || "Semua");
  const [kelompokList, setKelompokList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      const ref = collection(db, "kelompok_tani");
      let q = kategori === "Semua"
        ? firestoreQuery(ref)
        : firestoreQuery(ref, where("kategori", "==", kategori));

      const snap = await getDocs(q);
      let data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      if (kategori === "Semua") {
        data.sort((a, b) => {
          const katA = kategoriOrder[a.kategori] || 99;
          const katB = kategoriOrder[b.kategori] || 99;
          if (katA !== katB) return katA - katB;
          return a.nama_kelompok?.localeCompare(b.nama_kelompok || "");
        });
      } else {
        data.sort((a, b) => a.nama_kelompok?.localeCompare(b.nama_kelompok || ""));
      }

      setKelompokList(data);
      setCurrentPage(1);
    };

    fetchData();
  }, [kategori]);

  // Pagination
  const paginatedData = kelompokList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(kelompokList.length / itemsPerPage);

  // Handler ganti kategori dan update URL
  const handleKategoriChange = (newKategori) => {
    setKategori(newKategori);
    setSearchParams(newKategori === "Semua" ? {} : { kategori: newKategori });
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <h1 className="text-2xl font-bold mb-4 text-center">Daftar Kelompok</h1>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {kategoriOptions.map((k) => (
          <button
            key={k}
            onClick={() => handleKategoriChange(k)}
            className={`px-4 py-2 rounded-full border ${
              kategori === k ? "bg-green-700 text-white" : "bg-white text-gray-700"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {paginatedData.length === 0 ? (
          <p className="col-span-full text-center text-gray-500">Tidak ada data kelompok.</p>
        ) : (
          paginatedData.map((item) => <CardKelompok key={item.id} kelompok={item} />)
        )}
      </div>

      {/* Pagination */}
      {kelompokList.length > itemsPerPage && (
        <div className="flex justify-center items-center mt-6 gap-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-gray-700">
            Halaman {currentPage} dari {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
