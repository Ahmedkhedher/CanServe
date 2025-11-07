import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Device type detection
export const isSmartwatch = width < 250 || height < 250;
export const isSmallPhone = width < 360 && !isSmartwatch;
export const isPhone = width < 768 && !isSmartwatch && !isSmallPhone;
export const isTablet = width >= 768 && width < 1024;
export const isDesktop = width >= 1024;

// Responsive font scaling
export const scaleFontSize = (size: number): number => {
  if (isSmartwatch) return Math.round(size * 0.6);
  if (isSmallPhone) return Math.round(size * 0.85);
  if (isTablet) return Math.round(size * 1.1);
  if (isDesktop) return Math.round(size * 1.2);
  return size;
};

// Responsive spacing
export const scaleSpacing = (value: number): number => {
  if (isSmartwatch) return Math.round(value * 0.5);
  if (isSmallPhone) return Math.round(value * 0.8);
  if (isTablet) return Math.round(value * 1.15);
  if (isDesktop) return Math.round(value * 1.3);
  return value;
};

// Responsive sizing
export const scaleSize = (size: number): number => {
  if (isSmartwatch) return Math.round(size * 0.6);
  if (isSmallPhone) return Math.round(size * 0.85);
  if (isTablet) return Math.round(size * 1.1);
  if (isDesktop) return Math.round(size * 1.15);
  return size;
};

// Layout helpers
export const getColumns = (): number => {
  if (isSmartwatch) return 1;
  if (isSmallPhone) return 1;
  if (isPhone) return 1;
  if (isTablet) return 2;
  return 3;
};

// Get responsive value based on device
export const responsive = <T,>(values: {
  watch?: T;
  smallPhone?: T;
  phone?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T => {
  if (isSmartwatch && values.watch !== undefined) return values.watch;
  if (isSmallPhone && values.smallPhone !== undefined) return values.smallPhone;
  if (isPhone && values.phone !== undefined) return values.phone;
  if (isTablet && values.tablet !== undefined) return values.tablet;
  if (isDesktop && values.desktop !== undefined) return values.desktop;
  return values.default;
};

// Screen dimensions
export const screenWidth = width;
export const screenHeight = height;
export const isLandscape = width > height;
