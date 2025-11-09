import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, GestureResponderEvent, ViewStyle, Animated, Image } from 'react-native';
import { theme } from './theme';
import { isSmartwatch, scaleFontSize } from './responsive';
import { useAuth } from '../context/AuthContext';

export const ButtonPrimary: React.FC<{ title: string; onPress?: (e: GestureResponderEvent) => void; style?: ViewStyle; disabled?: boolean; size?: 'sm' | 'md' | 'lg' }>
  = ({ title, onPress, style, disabled, size = 'md' }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, friction: 5 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  
  const sizeStyle = size === 'sm' ? styles.btnSm : size === 'lg' ? styles.btnLg : styles.btnMd;
  
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        style={[styles.btn, styles.btnPrimary, sizeStyle, disabled && styles.btnDisabled, style]}
        activeOpacity={0.85}
      >
        <Text style={[styles.btnText, styles.btnTextPrimary, disabled && styles.btnTextDisabled]}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ButtonSecondary: React.FC<{ title: string; onPress?: (e: GestureResponderEvent) => void; style?: ViewStyle; disabled?: boolean; size?: 'sm' | 'md' | 'lg' }>
  = ({ title, onPress, style, disabled, size = 'md' }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, friction: 5 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  
  const sizeStyle = size === 'sm' ? styles.btnSm : size === 'lg' ? styles.btnLg : styles.btnMd;
  
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        style={[styles.btn, styles.btnSecondary, sizeStyle, disabled && styles.btnDisabled, style]}
        activeOpacity={0.85}
      >
        <Text style={[styles.btnText, styles.btnTextSecondary, disabled && styles.btnTextDisabled]}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ButtonOutline: React.FC<{ title: string; onPress?: (e: GestureResponderEvent) => void; style?: ViewStyle; disabled?: boolean; size?: 'sm' | 'md' | 'lg' }>
  = ({ title, onPress, style, disabled, size = 'md' }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, friction: 5 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  
  const sizeStyle = size === 'sm' ? styles.btnSm : size === 'lg' ? styles.btnLg : styles.btnMd;
  
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        style={[styles.btn, styles.btnOutline, sizeStyle, disabled && styles.btnDisabled, style]}
        activeOpacity={0.85}
      >
        <Text style={[styles.btnText, styles.btnTextOutline, disabled && styles.btnTextDisabled]}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const Tag: React.FC<{ text: string; color?: 'primary' | 'accent' | 'warning' | 'danger' | 'info' }>= ({ text, color = 'primary' }) => {
  const colorMap = {
    primary: theme.colors.primary,
    accent: theme.colors.accent,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    info: theme.colors.info,
  };
  return (
    <View style={[styles.tag, { backgroundColor: colorMap[color] }]}>
      <Text style={styles.tagText}>{text}</Text>
    </View>
  );
};

export const MetaText: React.FC<{ children: React.ReactNode; style?: ViewStyle }>= ({ children, style }) => (
  <Text style={[styles.meta, style]}>{children}</Text>
);

export const Card: React.FC<{ children: React.ReactNode; style?: ViewStyle; elevated?: boolean }>= ({ children, style, elevated }) => (
  <View style={[styles.card, elevated && theme.shadows.md, style]}>{children}</View>
);

export const Divider: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.divider, style]} />
);

export const Badge: React.FC<{ count: number; style?: ViewStyle }> = ({ count, style }) => {
  if (count === 0) return null;
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
};

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const rotation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const animate = () => {
      rotation.setValue(0);
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => animate());
    };
    animate();
  }, [rotation]);
  
  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  const sizeMap = { sm: 20, md: 32, lg: 48 };
  const spinnerSize = sizeMap[size];
  
  return (
    <Animated.View style={[styles.spinner, { width: spinnerSize, height: spinnerSize, transform: [{ rotate: spin }] }]}>
      <View style={styles.spinnerRing} />
    </Animated.View>
  );
};

