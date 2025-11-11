import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { auth, db, isConfigured } from '../firebase/app';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithCredential,
  User,
} from 'firebase/auth';
 import * as WebBrowser from 'expo-web-browser';
 import * as Google from 'expo-auth-session/providers/google';
 import { useEffect as useReactEffect } from 'react';

 WebBrowser.maybeCompleteAuthSession();

type AuthContextType = {
  user: User | null;
  initializing: boolean;
  onboardingNeeded: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
};

const Ctx = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [onboardingNeeded, setOnboardingNeeded] = useState(false);

  useEffect(() => {
    if (!auth || !isConfigured) {
      console.log('Firebase not configured, skipping auth');
      setInitializing(false);
      return;
    }
    let profileUnsub: (() => void) | undefined;
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        console.log('[AuthContext] Auth state changed, user:', u?.email);
        setUser(u);
      if (u) {
        // live listen to user profile so onboardingNeeded updates immediately after save
        try {
          const userDoc = doc(db!, 'users', u.uid);
          const isNewUser = u.metadata && u.metadata.creationTime === u.metadata.lastSignInTime;
          console.log('[AuthContext] User metadata:', {
            creationTime: u.metadata?.creationTime,
            lastSignInTime: u.metadata?.lastSignInTime,
            isNewUser
          });
          
          profileUnsub = onSnapshot(
            userDoc,
            (snap) => {
              const profileExists = snap.exists();
              const data = profileExists ? (snap.data() as any) : {};
              
              console.log('[AuthContext] Profile snapshot:', {
                profileExists,
                onboardingComplete: data?.onboardingComplete,
                displayName: data?.displayName,
                age: data?.age,
                isNewUser
              });
              
              // Simple check: onboarding is complete ONLY if explicitly set to true
              const isComplete = data?.onboardingComplete === true;
              
              if (!profileExists) {
                // No profile document yet - new user needs onboarding
                console.log('[AuthContext] No profile - needs onboarding');
                setOnboardingNeeded(true);
                setInitializing(false);
                return;
              }
              
              if (isComplete) {
                // Onboarding explicitly completed
                console.log('[AuthContext] Onboarding complete!');
                setOnboardingNeeded(false);
                setInitializing(false);
                return;
              }
              
              // Profile exists but onboarding not complete
              console.log('[AuthContext] Profile exists but onboarding not complete - needs onboarding');
              setOnboardingNeeded(true);
              setInitializing(false);
            },
            (error) => {
              console.error('[AuthContext] Profile snapshot error:', error);
              // On error, assume new user needs onboarding
              setOnboardingNeeded(true);
              setInitializing(false);
            }
          );
        } catch (error) {
          console.error('[AuthContext] Profile setup error:', error);
          setOnboardingNeeded(true);
          setInitializing(false);
        }
      } else {
        // User logged out
        console.log('[AuthContext] User logged out');
        setOnboardingNeeded(false);
        setInitializing(false);
        if (profileUnsub) { try { profileUnsub(); } catch {} profileUnsub = undefined; }
      }
      } catch (error) {
        console.error('[AuthContext] Auth error:', error);
        setInitializing(false);
      }
    });
    return () => { if (profileUnsub) { try { profileUnsub(); } catch {} } unsub(); };
  }, []);

  const signInEmail = async (email: string, password: string) => {
    if (!auth || !isConfigured) return Alert.alert('Config missing', 'Add Firebase config first.');
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const signUpEmail = async (email: string, password: string) => {
    if (!auth || !isConfigured) return Alert.alert('Config missing', 'Add Firebase config first.');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const u = cred.user;
      console.log('[Auth] User created, uid:', u.uid);
      
      // Immediately set onboarding needed for new users
      setOnboardingNeeded(true);
      console.log('[Auth] Set onboardingNeeded to true for new user');
      
      try {
        // Seed a minimal profile doc so onboarding gating has a stable snapshot
        const userDoc = doc(db!, 'users', u.uid);
        const { setDoc } = await import('firebase/firestore');
        await setDoc(
          userDoc,
          { 
            onboardingComplete: false,
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );
        console.log('[Auth] User doc seeded successfully with onboardingComplete: false');
      } catch (e) {
        console.warn('[Auth] Failed to seed user doc', e);
      }
    } catch (e: any) {
      Alert.alert('Sign up failed', e?.message ?? 'Unknown error');
      throw e;
    }
  };

  const signOut = async () => {
    if (!auth || !isConfigured) return;
    await fbSignOut(auth);
  };

  // Google OAuth request using Expo provider
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '1028348652431-etvin8g5sdmq335qei2u37esu4hemebi.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_GOOGLE_CLIENT_ID',
    androidClientId: 'YOUR_ANDROID_GOOGLE_CLIENT_ID',
    scopes: ['profile', 'email'],
  });

  useReactEffect(() => {
    const run = async () => {
      if (!auth || !isConfigured) return;
      if (!response) return;
      console.log('[Auth] Google response:', response);
      if (response.type === 'success') {
        const accessToken = response.authentication?.accessToken;
        if (accessToken) {
          try {
            const credential = GoogleAuthProvider.credential(undefined, accessToken);
            await signInWithCredential(auth, credential);
            console.log('[Auth] Google sign-in success');
          } catch (e) {
            console.error('[Auth] signInWithCredential error', e);
            Alert.alert('Google sign-in failed', (e as any)?.message ?? 'Unknown error');
          }
        } else {
          console.warn('[Auth] No access token in Google response');
          Alert.alert('Google sign-in failed', 'No access token returned.');
        }
      } else if (response.type === 'error') {
        console.error('[Auth] Google response error', (response as any).error);
        Alert.alert('Google sign-in failed', 'Response type error.');
      }
    };
    run();
  }, [response]);

  const signInWithGoogle = async () => {
    if (!auth || !isConfigured) return Alert.alert('Config missing', 'Add Firebase config and Google OAuth.');
    if (!request) {
      console.warn('[Auth] Google request not ready');
      return Alert.alert('Google sign-in not ready', 'Please wait a second and try again.');
    }
    try {
      const result = await promptAsync({ useProxy: true, showInRecents: true });
      console.log('[Auth] promptAsync result:', result);
    } catch (e) {
      console.error('[Auth] promptAsync threw', e);
      Alert.alert('Google sign-in failed', (e as any)?.message ?? 'Unknown error');
    }
  };

  const value = useMemo(
    () => ({ user, initializing, onboardingNeeded, signInEmail, signUpEmail, signOut, signInWithGoogle }),
    [user, initializing, onboardingNeeded]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
};
