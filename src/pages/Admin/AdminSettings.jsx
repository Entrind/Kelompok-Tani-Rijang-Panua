import React, { useEffect, useState } from "react";
import { db, storage } from "../../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "react-toastify";

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [headerUrl, setHeaderUrl] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const loadSettings = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, "settings", "homepage"));
      if (snap.exists()) {
        setHeaderUrl(snap.data()?.headerImageUrl || "");
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSelect = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    if (f) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.warn("Pilih file gambar dulu");
      return;
    }
    try {
      const path = `homepage/header_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await setDoc(doc(db, "settings", "homepage"), {
        headerImageUrl: url,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setHeaderUrl(url);
      setFile(null);
      setPreviewUrl("");
      toast.success("Header image diperbarui");
    } catch (e) {
      console.error(e);
      toast.error("Gagal upload gambar");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="max-w-screen-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Pengaturan Tampilan</h1>

      <div className="bg-white p-4 rounded shadow space-y-4">
        <div>
          <h2 className="font-semibold mb-2">Gambar Header Homepage</h2>
          {headerUrl ? (
            <img src={headerUrl} alt="Header" className="w-full max-h-60 object-cover rounded" />
          ) : (
            <p className="text-sm text-gray-500">Belum ada gambar header</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <input type="file" accept="image/*" onChange={handleSelect} />
          </div>
          <div>
            {previewUrl && (
              <img src={previewUrl} alt="Preview" className="w-full max-h-60 object-cover rounded" />
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            className="px-4 py-2 bg-lime-700 text-white rounded hover:bg-lime-800"
            disabled={!file}
          >
            Simpan Header
          </button>
        </div>
      </div>
    </div>
  );
}
