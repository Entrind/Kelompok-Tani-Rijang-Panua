import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query as firestoreQuery,
  where,
} from "firebase/firestore";
import CardKelompok from "../../components/cards/CardKelompok";
import SearchBar from "../../components/forms/SearchBar";
import { useSearchParams } from "react-router-dom";

const kategoriOptions = [
  "Semua",
  "Gapoktan",
  "Kelompok Tani",
  "Kelompok Kebun",
  "KWT",
];

const kategoriOrder = {
  Gapoktan: 1,
  "Kelompok Tani": 2,
  "Kelompok Kebun": 3,
  KWT: 4,
};

// --- helper angka aman ---
const toNumber = (v) => {
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
};

// --- helper: perkaya data gapoktan (pengurus + kelompok_anggota) ---
const enrichGapoktanItems = async (items) => {
  return Promise.all(
    items.map(async (item) => {
      if (item.kategori !== "Gapoktan") return item;

      try {
        // 1) Pengurus
        const pengSnap = await getDocs(
          collection(db, "kelompok_tani", item.id, "pengurus")
        );
        const pengurus = pengSnap.docs.map((d) => d.data());
        const ketua = pengurus.find((p) => p.jabatan === "Ketua")?.nama || "-";
        const sekretaris =
          pengurus.find((p) => p.jabatan === "Sekretaris")?.nama || "-";
        const bendahara =
          pengurus.find((p) => p.jabatan === "Bendahara")?.nama || "-";

        // 2) Kelompok Anggota
        const kaSnap = await getDocs(
          collection(db, "kelompok_tani", item.id, "kelompok_anggota")
        );
        const kAnggota = kaSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const jumlah_kelompok = kAnggota.length;

        // 3) Akumulasi lahan & anggota dari dokumen kelompok_tani (pakai ref jika ada)
        let total_lahan_gabungan = 0;
        let total_anggota_gabungan = 0;

        await Promise.all(
          kAnggota.map(async (ka) => {
            try {
              let mDocSnap = null;

              if (ka.kelompokRef) {
                // Prefer DocumentReference → paling akurat
                mDocSnap = await getDoc(ka.kelompokRef);
              } else if (ka.kelompokId) {
                // Fallback ke id string
                mDocSnap = await getDoc(doc(db, "kelompok_tani", ka.kelompokId));
              }

              if (mDocSnap && mDocSnap.exists()) {
                const kd = mDocSnap.data();

                // Ambil field agregat kalau tersedia
                const lahanField = toNumber(kd.total_lahan);
                let anggotaField = toNumber(kd.jumlah_anggota);

                // Jika jumlah anggota belum diset, hitung dari subkoleksi 'anggota' (fallback)
                if (!anggotaField) {
                  const anggotaSnap = await getDocs(
                    collection(mDocSnap.ref, "anggota")
                  );
                  anggotaField = anggotaSnap.size;

                  // Jika lahan juga 0/tidak ada, sum dari subkoleksi 'anggota'
                  if (!lahanField) {
                    let sumLuas = 0;
                    anggotaSnap.forEach((a) => {
                      sumLuas += toNumber(a.data()?.luas);
                    });
                    total_lahan_gabungan += sumLuas;
                  } else {
                    total_lahan_gabungan += lahanField;
                  }
                } else {
                  // Jika jumlah anggota OK, lahan tetap pakai field agregat (0 kalau tidak ada)
                  total_lahan_gabungan += lahanField;
                }

                total_anggota_gabungan += anggotaField;
              }
            } catch (e) {
              // Skip anggota yang gagal dibaca
              console.warn("Gagal baca dokumen anggota gapoktan:", e);
            }
          })
        );

        return {
          ...item,
          ketua,
          sekretaris,
          bendahara,
          _isGapoktan: true,
          jumlah_kelompok,
          total_lahan_gabungan,
          total_anggota_gabungan,
        };
      } catch (e) {
        console.error("Gagal memperkaya gapoktan:", e);
        // fallback aman
        return {
          ...item,
          _isGapoktan: true,
          jumlah_kelompok: item.jumlah_kelompok ?? 0,
          total_lahan_gabungan: item.total_lahan_gabungan ?? 0,
        };
      }
    })
  );
};

