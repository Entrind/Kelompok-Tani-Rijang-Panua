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
    jabatan: "",
    no_hp: "",
  });

  useEffect(() => {
    if (!visible) return;
    if (initialData) {
      setForm({
        nama: initialData.nama || "",
        jabatan: initialData.jabatan || "",
        no_hp: initialData.no_hp || "",
      });
    } else {
      setForm({ nama: "", jabatan: "", no_hp: "" });
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

        <input
          className="w-full border rounded px-3 py-2 mb-2"
          placeholder="Nama Pengurus"
          value={form.nama}
          onChange={(e) => handleChange("nama", e.target.value)}
        />

        <select
          className={`w-full border rounded px-3 py-2 mb-2 ${
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
          className="w-full border rounded px-3 py-2 mb-4"
          placeholder="No HP (opsional)"
          value={form.no_hp}
          onChange={(e) => handleChange("no_hp", e.target.value)}
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
  );
}
