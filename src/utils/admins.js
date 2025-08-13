import { createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, updateEmail, updateProfile } from "firebase/auth";
import { collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp, getDoc, updateDoc, query, orderBy } from "firebase/firestore";
import { auth, db, getSecondaryAuth } from "../firebase";

/**
 * Create an admin user (Auth + Firestore 'admins/{uid}')
 * - create with secondary auth (so it doesn't disturb current session)
 * - set Firestore: { nama, email, role, active, createdAt }
 * - sendPasswordResetEmail to let them set their password
 */
export const createAdmin = async ({ nama, email, role = "admin", sendInvite = true }) => {
  const secondaryAuth = getSecondaryAuth();

  // 1) create user in Auth temp session
  const cred = await createUserWithEmailAndPassword(secondaryAuth, email, crypto.randomUUID().slice(0, 8) + "Aa!");
  const uid = cred.user.uid;

  try {
    // 2) write admins doc
    await setDoc(doc(db, "admins", uid), {
      nama: nama || "",
      email,
      role,
      active: true,
      createdAt: serverTimestamp(),
    });

    // optional: Invite via email reset
    if (sendInvite) {
      await sendPasswordResetEmail(secondaryAuth, email);
    }
  } finally {
    // 3) logout secondary session
    await signOut(secondaryAuth).catch(() => {});
  }

  return uid;
};

/**
 * Soft delete / deactivate admin by deleting admins doc
 * Note: We cannot delete Auth user from client; removing Firestore doc will cut off panel access.
 */
export const deactivateAdmin = async (uid) => {
  // Option A: full delete doc -> cannot access panel anymore
  await deleteDoc(doc(db, "admins", uid));
  // Option B: set active=false (then RequireAuth refuse)
  // await updateDoc(doc(db, 'admins', uid), { active: false });
};

/** List admins sorted by createdAt/name for display */
export const listAdmins = async () => {
  const snap = await getDocs(query(collection(db, "admins"), orderBy("nama")));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
};

/** Update admin doc fields (e.g., role, nama, active) */
export const updateAdminDoc = async (uid, data) => {
  await updateDoc(doc(db, "admins", uid), data);
};

/** Update current admin's own profile (displayName + Firestore name) */
export const updateSelfProfile = async ({ nama, email }) => {
  if (!auth.currentUser) throw new Error("Not logged in");

  const u = auth.currentUser;

  // Update auth email if changed
  if (email && email !== u.email) {
    await updateEmail(u, email);
  }

  // Update displayName
  if (nama && nama !== u.displayName) {
    await updateProfile(u, { displayName: nama });
  }

  // Update admins doc
  const ref = doc(db, "admins", u.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, {
      nama: nama ?? snap.data().nama ?? "",
      email: email ?? snap.data().email ?? u.email,
      updatedAt: serverTimestamp(),
    });
  } else {
    // ensure doc exists
    await setDoc(ref, {
      nama: nama || u.displayName || "",
      email: email || u.email,
      role: "admin",
      active: true,
      createdAt: serverTimestamp(),
    });
  }
};

/** Send a forgot password email to any admin email (no login required) */
export const sendResetEmail = async (email) => {
  const secondaryAuth = getSecondaryAuth();
  await sendPasswordResetEmail(secondaryAuth, email);
  await signOut(secondaryAuth).catch(() => {});
};
