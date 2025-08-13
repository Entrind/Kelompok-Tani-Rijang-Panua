import { doc, getDocs, collection, writeBatch, deleteDoc, setDoc } from "firebase/firestore";

/**
 * Chunk array agar aman dari limit 500 operasi per batch.
 */
export const chunkArray = (arr, size = 450) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
};

/**
 * Salin seluruh dokumen pada subkoleksi dari dokumen lama ke dokumen baru (docId dipertahankan).
 */
export async function copySubcollection(db, oldId, newId, subName) {
  const oldRef = collection(db, "kelompok_tani", oldId, subName);
  const snap = await getDocs(oldRef);
  const docs = snap.docs;

  if (!docs.length) return;

  const chunks = chunkArray(docs);
  for (const group of chunks) {
    const batch = writeBatch(db);
    group.forEach((d) => {
      const newDocRef = doc(db, "kelompok_tani", newId, subName, d.id);
      batch.set(newDocRef, d.data(), { merge: true });
    });
    await batch.commit();
  }
}

/**
 * Hapus seluruh dokumen pada subkoleksi dokumen lama.
 */
export async function deleteSubcollection(db, oldId, subName) {
  const oldRef = collection(db, "kelompok_tani", oldId, subName);
  const snap = await getDocs(oldRef);
  const docs = snap.docs;

  if (!docs.length) return;

  const chunks = chunkArray(docs);
  for (const group of chunks) {
    const batch = writeBatch(db);
    group.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
  }
}

/**
 * Rename dokumen `kelompok_tani/{oldId}` → `kelompok_tani/{newId}`:
 *   - Tulis dokumen baru (merge: true)
 *   - Salin subkoleksi (default: non-gapoktan: ["anggota"], gapoktan: ["pengurus","kelompok_anggota"])
 *   - Hapus subkoleksi lama
 *   - Hapus dokumen lama
 *
 * @param {object} params
 * @param {import('firebase/firestore').Firestore} params.db
 * @param {string} params.oldId
 * @param {string} params.newId
 * @param {object} params.data             - data dokumen utama yang ingin disimpan
 * @param {boolean} params.isGapoktan      - jika true, gunakan subkoleksi pengurus & kelompok_anggota
 * @param {string[]} [params.subcollectionsOverride] - jika ingin override daftar subkoleksi manual
 */
export async function renameKelompokDoc({
  db,
  oldId,
  newId,
  data,
  isGapoktan,
  subcollectionsOverride,
}) {
  // 1) Tulis dokumen baru
  const newDocRef = doc(db, "kelompok_tani", newId);
  await setDoc(newDocRef, data, { merge: true });

  // 2) Salin subkoleksi
  const subNames =
    Array.isArray(subcollectionsOverride) && subcollectionsOverride.length > 0
      ? subcollectionsOverride
      : isGapoktan
      ? ["pengurus", "kelompok_anggota"]
      : ["anggota"];

  for (const sub of subNames) {
    await copySubcollection(db, oldId, newId, sub);
  }

  // 3) Hapus subkoleksi lama
  for (const sub of subNames) {
    await deleteSubcollection(db, oldId, sub);
  }

  // 4) Hapus dokumen lama
  await deleteDoc(doc(db, "kelompok_tani", oldId));
}
