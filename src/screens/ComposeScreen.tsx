import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { addQuestion, addAnswer } from '../data/store';

type Props = NativeStackScreenProps<RootStackParamList, 'Compose'>;

const ComposeScreen: React.FC<Props> = ({ route, navigation }) => {
  const mode = route.params?.mode ?? 'question';
  const [text, setText] = useState('');
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{mode === 'question' ? 'Ask a Question' : 'Write an Answer'}</Text>
      <TextInput
        multiline
        placeholder={mode === 'question' ? 'Describe your question…' : 'Share your insights…'}
        value={text}
        onChangeText={setText}
        style={styles.input}
      />
      <Button
        title="Submit"
        onPress={async () => {
          const content = text.trim();
          if (!content) {
            Alert.alert('Please enter some text.');
            return;
          }
          if (mode === 'question') {
            const q = await addQuestion(content);
            navigation.replace('Question', { id: q.id });
          } else {
            const qid = route.params?.questionId;
            if (!qid) {
              Alert.alert('Missing question context');
              return;
            }
            await addAnswer(qid, content);
            navigation.replace('Question', { id: qid });
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, textAlignVertical: 'top' },
});

export default ComposeScreen;
