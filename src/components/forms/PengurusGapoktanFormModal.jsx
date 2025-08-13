import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

const JABATAN_OPSI = ["Ketua", "Sekretaris", "Bendahara"];

export default function PengurusGapoktanFormModal({
  visible,
  onClose,
  onSubmit, // (data) => void
  initialData,
  existingJabatan = [], // array jabatan yang sudah terpakai: ["Ketua", "Sekretaris"]
}) {
  const [form, setForm] = useState({
    nama: "",
    nik: "",
    no_hp: "",
    luas: 0,
    jabatan: "",
    ket: "",
  });

  useEffect(() => {
    if (!visible) return;
    if (initialData) {
      setForm({
        nama: initialData.nama || "",
        nik: initialData.nik || "",
        no_hp: initialData.no_hp || "",
        luas: initialData.luas || 0,
        jabatan: initialData.jabatan || "",
        ket: initialData.ket || "",
      });
    } else {
      setForm({ nama: "", nik: "", no_hp: "", luas: "", jabatan: "", ket: "" });
    }
  }, [visible, initialData]);

  if (!visible) return null;

  const handleChange = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    if (!form.nama || !form.jabatan) {
      await Swal.fire("Oops", "Nama & Jabatan wajib diisi", "warning");
      return;
    }
    // Cegah duplikasi jabatan (kecuali kalau sedang edit jabatan yang sama)
    if (
      !initialData ||
      (initialData && initialData.jabatan !== form.jabatan)
    ) {
      if (existingJabatan.includes(form.jabatan)) {
        await Swal.fire(
          "Duplikat",
          `Jabatan "${form.jabatan}" sudah ada. Pilih jabatan lain`,
          "warning"
        );
        return;
      }
    }

    onSubmit(form);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded p-4">
        <h3 className="text-lg font-semibold mb-3">
          {initialData ? "Edit Pengurus" : "Tambah Pengurus"}
        </h3>

        {/* Form */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Nama Pengurus"
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
            className={`w-full bg-white border rounded px-3 py-2 mb-2 ${
              !form.jabatan ? "text-gray-400" : "text-black"
            }`}
            value={form.jabatan}
            onChange={(e) => handleChange("jabatan", e.target.value)}
          >
            <option value="" disabled>
              Pilih Jabatan
            </option>
            {JABATAN_OPSI.map((j) => (
              <option
                key={j}
                value={j}
                disabled={
                  // disable opsi ini jika sudah terpakai & bukan initialData dengan jabatan yang sama
                  existingJabatan.includes(j) &&
                  (!initialData || initialData.jabatan !== j)
                }
              >
                {j}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Keterangan"
            value={form.ket}
            onChange={(e) => handleChange("ket", e.target.value)}
            className="bg-white border p-2 w-full rounded"
          />
          
          <div className="flex justify-end gap-2">
            <button className="px-3 py-2 bg-gray-200 rounded" onClick={onClose}>
              Batal
            </button>
            <button
              className="px-3 py-2 bg-lime-700 text-white rounded hover:bg-lime-800"
              onClick={handleSave}
            >
              {initialData ? "Simpan" : "Tambah"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
