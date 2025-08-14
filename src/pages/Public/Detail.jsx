/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

import { MaterialReactTable } from "material-react-table";
import { ArrowBack } from "@mui/icons-material";
import { toast } from "react-toastify";

const DetailPublik = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [kelompok, setKelompok] = useState(null);
  const [loading, setLoading] = useState(true);

  // Non-gapoktan data
  const [anggota, setAnggota] = useState([]);

  // Gapoktan mode
  const [isGapoktan, setIsGapoktan] = useState(false);
  const [pengurus, setPengurus] = useState([]);
  const [kelompokAnggota, setKelompokAnggota] = useState([]);
  const [totalLahanGabungan, setTotalLahanGabungan] = useState(0);

  // === Fetch Detail ===
  const fetchGapoktanData = async () => {
    try {
      // 1) Pengurus gapoktan
      const pengRef = collection(db, "kelompok_tani", id, "pengurus");
      const pengSnap = await getDocs(pengRef);
      setPengurus(pengSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // 2) Kelompok anggota gapoktan
      const kaRef = collection(db, "kelompok_tani", id, "kelompok_anggota");
      const kaSnap = await getDocs(kaRef);

      // Join dengan dokumen kelompok_tani asli
      const joined = await Promise.all(
        kaSnap.docs.map(async (d) => {
          const data = d.data();
          const kId = data.kelompokId;
          if (!kId) {
            return { id: d.id, kelompokId: "", nama_kelompok: "(Tidak ditemukan)" };
          }
          const kDoc = await getDoc(doc(db, "kelompok_tani", kId));
          if (!kDoc.exists()) {
            return { id: d.id, kelompokId: kId, nama_kelompok: "(Tidak ditemukan)" };
          }
          const kd = kDoc.data();
          return {
            id: d.id,             // id dokumen di subkoleksi kelompok_anggota
            kelompokId: kId,      // referensi id kelompok
            nama_kelompok: kd.nama_kelompok || "(Tanpa Nama)",
            kategori: kd.kategori || "Kelompok Tani",
            ketua: kd.ketua || "-",
            sekretaris: kd.sekretaris || "-",
            bendahara: kd.bendahara || "-",
            jumlah_anggota: kd.jumlah_anggota || 0,
            total_lahan: parseFloat(kd.total_lahan || 0) || 0,
          };
        })
      );

      setKelompokAnggota(joined);

      // Hitung total lahan gabungan
      const totalLahan = joined.reduce((sum, k) => sum + (parseFloat(k.total_lahan) || 0), 0);
      setTotalLahanGabungan(totalLahan);

    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data gapoktan");
    }
  };

  const fetchNonGapoktanData = async (docRef) => {
    // Ambil subkoleksi anggota
    const anggotaRef = collection(docRef, "anggota");
    const anggotaSnap = await getDocs(anggotaRef);
    const hasil = anggotaSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setAnggota(hasil);
  };

  const fetchDetail = async () => {
    try {
      const docRef = doc(db, "kelompok_tani", id);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        toast.error("Kelompok tidak ditemukan");
        setLoading(false);
        return;
      }

      const data = { id: snap.id, ...snap.data() };
      setKelompok(data);

      const gap = (data.kategori || "") === "Gapoktan";
      setIsGapoktan(gap);

      if (gap) {
        await fetchGapoktanData();
      } else {
        await fetchNonGapoktanData(docRef);
      }
    } catch (err) {
      console.error("Gagal ambil detail:", err);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // === Columns definitions ===

  // Urutan jabatan (badge)
  const jabatanOrder = {
    Ketua: 1,
    Sekretaris: 2,
    Bendahara: 3,
    Anggota: 4,
  };

  // Tabel anggota (Non-Gapoktan)
  const columnsAnggota = useMemo(
    () => [
      { id: "nama", accessorKey: "nama", header: "Nama" },
      {
        id: "jabatan",
        accessorKey: "jabatan",
        header: "Jabatan",
        sortingFn: (rowA, rowB) => {
          const ja = rowA.getValue("jabatan") || "Anggota";
          const jb = rowB.getValue("jabatan") || "Anggota";
          if (jabatanOrder[ja] !== jabatanOrder[jb]) {
            return jabatanOrder[ja] - jabatanOrder[jb];
          }
          return (rowA.getValue("nama") || "").localeCompare(rowB.getValue("nama") || "");
        },
        Cell: ({ cell }) => {
          const val = cell.getValue() || "Anggota";
          const colors = {
            Ketua: "bg-green-600 text-white",
            Sekretaris: "bg-blue-600 text-white",
            Bendahara: "bg-yellow-600 text-white",
            Anggota: "bg-gray-400 text-white",
          };
          return (
            <span className={`px-2 py-1 rounded-md text-xs font-semibold ${colors[val] || "bg-gray-300 text-gray-800"}`}>
              {val}
            </span>
          );
        },
      },
      {
        id: "luas",
        accessorKey: "luas",
        header: "Luas (Ha)",
        Cell: ({ cell }) => cell.getValue() || 0,
      },
      {
        id: "ket",
        accessorKey: "ket",
        header: "Keterangan",
        Cell: ({ cell }) => cell.getValue() || "-",
      },
    ],
    []
  );

  // Tabel Pengurus Gapoktan (struktur seperti anggota)
  const columnsPengurus = useMemo(
    () => [
      { id: "nama", accessorKey: "nama", header: "Nama" },
      {
        id: "jabatan",
        accessorKey: "jabatan",
        header: "Jabatan",
        sortingFn: (rowA, rowB) => {
          const ja = rowA.getValue("jabatan") || "Anggota";
          const jb = rowB.getValue("jabatan") || "Anggota";
          if (jabatanOrder[ja] !== jabatanOrder[jb]) {
            return jabatanOrder[ja] - jabatanOrder[jb];
          }
          return (rowA.getValue("nama") || "").localeCompare(rowB.getValue("nama") || "");
        },
        Cell: ({ cell }) => {
          const val = cell.getValue() || "Anggota";
          const colors = {
            Ketua: "bg-green-600 text-white",
            Sekretaris: "bg-blue-600 text-white",
            Bendahara: "bg-yellow-600 text-white",
            Anggota: "bg-gray-400 text-white",
          };
          return (
            <span className={`px-2 py-1 rounded-md text-xs font-semibold ${colors[val] || "bg-gray-300 text-gray-800"}`}>
              {val}
            </span>
          );
        },
      },
      {
        id: "no_hp",
        accessorKey: "no_hp",
        header: "No HP",
        Cell: ({ cell }) => cell.getValue() || "-",
      },
      {
        id: "ket",
        accessorKey: "ket",
        header: "Keterangan",
        Cell: ({ cell }) => cell.getValue() || "-",
      },
    ],
    []
  );

  // Tabel Kelompok Anggota Gapoktan (struktur seperti tabel Admin.jsx)
  const kategoriBadge = (val) => {
    const colorMap = {
      "Gapoktan": "bg-lime-900 text-lime-100",
      "Kelompok Tani": "bg-green-800 text-green-100",
      "Kelompok Kebun": "bg-amber-800 text-amber-100",
      "KWT": "bg-pink-800 text-pink-100",
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-md ${colorMap[val] || "bg-gray-300 text-gray-700"}`}>
        {val}
      </span>
    );
  };

  const columnsKelompokAnggota = useMemo(
    () => [
      { id: "nama_kelompok", accessorKey: "nama_kelompok", header: "Nama Kelompok" },
      {
        id: "kategori",
        accessorKey: "kategori",
        header: "Kategori",
        Cell: ({ cell }) => kategoriBadge(cell.getValue() || "Kelompok Tani"),
      },
      {
        id: "ketua",
        accessorKey: "ketua",
        header: "Ketua",
        Cell: ({ cell }) => cell.getValue() || "-",
      },
      {
        id: "sekretaris",
        accessorKey: "sekretaris",
        header: "Sekretaris",
        Cell: ({ cell }) => cell.getValue() || "-",
      },
      {
        id: "bendahara",
        accessorKey: "bendahara",
        header: "Bendahara",
        Cell: ({ cell }) => cell.getValue() || "-",
      },
      {
        id: "jumlah_anggota",
        accessorKey: "jumlah_anggota",
        header: "Jumlah Anggota",
        Cell: ({ cell }) => cell.getValue() || 0,
      },
      {
        id: "total_lahan",
        accessorKey: "total_lahan",
        header: "Total Lahan (Ha)",
        Cell: ({ cell }) => (parseFloat(cell.getValue() || 0)).toFixed(2),
      },
    ],
    []
  );

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-full mx-auto p-4 sm:p-6">
      {/* Tombol kembali */}
      <div className="mb-4">
        <button
          onClick={() => {
            if (window.history.length > 2) navigate(-1);
            else navigate("/kelompoklist");
          }}
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
        >
          <ArrowBack fontSize="small" />
          <span className="text-sm font-medium">Kembali</span>
        </button>
      </div>

      {/* Info kelompok */}
      <div className="relative bg-white p-4 rounded-xl shadow-md mb-5 text-base">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-2xl font-bold">{kelompok?.nama_kelompok}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-gray-700">
          <p className="col-start-1 row-start-1">
            Kategori: <strong>{kelompok?.kategori || "Kelompok Tani"}</strong>
          </p>
          <p className="col-start-1 row-start-2">
            Provinsi: <strong>{kelompok.provinsi}</strong>
          </p>
          <p className="col-start-1 row-start-3">
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
              <p>Jumlah Anggota: <strong>{kelompok?.jumlah_anggota || 0}</strong></p>
              <p>
                Total Lahan:{" "}
                <strong>{Number(kelompok?.total_lahan || 0).toFixed(2)} Ha</strong>
              </p>
            </>
          )}
        </div>
      </div>

      {/* MODE GAPOKTAN */}
      {isGapoktan ? (
        <>
          {/* Pengurus Gapoktan */}
          <div className="bg-white p-4 rounded-xl shadow mb-5">
            <h2 className="text-xl font-semibold mb-3">Pengurus Gapoktan</h2>
            <MaterialReactTable
              columns={columnsPengurus}
              data={pengurus}
              getRowId={(row) => row.id}
              enableColumnActions={false}
              enableColumnFilters={false}
              enableHiding={false}
              initialState={{
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
                sx: {
                  fontWeight: "bold",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                },
              }}
              muiTableBodyCellProps={{
                sx: { whiteSpace: "nowrap" },
              }}
            />
          </div>

          {/* Kelompok Anggota Gapoktan */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-3">Kelompok Anggota Gapoktan</h2>
            <MaterialReactTable
              columns={columnsKelompokAnggota}
              data={kelompokAnggota}
              getRowId={(row) => row.id}
              enableColumnActions={false}
              enableColumnFilters={false}
              enableHiding={false}
              initialState={{
                pagination: { pageIndex: 0, pageSize: 10 },
                sorting: [{ id: "nama_kelompok", desc: false }],
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
                sx: {
                  fontWeight: "bold",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                },
              }}
              muiTableBodyCellProps={{
                sx: { whiteSpace: "nowrap" },
              }}
            />
          </div>
        </>
      ) : (
        // MODE BUKAN GAPOKTAN (Anggota perorangan)
        <>
          {anggota.length === 0 ? (
            <div className="text-center text-gray-500">Belum ada data anggota</div>
          ) : (
            <MaterialReactTable
              columns={columnsAnggota}
              data={anggota}
              getRowId={(row) => row.id}
              enableColumnActions={false}
              enableColumnFilters={false}
              enableHiding={false}
              initialState={{
                sorting: [{ id: "jabatan", desc: false }],
                pagination: { pageIndex: 0, pageSize: 10 },
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
              muiTableHeadCellProps={{
                sx: {
                  fontWeight: "bold",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                },
              }}
              muiTableBodyCellProps={{
                sx: { whiteSpace: "nowrap" },
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default DetailPublik;
