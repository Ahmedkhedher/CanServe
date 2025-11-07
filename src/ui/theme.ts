import { scaleFontSize, scaleSpacing, scaleSize, isSmartwatch } from './responsive';

export const theme = {
  colors: {
    bg: '#F7F6FB',            // soft lavender tint
    bgDark: '#1F2937',        // dark mode background
    card: '#FFFFFF',
    cardDark: '#374151',      // dark mode card
    text: '#1F2937',
    textDark: '#F9FAFB',      // dark mode text
    subtext: '#6B7280',
    subtextDark: '#9CA3AF',   // dark mode subtext
    primary: '#8B5CF6',       // violet (calming)
    primaryHover: '#7C3AED',  // darker violet for hover
    primaryLight: '#A78BFA',  // lighter violet
    primaryText: '#FFFFFF',
    border: '#E5E7EB',
    borderDark: '#4B5563',    // dark mode border
    accent: '#22C55E',        // calming green
    accentLight: '#86EFAC',   // light green
    danger: '#EF4444',
    dangerLight: '#FCA5A5',   // light red
    warning: '#F59E0B',       // amber
    info: '#3B82F6',          // blue
    success: '#10B981',       // emerald
    
    // Gradient colors
    gradientStart: '#8B5CF6',
    gradientEnd: '#EC4899',   // pink
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
  },
  spacing: (n: number) => scaleSpacing(n * 8),
  radius: {
    xs: scaleSize(6),
    sm: scaleSize(10),
    md: scaleSize(14),
    lg: scaleSize(18),
    xl: scaleSize(24),
    full: 9999,
  },
  typography: {
    // Responsive typography
    hero: { 
      fontSize: scaleFontSize(isSmartwatch ? 18 : 32), 
      fontWeight: '800' as const,
      lineHeight: scaleFontSize(isSmartwatch ? 22 : 38),
    },
    title: { 
      fontSize: scaleFontSize(22), 
      fontWeight: '700' as const,
      lineHeight: scaleFontSize(28),
    },
    h1: {
      fontSize: scaleFontSize(28),
      fontWeight: '700' as const,
      lineHeight: scaleFontSize(34),
    },
    h2: { 
      fontSize: scaleFontSize(18), 
      fontWeight: '700' as const,
      lineHeight: scaleFontSize(24),
    },
    h3: {
      fontSize: scaleFontSize(16),
      fontWeight: '600' as const,
      lineHeight: scaleFontSize(22),
    },
    body: { 
      fontSize: scaleFontSize(16),
      lineHeight: scaleFontSize(24),
    },
    bodySmall: {
      fontSize: scaleFontSize(14),
      lineHeight: scaleFontSize(20),
    },
    meta: { 
      fontSize: scaleFontSize(13), 
      color: '#6B7280',
      lineHeight: scaleFontSize(18),
    },
    caption: {
      fontSize: scaleFontSize(11),
      color: '#9CA3AF',
      lineHeight: scaleFontSize(16),
    },
    tag: { 
      fontSize: scaleFontSize(12), 
      color: '#FFFFFF', 
      fontWeight: '600' as const,
      lineHeight: scaleFontSize(16),
    },
  },
  // Shadows for depth
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  // Animation durations
  animation: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
};
