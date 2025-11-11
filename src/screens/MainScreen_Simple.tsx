import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../ui/theme';
import { useAuth } from '../context/AuthContext';
import type { Appointment } from '../services/appointments';
import { getUserAppointments } from '../services/appointments';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const MainScreenNew: React.FC<any> = ({ navigation }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user]);

  const loadAppointments = async () => {
    const data = await getUserAppointments();
    setAppointments(data);
  };

  const getUpcomingAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointments
      .filter(apt => new Date(apt.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  };

  const upcomingAppointments = getUpcomingAppointments();

  const quickActions = [
    {
      id: 1,
      title: 'AI Assistant',
      subtitle: 'Ask questions',
      icon: 'chatbubble-ellipses',
      color: '#1877F2',
      screen: 'Chat',
    },
    {
      id: 2,
      title: 'Scan Food',
      subtitle: 'Check nutrition',
      icon: 'camera',
      color: '#42B72A',
      screen: 'FoodScan',
    },
    {
      id: 3,
      title: 'Community',
      subtitle: 'Share & connect',
      icon: 'people',
      color: '#1877F2',
      screen: 'Feed',
    },
    {
      id: 4,
      title: 'Resources',
      subtitle: 'Learn more',
      icon: 'book',
      color: '#F7B928',
      screen: 'Resources',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day</Text>
          <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile', {})}
          style={styles.profileButton}
        >
          <Ionicons name="person-circle" size={40} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.grid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => navigation.navigate(action.screen, {})}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon as any} size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
              <TouchableOpacity onPress={() => {/* TODO: Navigate to appointments */}}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {upcomingAppointments.map((apt, index) => (
              <View key={apt.id || index} style={styles.appointmentCard}>
                <View style={styles.appointmentIcon}>
                  <Ionicons
                    name={apt.type === 'medical' ? 'medical' : apt.type === 'lab' ? 'flask' : 'calendar'}
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentTitle}>{apt.title}</Text>
                  <Text style={styles.appointmentTime}>
                    {new Date(apt.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    • {apt.time}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
              </View>
            ))}
          </View>
        )}

        {/* Health Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Tools</Text>
          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => navigation.navigate('NutritionCheck', {})}
            activeOpacity={0.7}
          >
            <View style={styles.featureLeft}>
              <View style={[styles.featureIcon, { backgroundColor: theme.colors.accentLight }]}>
                <Ionicons name="nutrition" size={28} color={theme.colors.accent} />
              </View>
              <View>
                <Text style={styles.featureTitle}>Nutrition Check</Text>
                <Text style={styles.featureSubtitle}>Track your meals</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={24} color={theme.colors.subtext} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => navigation.navigate('Wellness', {})}
            activeOpacity={0.7}
          >
            <View style={styles.featureLeft}>
              <View style={[styles.featureIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name="fitness" size={28} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.featureTitle}>Wellness Tips</Text>
                <Text style={styles.featureSubtitle}>Daily health advice</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={24} color={theme.colors.subtext} />
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  greeting: {
    fontSize: 14,
    color: theme.colors.subtext,
    fontWeight: '400',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 2,
  },
  profileButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: theme.colors.subtext,
    textAlign: 'center',
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.sm,
  },
  appointmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 14,
    color: theme.colors.subtext,
  },
  featureCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.sm,
  },
  featureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 14,
    color: theme.colors.subtext,
  },
});

export default MainScreenNew;
