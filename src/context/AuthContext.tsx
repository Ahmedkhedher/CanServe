import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { auth, isConfigured } from '../firebase/app';
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
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
};

const Ctx = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!auth || !isConfigured) {
      setInitializing(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return unsub;
  }, []);

  const signInEmail = async (email: string, password: string) => {
    if (!auth || !isConfigured) return Alert.alert('Config missing', 'Add Firebase config first.');
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const signUpEmail = async (email: string, password: string) => {
    if (!auth || !isConfigured) return Alert.alert('Config missing', 'Add Firebase config first.');
    await createUserWithEmailAndPassword(auth, email.trim(), password);
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
    () => ({ user, initializing, signInEmail, signUpEmail, signOut, signInWithGoogle }),
    [user, initializing]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
};
