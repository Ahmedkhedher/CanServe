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
        setUser(u);
      if (u) {
        // live listen to user profile so onboardingNeeded updates immediately after save
        try {
          const userDoc = doc(db!, 'users', u.uid);
          const isNewUser = u.metadata && u.metadata.creationTime === u.metadata.lastSignInTime;
          
          profileUnsub = onSnapshot(
            userDoc,
            (snap) => {
              const profileExists = snap.exists();
              const data = profileExists ? (snap.data() as any) : {};
              
              // Check if onboarding is complete
              const explicitComplete = data?.onboardingComplete === true;
              const hasBasicInfo = !!(data?.displayName) && typeof data?.age === 'number';
              
              // New users without profile need onboarding
              if (!profileExists && isNewUser) {
                console.log('New user detected - needs onboarding');
                setOnboardingNeeded(true);
                return;
              }
              
              // Existing users who haven't completed onboarding
              if (!explicitComplete && !hasBasicInfo) {
                console.log('User needs onboarding - incomplete profile');
                setOnboardingNeeded(true);
                return;
              }
              
              // Onboarding is complete
              console.log('Onboarding complete');
              setOnboardingNeeded(false);
            },
            (error) => {
              console.error('Profile snapshot error:', error);
              // On error, assume new user needs onboarding
              setOnboardingNeeded(true);
            }
          );
        } catch (error) {
          console.error('Profile setup error:', error);
          setOnboardingNeeded(true);
        }
      } else {
        setOnboardingNeeded(false);
        if (profileUnsub) { try { profileUnsub(); } catch {} profileUnsub = undefined; }
      }
      setInitializing(false);
      } catch (error) {
        console.error('Auth error:', error);
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
      try {
        // Seed a minimal profile doc so onboarding gating has a stable snapshot
        const userDoc = doc(db!, 'users', u.uid);
        await (await import('firebase/firestore')).setDoc(
          userDoc,
          { onboardingComplete: false },
          { merge: true }
        );
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
