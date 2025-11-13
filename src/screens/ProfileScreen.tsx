import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../ui/theme';
import { loadProfile, saveProfile } from '../services/profile';

const ProfileScreenNew: React.FC<any> = ({ navigation }) => {
  const { signOut, user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [cancerType, setCancerType] = useState('');
  const [stage, setStage] = useState('');
  const [age, setAge] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    console.log('🔄 Loading user profile...');
    const p = await loadProfile();
    if (p) {
      console.log('✅ Profile loaded:', {
        displayName: p.displayName,
        hasPhotoURL: !!p.photoURL,
        photoURLLength: p.photoURL?.length,
        cancerType: p.cancerType,
        stage: p.stage,
        age: p.age
      });
      
      setDisplayName(p.displayName || user?.displayName || 'Member');
      // Use Firebase Auth photoURL as primary source, fallback to profile photoURL
      setPhotoURL(user?.photoURL || p.photoURL);
      if (p.cancerType) setCancerType(p.cancerType);
      if (p.stage) setStage(p.stage);
      if (typeof p.age === 'number') setAge(String(p.age));
    } else {
      console.log('❌ No profile found, using Firebase Auth data');
      setDisplayName(user?.displayName || 'Member');
      setPhotoURL(user?.photoURL || undefined);
    }
  };

  const pickImage = async () => {
    try {
      setSaving(true);
      console.log('🔄 Starting profile image picker for platform:', Platform.OS);
      
      if (Platform.OS === 'web') {
        // Web implementation using HTML file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        return new Promise<void>((resolve, reject) => {
          input.onchange = async (event: any) => {
            const file = event.target.files?.[0];
            if (file) {
              try {
                console.log('🔄 Converting web profile picture to base64...');
                
                const reader = new FileReader();
                reader.onloadend = async () => {
                  if (typeof reader.result === 'string') {
                    console.log('✅ Web profile base64 conversion successful');
                    const url = reader.result;
                    
                    // Update local state
                    setPhotoURL(url);
                    
                    // Save to database
                    await saveProfile({
                      displayName: displayName.trim() || 'Member',
                      photoURL: url,
                      cancerType: cancerType.trim() || undefined,
                      stage: stage.trim() || undefined,
                      age: Number.isFinite(parseInt(age, 10)) ? parseInt(age, 10) : undefined,
                    });
                    
                    console.log('✅ Web profile picture converted and saved!');
                    await loadUserProfile();
                    Alert.alert('Success', 'Profile picture updated! Everyone can now see it.');
                    resolve();
                  } else {
                    reject(new Error('Failed to convert to base64'));
                  }
                };
                reader.onerror = () => reject(new Error('FileReader error'));
                reader.readAsDataURL(file);
              } catch (e: any) {
                console.error('❌ Web profile picture update failed:', e);
                Alert.alert('Update failed', e?.message ?? 'Could not update profile picture');
                reject(e);
              }
            } else {
              resolve(); // User canceled
            }
          };
          
          input.oncancel = () => resolve(); // User canceled
          input.click();
        });
      } else {
        // Mobile implementation using expo-image-picker
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
          setSaving(false);
          return Alert.alert('Permission required', 'Please allow photo library access.');
        }
        
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        });
        
        if (!res.canceled && res.assets?.[0]?.uri) {
          console.log('🔄 Converting mobile profile picture to base64...');
          
          // Convert to base64 directly using a more reliable method
          const response = await fetch(res.assets[0].uri);
          const blob = await response.blob();
          
          const base64Url = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                console.log('✅ Mobile profile base64 conversion successful');
                resolve(reader.result);
              } else {
                reject(new Error('Failed to convert to base64'));
              }
            };
            reader.onerror = () => reject(new Error('FileReader error'));
            reader.readAsDataURL(blob);
          });
          
          const url = base64Url;
          
          // Update local state
          setPhotoURL(url);
          
          // Save to database
          await saveProfile({
            displayName: displayName.trim() || 'Member',
            photoURL: url,
            cancerType: cancerType.trim() || undefined,
            stage: stage.trim() || undefined,
            age: Number.isFinite(parseInt(age, 10)) ? parseInt(age, 10) : undefined,
          });
          
          console.log('✅ Mobile profile picture converted and saved!');
          
          // Reload profile to confirm it was saved
          await loadUserProfile();
          
          Alert.alert('Success', 'Profile picture updated! Everyone can now see it.');
        }
      }
    } catch (e: any) {
      console.error('❌ Profile picture update failed:', e);
      Alert.alert('Update failed', e?.message ?? 'Could not update profile picture');
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    try {
      setSaving(true);
      const ageNum = parseInt(age, 10);
      await saveProfile({
        displayName: displayName.trim() || 'Member',
        photoURL,
        cancerType: cancerType.trim() || undefined,
        stage: stage.trim() || undefined,
        age: Number.isFinite(ageNum) ? ageNum : undefined,
      });
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (displayName) return displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={onSave} disabled={saving}>
          <Text style={[styles.saveText, saving && styles.saveTextDisabled]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            onPress={pickImage}
            style={styles.avatarContainer}
            activeOpacity={0.7}
          >
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
            )}
            <View style={styles.cameraButton}>
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Change Profile Picture</Text>
        </View>

        {/* Profile Info Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                placeholder="Enter your name"
                placeholderTextColor={theme.colors.subtext}
                value={displayName}
                onChangeText={setDisplayName}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.disabledInput}>
                <Text style={styles.disabledText}>{user?.email || 'Not available'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Health Info Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Information</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cancer Type</Text>
              <TextInput
                placeholder="e.g., Breast, Lung, etc."
                placeholderTextColor={theme.colors.subtext}
                value={cancerType}
                onChangeText={setCancerType}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Stage</Text>
              <TextInput
                placeholder="e.g., Stage I, II, III, IV"
                placeholderTextColor={theme.colors.subtext}
                value={stage}
                onChangeText={setStage}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                placeholder="Your age"
                placeholderTextColor={theme.colors.subtext}
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('OnboardingSummary')}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="document-text" size={24} color={theme.colors.primary} />
                <Text style={styles.actionText}>View Summary</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <Ionicons name="settings" size={24} color={theme.colors.primary} />
                <Text style={styles.actionText}>Settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <Ionicons name="help-circle" size={24} color={theme.colors.primary} />
                <Text style={styles.actionText}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Ionicons name="log-out" size={20} color={theme.colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 8,
    borderBottomColor: theme.colors.bg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: theme.colors.primary,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.primaryLight,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...theme.shadows.md,
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
  },
  inputGroup: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.bg,
  },
  disabledInput: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: theme.colors.bg,
  },
  disabledText: {
    fontSize: 16,
    color: theme.colors.subtext,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.danger,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.danger,
  },
});

export default ProfileScreenNew;
