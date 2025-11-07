import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
 import { firebaseConfig } from './config';

 const isConfigured = !!(firebaseConfig.apiKey && firebaseConfig.appId && firebaseConfig.projectId);
 // Diagnostics for web
 // eslint-disable-next-line no-console
 console.log('[Firebase web] config present?', {
   apiKey: !!firebaseConfig.apiKey,
   appId: !!firebaseConfig.appId,
   projectId: !!firebaseConfig.projectId,
 });
 // eslint-disable-next-line no-console
 console.log('[Firebase web] isConfigured =', isConfigured);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage, isConfigured };
