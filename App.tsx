 import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoadingSpinner } from './src/ui/components';
import { theme } from './src/ui/theme';
import { scaleFontSize } from './src/ui/responsive';
import { ErrorBoundary } from './src/components/ErrorBoundary';

function Root() {
  console.log('Root component rendering');
  const { user, initializing, onboardingNeeded } = useAuth();
  console.log('Auth state:', { hasUser: !!user, initializing, onboardingNeeded });
  
  if (initializing) {
    console.log('Showing loading screen');
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  
  console.log('Loading complete, rendering navigator');
  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator isAuthenticated={!!user} onboardingNeeded={onboardingNeeded} />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
  },
  loadingCard: {
    alignItems: 'center',
    padding: theme.spacing(4),
  },
  logo: {
    width: scaleFontSize(80),
    height: scaleFontSize(80),
    borderRadius: scaleFontSize(40),
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(3),
    ...theme.shadows.xl,
  },
  logoText: {
    color: theme.colors.primaryText,
    fontSize: scaleFontSize(36),
    fontWeight: '800',
  },
  loadingText: {
    marginTop: theme.spacing(2),
    color: theme.colors.text,
    fontSize: scaleFontSize(16),
    fontWeight: '600',
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </ErrorBoundary>
  );
}
