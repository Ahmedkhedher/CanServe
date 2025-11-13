import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { fetchDietAndWellness } from '../services/gemini';
import { theme } from '../ui/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Wellness'>;

const WellnessScreen: React.FC<Props> = ({ navigation, route }) => {
  const [type, setType] = useState('Breast');
  const [stage, setStage] = useState('I');
  const [age, setAge] = useState(35);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const result = await fetchDietAndWellness({ cancerType: type, stage, age: String(age) });
      const lines = result.suggestions.split('\n').map(l => l.trim());
      const extract = (label: string) => {
        const line = lines.find(l => l.toLowerCase().includes(label.toLowerCase()));
        return line ? line.split(':')[1]?.trim() || line : 'No data available';
      };
      setSuggestions({
        diet: extract('diet'),
        hydration: extract('hydration'),
        activity: extract('activity'),
        sleep: extract('sleep'),
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

  const renderWellnessCard = (icon: string, title: string, content: string, color: string, imagePath?: any) => (
    <View style={styles.wellnessCard} key={title}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={24} color="#FFFFFF" />
        </View>
        {imagePath && (
          <Image 
            source={imagePath} 
            style={styles.wellnessImage}
            resizeMode="contain"
          />
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardText}>{content}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wellness Plan</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {!suggestions ? (
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Text style={styles.sectionTitle}>Your Profile</Text>
              <Image 
                source={require('../../assets/better/Healthy.png')} 
                style={styles.profileHeaderImage}
                resizeMode="contain"
              />
            </View>
            
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
            <View style={styles.ageSlider}>
              <TouchableOpacity onPress={() => setAge(Math.max(18, age - 5))} style={styles.ageButton}>
                <Ionicons name="remove" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <Text style={styles.ageValue}>{age}</Text>
              <TouchableOpacity onPress={() => setAge(Math.min(100, age + 5))} style={styles.ageButton}>
                <Ionicons name="add" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.generateButton, loading && styles.generateButtonDisabled]}
              onPress={generate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.generateButtonText}>Generate Wellness Plan</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={styles.sectionTitle}>Your Personalized Wellness Plan</Text>
              <Image 
                source={require('../../assets/better/Gym-guy.png')} 
                style={styles.resultsHeaderImage}
                resizeMode="contain"
              />
            </View>
            
            {renderWellnessCard('restaurant', 'Diet', suggestions.diet, '#4CAF50', require('../../assets/better/Healthy.png'))}
            {renderWellnessCard('water', 'Hydration', suggestions.hydration, '#2196F3', require('../../assets/better/Coffee.png'))}
            {renderWellnessCard('fitness', 'Activity', suggestions.activity, '#FF9800', require('../../assets/better/Dumbbell.png'))}
            {renderWellnessCard('bed', 'Sleep', suggestions.sleep, '#9C27B0', require('../../assets/better/Bed.png'))}

            <TouchableOpacity 
              onPress={() => setSuggestions(null)} 
              style={styles.newPlanButton}
            >
              <Text style={styles.newPlanButtonText}>Create New Plan</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    ...theme.shadows.sm,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  profileHeaderImage: {
    width: 80,
    height: 80,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  resultsHeaderImage: {
    width: 100,
    height: 100,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.border,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  ageSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 20,
  },
  ageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    minWidth: 60,
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  wellnessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  wellnessImage: {
    width: 60,
    height: 60,
    marginLeft: 'auto',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: theme.colors.subtext,
    lineHeight: 20,
  },
  newPlanButton: {
    backgroundColor: theme.colors.border,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  newPlanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
});

export default WellnessScreen;
