import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Linking, TextInput, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { FooterBar, ButtonSecondary, ButtonPrimary, Card } from '../ui/components';
import { useAuth } from '../context/AuthContext';
import { theme } from '../ui/theme';
import { loadProfile, saveProfile, uploadAvatarAsync } from '../services/profile';

const AVATARS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527980969970-0c9da7b3b6c1?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=800&auto=format&fit=crop',
];

const ProfileScreen: React.FC<any> = ({ navigation }) => {
  const { signOut } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      if (p) {
        setDisplayName(p.displayName || 'Member');
        setPhotoURL(p.photoURL);
      }
    })();
  }, []);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      return Alert.alert('Permission required', 'Please allow photo library access to upload an avatar.');
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled && res.assets?.[0]?.uri) {
      try {
        setSaving(true);
        const url = await uploadAvatarAsync(res.assets[0].uri);
        setPhotoURL(url);
      } catch (e: any) {
        Alert.alert('Upload failed', e?.message ?? 'Could not upload image');
      } finally {
        setSaving(false);
      }
    }
  };

  const onSave = async () => {
    try {
      setSaving(true);
      await saveProfile({ displayName: displayName.trim() || 'Member', photoURL });
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Profile</Text>

      <Card style={{ alignItems: 'center' }}>
        <TouchableOpacity onPress={pickImage} activeOpacity={0.9}>
          <Image source={{ uri: photoURL || AVATARS[0] }} style={styles.avatar} />
        </TouchableOpacity>
        <Text style={{ color: theme.colors.subtext, marginTop: 6 }}>Tap image to upload</Text>
        <View style={{ height: theme.spacing(1) }} />
        <TextInput
          placeholder="Display name"
          placeholderTextColor={theme.colors.subtext}
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.input}
        />
        <View style={{ height: theme.spacing(1) }} />
        <ButtonPrimary title={saving ? 'Saving…' : 'Save profile'} onPress={onSave} disabled={saving} />
      </Card>

      <Text style={styles.section}>Choose an avatar</Text>
      <View style={styles.avatarGrid}>
        {AVATARS.map((u, i) => (
          <TouchableOpacity key={i} onPress={() => setPhotoURL(u)}>
            <Image source={{ uri: u }} style={[styles.avatarSmall, photoURL === u && styles.avatarSmallActive]} />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.section}>Resources</Text>
      <View style={styles.card}>
        <Text style={styles.link} onPress={() => Linking.openURL('https://www.who.int/health-topics/cancer')}>WHO: Cancer</Text>
        <Text style={styles.link} onPress={() => Linking.openURL('https://www.cancerresearchuk.org/')}>Cancer Research UK</Text>
        <Text style={styles.link} onPress={() => Linking.openURL('https://www.nccn.org/patients')}>NCCN Guidelines for Patients</Text>
      </View>

      {saving && (
        <View style={{ paddingVertical: 8 }}>
          <ActivityIndicator />
        </View>
      )}

      <View style={{ flex: 1 }} />
      <ButtonSecondary title="Sign out" onPress={signOut} />
      <View style={{ height: theme.spacing(1) }} />
      <FooterBar
        active="profile"
        onHome={() => navigation.navigate('Main')}
        onQA={() => navigation.navigate('Feed')}
        onChat={() => navigation.navigate('Chat')}
        onProfile={() => {}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing(2), backgroundColor: theme.colors.bg },
  title: { fontSize: 20, fontWeight: '700', marginBottom: theme.spacing(1), color: theme.colors.text },
  section: { marginTop: theme.spacing(2), marginBottom: theme.spacing(1), fontWeight: '700', color: theme.colors.text },
  card: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: theme.spacing(2) },
  link: { color: theme.colors.primary, marginBottom: 8 },
  input: { width: '100%', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: 10, color: theme.colors.text, backgroundColor: theme.colors.card },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: theme.colors.border },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  avatarSmall: { width: 56, height: 56, borderRadius: 28, marginRight: 8, marginBottom: 8, borderWidth: 2, borderColor: 'transparent' },
  avatarSmallActive: { borderColor: theme.colors.primary },
});

export default ProfileScreen;
