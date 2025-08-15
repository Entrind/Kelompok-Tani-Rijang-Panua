/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc, collection, getDocs, updateDoc, deleteDoc, addDoc, setDoc } from "firebase/firestore";

import { MaterialReactTable } from "material-react-table";
import { Box, IconButton } from "@mui/material";
import { Edit, Delete, GroupAdd, Article } from "@mui/icons-material";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import { ArrowLeft } from 'lucide-react';

import Swal from "sweetalert2";
import { toast } from "react-toastify";
import AnggotaFormModal from "../../components/forms/AnggotaFormModal";
import KelompokFormModal from "../../components/forms/KelompokFormModal";
import TambahKelompokGapoktanModal from "../../components/forms/TambahKelompokGapoktanModal";
import PengurusGapoktanFormModal from "../../components/forms/PengurusGapoktanFormModal";

import { renameKelompokDoc } from "../../utils/firestoreRename";

import * as XLSX from "xlsx";

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [kelompok, setKelompok] = useState(null);
  const [anggota, setAnggota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);

  // Modal tambah/edit (anggota & edit kelompok)
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showKelompokModal, setShowKelompokModal] = useState(false);

  // Gapoktan mode
  const [isGapoktan, setIsGapoktan] = useState(false);
  const [pengurus, setPengurus] = useState([]); // subkoleksi 'pengurus'
  const [kelompokAnggota, setKelompokAnggota] = useState([]); // subkoleksi 'kelompok_anggota' (diperkaya)
  const [totalLahanGabungan, setTotalLahanGabungan] = useState(0);

  // modal states (gapoktan)
  const [showTambahKelompok, setShowTambahKelompok] = useState(false);
  const [showPengurusModal, setShowPengurusModal] = useState(false);
  const [editPengurus, setEditPengurus] = useState(null);

  /** Helper Badge Jabatan (Ketua/Sekretaris/Bendahara/Anggota) */
  const jabatanOrder = {
    Ketua: 1,
    Sekretaris: 2,
    Bendahara: 3,
    Anggota: 4,
  };
  const badgeJabatanColors = {
    Ketua: "bg-green-600 text-white",
    Sekretaris: "bg-blue-600 text-white",
    Bendahara: "bg-yellow-600 text-white",
    Anggota: "bg-gray-400 text-white",
  };

  const renderJabatanChip = (value) => {
    const v = value || "Anggota";
    const color = badgeJabatanColors[v] || "bg-gray-300 text-gray-800";
    return (
      <div className="flex justify-center">
        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${color}`}>
          {v}
        </span>
      </div>
    );
  };

  /** Badge Kategori seperti di Admin.jsx */
  const kategoriColorMap = {
    Gapoktan: "bg-lime-900 text-lime-100",
    "Kelompok Tani": "bg-green-800 text-green-100",
    "Kelompok Kebun": "bg-amber-800 text-amber-100",
    KWT: "bg-pink-800 text-pink-100",
  };

  const renderBadgeKategori = (value) => {
    const label = value || "Kelompok Tani";
    const color = kategoriColorMap[label] || "bg-gray-300 text-gray-800";
    return (
      <div className="flex justify-center">
        <span className={`px-2 py-1 text-sm font-medium rounded-md ${color}`}>
          {label}
        </span>
      </div>
    );
  };

  /** Badge Nama Pengurus (Ketua/Sekretaris/Bendahara) ala Admin.jsx */
  const renderBadgeNamaRole = (label, type) => {
    const baseMap = {
      Ketua: "bg-green-100 text-green-800",
      Sekretaris: "bg-blue-100 text-blue-800",
      Bendahara: "bg-yellow-100 text-yellow-800",
    };
    const colorClass = baseMap[type] || "bg-gray-300 text-gray-800";
    return (
      <span className={`px-2 py-1 text-sm font-medium rounded-md ${colorClass}`}>
        {label || "-"}
      </span>
    );
  };

  const columnOrderFixed = [
    'nama', 'nik', 'no_hp', 'jabatan', 'luas', 'ket', 'aksi'
  ];

 
  const fetchGapoktanData = useCallback(async () => {
    try {
      // Pengurus
      const pengRef = collection(db, "kelompok_tani", id, "pengurus");
      const pengSnap = await getDocs(pengRef);
      const pengData = pengSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPengurus(pengData);

      // Kelompok Anggota
      const kaRef = collection(db, "kelompok_tani", id, "kelompok_anggota");
      const kaSnap = await getDocs(kaRef);

      const enriched = await Promise.all(
        kaSnap.docs.map(async (d) => {
          const { kelompokId, nama_kelompok } = d.data();
          let detail = {
            kategori: "Kelompok Tani",
            ketua: "-",
            sekretaris: "-",
            bendahara: "-",
            jumlah_anggota: 0,
            total_lahan: 0,
          };

          if (kelompokId) {
            const kDoc = await getDoc(doc(db, "kelompok_tani", kelompokId));
            if (kDoc.exists()) {
              const kData = kDoc.data();
              detail = {
                kategori: kData.kategori || "Kelompok Tani",
                ketua: kData.ketua || "-",
                sekretaris: kData.sekretaris || "-",
                bendahara: kData.bendahara || "-",
                jumlah_anggota: kData.jumlah_anggota || 0,
                // pastikan numerik
                total_lahan: parseFloat(kData.total_lahan || 0) || 0,
              };
            }
          }

          return {
            id: d.id,
            kelompokId: kelompokId || null,
            nama_kelompok: nama_kelompok || "(Tanpa Nama)",
            ...detail,
          };
        })
      );

      // Urutkan A→Z
      enriched.sort((a, b) =>
        (a.nama_kelompok || "").localeCompare(b.nama_kelompok || "")
      );
      setKelompokAnggota(enriched);

      // === Hitung total lahan gabungan (seperti DetailPublik) ===
      const total = enriched.reduce(
        (sum, item) => sum + (parseFloat(item.total_lahan) || 0),
        0
      );
      setTotalLahanGabungan(total);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data gapoktan");
    }
  }, [id]);

  /** === Fetch data detail & anggota === */
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const docRef = doc(db, "kelompok_tani", id);
        const kelompokSnap = await getDoc(docRef);
        if (kelompokSnap.exists()) {
          const data = { id: kelompokSnap.id, ...kelompokSnap.data() };
          setKelompok(data);

          const isGap = (data.kategori || "") === "Gapoktan";
          setIsGapoktan(isGap);

          if (isGap) {
            await fetchGapoktanData();
          } else {
            const anggotaRef = collection(docRef, "anggota");
            const anggotaSnap = await getDocs(anggotaRef);
            setAnggota(anggotaSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setTotalLahanGabungan(0); // reset saat non-gapoktan
          }
        }
      } catch (err) {
        console.error("Gagal ambil detail:", err);
        toast.error("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, fetchGapoktanData]);

  /** === ACTION NON-GAPOKTAN === */
  const updateSummary = useCallback(
    async (data) => {
      const jumlah = data.length;
      const totalLahan = data.reduce(
        (sum, a) => sum + (a.luas ? Number(a.luas) : 0),
        0
      );

      const ketua = data.find((a) => a.jabatan === "Ketua")?.nama || "";
      const sekretaris = data.find((a) => a.jabatan === "Sekretaris")?.nama || "";
      const bendahara = data.find((a) => a.jabatan === "Bendahara")?.nama || "";

      await updateDoc(doc(db, "kelompok_tani", id), {
        jumlah_anggota: jumlah,
        total_lahan: totalLahan,
        ketua,
        sekretaris,
        bendahara,
      });

      setKelompok((prev) => ({
        ...prev,
        jumlah_anggota: jumlah,
        total_lahan: totalLahan,
        ketua,
        sekretaris,
        bendahara,
      }));
    },
    [id]
  );

  const handleDelete = useCallback(
    async (anggotaId) => {
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
    },
    [id, updateSummary]
  );

  const handleTambah = () => {
    setEditData(null);
    setShowModal(true);
  };

  const handleEdit = useCallback((data) => {
    setEditData(data);
    setShowModal(true);
  }, []);

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

  /** === EXPORT EXCEL (Non-Gapoktan) === */
  const handleExportExcel = () => {
    if (!kelompok) return toast.warn("Data kelompok belum siap");
    if (!anggota.length) return toast.warn("Tidak ada data anggota untuk diexport");

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
    XLSX.writeFile(wb, `Kelompok_${kelompok.nama_kelompok}.xlsx`);
  };

  /** === COLUMNS MRT: Anggota (Non-Gapoktan) === */
  const columns = useMemo(
    () => [
      { accessorKey: "nama", header: "Nama" },
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
        Cell: ({ cell }) => renderJabatanChip(cell.getValue()),
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
            <IconButton color="primary" onClick={() => handleEdit(row.original)}>
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
    [loadingAction, handleEdit, handleDelete]
  );

  /** === COLUMNS MRT: Pengurus (Gapoktan) — disamakan dengan Anggota === */
  const columnsPengurus = useMemo(
    () => [
      { accessorKey: "nama", header: "Nama" },
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
        Cell: ({ cell }) => renderJabatanChip(cell.getValue()),
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
              onClick={() => {
                setEditPengurus(row.original);
                setShowPengurusModal(true);
              }}
            >
              <Edit />
            </IconButton>
            <IconButton
              color="error"
              onClick={() => handleDeletePengurus(row.original.id)}
              disabled={loadingAction}
            >
              <Delete />
            </IconButton>
          </Box>
        ),
      },
    ],
    [id]
  );

  /** === COLUMNS MRT: Kelompok Anggota (Gapoktan) — disamakan dengan Admin.jsx === */
  const columnsKelompokAnggota = useMemo(
    () => [
      { accessorKey: "nama_kelompok", header: "Nama Kelompok" },
      {
        accessorKey: "kategori",
        header: "Kategori",
        Cell: ({ cell }) => renderBadgeKategori(cell.getValue()),
      },
      {
        accessorKey: "ketua",
        header: "Ketua",
        Cell: ({ cell }) => renderBadgeNamaRole(cell.getValue(), "Ketua"),
      },
      {
        accessorKey: "sekretaris",
        header: "Sekretaris",
        Cell: ({ cell }) => renderBadgeNamaRole(cell.getValue(), "Sekretaris"),
      },
      {
        accessorKey: "bendahara",
        header: "Bendahara",
        Cell: ({ cell }) => renderBadgeNamaRole(cell.getValue(), "Bendahara"),
      },
      {
        accessorKey: "jumlah_anggota",
        header: "Jumlah Anggota",
        Cell: ({ cell }) => cell.getValue() || 0,
      },
      {
        accessorKey: "total_lahan",
        header: "Total Lahan (Ha)",
        Cell: ({ cell }) => `${Number(cell.getValue() || 0).toFixed(2)} Ha`,
      },
      {
        header: "Aksi",
        enableSorting: false,
        Cell: ({ row }) => (
          <Box display="flex" gap={1} justifyContent="center">
            <IconButton
              color="primary"
              onClick={() => navigate(`/admin/detail/${row.original.kelompokId}`)}
              title="Lihat Detail Kelompok"
            >
              <Article />
            </IconButton>
            <IconButton
              color="error"
              onClick={() => handleDeleteKelompokAnggota(row.original.id)}
              disabled={loadingAction}
            >
              <Delete />
            </IconButton>
          </Box>
        ),
      },
    ],
    [id, navigate]
  );

  /** === Edit Data Kelompok (common) === */
  const handleEditKelompok = async (formData) => {
    try {
      const oldId = kelompok.id;
      const newId = (formData.id_kelompok || "").trim() || oldId;

      const dataToSave = {
        nama_kelompok: formData.nama_kelompok,
        kategori: formData.kategori,
        provinsi: formData.provinsi,
        kabupaten: formData.kabupaten,
        kecamatan: formData.kecamatan,
        ...(formData.ketua ? { ketua: formData.ketua } : {}),
        ...(formData.sekretaris ? { sekretaris: formData.sekretaris } : {}),
        ...(formData.bendahara ? { bendahara: formData.bendahara } : {}),
      };

      // ID tidak berubah → update biasa
      if (newId === oldId) {
        await setDoc(doc(db, "kelompok_tani", oldId), dataToSave, { merge: true });
        await Swal.fire("Sukses", "Data kelompok berhasil diperbarui", "success");

        setKelompok((prev) => ({ ...prev, ...dataToSave }));
        setShowKelompokModal(false);
        return;
      }

      // Konfirmasi rename ID
      const konf = await Swal.fire({
        title: "Ubah ID Kelompok?",
        html: `
          ID lama: <b>${oldId}</b><br/>
          ID baru: <b>${newId}</b><br/><br/>
          Proses ini akan menyalin data & subkoleksi, lalu menghapus dokumen lama.
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, ganti ID",
        cancelButtonText: "Batal",
      });
      if (!konf.isConfirmed) return;

      // Pastikan newId belum ada
      const newSnap = await getDoc(doc(db, "kelompok_tani", newId));
      if (newSnap.exists()) {
        await Swal.fire("Gagal", `ID "${newId}" sudah digunakan. Pilih ID lain.`, "error");
        return;
      }

      // Panggil util rename
      await renameKelompokDoc({
        db,
        oldId,
        newId,
        data: dataToSave,
        isGapoktan, // pakai state kamu yang sudah ada
        // subcollectionsOverride: ["anggota"], // opsional override
      });

      await Swal.fire("Sukses", "ID kelompok berhasil diubah.", "success");

      setShowKelompokModal(false);
      navigate(`/admin/detail/${newId}`, { replace: true });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Gagal memperbarui/merename kelompok", "error");
    }
  };

  /** === Submit Pengurus Gapoktan === */
  const handleSubmitPengurus = async (form) => {
    try {
      if (editPengurus) {
        await updateDoc(doc(db, "kelompok_tani", id, "pengurus", editPengurus.id), form);
        setPengurus((prev) =>
          prev.map((p) => (p.id === editPengurus.id ? { ...p, ...form } : p))
        );
        toast.success("Pengurus diperbarui");
      } else {
        await addDoc(collection(db, "kelompok_tani", id, "pengurus"), form);
        await fetchGapoktanData(); // refresh
        toast.success("Pengurus ditambahkan");
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal menyimpan pengurus");
    } finally {
      setEditPengurus(null);
      setShowPengurusModal(false);
    }
  };

  // === DELETE: Pengurus Gapoktan ===
  const handleDeletePengurus = useCallback(
    async (pengurusId) => {
      const result = await Swal.fire({
        title: "Hapus Pengurus?",
        text: "Data pengurus ini akan dihapus permanen.",
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
        await deleteDoc(doc(db, "kelompok_tani", id, "pengurus", pengurusId));
        setPengurus((prev) => prev.filter((p) => p.id !== pengurusId));
        toast.success("Pengurus berhasil dihapus");
      } catch (error) {
        console.error(error);
        toast.error("Gagal menghapus pengurus");
      } finally {
        setLoadingAction(false);
      }
    },
    [id]
  );

  // === DELETE: Kelompok Anggota (Gapoktan) ===
  const handleDeleteKelompokAnggota = useCallback(
    async (kaId) => {
      const result = await Swal.fire({
        title: "Buang Kelompok dari Gapoktan?",
        text: "Kelompok ini akan dihapus dari daftar anggota gapoktan.",
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
        await deleteDoc(doc(db, "kelompok_tani", id, "kelompok_anggota", kaId));
        setKelompokAnggota((prev) => prev.filter((k) => k.id !== kaId));
        toast.success("Kelompok anggota dibuang dari gapoktan");
      } catch (error) {
        console.error(error);
        toast.error("Gagal menghapus");
      } finally {
        setLoadingAction(false);
      }
    },
    [id]
  );


  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-full mx-auto p-6">
      {/* Tombol kembali */}
      <div className="mb-4">
        <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
            >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">Kembali</span>
        </button>
      </div>

      {/* Info kelompok */}
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
          <p className="col-start-1 row-start-1">
            Kategori: <strong>{kelompok?.kategori || "Kelompok Tani"}</strong>
          </p>
          <p className="col-start-1 row-start-2">
            ID Kelompok: <strong>{kelompok.id}</strong>
          </p>
          <p className="col-start-1 row-start-3">
            Provinsi: <strong>{kelompok.provinsi}</strong>
          </p>
          <p className="col-start-1 row-start-4">
            Kabupaten: <strong>{kelompok.kabupaten}</strong>
          </p>
          <p>Kecamatan: <strong>{kelompok.kecamatan}</strong></p>

          {isGapoktan ? (
            <>
              <p>
                Jumlah Kelompok: <strong>{kelompokAnggota.length}</strong>
              </p>
              <p>
                Total Lahan (gabungan):{" "}
                <strong>{Number(totalLahanGabungan || 0).toFixed(2)} Ha</strong>
              </p>
            </>
          ) : (
            <>
              <p>
                Jumlah Anggota: <strong>{kelompok?.jumlah_anggota || 0}</strong>
              </p>
              <p>
                Total Lahan:{" "}
                <strong>
                  {Number(kelompok?.total_lahan || 0).toFixed(2)} Ha
                </strong>
              </p>
            </>
          )}
        </div>
      </div>

      {/* MODE GAPOKTAN */}
      {isGapoktan ? (
        <>
          {/* Section: Pengurus */}
          <div className="bg-white p-4 rounded-xl shadow mb-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold">Pengurus Gapoktan</h2>
              <button
                onClick={() => {
                  setEditPengurus(null);
                  setShowPengurusModal(true);
                }}
                className="px-3 py-2 bg-lime-700 text-white rounded hover:bg-lime-800"
              >
                <PersonAddAlt1Icon fontSize="small" className="mb-1 mr-1.5" />
                Tambah Pengurus
              </button>
            </div>
            <MaterialReactTable
              columns={columnsPengurus}
              data={pengurus}
              getRowId={(row) => row.id}
              enableColumnActions={false}
              enableColumnFilters={false}
              initialState={{
                columnOrder: columnOrderFixed,
                sorting: [{ id: "jabatan", desc: false }],
                pagination: { pageIndex: 0, pageSize: 10 },
              }}
              muiTablePaperProps={{
                elevation: 2,
                sx: {
                  borderRadius: "0.75rem",
                  overflow: "hidden",
                  border: "1px solid #e5e7eb",
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
                  "&:hover": { backgroundColor: "#f3f4f6" },
                },
              }}
            />
          </div>

          {/* Section: Kelompok Anggota */}
          <div className="bg-white p-4 rounded-xl shadow">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold">Kelompok Anggota Gapoktan</h2>
              <button
                onClick={() => setShowTambahKelompok(true)}
                className="px-3 py-2 bg-lime-700 text-white rounded hover:bg-lime-800"
              >
                <GroupAdd fontSize="small" className="mb-1 mr-1.5" />
                Tambah Kelompok Anggota
              </button>
            </div>
            <MaterialReactTable
              columns={columnsKelompokAnggota}
              data={kelompokAnggota}
              getRowId={(row) => row.id}
              enableColumnActions={false}
              enableColumnFilters={false}
              initialState={{ pagination: { pageIndex: 0, pageSize: 10 } }}
              muiTablePaperProps={{
                elevation: 2,
                sx: {
                  borderRadius: "0.75rem",
                  overflow: "hidden",
                  border: "1px solid #e5e7eb",
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
                  "&:hover": { backgroundColor: "#f3f4f6" },
                },
              }}
            />
          </div>

          {/* Modals Gapoktan */}
          <TambahKelompokGapoktanModal
            visible={showTambahKelompok}
            gapoktanId={id}
            existingKelompokIds={kelompokAnggota.map((k) => k.kelompokId)}
            onClose={() => setShowTambahKelompok(false)}
            onAdded={fetchGapoktanData}
          />
          <PengurusGapoktanFormModal
            visible={showPengurusModal}
            onClose={() => {
              setShowPengurusModal(false);
              setEditPengurus(null);
            }}
            onSubmit={handleSubmitPengurus}
            initialData={editPengurus}
            existingJabatan={pengurus.map((p) => p.jabatan)}
          />
        </>
      ) : (
        <>
          {/* Tombol export & tambah anggota */}
          <div className="flex justify-end mb-2 gap-2">
            <button
              onClick={handleExportExcel}
              className="ml-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
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
              Export Excel
            </button>

            <button
              onClick={handleTambah}
              className="bg-lime-700 text-white px-4 py-2 rounded-md hover:bg-lime-800"
            >
              <PersonAddAlt1Icon fontSize="small" className="mb-1 mr-1.5" />
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
              initialState={{
                columnOrder: columnOrderFixed,
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
              muiTableContainerProps={{ sx: { border: "none" } }}
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
                sx: { "&:hover": { backgroundColor: "#f3f4f6" } },
              }}
            />
          )}

          {/* Modals Non-Gapoktan */}
          <AnggotaFormModal
            visible={showModal}
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmitModal}
            initialData={editData}
            existingJabatan={anggota.map((a) => a.jabatan)}
          />
        </>
      )}

      {/* Modal Edit Kelompok (common) */}
      <KelompokFormModal
        visible={showKelompokModal}
        onClose={() => setShowKelompokModal(false)}
        onSubmit={handleEditKelompok}
        initialData={kelompok}
        defaultRegion={{
          provinsi: kelompok?.provinsi,
          kabupaten: kelompok?.kabupaten,
          kecamatan: kelompok?.kecamatan,
        }}
      />
    </div>
  );
};

export default Detail;
