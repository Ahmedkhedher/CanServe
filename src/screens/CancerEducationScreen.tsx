import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../ui/theme';

const { width } = Dimensions.get('window');

const CancerEducationScreen: React.FC<any> = ({ navigation }) => {
  const [expandedFact, setExpandedFact] = useState<number | null>(null);
  const [expandedMyth, setExpandedMyth] = useState<number | null>(null);

  const interestingFacts = [
    {
      icon: 'medical',
      color: '#E74C3C',
      title: 'Cancer is Not One Disease',
      detail: 'There are over 200 different types of cancer, each with unique characteristics. From breast to brain, lung to leukemia - each requires different treatment approaches and has different survival rates.',
    },
    {
      icon: 'fitness',
      color: '#27AE60',
      title: '40% of Cancers are Preventable',
      detail: 'Research shows that lifestyle changes can prevent up to 40% of cancers. Regular exercise, healthy diet, avoiding tobacco, limiting alcohol, and sun protection are powerful prevention tools.',
    },
    {
      icon: 'water',
      color: '#3498DB',
      title: 'Your Body Fights Cancer Daily',
      detail: 'Every day, your immune system identifies and destroys thousands of abnormal cells that could become cancerous. It\'s like having a 24/7 security team protecting you!',
    },
    {
      icon: 'pulse',
      color: '#9B59B6',
      title: 'Cancer Survival Rates Are Rising',
      detail: 'Thanks to advances in research and early detection, cancer survival rates have doubled in the last 50 years. Many cancers caught early now have cure rates above 90%.',
    },
    {
      icon: 'color-palette',
      color: '#F39C12',
      title: 'Cancer Ribbon Colors Have Meaning',
      detail: 'Pink for breast cancer, gold for childhood cancer, purple for pancreatic cancer - each ribbon color raises awareness for specific cancer types and research efforts.',
    },
    {
      icon: 'flask',
      color: '#1ABC9C',
      title: 'Personalized Medicine is the Future',
      detail: 'Scientists can now analyze your specific cancer\'s DNA to create targeted treatments. This precision medicine approach is revolutionizing cancer care with fewer side effects.',
    },
  ];

  const mythsVsFacts = [
    {
      myth: 'Cancer is Always a Death Sentence',
      fact: 'Many cancers are highly treatable, especially when caught early. Survival rates for many cancers now exceed 90% with modern treatments.',
      icon: 'close-circle',
      factIcon: 'checkmark-circle',
    },
    {
      myth: 'Cancer is Contagious',
      fact: 'Cancer itself cannot spread from person to person. However, some viruses (like HPV) that can lead to cancer are transmissible - but vaccines exist!',
      icon: 'close-circle',
      factIcon: 'checkmark-circle',
    },
    {
      myth: 'Sugar Feeds Cancer',
      fact: 'While cancer cells use sugar (glucose) for energy like all cells, eating sugar doesn\'t make cancer grow faster. A balanced diet is what matters.',
      icon: 'close-circle',
      factIcon: 'checkmark-circle',
    },
    {
      myth: 'Cancer Only Affects Old People',
      fact: 'While cancer risk increases with age, it can affect anyone at any age, including children. Early detection is important for everyone.',
      icon: 'close-circle',
      factIcon: 'checkmark-circle',
    },
    {
      myth: 'Cell Phones Cause Cancer',
      fact: 'Extensive research has found no convincing evidence that cell phone use increases cancer risk. They emit non-ionizing radiation, which is different from cancer-causing radiation.',
      icon: 'close-circle',
      factIcon: 'checkmark-circle',
    },
  ];

  const preventionTips = [
    {
      icon: 'ban',
      color: '#E74C3C',
      title: 'Don\'t Smoke',
      description: 'Smoking causes 30% of all cancer deaths. Quitting is the #1 thing you can do to prevent cancer.',
      impact: 'Reduces risk by 90%',
    },
    {
      icon: 'nutrition',
      color: '#27AE60',
      title: 'Eat a Rainbow',
      description: 'Colorful fruits and vegetables contain antioxidants that protect cells from damage.',
      impact: 'Reduces risk by 20%',
    },
    {
      icon: 'barbell',
      color: '#3498DB',
      title: 'Stay Active',
      description: '30 minutes of daily exercise reduces cancer risk and improves treatment outcomes.',
      impact: 'Reduces risk by 15%',
    },
    {
      icon: 'sunny',
      color: '#F39C12',
      title: 'Protect Your Skin',
      description: 'Use SPF 30+, avoid tanning beds, and seek shade. Skin cancer is one of the most preventable.',
      impact: 'Reduces risk by 95%',
    },
    {
      icon: 'shield-checkmark',
      color: '#9B59B6',
      title: 'Get Vaccinated',
      description: 'HPV and Hepatitis B vaccines prevent viruses that can lead to cancer.',
      impact: 'Prevents up to 6 cancers',
    },
    {
      icon: 'calendar',
      color: '#1ABC9C',
      title: 'Get Screened',
      description: 'Regular screenings can catch cancer early when it\'s most treatable.',
      impact: 'Saves 1000s of lives',
    },
  ];

  const breakthroughs = [
    {
      year: '2024',
      title: 'AI Detects Cancer Earlier',
      description: 'Artificial intelligence can now detect breast cancer up to 2 years earlier than traditional methods.',
    },
    {
      year: '2023',
      title: 'mRNA Cancer Vaccines',
      description: 'Personalized vaccines train your immune system to attack cancer cells specifically.',
    },
    {
      year: '2022',
      title: 'Blood Tests for Multiple Cancers',
      description: 'A single blood test can now screen for over 50 types of cancer at once.',
    },
    {
      year: '2021',
      title: 'CAR-T Cell Therapy',
      description: 'Genetically modified immune cells achieve 80%+ remission rates in some blood cancers.',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary, '#0A66C2']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Cancer Education</Text>
          <Text style={styles.headerSubtitle}>Knowledge is Power</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="school" size={32} color="#FFFFFF" />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Introduction */}
        <View style={styles.introCard}>
          <Text style={styles.introText}>
            Understanding cancer empowers you to make informed decisions about prevention, screening, and treatment. Let's explore the fascinating science behind cancer! 🔬
          </Text>
        </View>

        {/* Interesting Facts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={24} color={theme.colors.warning} />
            <Text style={styles.sectionTitle}>Fascinating Facts</Text>
          </View>
          {interestingFacts.map((fact, index) => (
            <TouchableOpacity
              key={index}
              style={styles.factCard}
              onPress={() => setExpandedFact(expandedFact === index ? null : index)}
              activeOpacity={0.7}
            >
              <View style={styles.factHeader}>
                <View style={[styles.factIcon, { backgroundColor: fact.color }]}>
                  <Ionicons name={fact.icon as any} size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.factTitle}>{fact.title}</Text>
                <Ionicons
                  name={expandedFact === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.subtext}
                />
              </View>
              {expandedFact === index && (
                <Text style={styles.factDetail}>{fact.detail}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Myths vs Facts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="alert-circle" size={24} color={theme.colors.danger} />
            <Text style={styles.sectionTitle}>Myths vs Facts</Text>
          </View>
          {mythsVsFacts.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.mythCard}
              onPress={() => setExpandedMyth(expandedMyth === index ? null : index)}
              activeOpacity={0.7}
            >
              <View style={styles.mythHeader}>
                <Ionicons name="close-circle" size={24} color={theme.colors.danger} />
                <Text style={styles.mythText}>{item.myth}</Text>
              </View>
              {expandedMyth === index && (
                <View style={styles.factContainer}>
                  <View style={styles.factBadge}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                    <Text style={styles.factBadgeText}>FACT</Text>
                  </View>
                  <Text style={styles.factText}>{item.fact}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Prevention Tips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={24} color={theme.colors.success} />
            <Text style={styles.sectionTitle}>Prevention is Powerful</Text>
          </View>
          <View style={styles.preventionGrid}>
            {preventionTips.map((tip, index) => (
              <View key={index} style={styles.preventionCard}>
                <View style={[styles.preventionIcon, { backgroundColor: tip.color }]}>
                  <Ionicons name={tip.icon as any} size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.preventionTitle}>{tip.title}</Text>
                <Text style={styles.preventionDescription}>{tip.description}</Text>
                <View style={styles.impactBadge}>
                  <Text style={styles.impactText}>{tip.impact}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Breakthroughs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="rocket" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Recent Breakthroughs</Text>
          </View>
          {breakthroughs.map((breakthrough, index) => (
            <View key={index} style={styles.breakthroughCard}>
              <View style={styles.breakthroughYear}>
                <Text style={styles.yearText}>{breakthrough.year}</Text>
              </View>
              <View style={styles.breakthroughContent}>
                <Text style={styles.breakthroughTitle}>{breakthrough.title}</Text>
                <Text style={styles.breakthroughDescription}>{breakthrough.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Call to Action */}
        <View style={styles.ctaCard}>
          <Ionicons name="heart" size={32} color={theme.colors.danger} />
          <Text style={styles.ctaTitle}>Stay Informed, Stay Healthy</Text>
          <Text style={styles.ctaText}>
            Regular check-ups, healthy lifestyle choices, and staying informed about cancer can save lives. Share this knowledge with your loved ones! 💙
          </Text>
        </View>

        <View style={{ height: 40 }} />
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
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  introCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    ...theme.shadows.md,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  factCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.sm,
  },
  factHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  factIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  factTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  factDetail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.subtext,
  },
  mythCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFDDDD',
  },
  mythHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mythText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.danger,
  },
  factContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0FFF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  factBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  factBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.success,
  },
  factText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
  },
  preventionGrid: {
    gap: 12,
  },
  preventionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...theme.shadows.sm,
  },
  preventionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  preventionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  preventionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.subtext,
    marginBottom: 12,
  },
  impactBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  impactText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  breakthroughCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.sm,
  },
  breakthroughYear: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  yearText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  breakthroughContent: {
    flex: 1,
  },
  breakthroughTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  breakthroughDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.subtext,
  },
  ctaCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.subtext,
    textAlign: 'center',
  },
});

export default CancerEducationScreen;
