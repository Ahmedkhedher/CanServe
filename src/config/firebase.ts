import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Firebase configuration for Cancer Awareness QA App
// Using a demo project - you can replace with your own Firebase project
const firebaseConfig = {
  apiKey: "AIzaSyDemoKey123456789",
  authDomain: "cancer-awareness-qa.firebaseapp.com",
  projectId: "cancer-awareness-qa",
  storageBucket: "cancer-awareness-qa.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Firebase Auth (if needed)
export const auth = getAuth(app);

export default app;
