import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../../firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import AnggotaFormModal from "../../components/forms/AnggotaFormModal";

const Detail = () => {
  const { id } = useParams();
  const [kelompok, setKelompok] = useState(null);
  const [anggota, setAnggota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false); // state untuk loading tombol

  // Modal form tambah/edit
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
        toast.error("Gagal memuat data");
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  /** === ACTION === */

  const handleDelete = async (anggotaId) => {
    // Sweetalert2 konfirmasi
    const result = await Swal.fire({
      title: "Hapus Anggota?",
      text: "Data anggota ini akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setLoadingAction(true);
      await deleteDoc(doc(db, "kelompok_tani", id, "anggota", anggotaId));

      // Update jumlah anggota
      setAnggota((prev) => {
        const updated = prev.filter((a) => a.id !== anggotaId);
        updateDoc(doc(db, "kelompok_tani", id), {
          jumlah_anggota: updated.length,
        });
        return updated;
      });

      toast.success("Anggota berhasil dihapus");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus anggota");
    } finally {
      setLoadingAction(false);
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
    try {
      setLoadingAction(true);
      if (editData) {
        // Edit anggota
        const anggotaRef = doc(db, "kelompok_tani", id, "anggota", editData.id);
        await updateDoc(anggotaRef, data);

        setAnggota((prev) =>
          prev.map((a) => (a.id === editData.id ? { ...a, ...data } : a))
        );

        toast.success("Data anggota berhasil diperbarui");
      } else {
        // Tambah anggota baru
        const anggotaRef = collection(db, "kelompok_tani", id, "anggota");
        const newDoc = await addDoc(anggotaRef, data);

        setAnggota((prev) => [...prev, { id: newDoc.id, ...data }]);

        await updateDoc(doc(db, "kelompok_tani", id), {
          jumlah_anggota: anggota.length + 1,
        });

        toast.success("Anggota baru berhasil ditambahkan");
      }
      setShowModal(false);
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan data");
    } finally {
      setLoadingAction(false);
    }
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
                    disabled={loadingAction}
                  >
                    {loadingAction ? "..." : "Hapus"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal Form */}
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
