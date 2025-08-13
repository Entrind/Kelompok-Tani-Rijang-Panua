import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toast } from "react-toastify";

const AdminSettings = () => {
  const [headerUrl, setHeaderUrl] = useState("");
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  const settingsRef = doc(db, "settings", "site");

  const fetchSettings = async () => {
    const snap = await getDoc(settingsRef);
    if (snap.exists()) {
      const d = snap.data();
      setHeaderUrl(d.headerImageUrl || "");
      setPreview(d.headerImageUrl || "");
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const storage = getStorage();
      const path = `homepage/header-${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);

      const task = uploadBytesResumable(storageRef, file);
      await new Promise((resolve, reject) => {
        task.on(
          "state_changed",
          () => {},
          reject,
          resolve
        );
      });

      const url = await getDownloadURL(storageRef);
      setPreview(url);
      await setDoc(settingsRef, {
        headerImageUrl: url,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast.success("Header image diperbarui");
    } catch (err) {
      console.error(err);
      toast.error("Gagal upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Pengaturan Situs</h1>

      <div className="bg-white p-4 rounded shadow">
        <label className="block text-sm font-medium mb-2">Header Image</label>

        {preview && (
          <img
            src={preview}
            alt="Header preview"
            className="w-full h-48 object-cover rounded mb-3 border"
          />
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          disabled={uploading}
          className="w-full"
        />

        {uploading && (
          <p className="text-sm text-gray-500 mt-2">Uploading...</p>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
