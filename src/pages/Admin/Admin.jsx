import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";

const Admin = () => {
  const [kelompok, setKelompok] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKelompok = async () => {
      try {
        const snapshot = await getDocs(collection(db, "kelompok_tani"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setKelompok(data);
        setLoading(false);
      } catch (err) {
        console.error("Gagal ambil data:", err);
        setLoading(false);
      }
    };
    fetchKelompok();
  }, []);

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <Link
          to="/admin/tambah"
          className="bg-lime-700 text-white px-4 py-2 rounded hover:bg-lime-800"
        >
          + Tambah Kelompok
        </Link>
      </div>

      {kelompok.length === 0 ? (
        <div className="text-center text-gray-500">Belum ada data kelompok tani</div>
      ) : (
        <table className="w-full border text-sm bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">No</th>
              <th className="border p-2 text-left">Nama Kelompok</th>
              <th className="border p-2">Jumlah Anggota</th>
              <th className="border p-2">Total Lahan (Ha)</th>
              <th className="border p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {kelompok.map((item, idx) => (
              <tr key={item.id}>
                <td className="border p-2 text-center">{idx + 1}</td>
                <td className="border p-2">{item.nama_kelompok}</td>
                <td className="border p-2 text-center">{item.jumlah_anggota || 0}</td>
                <td className="border p-2 text-center">{item.total_lahan || 0}</td>
                <td className="border p-2 text-center">
                  <Link
                    to={`/admin/detail/${item.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Admin;
