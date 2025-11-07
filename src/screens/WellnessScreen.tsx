import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, ImageBackground } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ButtonSecondary, Card, FooterBar } from '../ui/components';
import { theme } from '../ui/theme';
import { fetchDietAndWellness } from '../services/gemini';
import type { RootStackParamList } from '../navigation/AppNavigator';

type R = RouteProp<RootStackParamList, 'Wellness'>;

const IMAGE_MAP: Record<string, string> = {
  Diet: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1600&auto=format&fit=crop',
  Hydration: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?q=80&w=1600&auto=format&fit=crop',
  Activity: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1600&auto=format&fit=crop',
  // Replaced Sleep image with a more reliable photo
  Sleep: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop',
  Wellness: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1600&auto=format&fit=crop',
};

const SuggestionCard: React.FC<{
  title: string;
  content: string;
  onPress: () => void;
}> = ({ title, content, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={{ marginBottom: theme.spacing(2) }}>
    <ImageBackground
      source={{ uri: IMAGE_MAP[title] || IMAGE_MAP['Wellness'] }}
      style={styles.imageCard}
      imageStyle={{ borderRadius: theme.radius.md }}
    >
      <View style={styles.imageOverlay}>
        <Text style={styles.imageTitle}>{title}</Text>
      </View>
    </ImageBackground>
    <Card style={{ marginTop: 8 }}>
      <Text style={styles.sectionText}>{content || '—'}</Text>
    </Card>
  </TouchableOpacity>
);

const Chip: React.FC<{ label: string; active?: boolean; onPress: () => void }> = ({ label, active, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const Stepper: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => (
  <View style={styles.stepperRow}>
    <TouchableOpacity onPress={() => onChange(Math.max(1, value - 1))} style={styles.stepBtn}><Text style={styles.stepBtnText}>-</Text></TouchableOpacity>
    <Text style={styles.ageValue}>{value}</Text>
    <TouchableOpacity onPress={() => onChange(Math.min(120, value + 1))} style={styles.stepBtn}><Text style={styles.stepBtnText}>+</Text></TouchableOpacity>
  </View>
);

const WellnessScreen: React.FC<any> = ({ navigation }) => {
  const route = useRoute<R>();
  const initType = route.params?.cancerType || 'Lung';
  const initStage = route.params?.stage || 'III';
  const initAge = route.params?.age ? parseInt(route.params.age, 10) || 54 : 54;
  const [type, setType] = useState<string>(initType);
  const [stage, setStage] = useState<string>(initStage);
  const [age, setAge] = useState<number>(initAge);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState<string>('');

  const generate = async () => {
    setLoading(true);
    setError(null);
    setText('');
    try {
      const { suggestions } = await fetchDietAndWellness({ cancerType: type, stage, age: String(age) });
      setText(suggestions);
    } catch (e: any) {
      setError(e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-generate on mount if params were provided
    if (route.params?.cancerType || route.params?.stage || route.params?.age) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parsed = useMemo(() => {
    const lines = (text || '').split(/\r?\n/).map((l) => l.trim());
    const pick = (label: string) => {
      const i = lines.findIndex((l) => l.toLowerCase().startsWith(label));
      if (i === -1) return undefined;
      const v = lines[i].slice(label.length).trim().replace(/^[:\-\s]+/, '');
      return v || lines[i];
    };
    const diet = pick('diet:') || '';
    const hydration = pick('hydration:') || '';
    const activity = pick('activity:') || '';
    const sleep = pick('sleep:') || '';
    const wellness = pick('wellness score:') || '';
    return [
      { title: 'Diet', content: diet },
      { title: 'Hydration', content: hydration },
      { title: 'Activity', content: activity },
      { title: 'Sleep', content: sleep },
      { title: 'Wellness', content: wellness },
    ];
  }, [text]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Personalized wellness</Text>
      <Text style={styles.subtitle}>Quick assessment</Text>

      <Card style={{ marginTop: theme.spacing(2) }}>
        <Text style={styles.sectionTitle}>Cancer type</Text>
        <View style={styles.rowWrap}>
          {['Breast', 'Lung', 'Prostate', 'Colorectal', 'Skin', 'Other'].map((t) => (
            <Chip key={t} label={t} active={type === t} onPress={() => setType(t)} />
          ))}
        </View>
        <Text style={[styles.sectionTitle, { marginTop: theme.spacing(1) }]}>Stage</Text>
        <View style={styles.rowWrap}>
          {['I', 'II', 'III', 'IV'].map((s) => (
            <Chip key={s} label={s} active={stage === s} onPress={() => setStage(s)} />
          ))}
        </View>
        <Text style={[styles.sectionTitle, { marginTop: theme.spacing(1) }]}>Age</Text>
        <Stepper value={age} onChange={setAge} />
        <View style={{ height: 8 }} />
        <ButtonSecondary title="Generate" onPress={generate} />
      </Card>

      {loading && (
        <View style={{ paddingVertical: 24 }}>
          <ActivityIndicator />
        </View>
      )}

      {!loading && error && (
        <Card style={{ borderColor: '#dc2626' }}>
          <Text style={{ color: '#dc2626' }}>{error}</Text>
        </Card>
      )}

      {!loading && !error && text && (
        <ScrollView style={{ marginTop: theme.spacing(1) }} contentContainerStyle={{ paddingBottom: theme.spacing(2) }}>
          {parsed.map((s) => (
            <SuggestionCard
              key={s.title}
              title={s.title}
              content={s.content}
              onPress={() => navigation.navigate('SuggestionDetail', { title: s.title, content: s.content, image: IMAGE_MAP[s.title] })}
            />
          ))}
          <ButtonSecondary title="Back" onPress={() => navigation.goBack()} />
        </ScrollView>
      )}

      <FooterBar
        active="home"
        onHome={() => navigation.navigate('Main')}
        onQA={() => navigation.navigate('Feed')}
        onProfile={() => navigation.navigate('Profile', {})}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing(2) },
  title: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
  subtitle: { color: theme.colors.subtext, marginTop: 4 },
  sectionTitle: { fontWeight: '800', marginBottom: 6, color: theme.colors.text },
  sectionText: { color: theme.colors.text },
  wellnessCard: { borderWidth: 1, borderColor: theme.colors.primary },
  wellnessScore: { fontWeight: '800' },
  imageCard: { height: 140, justifyContent: 'flex-end' },
  imageOverlay: { backgroundColor: 'rgba(0,0,0,0.35)', padding: theme.spacing(2), borderBottomLeftRadius: theme.radius.md, borderBottomRightRadius: theme.radius.md, borderRadius: theme.radius.md },
  imageTitle: { color: '#fff', fontWeight: '800', marginBottom: 4 },
  imageExcerpt: { color: '#f3f4f6' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.text },
  chipTextActive: { color: theme.colors.primaryText, fontWeight: '700' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  stepBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { color: theme.colors.text, fontWeight: '800' },
  ageValue: { minWidth: 40, textAlign: 'center', color: theme.colors.text, fontWeight: '700' },
});

export default WellnessScreen;
