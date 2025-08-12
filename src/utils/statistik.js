// src/utils/statistik.js
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Hitung ulang statistik dari Firestore dan simpan ke dokumen "stats/global".
 * - jumlahKelompok: jumlah dokumen di koleksi "kelompok_tani"
 * - totalAnggota & totalLahan: dijumlah dari subkoleksi "anggota" HANYA untuk kategori non-Gapoktan
 */
export const recomputeStats = async () => {
  const kelompokSnap = await getDocs(collection(db, "kelompok_tani"));

  const jumlahKelompok = kelompokSnap.size;
  let totalAnggota = 0;
  let totalLahan = 0;

  for (const k of kelompokSnap.docs) {
    const data = k.data();
    const kategori = data?.kategori || "Kelompok Tani";

    // EXCLUDE Gapoktan untuk mencegah double-count
    if (kategori === "Gapoktan") continue;

    const anggotaSnap = await getDocs(collection(k.ref, "anggota"));
    totalAnggota += anggotaSnap.size;

    anggotaSnap.forEach((a) => {
      const luas = parseFloat(a.data()?.luas || 0);
      if (!isNaN(luas)) totalLahan += luas;
    });
  }

  await setDoc(doc(db, "stats", "global"), {
    jumlahKelompok,
    totalAnggota,
    totalLahan,
    lastUpdated: serverTimestamp(),
  });
};

/**
 * Ambil dokumen stats/global; jika belum ada → hitung & buat.
 * Return: { jumlahKelompok, totalAnggota, totalLahan }
 */
export const getStatsOrInit = async () => {
  const ref = doc(db, "stats", "global");
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const d = snap.data();
    return {
      jumlahKelompok: d.jumlahKelompok || 0,
      totalAnggota: d.totalAnggota || 0,
      totalLahan: d.totalLahan || 0,
    };
  }

  // jika belum ada, kita hitung & buat
  await recomputeStats();
  const snap2 = await getDoc(ref);
  if (snap2.exists()) {
    const d = snap2.data();
    return {
      jumlahKelompok: d.jumlahKelompok || 0,
      totalAnggota: d.totalAnggota || 0,
      totalLahan: d.totalLahan || 0,
    };
  }

  // fallback aman
  return { jumlahKelompok: 0, totalAnggota: 0, totalLahan: 0 };
};
export const fetchStatistikKelompok = async () => {
  const stats = await getStatsOrInit();
  return {
    jumlahKelompok: stats.jumlahKelompok,
    totalAnggota: stats.totalAnggota,
    totalLahan: stats.totalLahan,
  };
};