/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

import { MaterialReactTable } from "material-react-table";
import { Box, IconButton } from "@mui/material";
import { Visibility, Delete } from "@mui/icons-material";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

import JSZip from "jszip";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

const Admin = () => {
  const [kelompok, setKelompok] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rowSelection, setRowSelection] = useState({});
  const [modeSelect, setModeSelect] = useState(false);
  const navigate = useNavigate();

  /** === FETCH DATA KELOMPOK === */
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
      } catch {
        toast.error("Gagal memuat data kelompok");
      } finally {
        setLoading(false);
      }
    };

    fetchKelompok();
  }, []);

  /** === HANDLE DELETE === */
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
    } catch {
      toast.error("Gagal menghapus kelompok");
    }
  };

  /** === HANDLE EXPORT ZIP EXCEL === */
  const exportKelompokToZip = async (dataKelompok) => {
    if (!dataKelompok || dataKelompok.length === 0) {
      toast.warn("Tidak ada data yang dipilih untuk diexport!");
      return;
    }

    const zip = new JSZip();

    // 🔹 Urutkan abjad A → Z
    const dataSorted = [...dataKelompok].sort((a, b) =>
      a.nama_kelompok.localeCompare(b.nama_kelompok)
    );

    for (const kelompok of dataSorted) {
      const anggotaSnap = await getDocs(
        collection(db, "kelompok_tani", kelompok.id, "anggota")
      );
      const anggota = anggotaSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const jabatanOrder = { Ketua: 1, Sekretaris: 2, Bendahara: 3, Anggota: 4 };
      const anggotaSorted = [...anggota].sort((a, b) => {
        const rankA = jabatanOrder[a.jabatan || "Anggota"];
        const rankB = jabatanOrder[b.jabatan || "Anggota"];
        if (rankA !== rankB) return rankA - rankB;
        return (a.nama || "").localeCompare(b.nama || "");
      });

      // Buat rows
      const rows = [];
      rows.push([]);
      rows.push(["", "Nama Kelompok Tani", kelompok.nama_kelompok]);
      rows.push(["", "Kategori", kelompok.kategori || "Kelompok Tani"]);
      rows.push(["", "ID Kelompok Tani", kelompok.id]);
      rows.push(["", "Provinsi", kelompok.provinsi]);
      rows.push(["", "Kabupaten", kelompok.kabupaten]);
      rows.push(["", "Kecamatan", kelompok.kecamatan]);
      rows.push(["", "Jumlah Anggota", `${kelompok.jumlah_anggota || 0}`]);
      rows.push(["", "Total Lahan", `${kelompok.total_lahan || 0} Ha`]);
      rows.push([]);
      rows.push([
        "No",
        "Nama",
        "NIK",
        "No HP",
        "Jabatan",
        "Luas (Ha)",
        "Keterangan",
      ]);

      anggotaSorted.forEach((a, idx) => {
        rows.push([
          idx + 1,
          a.nama,
          a.nik,
          a.no_hp || "-",
          a.jabatan || "Anggota",
          a.luas || 0,
          a.ket || "-",
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [
        { wch: 5 },
        { wch: 25 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 25 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Kelompok");
      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

      zip.file(`${kelompok.nama_kelompok}.xlsx`, buffer);
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "Data-Kelompok-Tani.zip");
  };

  /** === HANDLE EXPORT TERPILIH === */
  const handleExportSelected = async () => {
    const selected = kelompok.filter((k) => rowSelection[k.id]);
    await exportKelompokToZip(selected);

    // ✅ Reset row selection & kembali ke mode normal
    setRowSelection({});
    setModeSelect(false);
  };

  /** === BADGE JABATAN === */
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

  /** === COLUMNS MRT === */
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
      {/* Judul Halaman */}
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
      </div>

      {/* Tombol Aksi di atas tabel */}
      <div className="flex justify-end mb-2 gap-2">
        {!modeSelect ? (
          // Tombol utama (pilih mode export)
          <button
            onClick={async () => {
              const result = await Swal.fire({
                title: "Export Data",
                text: "Pilih metode export data kelompok:",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Export Semua",
                cancelButtonText: "Export Terpilih",
              });

              if (result.isConfirmed) {
                // Export semua langsung
                await exportKelompokToZip(kelompok);
              } else if (result.dismiss === Swal.DismissReason.cancel) {
                // Aktifkan mode select untuk memilih kelompok
                setModeSelect(true);
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export ZIP Excel
          </button>
        ) : (
          // Jika sedang mode select
          <>
            <button
              onClick={handleExportSelected}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Export Terpilih
            </button>
            <button
              onClick={() => {
                setRowSelection({});
                setModeSelect(false);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Batal
            </button>
          </>
        )}

        {/* Tombol Tambah Anggota */}
        <button className="bg-lime-700 text-white px-4 py-2 rounded-md hover:bg-lime-800">
          + Tambah Kelompok
        </button>
      </div>

      {/* Tabel Data */}
      <MaterialReactTable
        columns={columns}
        data={kelompok}
        getRowId={(row) => row.id}
        enableRowSelection={modeSelect}
        state={{ rowSelection }}
        onRowSelectionChange={setRowSelection}
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
