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
import { Edit, Delete, ArrowBack } from "@mui/icons-material";

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

  const jabatanOrder = {
    Ketua: 1,
    Sekretaris: 2,
    Bendahara: 3,
    Anggota: 4,
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "nama",
        header: "Nama",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
      },
      {
        accessorKey: "nik",
        header: "NIK",
      },
      {
        accessorKey: "no_hp",
        header: "No HP",
      },
      {
        accessorKey: "luas",
        header: "Luas (Ha)",
        Cell: ({ cell }) => cell.getValue() || 0,
      },
      {
        accessorKey: "jabatan",
        header: "Jabatan",
        sortingFn: (rowA, rowB) => {
          const jabA = rowA.getValue("jabatan") || "Anggota";
          const jabB = rowB.getValue("jabatan") || "Anggota";

          // Urutkan berdasarkan jabatanOrder dulu
          if (jabatanOrder[jabA] !== jabatanOrder[jabB]) {
            return jabatanOrder[jabA] - jabatanOrder[jabB];
          }

          // Kalau jabatan sama, urutkan berdasarkan nama
          const namaA = rowA.getValue("nama")?.toLowerCase() || "";
          const namaB = rowB.getValue("nama")?.toLowerCase() || "";
          return namaA.localeCompare(namaB);
        },
        Cell: ({ cell }) => {
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
      },
    ],
    [loadingAction]
  );

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-full mx-auto p-6">
      {/* Tombol kembali di atas */}
      <div className="mb-4">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
        >
          <ArrowBack fontSize="small" />
          <span className="text-sm font-medium">Kembali</span>
        </Link>
      </div>

      {/* Info kelompok tani */}
      <div className="bg-white p-4 rounded shadow mb-4 text-base">
        <h1 className="text-2xl font-bold mb-5">{kelompok?.nama_kelompok}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-gray-700">
          <p>Kategori: 
            <strong className="ml-1">
              {kelompok?.kategori || "Kelompok Tani"}
            </strong>
          </p>
          <p>ID Kelompok: <strong>{kelompok.id}</strong></p>
          <p>Provinsi: <strong>{kelompok.provinsi}</strong></p>
          <p>Kabupaten: <strong>{kelompok.kabupaten}</strong></p>
          <p>Kecamatan: <strong>{kelompok.kecamatan}</strong></p>
          <p>Jumlah Anggota: <strong>{kelompok.jumlah_anggota || 0}</strong></p>
          <p>Total Lahan: <strong>{kelompok.total_lahan || 0} Ha</strong></p>
        </div>
      </div>

      {/* Tombol tambah di atas tabel */}
      <div className="flex justify-end mb-2">
        <button
          onClick={handleTambah}
          className="bg-lime-700 text-white px-4 py-2 rounded hover:bg-lime-800"
        >
          + Tambah Anggota
        </button>
      </div>


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
            sorting: [{ id: "jabatan", desc: false }],
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
