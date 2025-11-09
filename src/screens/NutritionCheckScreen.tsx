import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator, Image, TouchableOpacity, ScrollView } from 'react-native';
import { ButtonPrimary, ButtonSecondary, Card, FooterBar } from '../ui/components';
import { theme } from '../ui/theme';
import * as ImagePicker from 'expo-image-picker';
import { analyzeIngredientsNutrition, analyzeFoodImageDetailed } from '../services/gemini';

const NutritionCheckScreen: React.FC<any> = ({ navigation }) => {
  const [ingredients, setIngredients] = useState('');
  const [cancerType, setCancerType] = useState('');
  const [stage, setStage] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [calories, setCalories] = useState<number | null>(null);
  const [recommended, setRecommended] = useState<'yes' | 'no' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoResult, setPhotoResult] = useState<{
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    recommended: 'yes' | 'no';
    healthNotes: string;
  } | null>(null);

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

  const pickImage = async () => {
    setPhotoError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      setPhotoError('Permission denied for media library.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setImageUri(res.assets[0].uri);
      setPhotoResult(null);
    }
  };

  const analyzePhoto = async () => {
    if (!imageUri) {
      setPhotoError('Please select a photo first.');
      return;
    }
    setPhotoError(null);
    setPhotoLoading(true);
    try {
      const res = await analyzeFoodImageDetailed({ cancerType, stage, age, imageUri });
      setPhotoResult(res);
    } catch (e: any) {
      setPhotoError(e?.message ?? 'Failed to analyze photo');
    } finally {
      setPhotoLoading(false);
    }
  };

  const badgeColor = recommended === 'yes' ? '#16a34a' : recommended === 'no' ? '#dc2626' : theme.colors.border;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Nutrition Check</Text>
        <Text style={styles.subtitle}>Enter ingredients (with amounts if possible) or analyze a food photo. Educational only.</Text>

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

        <Text style={[styles.title, { marginTop: theme.spacing(2) }]}>Photo Analysis</Text>
        <Card>
          {imageUri ? (
            <TouchableOpacity onPress={pickImage} activeOpacity={0.9}>
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: 180, borderRadius: theme.radius.sm }} />
            </TouchableOpacity>
          ) : (
            <ButtonSecondary title="Pick a Photo" onPress={pickImage} />
          )}
          <View style={{ height: theme.spacing(1) }} />
          <ButtonPrimary title={photoLoading ? 'Analyzing…' : 'Analyze Photo'} onPress={analyzePhoto} disabled={photoLoading} />
          {photoLoading && (
            <View style={{ paddingVertical: 12 }}>
              <ActivityIndicator />
            </View>
          )}
          {!!photoError && (
            <Text style={{ color: '#dc2626', marginTop: theme.spacing(1) }}>{photoError}</Text>
          )}
        </Card>

        {photoResult && (
          <Card style={{ marginTop: theme.spacing(2) }}>
            <Text style={{ fontWeight: '800', fontSize: 16 }}>{photoResult.foodName}</Text>
            <View style={{ height: theme.spacing(0.5) }} />
            <Text>Calories: {photoResult.calories} kcal</Text>
            <Text>Protein: {photoResult.protein} g</Text>
            <Text>Carbs: {photoResult.carbs} g</Text>
            <Text>Fats: {photoResult.fats} g</Text>
            <View style={{ height: theme.spacing(0.5) }} />
            <Text style={{ fontWeight: '700' }}>Recommendation: {photoResult.recommended === 'yes' ? 'RECOMMENDED' : 'NOT RECOMMENDED'}</Text>
            <View style={{ height: theme.spacing(0.5) }} />
            <Text>{photoResult.healthNotes}</Text>
          </Card>
        )}
      </ScrollView>

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
  container: { flex: 1, backgroundColor: theme.colors.bg },
  scrollContent: { padding: theme.spacing(2), paddingBottom: theme.spacing(10) },
  title: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  subtitle: { color: theme.colors.subtext, marginTop: 6, marginBottom: theme.spacing(2) },
  input: { width: '100%', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: 10, color: theme.colors.text, backgroundColor: theme.colors.card },
  multiline: { minHeight: 100, textAlignVertical: 'top' as const },
});

export default NutritionCheckScreen;