export const FooterBar: React.FC<{
  active?: 'home' | 'qa' | 'chat' | 'profile';
  onHome: () => void;
  onQA: () => void;
  onChat: () => void;
  onProfile: () => void;
  onPlus?: () => void;
}> = ({ active, onHome, onQA, onChat, onProfile, onPlus }) => {
  const { user } = useAuth();
  const scale1 = useRef(new Animated.Value(active === 'home' ? 1.1 : 1)).current;
  const scale2 = useRef(new Animated.Value(active === 'qa' ? 1.1 : 1)).current;
  const scale3 = useRef(new Animated.Value(active === 'chat' ? 1.1 : 1)).current;
  const scale4 = useRef(new Animated.Value(active === 'profile' ? 1.1 : 1)).current;
  
  useEffect(() => {
    Animated.spring(scale1, { toValue: active === 'home' ? 1.1 : 1, useNativeDriver: true }).start();
    Animated.spring(scale2, { toValue: active === 'qa' ? 1.1 : 1, useNativeDriver: true }).start();
    Animated.spring(scale3, { toValue: active === 'chat' ? 1.1 : 1, useNativeDriver: true }).start();
    Animated.spring(scale4, { toValue: active === 'profile' ? 1.1 : 1, useNativeDriver: true }).start();
  }, [active, scale1, scale2, scale3, scale4]);
  
  return (
    <View style={styles.footerWrap}>
      <View style={[styles.footerBar, theme.shadows.lg]}>
      <Animated.View style={{ transform: [{ scale: scale1 }] }}>
        <TouchableOpacity onPress={onHome} style={styles.footerBtn}>
          <Text style={[styles.footerIcon, active==='home' && styles.footerIconActive]}>🏠</Text>
          {!isSmartwatch && <Text style={[styles.footerLbl, active==='home' && styles.footerLblActive]}>Home</Text>}
        </TouchableOpacity>
      </Animated.View>
      <Animated.View style={{ transform: [{ scale: scale2 }] }}>
        <TouchableOpacity onPress={onQA} style={styles.footerBtn}>
          <Text style={[styles.footerIcon, active==='qa' && styles.footerIconActive]}>❓</Text>
          {!isSmartwatch && <Text style={[styles.footerLbl, active==='qa' && styles.footerLblActive]}>Q&A</Text>}
        </TouchableOpacity>
      </Animated.View>
      <Animated.View style={{ transform: [{ scale: scale3 }] }}>
        <TouchableOpacity onPress={onChat} style={styles.footerBtn}>
          <Text style={[styles.footerIcon, active==='chat' && styles.footerIconActive]}>💬</Text>
          {!isSmartwatch && <Text style={[styles.footerLbl, active==='chat' && styles.footerLblActive]}>AI Chat</Text>}
        </TouchableOpacity>
      </Animated.View>
      <View style={{ flex: 1 }} />
      <Animated.View style={{ transform: [{ scale: scale4 }] }}>
        <TouchableOpacity onPress={onProfile} style={[styles.footerBtn, styles.footerUser]}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.footerAvatar} />
          ) : (
            <View style={styles.footerAvatarFallback}>
              <Text style={styles.footerAvatarText}>{(user?.displayName || 'U').slice(0,1).toUpperCase()}</Text>
            </View>
          )}
          {!isSmartwatch && (
            <Text style={[styles.footerUserName]} numberOfLines={1}>
              {user?.displayName || user?.email || 'Profile'}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
      </View>
      {!!onPlus && (
        <TouchableOpacity onPress={onPlus} style={[styles.plusBtn, theme.shadows.xl]} activeOpacity={0.9}>
          <Text style={styles.plusIcon}>＋</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Button base styles
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    flexDirection: 'row',
  },
  btnSm: {
    paddingVertical: theme.spacing(0.75),
    paddingHorizontal: theme.spacing(1.5),
  },
  btnMd: {
    paddingVertical: theme.spacing(1.25),
    paddingHorizontal: theme.spacing(2),
  },
  btnLg: {
    paddingVertical: theme.spacing(1.75),
    paddingHorizontal: theme.spacing(3),
  },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  btnSecondary: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  btnDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.6,
  },
  btnText: {
    fontWeight: '700',
    fontSize: scaleFontSize(isSmartwatch ? 12 : 15),
  },
  btnTextPrimary: {
    color: theme.colors.primaryText,
  },
  btnTextSecondary: {
    color: theme.colors.text,
  },
  btnTextOutline: {
    color: theme.colors.primary,
  },
  btnTextDisabled: {
    color: theme.colors.subtext,
  },
  
  // Tag styles
  tag: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(0.5),
    marginBottom: theme.spacing(0.75),
  },
  tagText: {
    ...theme.typography.tag as any,
  },
  
  // Text styles
  meta: {
    ...theme.typography.meta as any,
  },
  
  // Card styles
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(2),
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing(2),
  },
  
  // Badge
  badge: {
    backgroundColor: theme.colors.danger,
    borderRadius: theme.radius.full,
    minWidth: scaleFontSize(20),
    height: scaleFontSize(20),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing(0.5),
  },
  badgeText: {
    color: '#fff',
    fontSize: scaleFontSize(10),
    fontWeight: '700',
  },
  
  // Spinner
  spinner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerRing: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    borderTopColor: 'transparent',
  },
  
  // Footer bar (pill)
  footerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: theme.spacing(1),
  },
  footerBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: isSmartwatch ? theme.spacing(0.25) : theme.spacing(0.75),
    paddingHorizontal: theme.spacing(1.5),
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: theme.radius.full,
    marginHorizontal: theme.spacing(3),
  },
  footerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing(0.5),
    paddingHorizontal: theme.spacing(1),
  },
  footerIcon: {
    fontSize: scaleFontSize(isSmartwatch ? 16 : 20),
    color: theme.colors.subtext,
  },
  footerIconActive: {
    color: theme.colors.primary,
  },
  footerLbl: {
    fontSize: scaleFontSize(11),
    color: theme.colors.subtext,
    marginTop: 2,
  },
  footerLblActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  footerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: scaleFontSize(160),
  },
  footerAvatar: {
    width: scaleFontSize(isSmartwatch ? 28 : 36),
    height: scaleFontSize(isSmartwatch ? 28 : 36),
    borderRadius: scaleFontSize(isSmartwatch ? 14 : 18),
    backgroundColor: theme.colors.border,
    marginRight: 6,
  },
  footerAvatarFallback: {
    width: scaleFontSize(isSmartwatch ? 28 : 36),
    height: scaleFontSize(isSmartwatch ? 28 : 36),
    borderRadius: scaleFontSize(isSmartwatch ? 14 : 18),
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  footerAvatarText: {
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: scaleFontSize(14),
  },
  footerUserName: {
    color: theme.colors.text,
    fontWeight: '600',
    maxWidth: scaleFontSize(160),
  },
  plusBtn: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: theme.spacing(2.5),
    width: scaleFontSize(isSmartwatch ? 40 : 56),
    height: scaleFontSize(isSmartwatch ? 40 : 56),
    borderRadius: scaleFontSize(isSmartwatch ? 20 : 28),
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    color: theme.colors.primaryText,
    fontSize: scaleFontSize(isSmartwatch ? 24 : 30),
    fontWeight: '900',
    lineHeight: scaleFontSize(isSmartwatch ? 24 : 30),
  },
});
