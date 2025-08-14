// src/pages/Admin/ManageAdmins.jsx
import React, { useEffect, useMemo, useState } from "react";
import { listAdmins, createAdmin, deactivateAdmin, updateAdminDoc } from "../../utils/admins";
import { MaterialReactTable } from "material-react-table";
import { Box, IconButton } from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ nama: "", email: "", role: "admin", sendInvite: true });
  const [editRow, setEditRow] = useState(null);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const data = await listAdmins();
      setAdmins(data);
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
    {
      id: "nama",
      accessorKey: "nama",
      header: "Nama",
    },
    {
      id: "email",
      accessorKey: "email",
      header: "Email",
    },
    {
      id: "role",
      accessorKey: "role",
      header: "Role",
      Cell: ({ cell }) => {
        const r = cell.getValue() || "admin";
        const label = r.charAt(0).toUpperCase() + r.slice(1);
        const color = r === "superadmin" ? "bg-purple-600" : "bg-blue-600";
        return (
          <span className={`text-white text-xs px-2 py-1 rounded ${color}`}>
            {label}
          </span>
        );
      },
    },
    {
      id: "active",
      accessorKey: "active",
      header: "Status",
      Cell: ({ row, cell }) => {
        const [loading, setLoading] = React.useState(false);
        const active = cell.getValue() !== false; // default aktif

        const handleToggle = async () => {
          if (loading) return;
          const result = await Swal.fire({
            title: active ? "Nonaktifkan Admin?" : "Aktifkan Admin?",
            text: active
              ? "Admin akan kehilangan akses panel."
              : "Admin akan mendapatkan akses panel kembali.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: active ? "Nonaktifkan" : "Aktifkan",
            cancelButtonText: "Batal",
          });
          if (!result.isConfirmed) return;

          try {
            setLoading(true);
            await updateAdminDoc(row.original.uid, { active: !active });
            toast.success(`Admin ${active ? "dinonaktifkan" : "diaktifkan"}`);
            await fetchAdmins(); // refresh data tabel
          } catch (e) {
            console.error(e);
            toast.error("Gagal mengubah status");
          } finally {
            setLoading(false);
          }
        };

        return (
          <button
            type="button"
            onClick={handleToggle}
            disabled={loading}
            aria-pressed={active}
            title={active ? "Klik untuk menonaktifkan" : "Klik untuk mengaktifkan"}
            className={[
              "inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold text-white",
              "transition-colors duration-200 ease-out active:scale-95",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white",
              active ? "bg-green-600 hover:bg-green-700 focus:ring-green-500" : "bg-red-600 hover:bg-red-700 focus:ring-red-500",
              loading ? "opacity-70 cursor-not-allowed" : "cursor-pointer",
            ].join(" ")}
          >
            <span className="uppercase tracking-wide">
              {active ? "Aktif" : "Nonaktif"}
            </span>
            {loading && (
              <span className="ml-1 animate-pulse text-white/90">...</span>
            )}
          </button>
        );
      },
    },
    {
      id: "aksi",
      header: "Aksi",
      enableSorting: false,
      Cell: ({ row }) => (
        <Box display="flex" gap={1} justifyContent="center">
          <IconButton
            color="primary"
            onClick={() => setEditRow(row.original)}
            title="Edit"
          >
            <Edit />
          </IconButton>
          <IconButton
            color="error"
            onClick={async () => {
              const ok = await Swal.fire({
                title: "Nonaktifkan Admin?",
                text: "Admin akan kehilangan akses panel (dokumen Firestore dihapus).",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Ya, nonaktifkan",
                cancelButtonText: "Batal",
              });
              if (!ok.isConfirmed) return;
              try {
                await deactivateAdmin(row.original.uid);
                toast.success("Admin dinonaktifkan");
                fetchAdmins();
              } catch (e) {
                console.error(e);
                toast.error("Gagal menonaktifkan");
              }
            }}
            title="Nonaktifkan"
          >
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ], []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAdmin(form);
      toast.success("Admin ditambahkan & undangan reset password dikirim");
      setForm({ nama: "", email: "", role: "admin", sendInvite: true });
      fetchAdmins();
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Gagal menambah admin");
    }
  };

  const handleSaveEdit = async () => {
    if (!editRow) return;
    try {
      await updateAdminDoc(editRow.uid, { nama: editRow.nama, role: editRow.role });
      toast.success("Admin diperbarui");
      setEditRow(null);
      fetchAdmins();
    } catch (e) {
      console.error(e);
      toast.error("Gagal update admin");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="max-w-screen-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Kelola Admin</h1>

      {/* Form tambah admin */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-3"
      >
        <input
          type="text"
          placeholder="Nama"
          className="bg-white border px-3 py-2 rounded"
          value={form.nama}
          onChange={(e) => setForm((s) => ({ ...s, nama: e.target.value }))}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="bg-white border px-3 py-2 rounded"
          value={form.email}
          onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
          required
        />
        <select
          className="bg-white border px-3 py-2 rounded"
          value={form.role}
          onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}
        >
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.sendInvite}
            onChange={(e) => setForm((s) => ({ ...s, sendInvite: e.target.checked }))}
          />
          Kirim email reset password
        </label>

        <div className="md:col-span-4 flex justify-end">
          <button type="submit" className="px-4 py-2 bg-lime-700 text-white rounded hover:bg-lime-800">
            Tambah Admin
          </button>
        </div>
      </form>

      {/* Table admin */}
      <MaterialReactTable
        columns={columns}
        data={admins}
        getRowId={(row) => row.id}
        enableColumnActions={false}
        enableColumnFilters={false}
        initialState={{
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

      {/* Modal edit sederhana */}
      {editRow && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-5 w-full max-w-md">
            <h2 className="font-bold text-lg mb-4">Edit Admin</h2>
            <div className="space-y-3">
              <input
                type="text"
                className="w-full bg-white border px-3 py-2 rounded"
                value={editRow.nama || ""}
                onChange={(e) => setEditRow((s) => ({ ...s, nama: e.target.value }))}
              />
              <select
                className="w-full bg-white border px-3 py-2 rounded"
                value={editRow.role || "admin"}
                onChange={(e) => setEditRow((s) => ({ ...s, role: e.target.value }))}
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={() => setEditRow(null)}>
                Batal
              </button>
              <button className="px-4 py-2 bg-lime-700 text-white rounded" onClick={handleSaveEdit}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
