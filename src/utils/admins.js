// src/utils/admins.js
import { auth, db, getSecondaryAuth } from "../firebase";
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc, deleteDoc, serverTimestamp, getDoc, updateDoc, } from "firebase/firestore";

/**
 * Buat akun admin baru:
 * - Create user di Auth via Secondary Auth (agar tidak logout superadmin)
 * - Tulis dokumen admins/{uid}
 * - Kirim email reset password ke email tersebut
 */
export const createAdminAccount = async ({ email, nama, role = "admin" }) => {
  const secAuth = getSecondaryAuth();

  const tempPassword = Math.random().toString(36).slice(2, 10) + "A!9"; // password sementara
  const cred = await createUserWithEmailAndPassword(secAuth, email, tempPassword);
  const uid = cred.user.uid;

  await setDoc(doc(db, "admins", uid), {
    uid,
    email,
    nama: nama || "",
    role: role, // "admin" | "superadmin"
    active: true,
    createdAt: serverTimestamp(),
  });

  // Kirim email reset (pakai primary auth instance, tidak mempengaruhi sesi)
  await sendPasswordResetEmail(auth, email);

  return uid;
};

/** Soft-delete:
 *  - Hapus dokumen admins/{uid} (atau set active:false)
 *  - User Auth masih ada, tapi RequireAuth kamu akan menolak akses admin
 */
export const removeAdminAccess = async (uid) => {
  await deleteDoc(doc(db, "admins", uid));
};

export const setAdminActive = async (uid, active) => {
  const ref = doc(db, "admins", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { active: !!active });
  }
};
