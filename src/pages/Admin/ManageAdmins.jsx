import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { MaterialReactTable } from "material-react-table";
import { Box, IconButton } from "@mui/material";
import { Delete, PersonAdd } from "@mui/icons-material";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { createAdminAccount, removeAdminAccess, setAdminActive } from "../../utils/admins";

const ManageAdmins = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "admins"), orderBy("createdAt", "desc")));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRows(data);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat admin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const columns = useMemo(() => [
    { id: "nama", accessorKey: "nama", header: "Nama" },
    { id: "email", accessorKey: "email", header: "Email" },
    {
      id: "role", accessorKey: "role", header: "Role",
      Cell: ({ cell }) => {
        const role = (cell.getValue() || "").toString();
        const title = role.charAt(0).toUpperCase() + role.slice(1);
        return <span className="px-2 py-1 rounded bg-gray-200 text-gray-800 text-xs">{title}</span>;
      }
    },
    {
      id: "active", accessorKey: "active", header: "Aktif",
      Cell: ({ row }) => {
        const val = !!row.original.active;
        return (
          <button
            className={`px-2 py-1 rounded text-xs ${val ? "bg-green-600 text-white" : "bg-gray-300 text-gray-700"}`}
            onClick={async () => {
              try {
                await setAdminActive(row.original.uid, !val);
                toast.success("Status diperbarui");
                fetchAdmins();
              } catch {
                toast.error("Gagal memperbarui status");
              }
            }}
          >
            {val ? "Aktif" : "Nonaktif"}
          </button>
        );
      }
    },
    {
      id: "aksi", header: "Aksi",
      Cell: ({ row }) => (
        <Box display="flex" gap={1} justifyContent="center">
          <IconButton
            color="error"
            onClick={async () => {
              const result = await Swal.fire({
                title: "Hapus Admin?",
                text: "Ini akan mencabut akses admin (soft delete).",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Ya, hapus",
                cancelButtonText: "Batal",
              });
              if (!result.isConfirmed) return;
              try {
                await removeAdminAccess(row.original.uid);
                toast.success("Akses admin dicabut");
                fetchAdmins();
              } catch {
                toast.error("Gagal mencabut akses");
              }
            }}
          >
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ], []);

  const handleTambah = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Tambah Admin",
      html: `
        <input id="swal-nama" class="swal2-input" placeholder="Nama" />
        <input id="swal-email" type="email" class="swal2-input" placeholder="Email" />
        <select id="swal-role" class="swal2-input">
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </select>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const nama = document.getElementById("swal-nama").value;
        const email = document.getElementById("swal-email").value;
        const role = document.getElementById("swal-role").value;
        if (!email) {
          Swal.showValidationMessage("Email wajib diisi");
          return false;
        }
        return { nama, email, role };
      },
      showCancelButton: true,
      confirmButtonText: "Buat",
      cancelButtonText: "Batal",
    });

    if (!formValues) return;

    try {
      await createAdminAccount(formValues);
      toast.success("Admin dibuat. Email reset telah dikirim.");
      fetchAdmins();
    } catch (err) {
      console.error(err);
      toast.error("Gagal membuat admin");
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-2xl font-bold">Kelola Admin</h1>
        <button
          onClick={handleTambah}
          className="bg-lime-700 text-white px-3 py-2 rounded hover:bg-lime-800 flex items-center gap-2"
        >
          <PersonAdd fontSize="small" />
          Tambah Admin
        </button>
      </div>

      <MaterialReactTable
        columns={columns}
        data={rows}
        state={{ isLoading: loading }}
        enableColumnFilters={false}
        enableColumnActions={false}
        initialState={{ pagination: { pageIndex: 0, pageSize: 10 } }}
        muiTablePaperProps={{
          elevation: 2,
          sx: { borderRadius: "0.75rem", overflow: "hidden", border: "1px solid #e5e7eb" },
        }}
      />
    </div>
  );
};

export default ManageAdmins;
