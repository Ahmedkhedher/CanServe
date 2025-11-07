import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Report'>;

const ReportScreen: React.FC<Props> = ({ route, navigation }) => {
  const targetType = route.params?.targetType ?? 'question';
  const targetId = route.params?.targetId ?? 'unknown';
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Content</Text>
      <Text>Target: {targetType} #{targetId}</Text>
      <Text style={{ marginVertical: 8 }}>We take safety seriously. Thank you for helping keep the community safe.</Text>
      <Button title="Submit report" onPress={() => navigation.goBack()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
});

export default ReportScreen;
