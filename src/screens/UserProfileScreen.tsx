import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Card } from '../ui/components';
import { theme } from '../ui/theme';
import { loadUserProfile, AppProfile } from '../services/profile';
import { scaleFontSize } from '../ui/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

const UserProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const userId = route.params.userId;
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    (async () => {
      try {
        const p = await loadUserProfile(userId);
        setProfile(p);
      } catch (e) {
        console.error('Failed to load user profile:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={scaleFontSize(24)} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="account-off" size={scaleFontSize(64)} color={theme.colors.subtext} />
          <Text style={styles.errorText}>Profile not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={scaleFontSize(24)} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Card elevated style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {profile.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>
                  {(profile.displayName || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.displayName}>{profile.displayName || 'Member'}</Text>

          {profile.role && (
            <View style={styles.roleContainer}>
              <MaterialCommunityIcons name="shield-account" size={scaleFontSize(16)} color={theme.colors.primary} />
              <Text style={styles.roleText}>{profile.role}</Text>
            </View>
          )}
        </Card>

        {/* Health Information (if available and user has diagnosed status) */}
        {profile.diagnosed && (
          <Card elevated style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Health Information</Text>
            
            {profile.cancerType && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="medical-bag" size={scaleFontSize(20)} color={theme.colors.accent} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Cancer Type</Text>
                  <Text style={styles.infoValue}>{profile.cancerType}</Text>
                </View>
              </View>
            )}

            {profile.stage && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="progress-check" size={scaleFontSize(20)} color={theme.colors.accent} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Stage</Text>
                  <Text style={styles.infoValue}>{profile.stage}</Text>
                </View>
              </View>
            )}

            {typeof profile.inTreatment === 'boolean' && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="hospital-box" size={scaleFontSize(20)} color={theme.colors.accent} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Currently in Treatment</Text>
                  <Text style={styles.infoValue}>{profile.inTreatment ? 'Yes' : 'No'}</Text>
                </View>
              </View>
            )}

            {profile.treatmentTypes && profile.treatmentTypes.length > 0 && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="pill" size={scaleFontSize(20)} color={theme.colors.accent} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Treatment Types</Text>
                  <View style={styles.tagsContainer}>
                    {profile.treatmentTypes.map((type, idx) => (
                      <View key={idx} style={styles.tag}>
                        <Text style={styles.tagText}>{type}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Additional Information */}
        <Card elevated style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Additional Information</Text>

          {profile.age && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar" size={scaleFontSize(20)} color={theme.colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValue}>{profile.age}</Text>
              </View>
            </View>
          )}

          {profile.gender && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="gender-male-female" size={scaleFontSize(20)} color={theme.colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoValue}>{profile.gender}</Text>
              </View>
            </View>
          )}

          {profile.country && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="earth" size={scaleFontSize(20)} color={theme.colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Country</Text>
                <Text style={styles.infoValue}>{profile.country}</Text>
              </View>
            </View>
          )}

          {profile.interests && profile.interests.length > 0 && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="heart" size={scaleFontSize(20)} color={theme.colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Interests</Text>
                <View style={styles.tagsContainer}>
                  {profile.interests.map((interest, idx) => (
                    <View key={idx} style={styles.tag}>
                      <Text style={styles.tagText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
  },
  loadingText: {
    marginTop: theme.spacing(2),
    color: theme.colors.text,
    fontSize: scaleFontSize(16),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(4),
  },
  errorText: {
    marginTop: theme.spacing(2),
    color: theme.colors.subtext,
    fontSize: scaleFontSize(18),
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing(1),
  },
  headerTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: '700',
    color: theme.colors.text,
  },
  scrollContent: {
    padding: theme.spacing(2),
    paddingBottom: theme.spacing(4),
  },
  profileCard: {
    alignItems: 'center',
    padding: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  avatarContainer: {
    marginBottom: theme.spacing(2),
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  avatarFallback: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  avatarText: {
    fontSize: scaleFontSize(48),
    fontWeight: '800',
    color: theme.colors.primaryText,
  },
  displayName: {
    fontSize: scaleFontSize(24),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing(1),
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(0.5),
    borderRadius: theme.radius.full,
  },
  roleText: {
    marginLeft: theme.spacing(0.5),
    color: theme.colors.primary,
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
  infoCard: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  sectionTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing(2),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(2),
  },
  infoContent: {
    marginLeft: theme.spacing(1.5),
    flex: 1,
  },
  infoLabel: {
    fontSize: scaleFontSize(12),
    color: theme.colors.subtext,
    marginBottom: theme.spacing(0.25),
    fontWeight: '600',
  },
  infoValue: {
    fontSize: scaleFontSize(16),
    color: theme.colors.text,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: theme.spacing(0.5),
  },
  tag: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(0.5),
    borderRadius: theme.radius.full,
  },
  tagText: {
    color: theme.colors.primary,
    fontSize: scaleFontSize(12),
    fontWeight: '600',
  },
});

export default UserProfileScreen;
