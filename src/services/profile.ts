import { auth, db } from '../firebase/app';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
    console.log('🔄 Loading profile from Firestore...', u.uid);
    const snap = await getDoc(doc(db!, 'users', u.uid));
    if (snap.exists()) {
      const profile = snap.data() as AppProfile;
      console.log('✅ Profile loaded from Firestore:', {
        hasPhotoURL: !!profile.photoURL,
        photoURLLength: profile.photoURL?.length,
        isBase64: profile.photoURL?.startsWith('data:image/')
      });
      return profile || null;
    }
  } catch (e) {
    console.error('❌ Failed to load from Firestore:', e);
  }
  // Fallback from auth (won't have base64 photoURL)
  console.log('🔄 Falling back to Firebase Auth profile...');
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
  
  console.log('🔄 Saving profile...', {
    uid: u.uid,
    displayName: p.displayName,
    hasPhotoURL: !!p.photoURL,
    photoURLLength: p.photoURL?.length
  });
  
  // Update Firebase Auth profile (displayName only - photoURL stored in Firestore due to length limits)
  const authUpdate1: { displayName: string; photoURL?: string } = { displayName: p.displayName };
  // Skip photoURL for Firebase Auth if it's base64 (too long)
  if (p.photoURL && !p.photoURL.startsWith('data:image/')) {
    authUpdate1.photoURL = p.photoURL;
  }
  await updateProfile(u, authUpdate1);
  console.log('✅ Firebase Auth profile updated (photoURL stored in Firestore)');
  
  // Force refresh the auth token to reflect profile changes
  try {
    await u.reload();
  } catch (e) {
    console.warn('[Profile] Failed to reload user', e);
  }
  
  // Persist in Firestore with all fields
  const firestoreData = {
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
  };
  
  console.log('🔄 Saving to Firestore...', firestoreData);
  await setDoc(
    doc(db!, 'users', u.uid),
    firestoreData,
    { merge: true }
  );
  console.log('✅ Profile saved to Firestore successfully');
}

// uploadAvatarAsync removed - now using Firebase Storage directly

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
  // Update Firebase Auth profile (displayName only - photoURL saved to Firestore)
  // Note: We don't save photoURL to Firebase Auth because base64 images are too long
  const authUpdate2: { displayName: string } = { displayName: p.displayName };
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
