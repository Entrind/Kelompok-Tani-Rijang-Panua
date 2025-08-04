/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc, collection, getDocs, updateDoc, deleteDoc, addDoc, setDoc } from "firebase/firestore";

import { MaterialReactTable } from "material-react-table";
import { Box, IconButton } from "@mui/material";
import { Edit, Delete, ArrowBack } from "@mui/icons-material";
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';

import Swal from "sweetalert2";
import { toast } from "react-toastify";
import AnggotaFormModal from "../../components/forms/AnggotaFormModal";
import KelompokFormModal from "../../components/forms/KelompokFormModal";

import * as XLSX from "xlsx";

const Detail = () => {
  const { id } = useParams();
  const [kelompok, setKelompok] = useState(null);
  const [anggota, setAnggota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);

  // Modal tambah/edit
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showKelompokModal, setShowKelompokModal] = useState(false);

  /** === Fetch data detail & anggota === */
  const fetchKelompok = async () => {
    try {
      const docRef = doc(db, "kelompok_tani", id);
      const kelompokSnap = await getDoc(docRef);

      if (kelompokSnap.exists()) {
        const data = { id: kelompokSnap.id, ...kelompokSnap.data() };
        setKelompok(data);

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

  useEffect(() => {
    fetchKelompok();
  }, [id]);

  /** === ACTION === */
  const updateSummary = async (data) => {
      const jumlah = data.length;
      const totalLahan = data.reduce((sum, a) => sum + (a.luas ? Number(a.luas) : 0), 0);

      await updateDoc(doc(db, "kelompok_tani", id), {
        jumlah_anggota: jumlah,
        total_lahan: totalLahan,
      });

      setKelompok((prev) => ({
        ...prev,
        jumlah_anggota: jumlah,
        total_lahan: totalLahan,
      }));
    };
    
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
        updateSummary(updated);
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
        const anggotaRef = doc(db, "kelompok_tani", id, "anggota", editData.id);
        await updateDoc(anggotaRef, data);

        const updated = anggota.map((a) =>
          a.id === editData.id ? { ...a, ...data } : a
        );
        setAnggota(updated);
        updateSummary(updated);

        toast.success("Data anggota berhasil diperbarui");
      } else {
        const anggotaRef = collection(db, "kelompok_tani", id, "anggota");
        const newDoc = await addDoc(anggotaRef, {
          jabatan: data.jabatan || "Anggota",
          ...data,
        });

        const updated = [...anggota, { id: newDoc.id, ...data }];
        setAnggota(updated);
        updateSummary(updated);

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

  /** === EXPORT EXCEL === */
  const handleExportExcel = () => {
    if (!kelompok) return toast.warn("Data kelompok belum siap");
    if (!anggota.length) return toast.warn("Tidak ada data anggota untuk diexport");

    // Buat order jabatan
    const jabatanOrder = { Ketua: 1, Sekretaris: 2, Bendahara: 3, Anggota: 4 };

    // Urutkan anggota dulu (jabatan → nama)
    const anggotaSorted = [...anggota].sort((a, b) => {
      const rankA = jabatanOrder[a.jabatan || "Anggota"];
      const rankB = jabatanOrder[b.jabatan || "Anggota"];

      if (rankA !== rankB) return rankA - rankB;
      return (a.nama || "").localeCompare(b.nama || "");
    });

    const rows = [
      [],
      ["", "Nama Kelompok Tani", kelompok.nama_kelompok],
      ["", "Kategori", kelompok.kategori || "Kelompok Tani"],
      ["", "ID Kelompok Tani", kelompok.id],
      ["", "Provinsi", kelompok.provinsi],
      ["", "Kabupaten", kelompok.kabupaten],
      ["", "Kecamatan", kelompok.kecamatan],
      ["", "Jumlah Anggota", `${kelompok.jumlah_anggota || 0}`],
      ["", "Total Lahan", `${kelompok.total_lahan || 0} Ha`],
      [],
      ["No", "Nama", "NIK", "No HP", "Jabatan", "Luas (Ha)", "Keterangan"],
    ];

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

    rows.push([]);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Atur lebar kolom
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
    XLSX.writeFile(wb, `Kelompok_${kelompok.nama_kelompok}.xlsx`);
  };

  /** === COLUMNS MRT (dengan sorting prioritas jabatan) === */
  const jabatanOrder = {
    Ketua: 1,
    Sekretaris: 2,
    Bendahara: 3,
    Anggota: 4,
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "nama",header: "Nama" },
      { accessorKey: "nik", header: "NIK" },
      { accessorKey: "no_hp", header: "No HP" },      
      {
        accessorKey: "jabatan",
        header: "Jabatan",
        sortingFn: (rowA, rowB) => {
          const jabA = rowA.getValue("jabatan") || "Anggota";
          const jabB = rowB.getValue("jabatan") || "Anggota";
          if (jabatanOrder[jabA] !== jabatanOrder[jabB]) {
            return jabatanOrder[jabA] - jabatanOrder[jabB];
          }
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
                className={`px-2 py-1 rounded-md text-xs font-semibold ${
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
        accessorKey: "luas",
        header: "Luas (Ha)",
        Cell: ({ cell }) => cell.getValue() || 0,
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

  const handleEditKelompok = async (formData) => {
    try {
      const docRef = doc(db, "kelompok_tani", kelompok.id);
      await setDoc(docRef, {
        nama_kelompok: formData.nama_kelompok,
        kategori: formData.kategori,
        provinsi: formData.provinsi,
        kabupaten: formData.kabupaten,
        kecamatan: formData.kecamatan,
      }, { merge: true });

      await Swal.fire("Sukses", "Data kelompok berhasil diperbarui", "success");
      fetchKelompok();
      setShowKelompokModal(false);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Gagal memperbarui data kelompok", "error");
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-full mx-auto p-6">
      {/* Tombol kembali */}
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
      <div className="relative bg-white p-4 rounded-xl shadow-md mb-5 text-base">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-2xl font-bold">{kelompok?.nama_kelompok}</h1>
          <IconButton
            onClick={() => setShowKelompokModal(true)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit fontSize="medium" />
          </IconButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-gray-700">
          <p className="col-start-1 row-start-1">Kategori: <strong>{kelompok?.kategori || "Kelompok Tani"}</strong></p>
          <p className="col-start-1 row-start-2">ID Kelompok: <strong>{kelompok.id}</strong></p>
          <p className="col-start-1 row-start-3">Provinsi: <strong>{kelompok.provinsi}</strong></p>
          <p className="col-start-1 row-start-4">Kabupaten: <strong>{kelompok.kabupaten}</strong></p>
          <p>Kecamatan: <strong>{kelompok.kecamatan}</strong></p>
          <p>Jumlah Anggota: <strong>{kelompok.jumlah_anggota || 0}</strong></p>
          <p>Total Lahan: <strong>{(kelompok.total_lahan || 0).toFixed(2)} Ha</strong></p>
        </div>
      </div>


      {/* Tombol export & tambah anggota */}
      <div className="flex justify-end mb-2 gap-2">
        <button
          onClick={handleExportExcel}
          className="ml-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export Excel
        </button>

        <button
          onClick={handleTambah}
          className="bg-lime-700 text-white px-4 py-2 rounded-md hover:bg-lime-800"
        >
          <PersonAddAlt1Icon fontSize="small" className="mb-1 mr-1.5"/>
          Tambah Anggota
        </button>
      </div>

      {/* Tabel anggota */}
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
          muiTablePaperProps={{
            elevation: 2,
            sx: {
              marginTop: 1.5,
              borderRadius: "0.75rem", 
              overflow: "hidden",     
              border: "1px solid #e5e7eb",
            },
          }}
          muiTableContainerProps={{
            sx: {
              border: "none",
            },
          }}
          muiTableHeadCellProps={{
            align: "center",
            sx: {
              fontWeight: "bold",
              backgroundColor: "#f3f4f6", 
              color: "#374151",           
            },
          }}
          muiTableBodyCellProps={{
            align: "center",
            sx: { whiteSpace: "nowrap" },
          }}
          muiTableBodyRowProps={{
            sx: {
              "&:hover": {
                backgroundColor: "#f3f4f6",
              },
            },
          }}
        />
      )}

      <AnggotaFormModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmitModal}
        initialData={editData}
      />

      <KelompokFormModal
        visible={showKelompokModal}
        onClose={() => setShowKelompokModal(false)}
        onSubmit={handleEditKelompok}
        initialData={kelompok}
        defaultRegion={{
          provinsi: kelompok.provinsi,
          kabupaten: kelompok.kabupaten,
          kecamatan: kelompok.kecamatan,
        }}
      />
    </div>
  );
};

export default Detail;
