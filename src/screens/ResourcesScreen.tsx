import React from 'react';
import { View, Text, StyleSheet, Linking, Button, ScrollView } from 'react-native';
import { FooterBar } from '../ui/components';
import { theme } from '../ui/theme';

const ResourcesScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: theme.spacing(16) }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Cancer Awareness Resources</Text>
        <Text>• WHO Cancer: https://www.who.int/health-topics/cancer</Text>
        <Text>• Cancer Research UK: https://www.cancerresearchuk.org/</Text>
        <Text>• NCCN Guidelines for Patients</Text>
        <View style={{ height: 12 }} />
        <Button title="Open WHO" onPress={() => Linking.openURL('https://www.who.int/health-topics/cancer')} />
      </ScrollView>
      <FooterBar
        active="home"
        onHome={() => {}}
        onQA={() => {}}
        onChat={() => {}}
        onProfile={() => {}}
        onPlus={() => {}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
});

export default ResourcesScreen;
