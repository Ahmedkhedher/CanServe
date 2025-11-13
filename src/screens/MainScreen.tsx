import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../ui/theme';
import { useAuth } from '../context/AuthContext';
import type { Appointment } from '../services/appointments';
import { getUserAppointments } from '../services/appointments';
import { loadProfile } from '../services/profile';

const { width } = Dimensions.get('window');

const MainScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Refresh data when screen comes into focus (e.g., returning from Calendar)
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadData();
      }
    }, [user])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [appts, profile] = await Promise.all([
        getUserAppointments(),
        loadProfile()
      ]);
      setAppointments(appts);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getInitials = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getUpcomingAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointments
      .filter(apt => new Date(apt.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const upcomingAppointments = getUpcomingAppointments();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[theme.colors.primary, '#0A66C2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logo}
            >
              <Ionicons name="heart" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.appName}>CanServe</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile', {})}
              style={styles.profileImageButton}
            >
              {userProfile?.photoURL ? (
                <Image source={{ uri: userProfile.photoURL }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileImageText}>{getInitials()}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerBottom}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >
        {/* Featured Card - Daily Tip */}
        <View style={styles.featuredSection}>
          <LinearGradient
            colors={[theme.colors.primary, '#0A66C2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featuredCard}
          >
            <View style={styles.featuredIcon}>
              <Ionicons name="bulb" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.featuredContent}>
              <Text style={styles.featuredTitle}>Daily Health Tip</Text>
              <Text style={styles.featuredText}>
                Stay hydrated! Drink at least 8 glasses of water daily to help your body function optimally.
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <TouchableOpacity style={styles.statCard} activeOpacity={0.7}>
              <View style={[styles.statIcon, { backgroundColor: '#E7F3FF' }]}>
                <Ionicons name="calendar" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.statNumber}>{upcomingAppointments.length}</Text>
              <Text style={styles.statLabel}>Appointments</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('Feed', {})}
              activeOpacity={0.7}
            >
              <View style={[styles.statIcon, { backgroundColor: '#E7F5E4' }]}>
                <Ionicons name="people" size={24} color={theme.colors.accent} />
              </View>
              <Text style={styles.statNumber}>24</Text>
              <Text style={styles.statLabel}>Community</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statCard} activeOpacity={0.7}>
              <View style={[styles.statIcon, { backgroundColor: '#FFF4E5' }]}>
                <Ionicons name="ribbon" size={24} color={theme.colors.warning} />
              </View>
              <Text style={styles.statNumber}>7</Text>
              <Text style={styles.statLabel}>Days Strong</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Chat', {})}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIcon, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="chatbubble-ellipses" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.quickText}>AI Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('FoodScan', {})}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIcon, { backgroundColor: theme.colors.accent }]}>
                <Ionicons name="camera" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.quickText}>Scan Food</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Feed', {})}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIcon, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="people" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.quickText}>Community</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Resources', {})}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIcon, { backgroundColor: theme.colors.warning }]}>
                <Ionicons name="book" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.quickText}>Resources</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Wellness', {})}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIcon, { backgroundColor: '#9B59B6' }]}>
                <Ionicons name="fitness" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.quickText}>Wellness</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('CancerEducation')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIcon, { backgroundColor: '#E74C3C' }]}>
                <Ionicons name="school" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.quickText}>Learn</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Appointments</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
              <Text style={styles.seeAll}>
                {upcomingAppointments.length > 0 ? 'View All' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
          {upcomingAppointments.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyAppointments}
              onPress={() => navigation.navigate('Calendar')}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={48} color={theme.colors.subtext} />
              <Text style={styles.emptyAppointmentsText}>No upcoming appointments</Text>
              <Text style={styles.emptyAppointmentsSubtext}>
                Tap to schedule your next checkup or treatment
              </Text>
            </TouchableOpacity>
          ) : (
            upcomingAppointments.slice(0, 3).map((apt, index) => (
              <View key={apt.id || index} style={styles.appointmentCard}>
                <View style={styles.appointmentLeft}>
                  <View style={styles.appointmentDate}>
                    <Text style={styles.appointmentDay}>
                      {new Date(apt.date).getDate()}
                    </Text>
                    <Text style={styles.appointmentMonth}>
                      {new Date(apt.date).toLocaleDateString('en-US', { month: 'short' })}
                    </Text>
                  </View>
                  <View style={styles.appointmentDetails}>
                    <Text style={styles.appointmentTitle}>{apt.title}</Text>
                    <View style={styles.appointmentMeta}>
                      <Ionicons name="time-outline" size={14} color={theme.colors.subtext} />
                      <Text style={styles.appointmentTime}>{apt.time}</Text>
                    </View>
                  </View>
                </View>
                <Ionicons
                  name={
                    apt.type === 'medical'
                      ? 'medical'
                      : apt.type === 'lab'
                      ? 'flask'
                      : 'calendar'
                  }
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
            ))
          )}
        </View>

        {/* Health Journey */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Health Journey</Text>
          <View style={styles.journeyCard}>
            <View style={styles.journeyHeader}>
              <View>
                <Text style={styles.journeyTitle}>Track Your Progress</Text>
                <Text style={styles.journeySubtitle}>Stay motivated on your journey</Text>
              </View>
              <View style={styles.journeyBadge}>
                <Ionicons name="trophy" size={32} color={theme.colors.warning} />
              </View>
            </View>
            <View style={styles.journeyProgress}>
              <View style={styles.progressItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.accent} />
                <Text style={styles.progressText}>Profile Complete</Text>
              </View>
              <View style={styles.progressItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.accent} />
                <Text style={styles.progressText}>First Chat Session</Text>
              </View>
              <View style={styles.progressItem}>
                <Ionicons
                  name="ellipse-outline"
                  size={20}
                  color={theme.colors.subtext}
                />
                <Text style={styles.progressText}>Join Community</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Resources</Text>
          <View style={styles.supportGrid}>
            <TouchableOpacity style={styles.supportCard} activeOpacity={0.7}>
              <Ionicons name="call" size={24} color={theme.colors.primary} />
              <Text style={styles.supportText}>Helpline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.supportCard} activeOpacity={0.7}>
              <Ionicons name="medical" size={24} color={theme.colors.danger} />
              <Text style={styles.supportText}>Emergency</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.supportCard} activeOpacity={0.7}>
              <Ionicons name="help-circle" size={24} color={theme.colors.accent} />
              <Text style={styles.supportText}>FAQs</Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  headerBottom: {
    paddingBottom: 4,
  },
  headerLeft: {
    flex: 1,
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
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageButton: {
    width: 40,
    height: 40,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  featuredSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  featuredCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  featuredIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featuredContent: {
    flex: 1,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featuredText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    opacity: 0.95,
  },
  statsSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.subtext,
    textAlign: 'center',
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
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    width: (width - 56) / 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  appointmentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.sm,
  },
  appointmentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentDate: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appointmentDay: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  appointmentMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    textTransform: 'uppercase',
  },
  appointmentDetails: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  appointmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  appointmentTime: {
    fontSize: 14,
    color: theme.colors.subtext,
  },
  journeyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    ...theme.shadows.sm,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  journeyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  journeySubtitle: {
    fontSize: 14,
    color: theme.colors.subtext,
  },
  journeyBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF4E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  journeyProgress: {
    gap: 12,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressText: {
    fontSize: 15,
    color: theme.colors.text,
  },
  supportGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  supportCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    ...theme.shadows.sm,
  },
  supportText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.subtext,
    fontWeight: '500',
  },
  // Empty appointments
  emptyAppointments: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  emptyAppointmentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyAppointmentsSubtext: {
    fontSize: 14,
    color: theme.colors.subtext,
    textAlign: 'center',
  },
});

export default MainScreen;
