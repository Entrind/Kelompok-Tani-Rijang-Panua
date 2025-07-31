/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useMemo } from "react";
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

import { MaterialReactTable } from "material-react-table";
import { Box, IconButton } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

import Swal from "sweetalert2";
import { toast } from "react-toastify";
import AnggotaFormModal from "../../components/forms/AnggotaFormModal";

const Detail = () => {
  const { id } = useParams();
  const [kelompok, setKelompok] = useState(null);
  const [anggota, setAnggota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);

  // Modal tambah/edit
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);

  /** === Fetch data detail & anggota === */
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const docRef = doc(db, "kelompok_tani", id);
        const kelompokSnap = await getDoc(docRef);

        if (kelompokSnap.exists()) {
          setKelompok({ id: kelompokSnap.id, ...kelompokSnap.data() });
          const anggotaRef = collection(docRef, "anggota");
          const anggotaSnap = await getDocs(anggotaRef);
          const hasil = anggotaSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setAnggota(hasil);
        }
      } catch (err) {
        console.error("Gagal ambil detail:", err);
        toast.error("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  /** === ACTION === */

  const handleDelete = async (anggotaId) => {
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
        // Edit
        const anggotaRef = doc(db, "kelompok_tani", id, "anggota", editData.id);
        await updateDoc(anggotaRef, {
          ...data,
          jabatan: data.jabatan || "Anggota", // 🔹 default Anggota
        });
        setAnggota((prev) =>
          prev.map((a) =>
            a.id === editData.id ? { ...a, ...data, jabatan: data.jabatan || "Anggota" } : a
          )
        );
        toast.success("Data anggota berhasil diperbarui");
      } else {
        // Tambah
        const anggotaRef = collection(db, "kelompok_tani", id, "anggota");
        const newDoc = await addDoc(anggotaRef, {
          ...data,
          jabatan: data.jabatan || "Anggota", // 🔹 default Anggota
        });

        setAnggota((prev) => [
          ...prev,
          { id: newDoc.id, ...data, jabatan: data.jabatan || "Anggota" },
        ]);

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

  /** === COLUMNS MRT === */
  const columns = useMemo(
    () => [
      { accessorKey: "nama", header: "Nama" },
      { accessorKey: "nik", header: "NIK" },
      { accessorKey: "no_hp", header: "No HP" },
      {
        accessorKey: "luas",
        header: "Luas (Ha)",
        Cell: ({ cell }) => cell.getValue() || 0,
      },
      {
        accessorKey: "jabatan",
        header: "Jabatan",
        Cell: ({ cell }) => {
          // Jika kosong, set default "Anggota"
          const value = cell.getValue() || "Anggota";
          const colors = {
            Ketua: "bg-green-600 text-white",
            Sekretaris: "bg-blue-600 text-white",
            Bendahara: "bg-yellow-600 text-white",
            Anggota: "bg-gray-400 text-white",
          };

          return (
            <div className="flex justify-center">
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  colors[value] || "bg-gray-300 text-gray-800"
                }`}
              >
                {value}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "ket",
        header: "Keterangan",
        Cell: ({ cell }) => cell.getValue() || "-",
      },
      {
        header: "Aksi",
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <Box display="flex" gap={1} justifyContent="center">
            <IconButton
              color="primary"
              onClick={() => handleEdit(row.original)}
            >
              <Edit />
            </IconButton>
            <IconButton
              color="error"
              onClick={() => handleDelete(row.original.id)}
              disabled={loadingAction}
            >
              <Delete />
            </IconButton>
          </Box>
        ),
        muiTableHeadCellProps: {
          align: "center", // Header center
        },
      },
    ],
    [loadingAction]
  );

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-full mx-auto p-6">
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
        Jumlah Anggota: <strong>{kelompok.jumlah_anggota || 0}</strong> &nbsp; | &nbsp;
        Total Lahan: <strong>{kelompok.total_lahan || 0} Ha</strong>
      </p>

      {anggota.length === 0 ? (
        <div className="text-center text-gray-500">Belum ada data anggota</div>
      ) : (
        <MaterialReactTable
          columns={columns}
          data={anggota}
          getRowId={(row) => row.id}
          enableColumnActions={false}
          enableColumnFilters={false}
          initialState={{
            pagination: {
              pageIndex: 0,
              pageSize: 10,
            },
          }}
          muiTableContainerProps={{
            sx: { maxWidth: "100%" }, // 🔹 Lebar penuh container
          }}
          muiTableHeadCellProps={{
            align: "center", // 🔹 Header center
          }}
          muiTableBodyCellProps={{
            align: "center", // 🔹 Body center
            sx: { whiteSpace: "nowrap" },
          }}
        />
      )}

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
