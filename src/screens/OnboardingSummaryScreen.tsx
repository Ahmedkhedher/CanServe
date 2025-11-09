import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Card, ButtonSecondary } from '../ui/components';
import { theme } from '../ui/theme';
import { loadProfile } from '../services/profile';

const Row: React.FC<{ label: string; value?: string | number | boolean | string[] }>= ({ label, value }) => {
  let display: string = '';
  if (Array.isArray(value)) display = value.join(', ');
  else if (typeof value === 'boolean') display = value ? 'Yes' : 'No';
  else if (value === undefined || value === null || value === '') display = '—';
  else display = String(value);
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{display}</Text>
    </View>
  );
};

const OnboardingSummaryScreen: React.FC<any> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [p, setP] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const prof = await loadProfile();
        setP(prof);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Your Profile Details</Text>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Card>
            <Row label="Display name" value={p?.displayName} />
            <Row label="Age" value={typeof p?.age === 'number' ? p?.age : undefined} />
            <Row label="Diagnosed" value={typeof p?.diagnosed === 'boolean' ? p?.diagnosed : undefined} />
            <Row label="Cancer type" value={p?.cancerType} />
            <Row label="Cancer stage" value={p?.stage} />
            <Row label="In treatment" value={typeof p?.inTreatment === 'boolean' ? p?.inTreatment : undefined} />
            <Row label="Treatment types" value={p?.treatmentTypes} />
            <Row label="Diagnosis year" value={typeof p?.diagnosisYear === 'number' ? p?.diagnosisYear : undefined} />
            <Row label="Gender" value={p?.gender} />
            <Row label="Country/Region" value={p?.country} />
            <Row label="Role" value={p?.role} />
            <Row label="Interests" value={p?.interests} />
            <Row label="Allow messages" value={typeof p?.allowMessages === 'boolean' ? p?.allowMessages : undefined} />
          </Card>
        )}
        <View style={{ height: theme.spacing(2) }} />
        <ButtonSecondary title="Back" onPress={() => navigation.goBack()} />
        <View style={{ height: theme.spacing(6) }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing(2), backgroundColor: theme.colors.bg },
  title: { fontSize: 24, fontWeight: '800', marginBottom: theme.spacing(2), color: theme.colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  rowLabel: { color: theme.colors.subtext, fontSize: 16 },
  rowValue: { color: theme.colors.text, fontSize: 18, fontWeight: '600', maxWidth: '60%' },
});

export default OnboardingSummaryScreen;
