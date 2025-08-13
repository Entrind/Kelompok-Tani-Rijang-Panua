import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

const AnggotaFormModal = ({ visible, onClose, onSubmit, initialData, existingJabatan }) => {
  const [form, setForm] = useState({
    nama: "",
    nik: "",
    no_hp: "",
    luas: 0,
    jabatan: "",
    ket: "",
  });

  const unik = new Set(["Ketua", "Sekretaris", "Bendahara"]);
  const taken = new Set(existingJabatan || []);
  const currentJabatan = initialData?.jabatan;

  // Reset form ketika modal dibuka atau initialData berubah
  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      setForm({
        nama: "",
        nik: "",
        no_hp: "",
        luas: "",
        jabatan: "",
        ket: "",
      });
    }
  }, [initialData, visible]); // 🔹 perhatikan 'visible' ikut dipantau

  if (!visible) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validasi wajib isi nama
    if (!form.nama.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Nama wajib diisi!",
        confirmButtonText: "OK",
      });
      return;
    }

    // Kirim data ke parent (Detail.jsx)
    onSubmit(form);

    // Tutup modal setelah submit sukses
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
        <h2 className="text-lg font-bold mb-4">
          {initialData ? "Edit Anggota" : "Tambah Anggota"}
        </h2>

        {/* Form */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Nama"
            value={form.nama}
            onChange={(e) => handleChange("nama", e.target.value)}
            className="bg-white border p-2 w-full rounded"
          />
          <input
            type="text"
            placeholder="NIK"
            value={form.nik}
            onChange={(e) => handleChange("nik", e.target.value)}
            className="bg-white border p-2 w-full rounded"
          />
          <input
            type="text"
            placeholder="No HP"
            value={form.no_hp}
            onChange={(e) => handleChange("no_hp", e.target.value)}
            className="bg-white border p-2 w-full rounded"
          />
          <input
            type="number"
            placeholder="Luas (Ha)"
            value={form.luas}
            onChange={(e) => handleChange("luas", parseFloat(e.target.value))}
            className="bg-white border p-2 w-full rounded"
          />
          <select
            value={form.jabatan}
            onChange={(e) => handleChange("jabatan", e.target.value)}
            className={`w-full bg-white border rounded p-2 ${
              form.jabatan === "" ? "text-gray-400" : "text-black"
            }`}
          >
            <option value="" disabled selected>Pilih Jabatan</option>
            <option value="Ketua" disabled={unik.has("Ketua") && taken.has("Ketua") && currentJabatan!=="Ketua"}>Ketua</option>
            <option value="Sekretaris" disabled={unik.has("Sekretaris") && taken.has("Sekretaris") && currentJabatan!=="Sekretaris"}>Sekretaris</option>
            <option value="Bendahara" disabled={unik.has("Bendahara") && taken.has("Bendahara") && currentJabatan!=="Bendahara"}>Bendahara</option>
            <option value="Anggota">Anggota</option>
          </select>
          <input
            type="text"
            placeholder="Keterangan"
            value={form.ket}
            onChange={(e) => handleChange("ket", e.target.value)}
            className="bg-white border p-2 w-full rounded"
          />
        </div>

        {/* Tombol Aksi */}
        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {initialData ? "Simpan" : "Tambah"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnggotaFormModal;
