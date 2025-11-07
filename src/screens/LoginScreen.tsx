import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { ButtonPrimary, ButtonSecondary, ButtonOutline, Card } from '../ui/components';
import { useAuth } from '../context/AuthContext';
import { isConfigured } from '../firebase/app';
import { theme } from '../ui/theme';
import { isSmartwatch, scaleFontSize } from '../ui/responsive';

const LoginScreen: React.FC = () => {
  const { signInEmail, signUpEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<'signin' | 'signup' | 'google' | null>(null);
  const [error, setError] = useState<string>('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  console.log('[UI] isConfigured =', isConfigured);
  
  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Logo and Title */}
          <View style={styles.header}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>LW</Text>
            </View>
            <Text style={styles.title}>LifeWeaver</Text>
            <Text style={styles.subtitle}>
              {isSmartwatch ? 'Cancer Awareness Q&A' : 'Cancer Awareness & Support Community'}
            </Text>
          </View>

          {/* Login Form Card */}
          <Card elevated style={styles.formCard}>
            <Text style={styles.formTitle}>{isSmartwatch ? 'Sign In' : 'Welcome Back'}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                placeholder="your@email.com"
                placeholderTextColor={theme.colors.subtext}
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={theme.colors.subtext}
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}

            <View style={styles.buttonGroup}>
              <ButtonPrimary
                title={loading === 'signin' ? 'Signing in…' : 'Sign In'}
                disabled={!!loading}
                size={isSmartwatch ? 'sm' : 'md'}
                onPress={async () => {
                  setError('');
                  const emailTrimmed = email.trim();
                  const validEmail = /.+@.+\..+/.test(emailTrimmed);
                  if (!validEmail) {
                    setError('Please enter a valid email address.');
                    return;
                  }
                  if (!password) {
                    setError('Please enter your password.');
                    return;
                  }
                  setLoading('signin');
                  try {
                    console.log('[UI] Sign In pressed');
                    alert('Sign In pressed');
                    await signInEmail(emailTrimmed, password);
                  } catch (e: any) {
                    setError(e?.message || 'Failed to sign in');
                  } finally {
                    setLoading(null);
                  }
                }}
              />
              
              <View style={{ height: theme.spacing(1) }} />
              
              <ButtonSecondary
                title={loading === 'signup' ? 'Signing up…' : 'Create Account'}
                disabled={!!loading}
                size={isSmartwatch ? 'sm' : 'md'}
                onPress={async () => {
                  setError('');
                  const emailTrimmed = email.trim();
                  const validEmail = /.+@.+\..+/.test(emailTrimmed);
                  if (!validEmail) {
                    setError('Please enter a valid email address.');
                    return;
                  }
                  if (!password) {
                    setError('Please enter a password.');
                    return;
                  }
                  if (password.length < 6) {
                    setError('Password must be at least 6 characters.');
                    return;
                  }
                  setLoading('signup');
                  try {
                    console.log('[UI] Sign Up pressed');
                    alert('Sign Up pressed');
                    await signUpEmail(emailTrimmed, password);
                  } catch (e: any) {
                    setError(e?.message || 'Failed to sign up');
                  } finally {
                    setLoading(null);
                  }
                }}
              />
            </View>

            {!isSmartwatch && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <ButtonOutline
                  title={loading === 'google' ? 'Opening…' : '🌐 Continue with Google'}
                  disabled={!!loading}
                  onPress={async () => {
                    setError('');
                    setLoading('google');
                    try {
                      console.log('[UI] Google pressed');
                      alert('Google pressed');
                      await signInWithGoogle();
                    } catch (e: any) {
                      setError(e?.message || 'Google sign-in failed');
                    } finally {
                      setLoading(null);
                    }
                  }}
                />
              </>
            )}
          </Card>

          {!!loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            {isSmartwatch 
              ? 'For awareness only' 
              : 'This app is for awareness only and does not replace professional medical advice.'}
          </Text>
          
          {!isSmartwatch && (
            <Text style={styles.configHint}>
              Status: {isConfigured ? '✓ Connected' : '⚠️ Not configured'}
            </Text>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing(isSmartwatch ? 1 : 2),
  },
  content: {
    width: '100%',
    maxWidth: isSmartwatch ? '100%' : 400,
    alignSelf: 'center',
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  },
  logo: {
    width: scaleFontSize(isSmartwatch ? 48 : 80),
    height: scaleFontSize(isSmartwatch ? 48 : 80),
    borderRadius: scaleFontSize(isSmartwatch ? 24 : 40),
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(2),
    ...theme.shadows.lg,
  },
  logoText: {
    color: theme.colors.primaryText,
    fontSize: scaleFontSize(isSmartwatch ? 20 : 36),
    fontWeight: '800',
  },
  title: {
    fontSize: scaleFontSize(isSmartwatch ? 18 : 32),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing(0.5),
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: scaleFontSize(isSmartwatch ? 11 : 16),
    color: theme.colors.subtext,
    textAlign: 'center',
  },
  
  // Form Card
  formCard: {
    marginBottom: theme.spacing(2),
  },
  formTitle: {
    fontSize: scaleFontSize(isSmartwatch ? 16 : 22),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing(2),
    textAlign: 'center',
  },
  
  // Input Group
  inputGroup: {
    marginBottom: theme.spacing(1.5),
  },
  label: {
    fontSize: scaleFontSize(isSmartwatch ? 11 : 14),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing(0.5),
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing(isSmartwatch ? 1 : 1.5),
    fontSize: scaleFontSize(isSmartwatch ? 12 : 16),
    color: theme.colors.text,
    backgroundColor: theme.colors.bg,
  },
  
  // Error Box
  errorBox: {
    backgroundColor: theme.colors.dangerLight,
    borderRadius: theme.radius.sm,
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(2),
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: scaleFontSize(isSmartwatch ? 11 : 14),
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Buttons
  buttonGroup: {
    marginTop: theme.spacing(1),
  },
  
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing(2),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: theme.spacing(2),
    color: theme.colors.subtext,
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
  
  // Loading
  loadingContainer: {
    marginTop: theme.spacing(2),
    alignItems: 'center',
  },
  
  // Footer
  disclaimer: {
    marginTop: theme.spacing(2),
    color: theme.colors.subtext,
    textAlign: 'center',
    fontSize: scaleFontSize(isSmartwatch ? 10 : 12),
    lineHeight: scaleFontSize(isSmartwatch ? 14 : 18),
    paddingHorizontal: theme.spacing(2),
  },
  configHint: {
    marginTop: theme.spacing(1),
    color: theme.colors.subtext,
    textAlign: 'center',
    fontSize: scaleFontSize(11),
  },
});

export default LoginScreen;
