import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ButtonPrimary, Card } from '../ui/components';
import { theme } from '../ui/theme';
import { uploadAvatarAsync, saveProfile, saveOnboardingProfile, loadProfile } from '../services/profile';

const AVATARS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527980969970-0c9da7b3b6c1?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?q=80&w=800&auto=format&fit=crop'
];

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const ROLE_OPTIONS = ['Patient', 'Survivor', 'Caregiver', 'Family/Friend', 'Healthcare professional'];
const TREATMENT_TYPES = ['Surgery', 'Chemotherapy', 'Radiation', 'Immunotherapy', 'Hormone therapy', 'Other'];
const INTERESTS = ['Nutrition', 'Exercise', 'Mental health', 'Support groups', 'Research updates'];
const COUNTRY_OPTIONS = ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Egypt', 'Saudi Arabia', 'UAE', 'India', 'Nigeria', 'South Africa', 'Other'];
const CURRENT_YEAR = new Date().getFullYear();
const DIAGNOSIS_YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => String(CURRENT_YEAR - i)).concat(['Other']);

const OnboardingScreen: React.FC<any> = ({ navigation }) => {
  console.log('OnboardingScreen rendering');
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState<string | undefined>(undefined);
  const [cancerType, setCancerType] = useState('');
  const [stage, setStage] = useState('');
  const [age, setAge] = useState('');
  const [saving, setSaving] = useState(false);
  const [diagnosed, setDiagnosed] = useState<undefined | boolean>(undefined);
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<string | undefined>(undefined);
  const [country, setCountry] = useState('');
  const [countryOption, setCountryOption] = useState<string | undefined>(undefined);
  const [otherCountry, setOtherCountry] = useState('');
  const [role, setRole] = useState<string | undefined>(undefined);
  const [inTreatment, setInTreatment] = useState<undefined | boolean>(undefined);
  const [treatmentTypes, setTreatmentTypes] = useState<string[]>([]);
  const [diagnosisYear, setDiagnosisYear] = useState('');
  const [diagnosisYearOption, setDiagnosisYearOption] = useState<string | undefined>(undefined);
  const [otherDiagnosisYear, setOtherDiagnosisYear] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [allowMessages, setAllowMessages] = useState<undefined | boolean>(undefined);

  // Prefill from existing profile (edit mode and when user revisits)
  useEffect(() => {
    (async () => {
      try {
        const p = await loadProfile();
        if (!p) return;
        if (p.displayName) setDisplayName(p.displayName);
        if (p.photoURL) setPhotoURL(p.photoURL);
        if (typeof p.age === 'number') setAge(String(p.age));
        if (typeof p.diagnosed === 'boolean') setDiagnosed(p.diagnosed);
        if (p.gender) setGender(p.gender);
        if (p.role) setRole(p.role);
        if (p.country) {
          setCountry(p.country);
          if (COUNTRY_OPTIONS.includes(p.country)) setCountryOption(p.country);
          else if (p.country) setCountryOption('Other');
        }
        if (Array.isArray(p.interests)) setInterests(p.interests);
        if (typeof p.allowMessages === 'boolean') setAllowMessages(p.allowMessages);
        if (p.cancerType) setCancerType(p.cancerType);
        if (p.stage) setStage(p.stage);
        if (typeof p.inTreatment === 'boolean') setInTreatment(p.inTreatment);
        if (Array.isArray(p.treatmentTypes)) setTreatmentTypes(p.treatmentTypes);
        if (typeof p.diagnosisYear === 'number') {
          const y = String(p.diagnosisYear);
          setDiagnosisYear(y);
          if (DIAGNOSIS_YEAR_OPTIONS.includes(y)) setDiagnosisYearOption(y);
          else setDiagnosisYearOption('Other');
        }
      } catch {}
    })();
  }, []);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      return Alert.alert('Permission required', 'Please allow photo library access.');
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled && res.assets?.[0]?.uri) {
      try {
        setSaving(true);
        console.log('🔄 Uploading profile picture in onboarding...');
        const url = await uploadAvatarAsync(res.assets[0].uri);
        console.log('✅ Profile picture uploaded in onboarding:', url.substring(0, 50) + '...');
        setPhotoURL(url);
      } catch (e: any) {
        console.error('❌ Onboarding profile picture upload failed:', e);
        Alert.alert('Upload failed', e?.message ?? 'Could not upload image');
      } finally {
        setSaving(false);
      }
    }
  };

  const onFinish = async () => {
    console.log('OnboardingScreen - Starting onFinish');
    const name = displayName.trim() || 'Member';
    const ageNum = parseInt(age, 10);
    if (!Number.isFinite(ageNum)) {
      return Alert.alert('Missing info', 'Please enter a valid age.');
    }
    try {
      setSaving(true);
      console.log('OnboardingScreen - Saving profile, diagnosed:', diagnosed);
      
      if (diagnosed) {
        if (!name || !cancerType.trim() || !stage.trim()) {
          setSaving(false);
          return Alert.alert('Missing info', 'Please fill name, cancer type, and stage.');
        }
        // For diagnosed users, use saveOnboardingProfile which handles everything
        await saveOnboardingProfile({
          displayName: name,
          photoURL,
          cancerType: cancerType.trim(),
          stage: stage.trim(),
          age: ageNum,
          onboardingComplete: true,
          diagnosed: true,
          gender,
          role,
          country: country.trim() || undefined,
          inTreatment,
          treatmentTypes,
          diagnosisYear: diagnosisYear ? parseInt(diagnosisYear, 10) : undefined,
          interests,
          allowMessages,
        });
      } else {
        // For non-diagnosed users, use saveProfile with onboardingComplete flag
        await saveProfile({
          displayName: name,
          photoURL,
          age: ageNum,
          onboardingComplete: true,
          diagnosed: false,
          gender,
          role,
          country: country.trim() || undefined,
          interests,
          allowMessages,
        });
      }
      console.log('OnboardingScreen - Profile saved successfully');
      Alert.alert(
        'Welcome to CanServe!',
        'Your profile has been set up. Let\'s get started!',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Auth context will automatically detect onboarding completion
              // and switch to the main navigator
              console.log('OnboardingScreen - User dismissed success alert');
            }
          }
        ]
      );
    } catch (e: any) {
      console.error('OnboardingScreen - Save error:', e);
      Alert.alert('Save failed', e?.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const isDiagnosedOnlyStep = (s: number) => [3, 4, 9, 10, 11].includes(s);

  const next = () => {
    if (step === 0) return setStep(1);
    if (step === 1) {
      const name = displayName.trim();
      if (!name) return Alert.alert('Missing info', 'Please enter your display name.');
      return setStep(2);
    }
    if (step === 2) {
      if (diagnosed === undefined) return Alert.alert('Select one', 'Please choose Yes or No.');
      return setStep(diagnosed ? 3 : 5);
    }
    if (step === 3) {
      if (!cancerType.trim()) return Alert.alert('Missing info', 'Please enter cancer type.');
      return setStep(4);
    }
    if (step === 4) {
      if (!stage.trim()) return Alert.alert('Missing info', 'Please enter cancer stage.');
      return setStep(5);
    }
    if (step === 5) {
      const ageNum = parseInt(age, 10);
      if (!Number.isFinite(ageNum)) return Alert.alert('Missing info', 'Please enter a valid age.');
      return setStep(6);
    }
    if (step === 6) {
      if (!gender) return Alert.alert('Missing info', 'Please select your gender.');
      return setStep(7);
    }
    if (step === 7) return setStep(8);
    if (step === 8) {
      if (!role) return Alert.alert('Missing info', 'Please select your role.');
      return setStep(diagnosed ? 9 : 12);
    }
    if (step === 9) return setStep(10);
    if (step === 10) return setStep(11);
    if (step === 11) return setStep(12);
    if (step === 12) return setStep(13);
    if (step === 13) return onFinish();
  };

  const back = () => {
    if (step === 0) return;
    // Go to previous non-diagnosed step if necessary
    let prev = step - 1;
    while (!diagnosed && isDiagnosedOnlyStep(prev)) prev -= 1;
    if (prev === 2 && diagnosed === false) return setStep(2);
    setStep(prev);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set up your profile</Text>
      {step === 0 && (
        <>
          <Text style={styles.section}>Choose an avatar</Text>
          <Card style={{ alignItems: 'center' }}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.9}>
              <Image source={{ uri: photoURL || AVATARS[0] }} style={styles.avatar} />
            </TouchableOpacity>
          </Card>
          <View style={styles.avatarGrid}>
            {AVATARS.map((u, i) => (
              <TouchableOpacity key={i} onPress={() => setPhotoURL(u)}>
                <Image source={{ uri: u }} style={[styles.avatarSmall, photoURL === u ? styles.avatarSmallActive : undefined]} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {step === 1 && (
        <>
          <Text style={styles.section}>Your display name</Text>
          <Card>
            <TextInput
              placeholder="Display name"
              placeholderTextColor={theme.colors.subtext}
              value={displayName}
              onChangeText={setDisplayName}
              style={styles.input}
            />
          </Card>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.section}>Have you been diagnosed with cancer?</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => setDiagnosed(true)}>
              <Card style={[styles.choice, diagnosed === true ? styles.choiceActive : undefined]}>
                <Text style={styles.choiceText}>Yes</Text>
              </Card>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDiagnosed(false)}>
              <Card style={[styles.choice, diagnosed === false ? styles.choiceActive : undefined]}>
                <Text style={styles.choiceText}>No</Text>
              </Card>
            </TouchableOpacity>
          </View>
        </>
      )}

      {step === 3 && diagnosed && (
        <>
          <Text style={styles.section}>Cancer type</Text>
          <Card>
            <TextInput
              placeholder="e.g., Breast, Lung"
              placeholderTextColor={theme.colors.subtext}
              value={cancerType}
              onChangeText={setCancerType}
              style={styles.input}
            />
          </Card>
        </>
      )}

      {step === 4 && diagnosed && (
        <>
          <Text style={styles.section}>Cancer stage</Text>
          <Card>
            <TextInput
              placeholder="e.g., Stage II"
              placeholderTextColor={theme.colors.subtext}
              value={stage}
              onChangeText={setStage}
              style={styles.input}
            />
          </Card>
        </>
      )}

      {step === 5 && (
        <>
          <Text style={styles.section}>Your age</Text>
          <Card>
            <TextInput
              placeholder="Age"
              placeholderTextColor={theme.colors.subtext}
              keyboardType="number-pad"
              value={age}
              onChangeText={setAge}
              style={styles.input}
            />
          </Card>
        </>
      )}

      {step === 6 && (
        <>
          <Text style={styles.section}>Gender</Text>
          <View style={styles.rowWrap}>
            {GENDER_OPTIONS.map((g) => (
              <TouchableOpacity key={g} onPress={() => setGender(g)}>
                <Card style={[styles.chip, gender === g ? styles.chipActive : undefined]}>
                  <Text style={styles.choiceText}>{g}</Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {step === 7 && (
        <>
          <Text style={styles.section}>Country/Region</Text>
          <View style={styles.rowWrap}>
            {COUNTRY_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => {
                  setCountryOption(c);
                  if (c !== 'Other') {
                    setCountry(c);
                  } else {
                    setCountry('');
                  }
                }}
              >
                <Card style={{ ...styles.chip, ...(countryOption === c ? styles.chipActive : {} as any) }}>
                  <Text style={styles.choiceText}>{c}</Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
          {countryOption === 'Other' && (
            <Card>
              <TextInput
                placeholder="Enter your country/region"
                placeholderTextColor={theme.colors.subtext}
                value={otherCountry}
                onChangeText={(t) => {
                  setOtherCountry(t);
                  setCountry(t);
                }}
                style={styles.input}
              />
            </Card>
          )}
        </>
      )}

      {step === 8 && (
        <>
          <Text style={styles.section}>Your role</Text>
          <View style={styles.rowWrap}>
            {ROLE_OPTIONS.map((r) => (
              <TouchableOpacity key={r} onPress={() => setRole(r)}>
                <Card style={[styles.chip, role === r ? styles.chipActive : undefined]}>
                  <Text style={styles.choiceText}>{r}</Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {step === 9 && diagnosed && (
        <>
          <Text style={styles.section}>Currently in treatment?</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => setInTreatment(true)}>
              <Card style={[styles.choice, inTreatment === true ? styles.choiceActive : undefined]}>
                <Text style={styles.choiceText}>Yes</Text>
              </Card>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setInTreatment(false)}>
              <Card style={[styles.choice, inTreatment === false ? styles.choiceActive : undefined]}>
                <Text style={styles.choiceText}>No</Text>
              </Card>
            </TouchableOpacity>
          </View>
        </>
      )}

      {step === 10 && diagnosed && (
        <>
          <Text style={styles.section}>Treatment types</Text>
          <View style={styles.rowWrap}>
            {TREATMENT_TYPES.map((t) => {
              const active = treatmentTypes.includes(t);
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() =>
                    setTreatmentTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
                  }
                >
                  <Card style={[styles.chip, active ? styles.chipActive : undefined]}>
                    <Text style={styles.choiceText}>{t}</Text>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {step === 11 && diagnosed && (
        <>
          <Text style={styles.section}>Diagnosis year</Text>
          <View style={styles.rowWrap}>
            {DIAGNOSIS_YEAR_OPTIONS.map((y) => (
              <TouchableOpacity
                key={y}
                onPress={() => {
                  setDiagnosisYearOption(y);
                  if (y !== 'Other') {
                    setDiagnosisYear(y);
                    setOtherDiagnosisYear('');
                  } else {
                    setDiagnosisYear('');
                  }
                }}
              >
                <Card style={[styles.chip, diagnosisYearOption === y ? styles.chipActive : undefined]}>
                  <Text style={styles.choiceText}>{y}</Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
          {diagnosisYearOption === 'Other' && (
            <Card>
              <TextInput
                placeholder="Enter year"
                placeholderTextColor={theme.colors.subtext}
                keyboardType="number-pad"
                value={otherDiagnosisYear}
                onChangeText={(t) => {
                  setOtherDiagnosisYear(t);
                  setDiagnosisYear(t);
                }}
                style={styles.input}
              />
            </Card>
          )}
        </>
      )}

      {step === 12 && (
        <>
          <Text style={styles.section}>Your interests</Text>
          <View style={styles.rowWrap}>
            {INTERESTS.map((i) => {
              const active = interests.includes(i);
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))}
                >
                  <Card style={[styles.chip, active ? styles.chipActive : undefined]}>
                    <Text style={styles.choiceText}>{i}</Text>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {step === 13 && (
        <>
          <Text style={styles.section}>Allow messages from community?</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => setAllowMessages(true)}>
              <Card style={[styles.choice, allowMessages === true ? styles.choiceActive : undefined]}>
                <Text style={styles.choiceText}>Yes</Text>
              </Card>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAllowMessages(false)}>
              <Card style={[styles.choice, allowMessages === false ? styles.choiceActive : undefined]}>
                <Text style={styles.choiceText}>No</Text>
              </Card>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={styles.navRow}>
        <ButtonPrimary title="Back" onPress={back} disabled={step === 0 || saving} />
        <View style={{ width: theme.spacing(1) }} />
        <ButtonPrimary title={step >= 13 ? (saving ? 'Saving…' : 'Finish') : 'Next'} onPress={next} disabled={saving} />
      </View>

      {saving && (
        <View style={{ paddingVertical: 8 }}>
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing(2), backgroundColor: theme.colors.bg },
  title: { fontSize: 28, fontWeight: '800', marginBottom: theme.spacing(2), color: theme.colors.text },
  section: { marginTop: theme.spacing(2), marginBottom: theme.spacing(1), fontWeight: '700', color: theme.colors.text, fontSize: 20 },
  input: { width: '100%', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: 12, color: theme.colors.text, backgroundColor: theme.colors.card, fontSize: 18 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: theme.colors.border },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  avatarSmall: { width: 56, height: 56, borderRadius: 28, marginRight: 8, marginBottom: 8, borderWidth: 2, borderColor: 'transparent' },
  avatarSmallActive: { borderColor: theme.colors.primary },
  navRow: { flexDirection: 'row', marginTop: theme.spacing(3) },
  choice: { padding: 12 },
  choiceActive: { borderColor: theme.colors.primary, borderWidth: 2 },
  choiceText: { fontSize: 18, color: theme.colors.text },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: theme.spacing(1) },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.border },
  chipActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.card },
});

export default OnboardingScreen;
