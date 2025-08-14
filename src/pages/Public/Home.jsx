/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import CardKelompok from "../../components/cards/CardKelompok";
import { Link } from "react-router-dom";
import { getStatsOrInit } from "../../utils/statistik";

const kategoriList = [
  { label: "Gapoktan", warna: "bg-lime-700", nama: "Gapoktan" },
  { label: "Kelompok Tani", warna: "bg-green-700", nama: "Kelompok Tani" },
  { label: "Kelompok Kebun", warna: "bg-amber-700", nama: "Kelompok Kebun" },
  { label: "Kelompok Wanita Tani", warna: "bg-pink-700", nama: "KWT" },
];

export default function Home() {
  const [dataPerKategori, setDataPerKategori] = useState({});
  const [stats, setStats] = useState({ kelompok: 0, anggota: 0, lahan: 0 });
  const [headerUrl, setHeaderUrl] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      // header image
      try {
        const snap = await getDoc(doc(db, "settings", "homepage"));
        const url = snap.exists() ? snap.data()?.headerImageUrl : "";
        setHeaderUrl(url || "");
      } catch {
        setHeaderUrl("");
      }

      // cards per kategori
      const result = {};
      for (const kategori of kategoriList) {
        const q = query(
          collection(db, "kelompok_tani"),
          where("kategori", "==", kategori.nama),
        );
        const snap = await getDocs(q);

        // Urut A-Z, ambil 4
        const top4 = snap.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .sort((a, b) =>
            (a.nama_kelompok || "")
              .toLowerCase()
              .localeCompare((b.nama_kelompok || "").toLowerCase())
          )
          .slice(0, 4);

        // === Enrichment khusus Gapoktan (pengurus + jumlah kelompok + total lahan gabungan) ===
        if (kategori.nama === "Gapoktan") {
          const enriched = await Promise.all(
            top4.map(async (g) => {
              // 1) Ambil pengurus dari subkoleksi 'pengurus'
              const pengSnap = await getDocs(
                collection(db, "kelompok_tani", g.id, "pengurus")
              );
              const pengurusList = pengSnap.docs.map((d) => d.data());
              const ketua =
                pengurusList.find((p) => p.jabatan === "Ketua")?.nama || "-";
              const sekretaris =
                pengurusList.find((p) => p.jabatan === "Sekretaris")?.nama ||
                "-";
              const bendahara =
                pengurusList.find((p) => p.jabatan === "Bendahara")?.nama ||
                "-";

              // 2) Ambil kelompok anggota dari subkoleksi 'kelompok_anggota'
              const kaSnap = await getDocs(
                collection(db, "kelompok_tani", g.id, "kelompok_anggota")
              );
              const memberIds = kaSnap.docs
                .map((d) => d.data().kelompokId)
                .filter(Boolean);

              // 3) Hitung jumlah kelompok & total lahan dari dokumen kelompok anggota (field total_lahan)
              let jumlahKelompok = memberIds.length;
              let totalLahanGapoktan = 0;

              if (memberIds.length) {
                const lahanList = await Promise.all(
                  memberIds.map(async (mid) => {
                    try {
                      const mDoc = await getDoc(doc(db, "kelompok_tani", mid));
                      if (mDoc.exists()) {
                        const md = mDoc.data();
                        return parseFloat(md.total_lahan || 0);
                      }
                    } catch {
                      /* ignore */
                    }
                    return 0;
                  })
                );
                totalLahanGapoktan = lahanList.reduce(
                  (sum, v) => sum + (parseFloat(v) || 0),
                  0
                );
              }

              return {
                ...g,
                ketua,
                sekretaris,
                bendahara,
                jumlah_kelompok_gapoktan: jumlahKelompok,
                total_lahan_gapoktan: totalLahanGapoktan,
              };
            })
          );

          result[kategori.nama] = enriched;
        } else {
          // Non-gapoktan → tetap
          result[kategori.nama] = top4;
        }
      }

      setDataPerKategori(result);

      // statistik global (auto init)
      const s = await getStatsOrInit();
      setStats({
        kelompok: s.jumlahKelompok,
        anggota: s.totalAnggota,
        lahan: s.totalLahan,
      });
    };

    fetchData();
  }, []);

  const fallbackHeader =
    "https://firebasestorage.googleapis.com/v0/b/kelompok-tani-rijang-panua.firebasestorage.app/o/homepage%2Fsawah.png?alt=media&token=604a6cf2-b4c8-4660-89e2-d977152e8cc8";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div
        className="h-96 bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: `url('${headerUrl || fallbackHeader}')`,
        }}
      >
        <div className="w-full px-4 sm:px-6 md:px-8">
          <div className="bg-black/50 p-6 rounded-xl max-w-3xl mx-auto text-center">
            <h1 className="lg:text-3xl  md:text-2xl font-bold text-white">
              Sistem Informasi Kelompok Tani<br />Desa Rijang Panua
            </h1>
          </div>
        </div>
      </div>

      {/* Statistik */}
      <div className="bg-gray-200 py-8">
        <div className="px-4 sm:px-5 md:px-7">
          <div className="max-w-7xl w-full bg-white mx-auto rounded-md py-8 px-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
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
        </div>
      </div>

      {/* Card per kategori */}
      {kategoriList.map((kat) => (
        <div key={kat.nama} className="py-8 px-4">
          <div className="max-w-screen-xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${kat.warna} text-white px-3 py-1 rounded shadow-md`}>
                {kat.label}
              </h2>
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
        </div>
      ))}
    </div>
  );
}
