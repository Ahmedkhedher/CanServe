import { auth, db } from '../firebase/app';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { uploadAvatar } from './minioStorage';

export type AppProfile = {
  displayName: string;
  photoURL?: string;
  cancerType?: string;
  stage?: string;
  age?: number;
  onboardingComplete?: boolean;
  diagnosed?: boolean;
  gender?: string;
  role?: string;
  country?: string;
  inTreatment?: boolean;
  treatmentTypes?: string[];
  diagnosisYear?: number;
  interests?: string[];
  allowMessages?: boolean;
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

export async function loadUserProfile(userId: string): Promise<AppProfile | null> {
  if (!userId) return null;
  try {
    const snap = await getDoc(doc(db!, 'users', userId));
    if (snap.exists()) {
      return (snap.data() as AppProfile) || null;
    }
  } catch (e) {
    console.error('[Profile] Failed to load user profile:', e);
  }
  return null;
}

export async function saveProfile(p: AppProfile): Promise<void> {
  const u = auth?.currentUser;
  if (!u) throw new Error('Not signed in');
  // Update Firebase Auth profile (displayName + optional photoURL)
  const authUpdate1: { displayName: string; photoURL?: string } = { displayName: p.displayName };
  if (p.photoURL) authUpdate1.photoURL = p.photoURL;
  await updateProfile(u, authUpdate1);
  
  // Force refresh the auth token to reflect profile changes
  try {
    await u.reload();
  } catch (e) {
    console.warn('[Profile] Failed to reload user', e);
  }
  
  // Persist in Firestore with all fields
  await setDoc(
    doc(db!, 'users', u.uid),
    {
      displayName: p.displayName,
      ...(p.photoURL ? { photoURL: p.photoURL } : {}),
      ...(p.cancerType ? { cancerType: p.cancerType } : {}),
      ...(p.stage ? { stage: p.stage } : {}),
      ...(typeof p.age === 'number' ? { age: p.age } : {}),
      ...(typeof p.onboardingComplete === 'boolean' ? { onboardingComplete: p.onboardingComplete } : {}),
      ...(typeof p.diagnosed === 'boolean' ? { diagnosed: p.diagnosed } : {}),
      ...(p.gender ? { gender: p.gender } : {}),
      ...(p.role ? { role: p.role } : {}),
      ...(p.country ? { country: p.country } : {}),
      ...(typeof p.inTreatment === 'boolean' ? { inTreatment: p.inTreatment } : {}),
      ...(p.treatmentTypes && p.treatmentTypes.length ? { treatmentTypes: p.treatmentTypes } : {}),
      ...(typeof p.diagnosisYear === 'number' ? { diagnosisYear: p.diagnosisYear } : {}),
      ...(p.interests && p.interests.length ? { interests: p.interests } : {}),
      ...(typeof p.allowMessages === 'boolean' ? { allowMessages: p.allowMessages } : {}),
    },
    { merge: true }
  );
}

export async function uploadAvatarAsync(uri: string): Promise<string> {
  const u = auth?.currentUser;
  if (!u) throw new Error('Not signed in');
  // Upload to MinIO storage
  const url = await uploadAvatar(uri, u.uid);
  return url;
}

export async function saveOnboardingProfile(p: Required<Pick<AppProfile, 'displayName'>> & {
  photoURL?: string;
  cancerType: string;
  stage: string;
  age: number;
  onboardingComplete: boolean;
  diagnosed?: boolean;
  gender?: string;
  role?: string;
  country?: string;
  inTreatment?: boolean;
  treatmentTypes?: string[];
  diagnosisYear?: number;
  interests?: string[];
  allowMessages?: boolean;
}): Promise<void> {
  const u = auth?.currentUser;
  if (!u) throw new Error('Not signed in');
  // Update Firebase Auth profile (displayName + optional photoURL)
  const authUpdate2: { displayName: string; photoURL?: string } = { displayName: p.displayName };
  if (p.photoURL) authUpdate2.photoURL = p.photoURL;
  await updateProfile(u, authUpdate2);
  
  // Force refresh the auth token to reflect profile changes
  try {
    await u.reload();
  } catch (e) {
    console.warn('[Profile] Failed to reload user', e);
  }
  
  // Persist all onboarding data in Firestore
  await setDoc(
    doc(db!, 'users', u.uid),
    {
      displayName: p.displayName,
      ...(p.photoURL ? { photoURL: p.photoURL } : {}),
      cancerType: p.cancerType,
      stage: p.stage,
      age: p.age,
      onboardingComplete: p.onboardingComplete,
      ...(typeof p.diagnosed === 'boolean' ? { diagnosed: p.diagnosed } : {}),
      ...(p.gender ? { gender: p.gender } : {}),
      ...(p.role ? { role: p.role } : {}),
      ...(p.country ? { country: p.country } : {}),
      ...(typeof p.inTreatment === 'boolean' ? { inTreatment: p.inTreatment } : {}),
      ...(p.treatmentTypes && p.treatmentTypes.length ? { treatmentTypes: p.treatmentTypes } : {}),
      ...(typeof p.diagnosisYear === 'number' ? { diagnosisYear: p.diagnosisYear } : {}),
      ...(p.interests && p.interests.length ? { interests: p.interests } : {}),
      ...(typeof p.allowMessages === 'boolean' ? { allowMessages: p.allowMessages } : {}),
    },
    { merge: true }
  );
}
