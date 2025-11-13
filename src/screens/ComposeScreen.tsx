import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { addQuestion, addAnswer } from '../data/store';
import { theme } from '../ui/theme';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Compose'>;

const ComposeScreen: React.FC<Props> = React.memo(({ route, navigation }) => {
  const mode = route.params?.mode ?? 'question';
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Optimized text change handler to prevent re-render issues
  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
  }, []);

  const handleSubmit = async () => {
    const content = text.trim();
    if (!content) {
      Alert.alert('Please enter some text.');
      return;
    }
    
    if (mode === 'question' && content.length < 10) {
      Alert.alert('Please write at least 10 characters.');
      return;
    }
    
    if (mode === 'answer' && content.length < 5) {
      Alert.alert('Please write at least 5 characters.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
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
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {mode === 'question' ? 'Ask a Question' : 'Write an Answer'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <TextInput
          key={`compose-input-${mode}`}
          multiline
          placeholder={mode === 'question' ? 'Describe your question in detail...' : 'Share your insights and help others...'}
          placeholderTextColor={theme.colors.subtext}
          value={text}
          onChangeText={handleTextChange}
          style={styles.input}
          maxLength={mode === 'question' ? 300 : 1000}
          textAlignVertical="top"
          autoFocus
          returnKeyType="default"
          blurOnSubmit={false}
          autoCorrect={true}
          autoCapitalize="sentences"
          keyboardType="default"
          scrollEnabled={true}
          selectTextOnFocus={false}
          clearTextOnFocus={false}
          editable={!isSubmitting}
        />
        
        <Text style={styles.characterCount}>
          {text.length}/{mode === 'question' ? 300 : 1000} characters
        </Text>
        
      </View>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (text.length < (mode === 'question' ? 10 : 5) || isSubmitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={text.length < (mode === 'question' ? 10 : 5) || isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>
              {mode === 'question' ? 'Post Question' : 'Post Answer'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  placeholder: {
    width: 40, // Same width as back button for centering
  },
  content: {
    flex: 1,
    padding: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.card,
    textAlignVertical: 'top',
    minHeight: 200,
  },
  characterCount: {
    fontSize: 12,
    color: theme.colors.subtext,
    textAlign: 'right',
    marginTop: 8,
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ComposeScreen;
