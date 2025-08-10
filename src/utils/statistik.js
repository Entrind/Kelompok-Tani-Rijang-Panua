// utils/statistik.js
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export async function fetchStatistikKelompok() {
  const snap = await getDocs(collection(db, "kelompok_tani"));
  let jumlahKelompok = 0;
  let totalAnggota = 0;
  let totalLahan = 0;

  for (const docKelompok of snap.docs) {
    const data = docKelompok.data();
    jumlahKelompok += 1;

    // Hanya hitung anggota/lahan untuk kelompok yang bukan Gapoktan
    if ((data.kategori || "") !== "Gapoktan") {
      const anggotaSnap = await getDocs(
        collection(docKelompok.ref, "anggota")
      );
      totalAnggota += anggotaSnap.size;
      anggotaSnap.forEach((d) => {
        totalLahan += parseFloat(d.data().luas || 0);
      });
    }
  }

  return { jumlahKelompok, totalAnggota, totalLahan };
}
