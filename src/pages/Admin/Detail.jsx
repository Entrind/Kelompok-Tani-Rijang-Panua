import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc, collection, getDocs, updateDoc, deleteDoc } from "firebase/firestore";

const Detail = () => {
  const { id } = useParams(); // id kelompok
  const [kelompok, setKelompok] = useState(null);
  const [anggota, setAnggota] = useState([]);
  const [loading, setLoading] = useState(true);

  // state untuk edit
  const [editId, setEditId] = useState(null);
  const [selectedJabatan, setSelectedJabatan] = useState("");

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

  // Fungsi untuk edit
  const handleEdit = (anggota) => {
    setEditId(anggota.id);
    setSelectedJabatan(anggota.jabatan || "");
  };

  const handleSave = async (anggotaId) => {
    const anggotaRef = doc(db, "kelompok_tani", id, "anggota", anggotaId);
    await updateDoc(anggotaRef, { jabatan: selectedJabatan });
    setEditId(null);

    // Update state supaya tabel langsung refresh
    setAnggota((prev) =>
      prev.map((a) =>
        a.id === anggotaId ? { ...a, jabatan: selectedJabatan } : a
      )
    );
  };

  const handleDelete = async (anggotaId) => {
  if (window.confirm("Yakin ingin menghapus anggota ini?")) {
    await deleteDoc(doc(db, "kelompok_tani", id, "anggota", anggotaId));
    // Update state supaya tabel langsung refresh
    setAnggota((prev) => prev.filter((a) => a.id !== anggotaId));
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!kelompok) return <div className="text-center py-10">Data tidak ditemukan</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Link to="/admin" className="text-blue-600 hover:underline">
          &larr; Kembali
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-2">{kelompok.nama_kelompok}</h1>
      <p className="text-gray-700 mb-4">
        ID Kelompok Tani: <strong>{kelompok.id || 0}</strong> <br />
        Provinsi: <strong>{kelompok.provinsi}</strong> <br />
        Kabupaten: <strong>{kelompok.kabupaten}</strong> <br />
        Kecamatan: <strong>{kelompok.kecamatan}</strong> <br />
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
              <th className="border p-2">Aksi</th>
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

                {/* Kolom Jabatan: tampilkan select jika edit */}
                <td className="border p-2">
                  {editId === a.id ? (
                    <input
                      type="text"
                      value={a.nama}
                      onChange={(e) =>
                        setAnggota((prev) =>
                          prev.map((x) =>
                            x.id === a.id ? { ...x, nama: e.target.value } : x
                          )
                        )
                      }
                      className="border p-1 rounded w-full"
                    />
                  ) : (
                    a.nama
                  )}
                </td>

                <td className="border p-2">
                  {editId === a.id ? (
                    <input
                      type="text"
                      value={a.nik}
                      onChange={(e) =>
                        setAnggota((prev) =>
                          prev.map((x) =>
                            x.id === a.id ? { ...x, nik: e.target.value } : x
                          )
                        )
                      }
                      className="border p-1 rounded w-full"
                    />
                  ) : (
                    a.nik
                  )}
                </td>

                <td className="border p-2">
                  {editId === a.id ? (
                    <input
                      type="text"
                      value={a.no_hp}
                      onChange={(e) =>
                        setAnggota((prev) =>
                          prev.map((x) =>
                            x.id === a.id ? { ...x, nama: e.target.value } : x
                          )
                        )
                      }
                      className="border p-1 rounded w-full"
                    />
                  ) : (
                    a.no_hp
                  )}
                </td>

                <td className="border p-2">
                  {editId === a.id ? (
                    <input
                      type="number"
                      value={a.luas}
                      onChange={(e) =>
                        setAnggota((prev) =>
                          prev.map((x) =>
                            x.id === a.id ? { ...x, nik: e.target.value } : x
                          )
                        )
                      }
                      className="border p-1 rounded w-full"
                    />
                  ) : (
                    a.luas
                  )}
                </td>

                <td className="border p-2">
                  {editId === a.id ? (
                    <input
                      type="text"
                      value={a.ket}
                      onChange={(e) =>
                        setAnggota((prev) =>
                          prev.map((x) =>
                            x.id === a.id ? { ...x, nama: e.target.value } : x
                          )
                        )
                      }
                      className="border p-1 rounded w-full"
                    />
                  ) : (
                    a.ket
                  )}
                </td>

                <td className="bg-white border p-2 text-center">
                  {editId === a.id ? (
                    <select
                      value={selectedJabatan}
                      onChange={(e) => setSelectedJabatan(e.target.value)}
                      className="bg-white border rounded p-1"
                    >
                      <option value="">- Pilih Jabatan -</option>
                      <option value="Ketua">Ketua</option>
                      <option value="Sekretaris">Sekretaris</option>
                      <option value="Bendahara">Bendahara</option>
                      <option value="Anggota">Anggota</option>
                    </select>
                  ) : (
                    a.jabatan || "-"
                  )}
                </td>

                <td className="border p-2">{a.ket || "-"}</td>

                {/* Kolom aksi */}
                <td className="border p-2 text-center space-x-2">
                  {editId === a.id ? (
                    <button
                      onClick={() => handleSave(a.id)}
                      className="bg-green-600 text-white px-2 py-1 rounded"
                    >
                      Simpan
                    </button>
                  ) : (
                    <>
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
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Detail;
