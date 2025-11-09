import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Dimensions, View, Text, Image, TouchableOpacity, Animated, Easing, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { theme } from '../ui/theme';
import { useAuth } from '../context/AuthContext';

const MainScreen: React.FC<any> = ({ navigation }) => {
  console.log('MainScreen rendering');
  const { user } = useAuth();
  console.log('MainScreen - got user:', !!user);
  // no phase morphing; we'll use seamless horizontal loop

  const { width, height } = Dimensions.get('window');
  const waveWidth = width * 2;
  const makeCurvePath = (amp: number, y: number) => {
    const x0 = -width * 0.25;
    const x1 = width * 0.2;
    const x2 = width * 0.6;
    const x3 = width * 1.25; // go beyond screen for clean edges
    return `M ${x0} ${y} C ${x1} ${y - amp}, ${x2} ${y + amp}, ${x3} ${y}`;
  };
  const path1 = useMemo(() => makeCurvePath(14, 120), [width]);
  const path2 = useMemo(() => makeCurvePath(10, 170), [width]);
  const path3 = useMemo(() => makeCurvePath(7, 220), [width]);

  // Opacity animation for curves (appear/disappear)
  const op1 = useRef(new Animated.Value(0.4)).current;
  const op2 = useRef(new Animated.Value(0.4)).current;
  const op3 = useRef(new Animated.Value(0.4)).current;
  
  // Floating elements animations
  const float1Y = useRef(new Animated.Value(0)).current;
  const float2Y = useRef(new Animated.Value(0)).current;
  const float3Y = useRef(new Animated.Value(0)).current;
  const float4Y = useRef(new Animated.Value(0)).current;
  const rotate1 = useRef(new Animated.Value(0)).current;
  const rotate2 = useRef(new Animated.Value(0)).current;
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const buttonPulse = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    const fadeLoop = (val: Animated.Value, delay: number, min = 0.15, max = 0.85, dur = 5000) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: max, duration: dur, delay, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(val, { toValue: min, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      ).start();
    fadeLoop(op1, 0, 0.2, 0.9, 5500);
    fadeLoop(op2, 1200, 0.15, 0.8, 6000);
    fadeLoop(op3, 2400, 0.1, 0.75, 6500);
    
    // Floating animations
    const floatAnim = (val: Animated.Value, distance: number, duration: number, delay: number) => 
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: distance, duration, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    
    floatAnim(float1Y, -20, 3000, 0);
    floatAnim(float2Y, -15, 4000, 500);
    floatAnim(float3Y, -25, 3500, 1000);
    floatAnim(float4Y, -18, 4500, 1500);
    
    // Rotation animations
    Animated.loop(
      Animated.timing(rotate1, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    
    Animated.loop(
      Animated.timing(rotate2, { toValue: 1, duration: 10000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    
    // Scale pulse animations
    const pulseAnim = (val: Animated.Value, min: number, max: number, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: max, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(val, { toValue: min, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    
    pulseAnim(scale1, 0.8, 1.2, 2000);
    pulseAnim(scale2, 0.9, 1.1, 3000);
    
    // Subtle button pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, { toValue: 1.05, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(buttonPulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    
    return () => {
      op1.stopAnimation();
      op2.stopAnimation();
      op3.stopAnimation();
      float1Y.stopAnimation();
      float2Y.stopAnimation();
      float3Y.stopAnimation();
      float4Y.stopAnimation();
      rotate1.stopAnimation();
      rotate2.stopAnimation();
      scale1.stopAnimation();
      scale2.stopAnimation();
      buttonPulse.stopAnimation();
    };
  }, []);

  // Soft pastel blue gradient (lighter sky blue)
  const start = `#A9D5E8`;
  const end = `#93C7DE`;
  // Controls the vertical position of the standalone welcome text (background)
  const welcomeTop = 200; // adjust this number to move the welcome text up/down

  type Meal = { key: 'breakfast'|'lunch'|'dinner'; label: string; title: string; time: string; proteins: number; fats: number; carbs: number; kcal: number; icon: string };
  const fallbackMeals: Meal[] = [
    { key: 'breakfast', label: 'Breakfast', title: 'Oatmeal & Berries', time: '8:00 AM', proteins: 23.0, fats: 12.3, carbs: 83.1, kcal: 459, icon: '🥣' },
    { key: 'lunch', label: 'Lunch', title: 'Chicken Salad', time: '12:30 PM', proteins: 26.5, fats: 10.2, carbs: 41.7, kcal: 420, icon: '🥗' },
    { key: 'dinner', label: 'Dinner', title: 'Grilled Salmon', time: '7:00 PM', proteins: 28.4, fats: 14.8, carbs: 12.0, kcal: 390, icon: '🐟' },
  ];
  const [meals, setMeals] = useState<Meal[]>(fallbackMeals);
  const [loadingMeals, setLoadingMeals] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) return;
        setLoadingMeals(true);
        const cancerType = (user as any)?.cancerType || (user as any)?.profile?.cancerType || 'unspecified';
        const prompt = `You are a nutrition assistant. Generate meal suggestions tailored for a patient with ${cancerType}.
Return strict JSON with keys breakfast, lunch, dinner. Each item has: label (Breakfast/Lunch/Dinner), title (short dish name), time (e.g. "8:00 AM"), proteins (number grams), fats (number grams), carbs (number grams), kcal (number), and emoji icon string.`;
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
          });
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return;
        const parsed = JSON.parse(jsonMatch[0]);
        const next: Meal[] = ['breakfast','lunch','dinner'].map((k:any) => {
          const it = parsed[k] || {};
          return {
            key: k,
            label: it.label || (k.charAt(0).toUpperCase()+k.slice(1)),
            title: it.title || '',
            time: it.time || '',
            proteins: Number(it.proteins)||0,
            fats: Number(it.fats)||0,
            carbs: Number(it.carbs)||0,
            kcal: Number(it.kcal)||0,
            icon: it.icon || (k==='breakfast'?'🥣':k==='lunch'?'🥗':'🍽️'),
          } as Meal;
        });
        setMeals(next);
      } finally {
        setLoadingMeals(false);
      }
    };
    run();
  }, [user]);

  return (
    <LinearGradient colors={[start, end]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerWrap}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile', {})} style={styles.headerRow} activeOpacity={0.85}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatarFallback}>
                <Text style={styles.headerAvatarText}>{(user?.displayName || 'U').slice(0,1).toUpperCase()}</Text>
              </View>
            )}
            <View>
              <Text style={styles.hey}>Hey</Text>
              <Text style={styles.name} numberOfLines={1}>{user?.displayName || 'Member'}</Text>
              {/* Welcome text moved out of header */}
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Profile', {})} style={styles.settingsBtn} activeOpacity={0.85}>
            <Svg width={34} height={34} viewBox="0 0 34 34">
              <Path d="M6 10 H28" stroke="#6B7280" strokeWidth="2.4" strokeLinecap="round"/>
              <Path d="M6 17 H28" stroke="#6B7280" strokeWidth="2.4" strokeLinecap="round"/>
              <Path d="M6 24 H28" stroke="#6B7280" strokeWidth="2.4" strokeLinecap="round"/>
            </Svg>
          </TouchableOpacity>
        </View>
      </View>
      {/* Spaced gentle curves with animated opacity */}
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', opacity: op1 }} pointerEvents="none">
        <Svg width={waveWidth} height="100%">
          <Path d={path1} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} fill="none" />
        </Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', opacity: op2 }} pointerEvents="none">
        <Svg width={waveWidth} height="100%">
          <Path d={path2} stroke="rgba(255,255,255,0.28)" strokeWidth={1.3} fill="none" />
        </Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', opacity: op3 }} pointerEvents="none">
        <Svg width={waveWidth} height="100%">
          <Path d={path3} stroke="rgba(255,255,255,0.22)" strokeWidth={1.2} fill="none" />
        </Svg>
      </Animated.View>

      {/* Background welcome text removed per request */}

      {/* Floating animated elements */}
      <Animated.View style={{ position: 'absolute', top: 120, left: '10%', opacity: 0.5, transform: [{ translateY: float1Y }, { scale: scale1 }] }} pointerEvents="none">
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.4)' }} />
      </Animated.View>
      
      <Animated.View style={{ position: 'absolute', top: 180, right: '15%', opacity: 0.6, transform: [{ translateY: float2Y }] }} pointerEvents="none">
        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(147,197,253,0.3)' }} />
      </Animated.View>
      
      <Animated.View style={{ position: 'absolute', top: 250, left: '75%', opacity: 0.4, transform: [{ translateY: float3Y }, { rotate: rotate1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }} pointerEvents="none">
        <View style={{ width: 50, height: 50, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.35)', transform: [{ rotate: '45deg' }] }} />
      </Animated.View>
      
      <Animated.View style={{ position: 'absolute', top: 320, right: '70%', opacity: 0.5, transform: [{ translateY: float4Y }, { scale: scale2 }] }} pointerEvents="none">
        <View style={{ width: 25, height: 25, borderRadius: 12.5, backgroundColor: 'rgba(252,231,243,0.6)' }} />
      </Animated.View>
      
      <Animated.View style={{ position: 'absolute', top: 450, left: '20%', opacity: 0.3, transform: [{ translateY: float1Y }] }} pointerEvents="none">
        <Text style={{ fontSize: 36, opacity: 0.4 }}>💙</Text>
      </Animated.View>
      
      <Animated.View style={{ position: 'absolute', top: 550, right: '18%', opacity: 0.35, transform: [{ translateY: float2Y }, { rotate: rotate2.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] }) }] }} pointerEvents="none">
        <Text style={{ fontSize: 28, opacity: 0.5 }}>✨</Text>
      </Animated.View>
      
      <Animated.View style={{ position: 'absolute', top: 650, left: '80%', opacity: 0.4, transform: [{ translateY: float3Y }] }} pointerEvents="none">
        <View style={{ width: 35, height: 35, borderRadius: 17.5, backgroundColor: 'rgba(254,226,226,0.5)' }} />
      </Animated.View>
      
      <Animated.View style={{ position: 'absolute', top: 750, left: '12%', opacity: 0.3, transform: [{ translateY: float4Y }] }} pointerEvents="none">
        <Text style={{ fontSize: 32, opacity: 0.4 }}>🌟</Text>
      </Animated.View>
      
      {/* Additional floating elements */}
      <Animated.View style={{ position: 'absolute', top: 420, right: '25%', opacity: 0.25, transform: [{ translateY: float3Y }, { scale: scale1 }] }} pointerEvents="none">
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(191,219,254,0.5)' }} />
      </Animated.View>
      
      <Animated.View style={{ position: 'absolute', top: 580, left: '65%', opacity: 0.3, transform: [{ translateY: float1Y }] }} pointerEvents="none">
        <View style={{ width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(255,255,255,0.3)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' }} />
      </Animated.View>
      
      <Animated.View style={{ position: 'absolute', top: 850, right: '60%', opacity: 0.35, transform: [{ translateY: float2Y }] }} pointerEvents="none">
        <Text style={{ fontSize: 26, opacity: 0.4 }}>🌸</Text>
      </Animated.View>

      {(() => {
        const size = Math.max(width, height) * 5.0; // larger radius for flatter top arc
        const inner = size * 0.99; // 4% smaller
        const targetTop = 350; // move circle top further up
        const bottom = -size + targetTop; // ensures top of circle stays at targetTop
        return (
          <>
            <ScrollView
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              contentContainerStyle={{ paddingTop: targetTop + 80, paddingBottom: 120, alignItems: 'center' }}
              showsVerticalScrollIndicator={false}
            >
              {/* Circular buttons above the circle */}
              <View style={{ position: 'absolute', top: targetTop - 160, width: '100%', alignItems: 'center', zIndex: 3 }}>
                <View style={{ width: Math.min(width * 0.92, 480), alignItems: 'center' }}>
                  <View style={styles.actionRow}>
                    <View style={styles.actionItem}>
                      <TouchableOpacity activeOpacity={0.9} style={styles.actionBtn} onPress={() => navigation.navigate('Chat', {})}>
                        <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                          <Text style={styles.actionIconEmoji}>💬</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                    <Animated.View style={[styles.actionItem, { marginTop: -12, transform: [{ scale: buttonPulse }] }]}>
                      <TouchableOpacity activeOpacity={0.9} style={styles.actionBtn} onPress={() => navigation.navigate('Wellness', {})}>
                        <View style={[styles.iconCircle, { backgroundColor: '#FCE7F3' }]}>
                          <Text style={styles.actionIconEmoji}>🧘</Text>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                    <View style={styles.actionItem}>
                      <TouchableOpacity activeOpacity={0.9} style={styles.actionBtn} onPress={() => navigation.navigate('Feed', {})}>
                        <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                          <Text style={styles.actionIconEmoji}>👥</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Circles moved inside ScrollView so they scroll */}
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: targetTop,
                  width: size,
                  height: size,
                  marginLeft: -size / 2,
                  borderRadius: size / 2,
                  backgroundColor: '#FFFFFF',
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: targetTop+ (size - inner) / 2,
                  width: inner,
                  height: inner,
                  marginLeft: -inner / 2,
                }}
              >
                <Svg width={inner} height={inner}>
                  <Circle
                    cx={inner / 2}
                    cy={inner / 2}
                    r={(inner / 2) - 1}
                    stroke="rgba(147,197,253,0.8)"
                    strokeWidth={4}
                    strokeDasharray="8 12"
                    strokeLinecap="round"
                    fill="none"
                  />
                </Svg>
              </View>
              <View style={{ position: 'absolute', top: targetTop - 40, width: '100%', alignItems: 'center', zIndex: 2 }}>
                <View style={{ width: Math.min(width * 0.92, 520), flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 }}>
                  <TouchableOpacity activeOpacity={0.85} style={[styles.edgeBtn, { marginTop: 14, backgroundColor: '#93C5FD' }]}>
                    <Text style={styles.edgeBtnEmoji}>📊</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.85} style={[styles.edgeBtnLarge, { backgroundColor: '#F9A8D4' }]}>
                    <Text style={styles.edgeBtnEmojiLarge}>🎯</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.85} style={[styles.edgeBtn, { marginTop: 14, backgroundColor: '#FCA5A5' }]}>
                    <Text style={styles.edgeBtnEmoji}>💪</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ width: Math.min(width * 0.92, 480) }}>
                <Text style={styles.mealsHeading}>Your meals</Text>
                {meals.map((m, idx) => (
                  <TouchableOpacity key={m.key} activeOpacity={0.85} style={[styles.mealCard, idx !== 0 && { marginTop: 16 }]}> 
                  {/* Header: icon + title/subtitle, actions on right */}
                  <View style={styles.cardHeader}>
                    <View style={styles.mealLeft}>
                      <View style={styles.mealIcon}><Text style={{ fontSize: 22 }}>{m.icon}</Text></View>
                      <View style={styles.mealTextCol}>
                        <Text style={styles.mealHeaderTitle}>{m.label}</Text>
                        <Text style={styles.mealHeaderSub}>{m.title}</Text>
                        {/* Macros nested under the name */}
                        <View style={styles.macroRow}>
                          <View style={styles.macroItem}>
                            <Text style={styles.macroLabel}>Fats</Text>
                            <Text style={styles.macroValue}>{m.fats.toFixed(1)}</Text>
                          </View>
                          <View style={styles.macroDivider} />
                          <View style={styles.macroItem}>
                            <Text style={styles.macroLabel}>Carbs</Text>
                            <Text style={styles.macroValue}>{m.carbs.toFixed(1)}</Text>
                          </View>
                          <View style={styles.macroDivider} />
                          <View style={styles.macroItem}>
                            <Text style={styles.macroLabel}>Kcal</Text>
                            <Text style={styles.macroValue}>{m.kcal.toFixed(1)}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View style={styles.actionsRow}>
                      <Text style={styles.actionIcon}>✏️</Text>
                      <Text style={styles.actionIcon}>☆</Text>
                    </View>
                  </View>

                  {/* Footer: time pill + show more */}
                  <View style={styles.cardFooter}>
                    <View style={styles.timePill}><Text style={styles.timePillText}>{m.time}</Text></View>
                    <Text style={styles.showMore}>Show more ›</Text>
                  </View>
                  </TouchableOpacity>
                ))}
                <View style={{ height: 24 }} />
              </View>
            </ScrollView>
          </>
        );
      })()}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { position: 'absolute', top: 16, left: 16, right: 16, zIndex: 20, elevation: 20, backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 28, paddingVertical: 14, paddingHorizontal: 18, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF' },
  headerAvatarFallback: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#1F2937', fontWeight: '700', fontSize: 18 },
  hey: { color: '#6B7280', fontSize: 13, fontWeight: '500' },
  name: { color: '#1F2937', fontWeight: '700', fontSize: 18 },
  welcomeHero: { color: theme.colors.text, fontWeight: '900', fontSize: 28, letterSpacing: 0.2, marginTop: 2 },
  welcomeSub: { color: 'rgba(0,0,0,0.65)', fontWeight: '600', fontSize: 14, marginTop: 2 },
  welcomeStandalone: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 36,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.08)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  // Welcome + actions
  welcomeTitle: { color: theme.colors.text, fontWeight: '700', fontSize: 16, marginBottom: 8 },
  chooseTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  chooseTitleText: { color: theme.colors.text, fontWeight: '800', fontSize: 18 },
  choosePill: { backgroundColor: '#FADBE5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  choosePillText: { color: '#111', fontWeight: '800', fontSize: 18 },
  actionRow: { flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: 2 },
  actionItem: { flex: 1, alignItems: 'center' },
  actionBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  actionIconEmoji: { fontSize: 32 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  edgeBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  edgeBtnLarge: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  edgeBtnEmoji: { fontSize: 28 },
  edgeBtnEmojiLarge: { fontSize: 34 },
  actionLabel: { color: theme.colors.text, fontWeight: '700', marginTop: 6, fontSize: 12 },
  settingsBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  settingsIcon: { fontSize: 20 },
  // Meals styles
  mealsHeading: { color: '#1F2937', fontWeight: '700', marginBottom: 14, fontSize: 20 },
  mealCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 20,
    minHeight: 96,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  mealLeft: { flexDirection: 'row', alignItems: 'flex-start', columnGap: 16 },
  mealIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTitle: { color: theme.colors.text, fontWeight: '800' },
  mealMetaRow: { flexDirection: 'row', columnGap: 12, marginTop: 4 },
  mealMeta: { color: 'rgba(0,0,0,0.55)', fontSize: 12 },
  mealRight: { alignItems: 'flex-end', rowGap: 2 },
  mealTime: { color: 'rgba(0,0,0,0.5)', fontSize: 13 },
  mealKcal: { color: theme.colors.text, fontWeight: '800', fontSize: 16 },
  chev: { color: 'rgba(0,0,0,0.35)', fontSize: 20, marginTop: 2 },
  // Reference-style card structure
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  mealHeaderTitle: { color: '#1F2937', fontWeight: '700', fontSize: 18 },
  mealHeaderSub: { color: '#6B7280', fontSize: 13, marginTop: 2, fontWeight: '500' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', columnGap: 12 },
  actionIcon: { color: '#9CA3AF', fontSize: 18 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  metricCol: { alignItems: 'center', flex: 1 },
  metricLabel: { color: 'rgba(0,0,0,0.6)', fontSize: 12 },
  metricValue: { color: theme.colors.text, fontWeight: '800', fontSize: 18, marginTop: 2 },
  // New macros under title
  mealTextCol: { flexDirection: 'column' },
  macroRow: { flexDirection: 'row', alignItems: 'center', columnGap: 12, marginTop: 12 },
  macroItem: { alignItems: 'flex-start' },
  macroLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  macroValue: { color: '#1F2937', fontWeight: '700', fontSize: 18, marginTop: 1 },
  macroDivider: { width: 1, height: 20, backgroundColor: '#E5E7EB', marginHorizontal: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  timePill: { backgroundColor: '#DBEAFE', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  timePillText: { color: '#1E40AF', fontWeight: '700', fontSize: 11 },
  showMore: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  // No extra styles needed for SVG waves beyond container
});

export default MainScreen;
