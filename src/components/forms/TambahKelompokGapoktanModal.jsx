import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, query, where, doc, writeBatch, } from "firebase/firestore";
import { toast } from "react-toastify";

export default function TambahKelompokGapoktanModal({
  gapoktanId,
  existingKelompokIds = [], // array string of kelompokId yang sudah menjadi anggota
  visible,
  onClose,
  onAdded, // callback refresh setelah sukses
}) {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const existing = new Set(existingKelompokIds);

  useEffect(() => {
    if (!visible) return;

    const fetchEligibleKelompok = async () => {
      // ambil hanya "Kelompok Tani"
      const ref = collection(db, "kelompok_tani");
      const q = query(ref, where("kategori", "==", "Kelompok Tani"));
      const snap = await getDocs(q);
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((k) => !existing.has(k.id))
        .sort((a, b) =>
          (a.nama_kelompok || "").localeCompare(b.nama_kelompok || "")
        );
      setList(data);
    };

    fetchEligibleKelompok();
  }, [visible]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) {
      toast.warn("Pilih minimal 1 kelompok");
      return;
    }
    setLoading(true);
    try {
      const batch = writeBatch(db);
      selected.forEach((kelompokId) => {
        const k = list.find((item) => item.id === kelompokId);
        const subRef = collection(db, "kelompok_tani", gapoktanId, "kelompok_anggota");
        const newDocRef = doc(subRef);
        batch.set(newDocRef, {
          kelompokId,
          kelompokRef: doc(db, "kelompok_tani", kelompokId),
          nama_kelompok: k?.nama_kelompok || "",
          // opsional cache:
          // ketua_cache: ...
          // jumlah_anggota_cache: 0,
          // total_lahan_cache: 0,
          createdAt: new Date(),
        });
      });

      await batch.commit();
      toast.success("Kelompok anggota gapoktan berhasil ditambahkan");
      onAdded?.();
      onClose?.();
    } catch (e) {
      console.error(e);
      toast.error("Gagal menambah kelompok anggota");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  const filtered = list.filter((item) =>
    (item.nama_kelompok || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-xl rounded p-4">
        <h3 className="text-lg font-semibold mb-3">Pilih Kelompok Tani</h3>

        <input
          className="w-full border rounded px-3 py-2 mb-3"
          placeholder="Cari kelompok..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="max-h-64 overflow-y-auto border rounded">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">Tidak ada data</div>
          ) : (
            filtered.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-2 px-3 py-2 border-b last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                />
                <div className="flex-1">
                  <div className="font-medium">{item.nama_kelompok}</div>
                  <div className="text-xs text-gray-500">
                    {item.kecamatan} • {item.kabupaten}
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button className="px-3 py-2 bg-gray-200 rounded" onClick={onClose}>
            Batal
          </button>
          <button
            disabled={loading}
            className="px-3 py-2 bg-lime-700 text-white rounded hover:bg-lime-800"
            onClick={handleSubmit}
          >
            {loading ? "Menyimpan..." : "Tambahkan"}
          </button>
        </div>
      </div>
    </div>
  );
}
