import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

const KelompokFormModal = ({ visible, onClose, onSubmit, initialData, defaultRegion }) => {
  const [form, setForm] = useState({
    id_kelompok: "",
    nama_kelompok: "",
    kategori: "",
    provinsi: defaultRegion?.provinsi || "",
    kabupaten: defaultRegion?.kabupaten || "",
    kecamatan: defaultRegion?.kecamatan || "",
    ketua: "",
    sekretaris: "",
    bendahara: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        id_kelompok: initialData.id || "",
        nama_kelompok: initialData.nama_kelompok || "",
        kategori: initialData.kategori || "Kelompok Tani",
        provinsi: initialData.provinsi || defaultRegion?.provinsi || "",
        kabupaten: initialData.kabupaten || defaultRegion?.kabupaten || "",
        kecamatan: initialData.kecamatan || defaultRegion?.kecamatan || "",
        ketua: initialData.ketua || "",
        sekretaris: initialData.sekretaris || "",
        bendahara: initialData.bendahara || "",
      });
    } else {
      setForm((prev) => ({
        ...prev,
        id_kelompok: "",
        nama_kelompok: "",
        kategori: "",
        provinsi: defaultRegion?.provinsi || "",
        kabupaten: defaultRegion?.kabupaten || "",
        kecamatan: defaultRegion?.kecamatan || "",
        ketua: "",
        sekretaris: "",
        bendahara: "",
      }));
    }
  }, [initialData, defaultRegion]);

  if (!visible) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const titleCase = (text) => {
    const keepUpper = ["KWT", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    
    return text
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((sub) => {
          const upper = sub.toUpperCase();
          if (keepUpper.includes(upper)) {
            return upper;
          }
          return sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase();
        })
        .join("-")
    )
    .join(" ");
  };

  const handleSubmit = async () => {
    if (!form.nama_kelompok || !form.kategori || !form.provinsi || !form.kabupaten || !form.kecamatan) {
      await Swal.fire("Oops", "Kolom wajib (Nama, Kategori, Provinsi, Kabupaten, Kecamatan) harus diisi!", "warning");
      return;
    }

    // Format Title Case
    const data = {
      ...form,
      nama_kelompok: titleCase(form.nama_kelompok),
      provinsi: titleCase(form.provinsi),
      kabupaten: titleCase(form.kabupaten),
      kecamatan: titleCase(form.kecamatan),
      ketua: titleCase(form.ketua),
      sekretaris: titleCase(form.sekretaris),
      bendahara: titleCase(form.bendahara),
    };

    onSubmit(data);

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
        <h2 className="text-lg font-bold mb-4">
          {initialData ? "Edit Kelompok" : "Tambah Kelompok"}
        </h2>

        {/* ID Kelompok (opsional) */}
        <input
          type="text"
          placeholder="ID Kelompok (opsional)"
          value={form.id_kelompok}
          onChange={(e) => handleChange("id_kelompok", e.target.value)}
          className="bg-white border p-2 w-full rounded mb-2"
          disabled={!!initialData}
        />

        {/* Nama kelompok */}
        <input
          type="text"
          placeholder="Nama Kelompok"
          value={form.nama_kelompok}
          onChange={(e) => handleChange("nama_kelompok", e.target.value)}
          className="bg-white border p-2 w-full rounded mb-2"
        />

        {/* Kategori Kelompok */}
        <select
          className={`w-full bg-white border rounded-md mb-2 px-3 py-2 ${
            form.kategori === "" ? "text-gray-400" : "text-black"
          }`}
          value={form.kategori}
          onChange={(e) => handleChange("kategori", e.target.value)}
        >
          <option value="" disabled>Pilih Kategori Kelompok</option>
          <option value="Kelompok Tani">Kelompok Tani</option>
          <option value="Kelompok Kebun">Kelompok Kebun</option>
          <option value="KWT">KWT</option>
          <option value="Gapoktan">Gapoktan</option>
        </select>

        {/* Provinsi, Kabupaten, Kecamatan */}
        <input
          type="text"
          placeholder="Provinsi"
          value={form.provinsi}
          onChange={(e) => handleChange("provinsi", e.target.value)}
          className="bg-white border p-2 w-full rounded mb-2"
        />
        <input
          type="text"
          placeholder="Kabupaten"
          value={form.kabupaten}
          onChange={(e) => handleChange("kabupaten", e.target.value)}
          className="bg-white border p-2 w-full rounded mb-2"
        />
        <input
          type="text"
          placeholder="Kecamatan"
          value={form.kecamatan}
          onChange={(e) => handleChange("kecamatan", e.target.value)}
          className="bg-white border p-2 w-full rounded mb-2"
        />

        {/* Ketua, Sekretaris, Bendahara (opsional) */}
        {!initialData && (
          <>
            <input
              type="text"
              placeholder="Nama Ketua (opsional)"
              value={form.ketua}
              onChange={(e) => handleChange("ketua", e.target.value)}
              className="bg-white border p-2 w-full rounded mb-2"
            />
            <input
              type="text"
              placeholder="Nama Sekretaris (opsional)"
              value={form.sekretaris}
              onChange={(e) => handleChange("sekretaris", e.target.value)}
              className="bg-white border p-2 w-full rounded mb-2"
            />
            <input
              type="text"
              placeholder="Nama Bendahara (opsional)"
              value={form.bendahara}
              onChange={(e) => handleChange("bendahara", e.target.value)}
              className="bg-white border p-2 w-full rounded mb-2"
            />
          </>
        )}

        {/* Tombol aksi */}
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

export default KelompokFormModal;
