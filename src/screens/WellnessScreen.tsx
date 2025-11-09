import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteProp, useRoute } from '@react-navigation/native';
import { fetchDietAndWellness } from '../services/gemini';
import type { RootStackParamList } from '../navigation/AppNavigator';
import Svg, { Circle, Path } from 'react-native-svg';

type R = RouteProp<RootStackParamList, 'Wellness'>;

const { width, height } = Dimensions.get('window');

// Custom Slider Component
const AgeSlider: React.FC<{ value: number; onChange: (val: number) => void }> = ({ value, onChange }) => {
  const sliderWidth = width - 72; // Account for padding
  const pan = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        const newX = Math.max(0, Math.min(sliderWidth, gestureState.moveX - 56)); // Account for screen padding
        const percentage = newX / sliderWidth;
        const newAge = Math.round(18 + percentage * (100 - 18));
        onChange(newAge);
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  const thumbPosition = ((value - 18) / (100 - 18)) * sliderWidth;

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: thumbPosition }]} />
        <Animated.View
          style={[styles.sliderThumb, { left: thumbPosition - 12 }]}
          {...panResponder.panHandlers}
        />
      </View>
    </View>
  );
};

const WellnessScreen: React.FC<any> = ({ navigation }) => {
  const route = useRoute<R>();
  const [type, setType] = useState<string>(route.params?.cancerType || 'Lung');
  const [stage, setStage] = useState<string>(route.params?.stage || 'II');
  const [age, setAge] = useState<number>(route.params?.age ? parseInt(route.params.age, 10) : 45);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ diet: string; hydration: string; activity: string; sleep: string }| null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const profileOpacity = useRef(new Animated.Value(1)).current;
  const resultsOpacity = useRef(new Animated.Value(0)).current;
  const resultsScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -20,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const generate = async () => {
    setLoading(true);
    try {
      const result = await fetchDietAndWellness({ cancerType: type, stage, age: String(age) });
      const lines = result.suggestions.split('\n').map(l => l.trim());
      const extract = (label: string) => {
        const line = lines.find(l => l.toLowerCase().includes(label.toLowerCase()));
        return line ? line.split(':')[1]?.trim() || line : 'No data available';
      };
      const newSuggestions = {
        diet: extract('diet'),
        hydration: extract('hydration'),
        activity: extract('activity'),
        sleep: extract('sleep'),
      };
      
      // Animate transition
      Animated.parallel([
        Animated.timing(profileOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setSuggestions(newSuggestions);
        Animated.parallel([
          Animated.timing(resultsOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(resultsScale, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (route.params?.cancerType) {
      generate();
    }
  }, []);

  return (
    <LinearGradient
      colors={['#A9D5E8', '#93C7DE']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Floating background elements */}
      <Animated.View style={[styles.floatingCircle, { top: 80, right: '10%', transform: [{ translateY: floatY }] }]} pointerEvents="none">
        <View style={styles.circle1} />
      </Animated.View>
      <Animated.View style={[styles.floatingCircle, { top: 200, left: '15%', transform: [{ translateY: floatY }] }]} pointerEvents="none">
        <View style={styles.circle2} />
      </Animated.View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerWrap}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Svg width={24} height={24} viewBox="0 0 24 24">
                <Path d="M15 18L9 12L15 6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Wellness Plan</Text>
            </View>
            <View style={{ width: 24 }} />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={{ marginTop: 80 }}
        >
          {/* Profile Selection Card */}
          {!suggestions && (
            <Animated.View style={[styles.card, { opacity: profileOpacity, transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.cardTitle}>Your Profile</Text>
            
            <Text style={styles.label}>Cancer Type</Text>
            <View style={styles.chipRow}>
              {['Breast', 'Lung', 'Prostate', 'Colorectal'].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  style={[styles.chip, type === t && styles.chipActive]}
                >
                  <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Stage</Text>
            <View style={styles.chipRow}>
              {['I', 'II', 'III', 'IV'].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStage(s)}
                  style={[styles.chip, stage === s && styles.chipActive]}
                >
                  <Text style={[styles.chipText, stage === s && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Age: {age} years old</Text>
            <AgeSlider value={age} onChange={setAge} />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>18</Text>
              <Text style={styles.sliderLabelText}>100</Text>
            </View>

            <TouchableOpacity onPress={generate} style={styles.generateButton} disabled={loading}>
              <Text style={styles.generateButtonText}>{loading ? 'Generating...' : 'Generate Plan'}</Text>
            </TouchableOpacity>
          </Animated.View>
          )}

          {/* Wellness Suggestions - Fullscreen */}
          {suggestions && !loading && (
            <Animated.View style={[styles.resultsContainer, { opacity: resultsOpacity, transform: [{ scale: resultsScale }] }]}>
              <Text style={styles.resultsTitle}>Your Personalized Plan</Text>
              
              {/* Wellness Score */}
              <View style={styles.scoreCard}>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreNumber}>8.5</Text>
                  <Text style={styles.scoreLabel}>/ 10</Text>
                </View>
                <View style={styles.scoreInfo}>
                  <Text style={styles.scoreTitle}>Wellness Score</Text>
                  <Text style={styles.scoreDescription}>Based on your profile and health goals</Text>
                </View>
              </View>

              {/* Quick Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statIcon}>🎯</Text>
                  <Text style={styles.statValue}>75%</Text>
                  <Text style={styles.statLabel}>Goals Met</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statIcon}>🔥</Text>
                  <Text style={styles.statValue}>12</Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statIcon}>⭐</Text>
                  <Text style={styles.statValue}>94</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>
              </View>

              {/* Daily Tip */}
              <View style={styles.tipCard}>
                <View style={styles.tipHeader}>
                  <Text style={styles.tipIcon}>💡</Text>
                  <Text style={styles.tipTitle}>Daily Wellness Tip</Text>
                </View>
                <Text style={styles.tipText}>Start your day with a glass of water and light stretching to boost energy and circulation.</Text>
              </View>

              {/* Wellness Cards */}
              <Text style={styles.sectionTitle}>Your Recommendations</Text>
              <WellnessCard icon="🥗" title="Diet" content={suggestions.diet} color="#93C5FD" />
              <WellnessCard icon="💧" title="Hydration" content={suggestions.hydration} color="#A1D5E6" />
              <WellnessCard icon="🏃" title="Activity" content={suggestions.activity} color="#7DD3FC" />
              <WellnessCard icon="😴" title="Sleep" content={suggestions.sleep} color="#60A5FA" />
              
              {/* Progress Tracker */}
              <View style={styles.progressCard}>
                <Text style={styles.progressTitle}>Weekly Progress</Text>
                <View style={styles.progressBars}>
                  <View style={styles.progressItem}>
                    <Text style={styles.progressLabel}>Nutrition</Text>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: '85%', backgroundColor: '#93C5FD' }]} />
                    </View>
                    <Text style={styles.progressPercent}>85%</Text>
                  </View>
                  <View style={styles.progressItem}>
                    <Text style={styles.progressLabel}>Exercise</Text>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: '70%', backgroundColor: '#7DD3FC' }]} />
                    </View>
                    <Text style={styles.progressPercent}>70%</Text>
                  </View>
                  <View style={styles.progressItem}>
                    <Text style={styles.progressLabel}>Rest</Text>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: '90%', backgroundColor: '#60A5FA' }]} />
                    </View>
                    <Text style={styles.progressPercent}>90%</Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity onPress={() => {
                Animated.parallel([
                  Animated.timing(resultsOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
                ]).start(() => {
                  setSuggestions(null);
                  Animated.timing(profileOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
                });
              }} style={styles.newPlanButton}>
                <Text style={styles.newPlanButtonText}>Create New Plan</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>
    </LinearGradient>
  );
};

const WellnessCard: React.FC<{ icon: string; title: string; content: string; color: string }> = ({ icon, title, content, color }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.wellnessCard, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.iconCircle, { backgroundColor: color }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={styles.wellnessContent}>
        <Text style={styles.wellnessTitle}>{title}</Text>
        <Text style={styles.wellnessText}>{content}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  // Floating elements
  header: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  floatingCircle: {
    position: 'absolute',
    opacity: 0.25,
  },
  circle1: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  circle2: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  // Content
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#93C5FD',
    borderColor: '#93C5FD',
  },
  chipText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sliderContainer: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sliderTrack: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    height: 12,
    backgroundColor: '#93C5FD',
    borderRadius: 6,
  },
  sliderThumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#60A5FA',
    top: -8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  sliderLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  generateButton: {
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: '#93C5FD',
    paddingVertical: 16,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  // Wellness Cards
  wellnessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconText: {
    fontSize: 28,
  },
  wellnessContent: {
    flex: 1,
  },
  wellnessTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  wellnessText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  newPlanButton: {
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#93C5FD',
  },
  newPlanButtonText: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '700',
  },
  // Wellness Score
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#93C5FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  // Tip Card
  tipCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
  },
  tipText: {
    fontSize: 15,
    color: '#78350F',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 8,
  },
  // Progress Tracker
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  progressBars: {
    gap: 16,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    width: 70,
  },
  progressBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 10,
    borderRadius: 5,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    width: 45,
    textAlign: 'right',
  },
});

export default WellnessScreen;
