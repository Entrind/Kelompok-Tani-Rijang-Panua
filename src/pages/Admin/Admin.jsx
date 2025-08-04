/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { doc, setDoc, collection, getDocs, deleteDoc, addDoc, getDoc, writeBatch } from "firebase/firestore";

import { MaterialReactTable } from "material-react-table";
import { Box, IconButton } from "@mui/material";
import { GroupAdd, Article, Edit, Delete } from "@mui/icons-material";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import KelompokFormModal from "../../components/forms/KelompokFormModal";

import JSZip from "jszip";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

const Admin = () => {
  const [kelompok, setKelompok] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rowSelection, setRowSelection] = useState({});
  const [modeSelect, setModeSelect] = useState(false);
  const navigate = useNavigate();

  const [showKelompokModal, setShowKelompokModal] = useState(false);
  const [editKelompokData, setEditKelompokData] = useState(null);
  const [jumlahKelompok, setJumlahKelompok] = useState(0);
  const [totalAnggota, setTotalAnggota] = useState(0);
  const [, setTotalLahan] = useState(0);
  const [totalLahanFormatted, setTotalLahanFormatted] = useState("0.00 Ha");

  /** === FETCH DATA KELOMPOK === */
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
          const sekretaris = anggota.find((a) => a.jabatan === "Sekretaris")?.nama || "-";
          const bendahara = anggota.find((a) => a.jabatan === "Bendahara")?.nama || "-";

          return { ...dataKelompok, ketua, sekretaris, bendahara };
        })
      );

      setKelompok(data);
    } catch {
      toast.error("Gagal memuat data kelompok");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistik = async () => {
    try {
      const kelompokSnap = await getDocs(collection(db, "kelompok_tani"));
      setJumlahKelompok(kelompokSnap.size);

      let totalAnggotaCount = 0;
      let totalLuas = 0;

      for (const docKelompok of kelompokSnap.docs) {
        const anggotaSnap = await getDocs(collection(docKelompok.ref, "anggota"));
        totalAnggotaCount += anggotaSnap.size;

        anggotaSnap.forEach((docAnggota) => {
          const data = docAnggota.data();
          const luas = parseFloat(data.luas || 0);
          totalLuas += luas;
        });
      }

      setTotalAnggota(totalAnggotaCount);
      setTotalLahan(totalLuas);
      setTotalLahanFormatted(totalLuas.toFixed(2) + " Ha");
    } catch (err) {
      console.error("Gagal ambil statistik:", err);
    }
  };

  useEffect(() => {
    fetchKelompok();
    fetchStatistik();
  }, []);

  /** === HANDLE DELETE === */
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Hapus Kelompok?",
      text: "Seluruh data anggota juga akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      // 1. Hapus semua dokumen dalam subcollection "anggota"
      const anggotaRef = collection(db, "kelompok_tani", id, "anggota");
      const anggotaSnap = await getDocs(anggotaRef);

      const batch = writeBatch(db);
      anggotaSnap.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      // 2. Hapus dokumen kelompoknya
      await deleteDoc(doc(db, "kelompok_tani", id));

      // 3. Update UI
      setKelompok((prev) => prev.filter((k) => k.id !== id));
      toast.success("Kelompok dan data anggotanya berhasil dihapus");
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus data kelompok");
    }
  };

  /** === HANDLE TAMBAH KELOMPOK === */
  const handleSubmitKelompok = async (formData) => {
    try {
      // Validasi kolom wajib
      if (!formData.nama_kelompok || !formData.kategori || !formData.provinsi || !formData.kabupaten || !formData.kecamatan) {
        await Swal.fire("Gagal", "Kolom wajib harus diisi!", "warning");
        return;
      }

      let docRef;

      // MODE: EDIT
      if (editKelompokData?.id) {
        docRef = doc(db, "kelompok_tani", editKelompokData.id);
        await setDoc(docRef, {
          nama_kelompok: formData.nama_kelompok,
          kategori: formData.kategori,
          provinsi: formData.provinsi,
          kabupaten: formData.kabupaten,
          kecamatan: formData.kecamatan,
        }, { merge: true });

        await Swal.fire("Sukses", "Data kelompok berhasil diperbarui", "success");
      } 
      // MODE: TAMBAH BARU
      else {
        if (formData.id_kelompok) {
          const checkDoc = await getDoc(doc(db, "kelompok_tani", formData.id_kelompok));
          if (checkDoc.exists()) {
            await Swal.fire("Gagal", `ID Kelompok "${formData.id_kelompok}" sudah ada!`, "error");
            return;
          }
          docRef = doc(db, "kelompok_tani", formData.id_kelompok);
          await setDoc(docRef, {
            nama_kelompok: formData.nama_kelompok,
            kategori: formData.kategori,
            provinsi: formData.provinsi,
            kabupaten: formData.kabupaten,
            kecamatan: formData.kecamatan,
            jumlah_anggota: 0,
            total_lahan: 0,
          });
        } else {
          docRef = await addDoc(collection(db, "kelompok_tani"), {
            nama_kelompok: formData.nama_kelompok,
            kategori: formData.kategori,
            provinsi: formData.provinsi,
            kabupaten: formData.kabupaten,
            kecamatan: formData.kecamatan,
            jumlah_anggota: 0,
            total_lahan: 0,
          });
        }
    
      // Tambahkan ketua/sekretaris/bendahara jika ada
      const anggotaColl = collection(docRef, "anggota");
      let anggotaCount = 0;

      if (formData.ketua) {
        await addDoc(anggotaColl, { nama: formData.ketua, jabatan: "Ketua" });
        anggotaCount++;
      }
      if (formData.sekretaris) {
        await addDoc(anggotaColl, { nama: formData.sekretaris, jabatan: "Sekretaris" });
        anggotaCount++;
      }
      if (formData.bendahara) {
        await addDoc(anggotaColl, { nama: formData.bendahara, jabatan: "Bendahara" });
        anggotaCount++;
      }

      // Update jumlah anggota di dokumen kelompok
      if (anggotaCount > 0) {
        await setDoc(docRef, { jumlah_anggota: anggotaCount }, { merge: true });
      }

      await Swal.fire("Sukses", "Kelompok berhasil ditambahkan!", "success");
      }

      setShowKelompokModal(false);
      setEditKelompokData(null); 
      fetchKelompok(); // Refresh tabel
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Terjadi kesalahan saat menambah kelompok", "error");
    }
  };

  /** === EXPORT ZIP EXCEL === */
  const exportKelompokToZip = async (dataKelompok) => {
    if (!dataKelompok || dataKelompok.length === 0) {
      toast.warn("Tidak ada data yang dipilih untuk diexport!");
      return;
    }

    const zip = new JSZip();

    // Urutkan abjad A → Z
    const dataSorted = [...dataKelompok].sort((a, b) =>
      a.nama_kelompok.localeCompare(b.nama_kelompok)
    );

    for (const kelompok of dataSorted) {
      const anggotaSnap = await getDocs(collection(db, "kelompok_tani", kelompok.id, "anggota"));
      const anggota = anggotaSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Urutkan anggota (jabatan → nama)
      const jabatanOrder = { Ketua: 1, Sekretaris: 2, Bendahara: 3, Anggota: 4 };
      const anggotaSorted = [...anggota].sort((a, b) => {
        const rankA = jabatanOrder[a.jabatan || "Anggota"];
        const rankB = jabatanOrder[b.jabatan || "Anggota"];
        if (rankA !== rankB) return rankA - rankB;
        return (a.nama || "").localeCompare(b.nama || "");
      });

      // Rows excel
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
      rows.push(["No", "Nama", "NIK", "No HP", "Jabatan", "Luas (Ha)", "Keterangan"]);

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

  /** === EXPORT TERPILIH === */
  const handleExportSelected = async () => {
    const selected = kelompok.filter((k) => rowSelection[k.id]);
    await exportKelompokToZip(selected);
    setRowSelection({});
    setModeSelect(false);
  };

  /** === BADGE JABATAN === */
  const renderBadge = (label, type) => {
    let colorClass = "bg-gray-300 text-gray-800";
    if (type === "Ketua") colorClass = "bg-green-100 text-green-800";
    if (type === "Sekretaris") colorClass = "bg-blue-100 text-blue-800";
    if (type === "Bendahara") colorClass = "bg-yellow-100 text-yellow-800";

    return <span className={`px-2 py-1 text-sm font-medium rounded-md ${colorClass}`}>{label}</span>;
  };

  const kategoriOrder = {
    "Gapoktan": 1,
    "Kelompok Tani": 2,
    "Kelompok Kebun": 3,
    "KWT": 4,
  };

  /** === COLUMNS MRT === */
  const columns = useMemo(
    () => [
      { accessorKey: "nama_kelompok", header: "Nama Kelompok" },
      {
        accessorKey: "kategori",
        header: "Kategori",
        sortingFn: (rowA, rowB) => {
          const katA = rowA.getValue("kategori") || "Kelompok Tani";
          const katB = rowB.getValue("kategori") || "Kelompok Tani";
          const rankA = kategoriOrder[katA] || 99;
          const rankB = kategoriOrder[katB] || 99;

          if (rankA !== rankB) {
            return rankA - rankB;
          }

          // Jika kategori sama, urutkan berdasarkan nama_kelompok
          const namaA = rowA.original.nama_kelompok?.toLowerCase() || "";
          const namaB = rowB.original.nama_kelompok?.toLowerCase() || "";
          return namaA.localeCompare(namaB);
        },
        Cell: ({ cell }) => {
          const value = cell.getValue() || "Kelompok Tani";
          const colorMap = {
            "Gapoktan": "bg-lime-900 text-lime-100",
            "Kelompok Tani": "bg-green-800 text-green-100",
            "Kelompok Kebun": "bg-amber-800 text-amber-100",
            "KWT": "bg-pink-800 text-pink-100",
          };
          return (
            <div className="flex justify-center">
              <span className={`px-2 py-1 text-sm font-medium rounded-md ${colorMap[value]}`}>
                {value}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "ketua",
        header: "Ketua",
        Cell: ({ cell }) => (cell.getValue() !== "-" ? renderBadge(cell.getValue(), "Ketua") : "-"),
      },
      {
        accessorKey: "sekretaris",
        header: "Sekretaris",
        Cell: ({ cell }) =>
          cell.getValue() !== "-" ? renderBadge(cell.getValue(), "Sekretaris") : "-",
      },
      {
        accessorKey: "bendahara",
        header: "Bendahara",
        Cell: ({ cell }) =>
          cell.getValue() !== "-" ? renderBadge(cell.getValue(), "Bendahara") : "-",
      },
      {
        accessorKey: "jumlah_anggota",
        header: "Jumlah Anggota",
        Cell: ({ cell }) => cell.getValue() || 0,
      },
      {
        accessorKey: "total_lahan",
        header: "Total Lahan (Ha)",
        Cell: ({ cell }) => (cell.getValue() || 0).toFixed(2) + " Ha",
      },
      {
        header: "Aksi",
        enableSorting: false,
        Cell: ({ row }) => (
          <Box display="flex" gap={1} justifyContent="center">
            <IconButton
              color="success"
              onClick={() => navigate(`/admin/detail/${row.original.id}`)}
            >
              <Article />
            </IconButton>
            <IconButton
              color="primary"
              onClick={() => {
                setEditKelompokData(row.original);
                setShowKelompokModal(true);
              }}
            >
              <Edit />
            </IconButton>
            <IconButton color="error" onClick={() => handleDelete(row.original.id)}>
              <Delete />
            </IconButton>
          </Box>
        ),
      },
    ],
    []
  );

  const StatCard = ({ title, value }) => (
    <div className="bg-white p-4 shadow rounded-lg text-center">
      <h3 className="text-gray-600 text-sm">{title}</h3>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
  );

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-full bg-slate-100 mx-auto p-6">
      {/* Judul */}
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Jumlah Kelompok" value={jumlahKelompok} />
        <StatCard title="Total Anggota" value={totalAnggota} />
        <StatCard title="Total Lahan" value={totalLahanFormatted} />
      </div>

      {/* Tombol Aksi */}
      <div className="flex justify-end mb-2 gap-2">
        {!modeSelect ? (
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
                await exportKelompokToZip(kelompok);
              } else if (result.dismiss === Swal.DismissReason.cancel) {
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

        <button
          onClick={() => {
            setEditKelompokData(null);
            setShowKelompokModal(true);
          }}
          className="bg-lime-700 text-white px-4 py-2 rounded-md hover:bg-lime-800"
        >
          <GroupAdd fontSize="small" className="mb-1 mr-1.5"/>
          Tambah Kelompok
        </button>
      </div>

      {/* Tabel */}
      <MaterialReactTable
        columns={columns}
        data={kelompok}
        getRowId={(row) => row.id}
        enableRowSelection={modeSelect}
        state={{ rowSelection }}
        onRowSelectionChange={setRowSelection}
        enableColumnActions={false}
        enableColumnFilters={true}
        initialState={{
          sorting: [{ id: "kategori", desc: false }],
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

      {/* Modal Tambah Kelompok */}
      <KelompokFormModal
        visible={showKelompokModal}
        onClose={() => setShowKelompokModal(false)}
        onSubmit={handleSubmitKelompok}
        initialData={editKelompokData}
        defaultRegion={{
          provinsi: kelompok[0]?.provinsi || "Sulawesi Selatan",
          kabupaten: kelompok[0]?.kabupaten || "Sidenreng Rappang",
          kecamatan: kelompok[0]?.kecamatan || "Kulo",
        }}
      />
    </div>
  );
};

export default Admin;
