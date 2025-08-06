/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import { MaterialReactTable } from "material-react-table";
import { ArrowBack } from "@mui/icons-material";

import { toast } from "react-toastify";

const Detail = () => {
  const { id } = useParams();
  const [kelompok, setKelompok] = useState(null);
  const [anggota, setAnggota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction] = useState(false);
  const navigate = useNavigate();

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

  /** === COLUMNS MRT (dengan sorting prioritas jabatan) === */
  const jabatanOrder = {
    Ketua: 1,
    Sekretaris: 2,
    Bendahara: 3,
    Anggota: 4,
  };

  const columns = useMemo(
    () => [
      { accessorKey: "nama",header: "Nama" },
    //   { accessorKey: "nik", header: "NIK" },
    //   { accessorKey: "no_hp", header: "No HP" },      
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
    ],
    [loadingAction]
  );

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-full mx-auto p-6">
      {/* Tombol kembali */}
      <div className="mb-4">
        <button
            onClick={() => {
            if (window.history.length > 2) {
                navigate(-1);
            } else {
                navigate("/kelompoklist");
            }
            }}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
        >
            <ArrowBack fontSize="small" />
            <span className="text-sm font-medium">Kembali</span>
        </button>
      </div>

      {/* Info kelompok tani */}
      <div className="relative bg-white p-4 rounded-xl shadow-md mb-5 text-base">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-2xl font-bold">{kelompok?.nama_kelompok}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-gray-700">
          <p className="col-start-1 row-start-1">Kategori: <strong>{kelompok?.kategori || "Kelompok Tani"}</strong></p>
          <p className="col-start-1 row-start-2">Provinsi: <strong>{kelompok.provinsi}</strong></p>
          <p className="col-start-1 row-start-3">Kabupaten: <strong>{kelompok.kabupaten}</strong></p>
          <p>Kecamatan: <strong>{kelompok.kecamatan}</strong></p>
          <p>Jumlah Anggota: <strong>{kelompok.jumlah_anggota || 0}</strong></p>
          <p>Total Lahan: <strong>{(kelompok.total_lahan || 0).toFixed(2)} Ha</strong></p>
        </div>
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
          enableHiding={false}
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
    </div>
  );
};

export default Detail;
