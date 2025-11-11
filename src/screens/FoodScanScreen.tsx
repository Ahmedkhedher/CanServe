import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../services/minioStorage';
import { geminiAI } from '../services/geminiAI';
import { theme } from '../ui/theme';
import Markdown from 'react-native-markdown-display';

type Props = NativeStackScreenProps<RootStackParamList, 'FoodScan'>;

interface FoodAnalysis {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recommended: boolean;
  reason: string;
  tips: string[];
}

const FoodScanScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [rawResponse, setRawResponse] = useState<string>('');
  const [detectedFood, setDetectedFood] = useState<string>('');

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        return Alert.alert('Permission required', 'Please allow photo library access.');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setSelectedImage(result.assets[0].uri);
        setAnalysis(null);
        setRawResponse('');
        setUploadedImageUrl(null);
        setDetectedFood('');
      }
    } catch (error: any) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const analyzeFood = async () => {
    if (!selectedImage) return;

    try {
      // Upload image first
      setIsUploading(true);
      const filename = `food-${Date.now()}.jpg`;
      const imageUrl = await uploadImage(selectedImage, 'food-scans', filename);
      setUploadedImageUrl(imageUrl);
      setIsUploading(false);

      // Analyze with Gemini Vision
      setIsAnalyzing(true);

      const prompt = `You are a nutritionist for cancer patients. Look at this food and tell me:

**Food Name:** [What food is this?]

**Nutrition (per serving):**
- Calories: [number]
- Protein: [number]g
- Fat: [number]g

**Can Cancer Patients Eat This?**
[Answer ONLY: "YES - Safe to eat" OR "NO - Avoid this food" OR "CAUTION - Eat in moderation"]

**Why?**
[2-3 sentences explaining your recommendation. Consider: processed foods, sugar content, digestibility, protein, nutrients, immune support]

**Quick Tips:**
- [One helpful tip]
- [One warning if applicable]

Keep it simple and direct. Estimate realistic nutrition values based on typical serving sizes.`;

      const response = await geminiAI.sendMessageWithImage(prompt, imageUrl);
      console.log('=== FOOD ANALYSIS RESPONSE ===');
      console.log(response);
      console.log('==============================');
      
      setRawResponse(response);
      
      // Extract detected food from Food Name in response
      const foodNameMatch = response.match(/\*\*Food Name:\*\*\s*(.+?)(?:\n|$)/i);
      if (foodNameMatch) {
        const detected = foodNameMatch[1].trim();
        setDetectedFood(detected);
        console.log('✅ AI identified food as:', detected);
      } else {
        console.log('⚠️ Could not extract food name from response');
      }
      
      // Parse the response
      const parsed = parseAnalysis(response);
      setAnalysis(parsed);

    } catch (error: any) {
      console.error('Analysis error:', error);
      Alert.alert('Analysis Failed', error?.message || 'Could not analyze food. Please try again.');
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const parseAnalysis = (response: string): FoodAnalysis => {
    // Extract food name
    const nameMatch = response.match(/\*\*Food Name:\*\*\s*(.+?)(?:\n|$)/i);
    const name = nameMatch ? nameMatch[1].trim() : 'Unknown Food';

    // Extract nutritional values
    const caloriesMatch = response.match(/Calories:\s*(\d+)/i);
    const proteinMatch = response.match(/Protein:\s*(\d+)/i);
    const fatMatch = response.match(/Fat:\s*(\d+)/i);
    
    const calories = caloriesMatch ? parseInt(caloriesMatch[1]) : 0;
    const protein = proteinMatch ? parseInt(proteinMatch[1]) : 0;
    const fat = fatMatch ? parseInt(fatMatch[1]) : 0;

    // Determine recommendation from "Can Cancer Patients Eat This?"
    let recommended = false;
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('yes') && lowerResponse.includes('safe to eat')) {
      recommended = true;
    } else if (lowerResponse.includes('no') && lowerResponse.includes('avoid')) {
      recommended = false;
    } else if (lowerResponse.includes('caution')) {
      recommended = true; // Show as yellow/caution
    }

    // Extract reasoning from "Why?" section
    const reasonMatch = response.match(/\*\*Why\?\*\*\s*(.+?)(?=\*\*Quick Tips:|$)/is);
    const reason = reasonMatch ? reasonMatch[1].trim() : 'No detailed reasoning provided.';

    // Extract tips
    const tipsMatch = response.match(/\*\*Quick Tips:\*\*\s*([\s\S]+?)$/i);
    const tipsText = tipsMatch ? tipsMatch[1] : '';
    const tips = tipsText.split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(tip => tip.length > 0);

    return { 
      name, 
      calories, 
      protein, 
      carbs: 0, // Not using carbs anymore to keep it simple
      fat, 
      recommended, 
      reason, 
      tips 
    };
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Scanner</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Image Picker */}
        {!selectedImage ? (
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            <Text style={styles.uploadIcon}>📷</Text>
            <Text style={styles.uploadTitle}>Take or Upload Photo</Text>
            <Text style={styles.uploadSubtitle}>Snap a picture of your meal</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.foodImage} />
            <TouchableOpacity style={styles.changeImageButton} onPress={pickImage}>
              <Text style={styles.changeImageText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Analyze Button */}
        {selectedImage && !analysis && (
          <TouchableOpacity
            style={[styles.analyzeButton, (isUploading || isAnalyzing) && styles.analyzeButtonDisabled]}
            onPress={analyzeFood}
            disabled={isUploading || isAnalyzing}
          >
            {isUploading || isAnalyzing ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.analyzeButtonText}>
                  {isUploading ? 'Uploading...' : 'Analyzing...'}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.analyzeIcon}>🔍</Text>
                <Text style={styles.analyzeButtonText}>Analyze Food</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Analysis Results */}
        {analysis && (
          <View style={styles.resultsContainer}>
            {/* Food Image & Name */}
            <View style={styles.resultCard}>
              {uploadedImageUrl && (
                <Image source={{ uri: uploadedImageUrl }} style={styles.resultImage} />
              )}
              <Text style={styles.foodName}>{analysis.name}</Text>
              {detectedFood && (
                <View style={styles.detectedBadge}>
                  <Text style={styles.detectedText}>🔍 AI Vision Detected: {detectedFood}</Text>
                </View>
              )}
            </View>

            {/* Big Can I Eat This Answer */}
            <View style={[styles.answerCard, analysis.recommended ? styles.safeCard : styles.avoidCard]}>
              <Text style={styles.answerIcon}>
                {analysis.recommended ? '✅' : '❌'}
              </Text>
              <Text style={styles.answerTitle}>
                {analysis.recommended ? 'YES - You Can Eat This' : 'NO - Avoid This Food'}
              </Text>
              <Text style={styles.answerSubtitle}>
                {analysis.recommended ? 'Safe for cancer patients' : 'Not recommended during treatment'}
              </Text>
            </View>

            {/* Nutrition Info - Simple & Compact */}
            {(analysis.calories > 0 || analysis.protein > 0 || analysis.fat > 0) && (
              <View style={styles.nutritionCard}>
                <Text style={styles.nutritionTitle}>📊 Nutrition (per serving)</Text>
                <View style={styles.nutritionRow}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{analysis.calories}</Text>
                    <Text style={styles.nutritionLabel}>Calories</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{analysis.protein}g</Text>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{analysis.fat}g</Text>
                    <Text style={styles.nutritionLabel}>Fat</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Why Section */}
            <View style={styles.resultCard}>
              <Text style={styles.sectionTitle}>💡 Why?</Text>
              <Text style={styles.reasonText}>{analysis.reason}</Text>
            </View>

            {/* Tips Section */}
            {analysis.tips && analysis.tips.length > 0 && (
              <View style={styles.resultCard}>
                <Text style={styles.sectionTitle}>📌 Quick Tips</Text>
                {analysis.tips.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <Text style={styles.tipBullet}>•</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Scan Another Button */}
            <TouchableOpacity
              style={styles.scanAnotherButton}
              onPress={() => {
                setSelectedImage(null);
                setAnalysis(null);
                setRawResponse('');
                setUploadedImageUrl(null);
                setDetectedFood('');
              }}
            >
              <Text style={styles.scanAnotherText}>Scan Another Food</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.subtext,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  uploadBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  uploadIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  foodImage: {
    width: '100%',
    height: 300,
    borderRadius: 20,
    marginBottom: 12,
  },
  changeImageButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  changeImageText: {
    color: '#5B9AB8',
    fontWeight: '600',
    fontSize: 14,
  },
  analyzeButton: {
    backgroundColor: '#5B9AB8',
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    marginBottom: 20,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  analyzeIcon: {
    fontSize: 24,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  resultsContainer: {
    gap: 16,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  foodName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  detectedBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
    alignSelf: 'center',
  },
  detectedText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  answerCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  safeCard: {
    backgroundColor: '#D1FAE5',
    borderWidth: 3,
    borderColor: '#10B981',
  },
  avoidCard: {
    backgroundColor: '#FEE2E2',
    borderWidth: 3,
    borderColor: '#EF4444',
  },
  answerIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  answerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  answerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '600',
  },
  reasonText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingLeft: 4,
  },
  tipBullet: {
    fontSize: 20,
    color: '#5B9AB8',
    marginRight: 12,
    marginTop: -2,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  nutritionCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5B9AB8',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  scanAnotherButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  scanAnotherText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});

const markdownStyles = {
  body: {
    color: '#1F2937',
    fontSize: 15,
    lineHeight: 24,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 12,
  },
  strong: {
    fontWeight: '700' as '700',
    color: '#111827',
  },
  bullet_list: {
    marginVertical: 8,
  },
  list_item: {
    marginVertical: 4,
  },
};

export default FoodScanScreen;
