/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

import { MaterialReactTable } from "material-react-table";
import { Box, IconButton } from "@mui/material";
import { Visibility, Delete } from "@mui/icons-material";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

const Admin = () => {
  const [kelompok, setKelompok] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchKelompok = async () => {
      try {
        const snapshot = await getDocs(collection(db, "kelompok_tani"));

        const data = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const dataKelompok = { id: docSnap.id, ...docSnap.data() };

            // Ambil sub-koleksi anggota
            const anggotaRef = collection(docSnap.ref, "anggota");
            const anggotaSnap = await getDocs(anggotaRef);
            const anggota = anggotaSnap.docs.map((a) => a.data());

            // Cari ketua, sekretaris, bendahara
            const ketua = anggota.find((a) => a.jabatan === "Ketua")?.nama || "-";
            const sekretaris =
              anggota.find((a) => a.jabatan === "Sekretaris")?.nama || "-";
            const bendahara =
              anggota.find((a) => a.jabatan === "Bendahara")?.nama || "-";

            return {
              ...dataKelompok,
              ketua,
              sekretaris,
              bendahara,
            };
          })
        );

        setKelompok(data);
      } catch (error) {
        toast.error("Gagal memuat data kelompok");
      } finally {
        setLoading(false);
      }
    };

    fetchKelompok();
  }, []);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Hapus Kelompok?",
      text: "Data kelompok ini akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteDoc(doc(db, "kelompok_tani", id));
      setKelompok((prev) => prev.filter((k) => k.id !== id));
      toast.success("Kelompok berhasil dihapus");
    } catch (error) {
      toast.error("Gagal menghapus kelompok");
    }
  };
  
  const renderBadge = (label, type) => {
    let colorClass = "bg-gray-300 text-gray-800"; // default

    if (type === "Ketua") colorClass = "bg-green-100 text-green-800";
    if (type === "Sekretaris") colorClass = "bg-blue-100 text-blue-800";
    if (type === "Bendahara") colorClass = "bg-yellow-100 text-yellow-800";

    return (
      <span
        className={`px-2 py-1 text-sm font-medium rounded-md ${colorClass}`}
      >
        {label}
      </span>
    );
  };
    /** Columns MRT **/
    const columns = useMemo(
    () => [
      { accessorKey: "nama_kelompok", header: "Nama Kelompok" },
      {
        accessorKey: "kategori",
        header: "Kategori",
        Cell: ({ cell }) => cell.getValue() || "Kelompok Tani",
      },
      {
        accessorKey: "ketua",
        header: "Ketua",
        Cell: ({ cell }) =>
          cell.getValue() !== "-"
            ? renderBadge(cell.getValue(), "Ketua")
            : "-",
      },
      {
        accessorKey: "sekretaris",
        header: "Sekretaris",
        Cell: ({ cell }) =>
          cell.getValue() !== "-"
            ? renderBadge(cell.getValue(), "Sekretaris")
            : "-",
      },
      {
        accessorKey: "bendahara",
        header: "Bendahara",
        Cell: ({ cell }) =>
          cell.getValue() !== "-"
            ? renderBadge(cell.getValue(), "Bendahara")
            : "-",
      },
      {
        accessorKey: "jumlah_anggota",
        header: "Jumlah Anggota",
        Cell: ({ cell }) => cell.getValue() || 0,
      },
      {
        accessorKey: "total_lahan",
        header: "Total Lahan (Ha)",
        Cell: ({ cell }) => cell.getValue() || 0,
      },
      {
        header: "Aksi",
        enableSorting: false,
        Cell: ({ row }) => (
          <Box display="flex" gap={1} justifyContent="center">
            <IconButton
              color="primary"
              onClick={() => navigate(`/admin/detail/${row.original.id}`)}
            >
              <Visibility />
            </IconButton>
            <IconButton
              color="error"
              onClick={() => handleDelete(row.original.id)}
            >
              <Delete />
            </IconButton>
          </Box>
        ),
      },
    ],
    []
  );

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-full mx-auto p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
      </div>
      <div className="flex justify-end mb-2 gap-2">
        <button
          className="bg-lime-700 text-white px-4 py-2 rounded-md hover:bg-lime-800"
        >
          + Tambah Anggota
        </button>
      </div>

      <MaterialReactTable
        columns={columns}
        data={kelompok}
        getRowId={(row) => row.id}
        enableColumnActions={false}
        enableColumnFilters={false}
        initialState={{
          sorting: [{ id: "nama_kelompok", desc: false }],
          pagination: { pageIndex: 0, pageSize: 10 },
        }}
        muiTablePaperProps={{
          elevation: 2,
          sx: {
            borderRadius: "1rem",
            overflow: "hidden",
            border: "1px solid #e5e7eb",
          },
        }}
        muiTableHeadCellProps={{
          align: "center",
          sx: { fontWeight: "bold", backgroundColor: "#f3f4f6" },
        }}
        muiTableBodyCellProps={{
          align: "center",
          sx: { whiteSpace: "nowrap" },
        }}
        muiTableBodyRowProps={{
          sx: {
            "&:hover": { backgroundColor: "#f3f4f6" },
          },
        }}
      />
    </div>
  );
};

export default Admin;
