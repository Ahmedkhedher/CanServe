import React from 'react';
import { View, Text, StyleSheet, ImageBackground, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ButtonSecondary, Card, FooterBar } from '../ui/components';
import { theme } from '../ui/theme';
import type { RootStackParamList } from '../navigation/AppNavigator';

type R = RouteProp<RootStackParamList, 'SuggestionDetail'>;

const SuggestionDetailScreen: React.FC<any> = ({ navigation }) => {
  const route = useRoute<R>();
  const { title, content, image } = route.params;

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: image || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1600&auto=format&fit=crop' }}
        style={styles.hero}
        imageStyle={{ borderRadius: theme.radius.lg }}
      >
        <View style={styles.overlay}>
          <Text style={styles.heroTitle}>{title}</Text>
        </View>
      </ImageBackground>

      <Card style={{ marginTop: theme.spacing(2) }}>
        <ScrollView>
          <Text style={{ color: theme.colors.text, lineHeight: 20 }}>{content}</Text>
        </ScrollView>
      </Card>

      <View style={{ marginTop: theme.spacing(2) }}>
        <ButtonSecondary title="Back" onPress={() => navigation.goBack()} />
      </View>

      <FooterBar
        active="home"
        onHome={() => navigation.navigate('Main')}
        onQA={() => navigation.navigate('Feed')}
        onProfile={() => navigation.navigate('Profile', {})}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing(2) },
  hero: { height: 180, justifyContent: 'flex-end' },
  overlay: { backgroundColor: 'rgba(0,0,0,0.35)', padding: theme.spacing(2), borderRadius: theme.radius.lg },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
});

export default SuggestionDetailScreen;
