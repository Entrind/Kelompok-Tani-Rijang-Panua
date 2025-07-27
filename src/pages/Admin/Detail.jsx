import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc, collection, getDocs, updateDoc, deleteDoc, addDoc,} from "firebase/firestore";

import AnggotaFormModal from "../../components/forms/AnggotaFormModal";

const Detail = () => {
  const { id } = useParams();
  const [kelompok, setKelompok] = useState(null);
  const [anggota, setAnggota] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const docRef = doc(db, "kelompok_tani", id);
        const kelompokSnap = await getDoc(docRef);

        if (kelompokSnap.exists()) {
          setKelompok({ id: kelompokSnap.id, ...kelompokSnap.data() });
          const anggotaRef = collection(docRef, "anggota");
          const anggotaSnap = await getDocs(anggotaRef);
          setAnggota(
            anggotaSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
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

  const handleDelete = async (anggotaId) => {
    if (window.confirm("Yakin ingin menghapus anggota ini?")) {
      await deleteDoc(doc(db, "kelompok_tani", id, "anggota", anggotaId));
      setAnggota((prev) => prev.filter((a) => a.id !== anggotaId));
    }
  };

  const handleTambah = () => {
    setEditData(null);
    setShowModal(true);
  };

  const handleEdit = (data) => {
    setEditData(data);
    setShowModal(true);
  };

  const handleSubmitModal = async (data) => {
    if (editData) {
      // update
      const anggotaRef = doc(db, "kelompok_tani", id, "anggota", editData.id);
      await updateDoc(anggotaRef, data);
      setAnggota((prev) =>
        prev.map((a) => (a.id === editData.id ? { ...a, ...data } : a))
      );
    } else {
      // tambah baru
      const anggotaRef = collection(db, "kelompok_tani", id, "anggota");
      const newDoc = await addDoc(anggotaRef, data);
      setAnggota((prev) => [...prev, { id: newDoc.id, ...data }]);
    }
    setShowModal(false);
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6 flex justify-between">
        <Link to="/admin" className="text-blue-600 hover:underline">
          &larr; Kembali
        </Link>
        <button
          onClick={handleTambah}
          className="bg-lime-700 text-white px-4 py-2 rounded hover:bg-lime-800"
        >
          + Tambah Anggota
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-2">{kelompok?.nama_kelompok}</h1>
      <p className="text-gray-700 mb-4">
        Jumlah Anggota: <strong>{anggota.length}</strong>
      </p>

      {anggota.length === 0 ? (
        <div className="text-center text-gray-500">Belum ada data anggota</div>
      ) : (
        <table className="w-full border text-sm bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">No</th>
              <th className="border p-2">Nama</th>
              <th className="border p-2">NIK</th>
              <th className="border p-2">No HP</th>
              <th className="border p-2">Luas</th>
              <th className="border p-2">Jabatan</th>
              <th className="border p-2">Ket</th>
              <th className="border p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {anggota.map((a, idx) => (
              <tr key={a.id}>
                <td className="border p-2 text-center">{idx + 1}</td>
                <td className="border p-2">{a.nama}</td>
                <td className="border p-2">{a.nik}</td>
                <td className="border p-2">{a.no_hp}</td>
                <td className="border p-2 text-center">{a.luas}</td>
                <td className="border p-2">{a.jabatan || "-"}</td>
                <td className="border p-2">{a.ket || "-"}</td>
                <td className="border p-2 text-center space-x-2">
                  <button
                    onClick={() => handleEdit(a)}
                    className="bg-blue-600 text-white px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal */}
      <AnggotaFormModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmitModal}
        initialData={editData}
      />
    </div>
  );
};

export default Detail;
