import React, { useState } from 'react';

const Tambah = () => {
  const [form, setForm] = useState({
    nama: "",
    ketua: "",
    sekretaris: "",
    bendahara: "",
    jenis: "",
    jumlah_anggota: "",
    luas_lahan: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Data Kelompok:", form);
    alert("Data berhasil disimpan (sementara)");
    // reset
    setForm({
      nama: "",
      ketua: "",
      sekretaris: "",
      bendahara: "",
      jenis: "",
      jumlah_anggota: "",
      luas_lahan: ""
    });
  };

  const isKelompokTani = form.jenis === "kelompok_tani";

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Tambah Kelompok Tani</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="nama" value={form.nama} onChange={handleChange} required placeholder="Nama Kelompok" className="bg-white w-full border p-2 rounded" />
        <input name="ketua" value={form.ketua} onChange={handleChange} required placeholder="Ketua" className="bg-white w-full border p-2 rounded" />
        <input name="sekretaris" value={form.sekretaris} onChange={handleChange} placeholder="Sekretaris" className="bg-white w-full border p-2 rounded" />
        <input name="bendahara" value={form.bendahara} onChange={handleChange} placeholder="Bendahara" className="bg-white w-full border p-2 rounded" />

        <select name="jenis" value={form.jenis} onChange={handleChange} required className="bg-white w-full border p-2 rounded">
          <option value="">Pilih Jenis Kelompok</option>
          <option value="gapoktan">Gapoktan</option>
          <option value="kelompok_tani">Kelompok Tani</option>
          <option value="kelompok_kebun">Kelompok Kebun</option>
          <option value="kwt">KWT</option>
        </select>

        {isKelompokTani && (
          <>
            <input name="jumlah_anggota" value={form.jumlah_anggota} onChange={handleChange} placeholder="Jumlah Anggota" className="bg-white w-full border p-2 rounded" />
            <input name="luas_lahan" value={form.luas_lahan} onChange={handleChange} placeholder="Luas Lahan (Ha)" className="bg-white w-full border p-2 rounded" />
          </>
        )}

        <button type="submit" className="bg-lime-700 text-white px-4 py-2 rounded hover:bg-lime-800">
          Simpan
        </button>
      </form>
    </div>
  );
};

export default Tambah;
