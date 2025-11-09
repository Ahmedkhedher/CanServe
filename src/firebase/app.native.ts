import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from './config';

const isConfigured = !!(firebaseConfig.apiKey && firebaseConfig.appId && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isConfigured) {
  try {
    console.log('Initializing Firebase...');
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    console.log('Firebase app initialized');
    
    try {
      // Prefer initializing Auth with React Native persistence on native platforms
      const { getReactNativePersistence } = require('firebase/auth');
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
      console.log('Auth initialized with persistence');
    } catch (e) {
      // If Auth was already initialized (e.g., fast refresh), fall back to retrieving it
      console.log('Using existing auth instance');
      auth = getAuth(app);
    }
    
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('Firebase services initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export { app, auth, db, storage, isConfigured };