// --- helper: patch nilai agar konsisten untuk CardKelompok (Gapoktan → pakai nilai gabungan) ---
const normalizeForCard = (item) => {
  if (item.kategori !== "Gapoktan") return item;
  return {
    ...item,
    jumlah_anggota: Number(item.jumlah_kelompok || 0),      // tampilkan jumlah kelompok
    total_lahan: Number(item.total_lahan_gabungan || 0),     // tampilkan lahan gabungan
    _isGapoktan: true,
  };
};

export default function KelompokList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramKategori = searchParams.get("kategori");
  const [kategori, setKategori] = useState(paramKategori || "Semua");

  const [kelompokList, setKelompokList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const ref = collection(db, "kelompok_tani");
        let q =
          kategori === "Semua"
            ? firestoreQuery(ref)
            : firestoreQuery(ref, where("kategori", "==", kategori));

        const snap = await getDocs(q);
        let baseData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Enrichment khusus Gapoktan
        const enriched = await enrichGapoktanItems(baseData);

        // Patch agar field yang dipakai CardKelompok konsisten (jumlah_anggota & total_lahan)
        const patched = enriched.map(normalizeForCard);

        // Sort
        if (kategori === "Semua") {
          patched.sort((a, b) => {
            const katA = kategoriOrder[a.kategori] || 99;
            const katB = kategoriOrder[b.kategori] || 99;
            if (katA !== katB) return katA - katB;
            return (a.nama_kelompok || "").localeCompare(
              b.nama_kelompok || ""
            );
          });
        } else {
          patched.sort((a, b) =>
            (a.nama_kelompok || "").localeCompare(b.nama_kelompok || "")
          );
        }

        // Filter (search) – pakai field yang sudah dipatch
        const s = searchTerm.toLowerCase();
        const filtered = patched.filter((item) => {
          const nama = (item.nama_kelompok || "").toLowerCase();
          const ketua = (item.ketua || "").toLowerCase();
          const sekretaris = (item.sekretaris || "").toLowerCase();
          const bendahara = (item.bendahara || "").toLowerCase();
          const lahanStr = (item.total_lahan ?? "").toString();
          const jumlahStr = (item.jumlah_anggota ?? "").toString();

          return (
            nama.includes(s) ||
            ketua.includes(s) ||
            sekretaris.includes(s) ||
            bendahara.includes(s) ||
            lahanStr.includes(s) ||
            jumlahStr.includes(s)
          );
        });

        setKelompokList(filtered);
        setCurrentPage(1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchTerm, kategori]);

  // Pagination
  const paginatedData = kelompokList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(kelompokList.length / itemsPerPage);

  // Handler ganti kategori dan update URL
  const handleKategoriChange = (newKategori) => {
    setKategori(newKategori);
    setSearchParams(newKategori === "Semua" ? {} : { kategori: newKategori });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <h1 className="text-3xl font-bold mb-4 text-center">Daftar Kelompok</h1>

      {/* Search Bar */}
      <div className="mb-4 px-1 flex justify-center">
        <SearchBar
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Cari nama kelompok..."
        />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-5">
        {kategoriOptions.map((k) => (
          <button
            key={k}
            onClick={() => handleKategoriChange(k)}
            className={`px-4 py-2 font-semibold rounded-full border  ${
              kategori === k
                ? "bg-green-700 text-white"
                : "bg-white text-gray-700 hover:border-green-700"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          <p className="col-span-full text-center text-gray-500">Memuat...</p>
        ) : paginatedData.length === 0 ? (
          searchTerm ? (
            <p className="col-span-full text-center text-gray-500 italic">
              Tidak ada kelompok untuk kategori <strong>{kategori}</strong> yang
              cocok dengan pencarian <strong>"{searchTerm}"</strong>.
            </p>
          ) : (
            <p className="col-span-full text-center text-gray-500">
              Tidak ada data kelompok.
            </p>
          )
        ) : (
          paginatedData.map((item) => (
            <CardKelompok key={item.id} kelompok={item} />
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && kelompokList.length > itemsPerPage && (
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
