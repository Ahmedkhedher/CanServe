import { scaleFontSize, scaleSpacing, scaleSize, isSmartwatch } from './responsive';

export const theme = {
  colors: {
    // Facebook-inspired blue and white theme
    bg: '#F0F2F5',            // Facebook light gray background
    bgDark: '#18191A',        // dark mode background
    card: '#FFFFFF',
    cardDark: '#242526',      // dark mode card
    text: '#050505',          // almost black text
    textDark: '#E4E6EB',      // dark mode text
    subtext: '#65676B',       // Facebook gray text
    subtextDark: '#B0B3B8',   // dark mode subtext
    primary: '#1877F2',       // Facebook blue
    primaryHover: '#166FE5',  // darker blue for hover
    primaryLight: '#E7F3FF',  // light blue background
    primaryText: '#FFFFFF',
    border: '#CED0D4',        // light gray border
    borderDark: '#3E4042',    // dark mode border
    accent: '#42B72A',        // Facebook green
    accentLight: '#E7F5E4',   // light green
    danger: '#F02849',        // Facebook red
    dangerLight: '#FFE5E9',   // light red
    warning: '#F7B928',       // Facebook yellow
    info: '#1877F2',          // Facebook blue
    success: '#42B72A',       // Facebook green
    
    // Gradient colors
    gradientStart: '#1877F2',
    gradientEnd: '#0A66C2',   // LinkedIn blue
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.6)',
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
