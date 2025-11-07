import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ButtonPrimary, ButtonSecondary, Card, FooterBar } from '../ui/components';
import { theme } from '../ui/theme';

const TYPES = ['Breast', 'Lung', 'Prostate', 'Colorectal', 'Skin', 'Other'];
const STAGES = ['I', 'II', 'III', 'IV'];

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

const AssessmentScreen: React.FC<any> = ({ navigation }) => {
  const [type, setType] = useState<string>('Lung');
  const [stage, setStage] = useState<string>('III');
  const [age, setAge] = useState<number>(54);

  const canContinue = !!type && !!stage && age > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick assessment</Text>
      <Text style={styles.subtitle}>Pick your cancer type, stage, and age.</Text>

      <Card style={{ marginTop: theme.spacing(2) }}>
        <Text style={styles.sectionTitle}>Cancer type</Text>
        <View style={styles.rowWrap}>
          {TYPES.map((t) => (
            <Chip key={t} label={t} active={type === t} onPress={() => setType(t)} />
          ))}
        </View>
      </Card>

      <Card style={{ marginTop: theme.spacing(2) }}>
        <Text style={styles.sectionTitle}>Stage</Text>
        <View style={styles.rowWrap}>
          {STAGES.map((s) => (
            <Chip key={s} label={s} active={stage === s} onPress={() => setStage(s)} />
          ))}
        </View>
      </Card>

      <Card style={{ marginTop: theme.spacing(2) }}>
        <Text style={styles.sectionTitle}>Age</Text>
        <Stepper value={age} onChange={setAge} />
      </Card>

      <View style={{ marginTop: theme.spacing(2) }}>
        <ButtonPrimary
          title="See my wellness plan"
          onPress={() => navigation.navigate('Wellness', { cancerType: type, stage, age: String(age) })}
          disabled={!canContinue}
        />
        <View style={{ height: 8 }} />
        <ButtonSecondary title="Back" onPress={() => navigation.goBack()} />
      </View>

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
  sectionTitle: { fontWeight: '800', marginBottom: 8, color: theme.colors.text },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.text },
  chipTextActive: { color: theme.colors.primaryText, fontWeight: '700' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { color: theme.colors.text, fontWeight: '800' },
  ageValue: { minWidth: 40, textAlign: 'center', color: theme.colors.text, fontWeight: '700' },
});

export default AssessmentScreen;
