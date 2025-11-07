import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ButtonPrimary, ButtonSecondary, Card, FooterBar } from '../ui/components';
import { theme } from '../ui/theme';
import { analyzeFoodImage } from '../services/gemini';

const ScanFoodScreen: React.FC<any> = ({ navigation }) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [cancerType, setCancerType] = useState('');
  const [stage, setStage] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ recommended: 'yes' | 'no' } | null>(null);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      return Alert.alert('Permission required', 'Please allow photo library access to select an image.');
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setImageUri(res.assets[0].uri);
      setResult(null);
    }
  };

  const analyze = async () => {
    if (!imageUri) return Alert.alert('No image', 'Please select a food image first.');
    try {
      setLoading(true);
      setResult(null);
      const r = await analyzeFoodImage({ imageUri, cancerType, stage, age });
      setResult(r);
    } catch (e: any) {
      Alert.alert('Analysis failed', e?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const badgeColor = (rec?: string) => {
    switch (rec) {
      case 'yes': return '#16a34a';
      case 'no': return '#dc2626';
      default: return theme.colors.border;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan Food</Text>
      <Text style={styles.subtitle}>Pick a food photo and get a quick recommendation based on your context. Educational only.</Text>

      <Card style={{ alignItems: 'center' }}>
        <TouchableOpacity onPress={pickImage} activeOpacity={0.9}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} />
          ) : (
            <View style={[styles.preview, styles.previewPlaceholder]}>
              <Text style={{ color: theme.colors.subtext }}>Tap to select image</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={{ height: theme.spacing(1.5) }} />
        <View style={styles.row}>
          <TextInput placeholder="Cancer type" placeholderTextColor={theme.colors.subtext} value={cancerType} onChangeText={setCancerType} style={styles.input} />
        </View>
        <View style={styles.row}>
          <TextInput placeholder="Stage" placeholderTextColor={theme.colors.subtext} value={stage} onChangeText={setStage} style={styles.input} />
        </View>
        <View style={styles.row}>
          <TextInput placeholder="Age" placeholderTextColor={theme.colors.subtext} value={age} onChangeText={setAge} style={styles.input} keyboardType="number-pad" />
        </View>
        <View style={{ height: theme.spacing(1) }} />
        <ButtonPrimary title={loading ? 'Analyzing…' : 'Analyze'} onPress={analyze} disabled={loading} />
      </Card>

      {loading && (
        <View style={{ paddingVertical: 12 }}>
          <ActivityIndicator />
        </View>
      )}

      {result && (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: badgeColor(result.recommended), marginRight: 8 }} />
            <Text style={{ fontWeight: '800' }}>Recommendation: {result.recommended === 'yes' ? 'RECOMMENDED' : 'NOT RECOMMENDED'}</Text>
          </View>
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
  preview: { width: 220, height: 220, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border },
  previewPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.card },
  row: { width: '100%', marginTop: theme.spacing(1) },
  input: { width: '100%', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: 10, color: theme.colors.text, backgroundColor: theme.colors.card },
});

export default ScanFoodScreen;
