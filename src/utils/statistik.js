import { collection, getDocs, doc } from "firebase/firestore";
import { db } from "../firebase";

export const fetchStatistikKelompok = async () => {
  const kelompokSnap = await getDocs(collection(db, "kelompok_tani"));

  const jumlahKelompok = kelompokSnap.size;
  let totalAnggota = 0;
  let totalLahan = 0;

  for (const docKelompok of kelompokSnap.docs) {
    const anggotaSnap = await getDocs(
      collection(doc(db, "kelompok_tani", docKelompok.id), "anggota")
    );
    totalAnggota += anggotaSnap.size;
    totalLahan += anggotaSnap.docs.reduce((sum, doc) => {
      return sum + (parseFloat(doc.data().luas) || 0);
    }, 0);
  }

  return {
    jumlahKelompok,
    totalAnggota,
    totalLahan,
  };
};
