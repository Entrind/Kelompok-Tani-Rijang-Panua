import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

const Detail = () => {
  const { id } = useParams(); // id kelompok
  const [kelompok, setKelompok] = useState(null);
  const [anggota, setAnggota] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        // Ambil data kelompok
        const docRef = doc(db, "kelompok_tani", id);
        const kelompokSnap = await getDoc(docRef);

        if (kelompokSnap.exists()) {
          setKelompok({ id: kelompokSnap.id, ...kelompokSnap.data() });

          // Ambil data anggota (sub-koleksi)
          const anggotaRef = collection(docRef, "anggota");
          const anggotaSnap = await getDocs(anggotaRef);
          setAnggota(
            anggotaSnap.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
          );
        }
        setLoading(false);
      } catch (err) {
        console.error("Gagal ambil detail:", err);
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!kelompok) return <div className="text-center py-10">Data tidak ditemukan</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Link to="/admin" className="text-blue-600 hover:underline">&larr; Kembali</Link>
      </div>

      <h1 className="text-2xl font-bold mb-2">{kelompok.nama_kelompok}</h1>
      <p className="text-gray-700 mb-4">
        ID Kelompok Tani: <strong>{kelompok.id || 0}</strong> <br></br>
        Provinsi: <strong>{kelompok.provinsi}</strong> <br></br>
        Kabupaten: <strong>{kelompok.kabupaten}</strong> <br></br>
        Kecamatan: <strong>{kelompok.kecamatan}</strong> <br></br>
      </p>
      <p className="text-gray-700 mb-4">
        Jumlah Anggota: <strong>{kelompok.jumlah_anggota || 0}</strong> &nbsp; | &nbsp;
        Total Lahan: <strong>{kelompok.total_lahan || 0} Ha</strong>
      </p>

      {anggota.length === 0 ? (
        <div className="text-center text-gray-500">Belum ada data anggota</div>
      ) : (
        <table className="w-full border text-sm bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">No</th>
              <th className="border p-2 text-left">Nama</th>
              <th className="border p-2 text-left">NIK</th>
              <th className="border p-2">No HP</th>
              <th className="border p-2">Luas (Ha)</th>
              <th className="border p-2">Jabatan</th>
              <th className="border p-2">Ket</th>
            </tr>
          </thead>
          <tbody>
            {anggota.map((a, idx) => (
              <tr key={a.id}>
                <td className="border p-2 text-center">{idx + 1}</td>
                <td className="border p-2">{a.nama}</td>
                <td className="border p-2">{a.nik}</td>
                <td className="border p-2 text-center">{a.no_hp || "-"}</td>
                <td className="border p-2 text-center">{a.luas || 0}</td>
                <td className="border p-2 text-center">{a.jabatan || "-"}</td> {/* Baru */}
                <td className="border p-2">{a.ket || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Detail;
