import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { ButtonPrimary, ButtonSecondary, Card, FooterBar } from '../ui/components';
import { theme } from '../ui/theme';
import { analyzeIngredientsNutrition } from '../services/gemini';

const NutritionCheckScreen: React.FC<any> = ({ navigation }) => {
  const [ingredients, setIngredients] = useState('');
  const [cancerType, setCancerType] = useState('');
  const [stage, setStage] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [calories, setCalories] = useState<number | null>(null);
  const [recommended, setRecommended] = useState<'yes' | 'no' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!ingredients.trim()) {
      setError('Please enter ingredients.');
      return;
    }
    setError(null);
    setLoading(true);
    setCalories(null);
    setRecommended(null);
    try {
      const res = await analyzeIngredientsNutrition({ ingredients, cancerType, stage, age });
      setCalories(res.calories);
      setRecommended(res.recommended);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to analyze');
    } finally {
      setLoading(false);
    }
  };

  const badgeColor = recommended === 'yes' ? '#16a34a' : recommended === 'no' ? '#dc2626' : theme.colors.border;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nutrition Check</Text>
      <Text style={styles.subtitle}>Enter ingredients (with amounts if possible). We’ll estimate calories and whether it’s recommended for you. Educational only.</Text>

      <Card>
        <TextInput
          placeholder="e.g. 1 cup cooked rice, 100g grilled chicken, 1 tbsp olive oil"
          placeholderTextColor={theme.colors.subtext}
          value={ingredients}
          onChangeText={setIngredients}
          style={[styles.input, styles.multiline]}
          multiline
        />
        <View style={{ height: theme.spacing(1) }} />
        <TextInput placeholder="Cancer type" placeholderTextColor={theme.colors.subtext} value={cancerType} onChangeText={setCancerType} style={styles.input} />
        <View style={{ height: theme.spacing(1) }} />
        <TextInput placeholder="Stage" placeholderTextColor={theme.colors.subtext} value={stage} onChangeText={setStage} style={styles.input} />
        <View style={{ height: theme.spacing(1) }} />
        <TextInput placeholder="Age" placeholderTextColor={theme.colors.subtext} value={age} onChangeText={setAge} keyboardType="number-pad" style={styles.input} />
        <View style={{ height: theme.spacing(1.5) }} />
        <ButtonPrimary title={loading ? 'Analyzing…' : 'Analyze'} onPress={run} disabled={loading} />
      </Card>

      {loading && (
        <View style={{ paddingVertical: 12 }}>
          <ActivityIndicator />
        </View>
      )}

      {!!error && (
        <Text style={{ color: '#dc2626', marginTop: theme.spacing(1) }}>{error}</Text>
      )}

      {(calories !== null || recommended !== null) && (
        <Card style={{ marginTop: theme.spacing(2) }}>
          {calories !== null && (
            <Text style={{ fontWeight: '700', marginBottom: 6 }}>Estimated Calories: {calories} kcal</Text>
          )}
          {recommended !== null && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: badgeColor, marginRight: 8 }} />
              <Text style={{ fontWeight: '800' }}>Recommendation: {recommended === 'yes' ? 'RECOMMENDED' : 'NOT RECOMMENDED'}</Text>
            </View>
          )}
        </Card>
      )}

      <View style={{ flex: 1 }} />
      <FooterBar
        active="home"
        onHome={() => navigation.navigate('Main')}
        onQA={() => navigation.navigate('Feed')}
        onChat={() => navigation.navigate('Chat')}
        onProfile={() => navigation.navigate('Profile', {})}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing(2), backgroundColor: theme.colors.bg },
  title: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  subtitle: { color: theme.colors.subtext, marginTop: 6, marginBottom: theme.spacing(2) },
  input: { width: '100%', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: 10, color: theme.colors.text, backgroundColor: theme.colors.card },
  multiline: { minHeight: 100, textAlignVertical: 'top' as const },
});

export default NutritionCheckScreen;
