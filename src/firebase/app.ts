 import { Platform } from 'react-native';

// Use explicit platform selection to avoid importing RN-only modules on web
// and to keep typing simple across the app.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const impl = Platform.OS === 'web' ? require('./app.web') : require('./app.native');

export const app = impl.app;
export const auth = impl.auth;
export const db = impl.db;
export const storage = impl.storage;
export const isConfigured = impl.isConfigured;
