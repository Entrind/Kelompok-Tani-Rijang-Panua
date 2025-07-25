import { useEffect } from "react";
import { Link } from 'react-router-dom';

import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";

const Admin = () => {
  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, "kelompok-tani"));
      snapshot.forEach((doc) => {
        console.log(doc.id, "=>", doc.data());
      });
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard Admin</h1>
      <div className="space-y-4">
        <Link
          to="/admin/tambah"
          className="inline-block bg-lime-700 text-white px-4 py-2 rounded hover:bg-lime-800"
        >
          + Tambah Kelompok Tani
        </Link>

        {/* Nanti akan ditambahkan daftar kelompok versi tabel di sini */}
        <div className="mt-6 text-gray-500">Belum ada daftar kelompok (nanti kita sambungkan)</div>
      </div>
    </div>
  );
};

export default Admin;
