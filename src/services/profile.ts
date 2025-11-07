import { auth, db, storage } from '../firebase/app';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

export type AppProfile = {
  displayName: string;
  photoURL?: string;
};

export async function loadProfile(): Promise<AppProfile | null> {
  const u = auth?.currentUser;
  if (!u) return null;
  try {
    const snap = await getDoc(doc(db!, 'users', u.uid));
    if (snap.exists()) return (snap.data() as AppProfile) || null;
  } catch {}
  // Fallback from auth
  return { displayName: u.displayName || 'Member', photoURL: u.photoURL || undefined };
}

export async function saveProfile(p: AppProfile): Promise<void> {
  const u = auth?.currentUser;
  if (!u) throw new Error('Not signed in');
  // Update Firebase Auth profile (displayName + photoURL)
  await updateProfile(u, { displayName: p.displayName, photoURL: p.photoURL });
  // Persist in Firestore
  await setDoc(doc(db!, 'users', u.uid), { displayName: p.displayName, photoURL: p.photoURL }, { merge: true });
}

export async function uploadAvatarAsync(uri: string): Promise<string> {
  const u = auth?.currentUser;
  if (!u) throw new Error('Not signed in');
  const r = ref(storage!, `users/${u.uid}/avatar.jpg`);
  // Fetch the file bytes
  const resp = await fetch(uri);
  const blob = await resp.blob();
  await uploadBytes(r, blob, { contentType: blob.type || 'image/jpeg' });
  const url = await getDownloadURL(r);
  return url;
}
