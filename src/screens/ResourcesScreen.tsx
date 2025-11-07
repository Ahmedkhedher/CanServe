import React from 'react';
import { View, Text, StyleSheet, Linking, Button } from 'react-native';

const ResourcesScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cancer Awareness Resources</Text>
      <Text>• WHO Cancer: https://www.who.int/health-topics/cancer</Text>
      <Text>• Cancer Research UK: https://www.cancerresearchuk.org/</Text>
      <Text>• NCCN Guidelines for Patients</Text>
      <View style={{ height: 12 }} />
      <Button title="Open WHO" onPress={() => Linking.openURL('https://www.who.int/health-topics/cancer')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
});

export default ResourcesScreen;
