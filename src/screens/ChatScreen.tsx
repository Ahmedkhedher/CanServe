import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { geminiAI, ChatMessage, generateMessageId } from '../services/geminiAI';
import { useAuth } from '../context/AuthContext';
import { loadProfile } from '../services/profile';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../services/minioStorage';
import Markdown from 'react-native-markdown-display';
import { theme } from '../ui/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

// Message Bubble Component
const MessageBubble: React.FC<{ item: ChatMessage }> = ({ item }) => {
  const isUser = item.role === 'user';

  return (
    <View
      style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.aiMessageContainer,
      ]}
    >
      {/* AI Avatar */}
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={20} color="#FFFFFF" />
        </View>
      )}

      {/* Message Bubble */}
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {(item as any).imageUrl && (
          <Image
            source={{ uri: (item as any).imageUrl }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        )}
        {isUser ? (
          <Text style={styles.userText}>{item.content}</Text>
        ) : (
          <Markdown style={markdownStyles}>{item.content}</Markdown>
        )}
        <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
          {new Date(item.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {/* User Avatar */}
      {isUser && (
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={16} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
};

const ChatScreenNew: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<{
    cancerType?: string;
    stage?: string;
    age?: number;
  } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your AI health assistant. How can I help you today?",
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await loadProfile();
      if (profile) {
        setUserProfile({
          cancerType: profile.cancerType,
          stage: profile.stage,
          age: profile.age,
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        return Alert.alert('Permission required', 'Please allow photo library access.');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSend = async () => {
    const trimmedText = inputText.trim();
    if ((!trimmedText && !selectedImage) || isLoading) return;

    let imageUrl: string | undefined;

    // Upload image if selected
    if (selectedImage) {
      try {
        setIsUploading(true);
        const filename = `chat-${Date.now()}.jpg`;
        imageUrl = await uploadImage(selectedImage, 'chat', filename);
      } catch (error: any) {
        console.error('Image upload error:', error);
        Alert.alert('Upload failed', error?.message || 'Could not upload image');
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const userMessage: ChatMessage & { imageUrl?: string } = {
      id: generateMessageId(),
      role: 'user',
      content: trimmedText || '📷 [Image]',
      timestamp: Date.now(),
      imageUrl,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setSelectedImage(null);
    setIsLoading(true);
    scrollToBottom();

    try {
      let aiResponse: string;

      // If image is uploaded, use Vision API
      if (imageUrl) {
        let prompt = trimmedText || 'Please analyze this image and provide relevant health insights.';
        if (userProfile?.cancerType) {
          prompt = `[Patient context: ${userProfile.cancerType}, Stage ${userProfile.stage || 'unknown'}]\n\n${prompt}`;
        }

        aiResponse = await geminiAI.sendMessageWithImage(prompt, imageUrl);
      } else {
        // Regular text message
        let contextualMessage = trimmedText;
        if (userProfile?.cancerType) {
          const context = `[User: ${userProfile.cancerType}, Stage ${userProfile.stage || 'unknown'}]\n\n`;
          contextualMessage = context + trimmedText;
        }

        aiResponse = await geminiAI.sendMessage(contextualMessage);
      }

      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      scrollToBottom();
    } catch (error: any) {
      console.error('AI Error:', error);
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: error?.message || '⚠️ Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <Text style={styles.headerSubtitle}>Always here to help</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble item={item} />}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          style={styles.messagesList}
        />

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <View style={styles.typingIndicator}>
              <View style={styles.typingDot} />
              <View style={[styles.typingDot, styles.typingDotDelay1]} />
              <View style={[styles.typingDot, styles.typingDotDelay2]} />
            </View>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          {/* Image Preview */}
          {selectedImage && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close-circle" size={24} color={theme.colors.danger} />
              </TouchableOpacity>
            </View>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator color={theme.colors.primary} size="small" />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          )}

          <View style={styles.inputWrapper}>
            {/* Photo Button */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={pickImage}
              disabled={isLoading || isUploading}
            >
              <Ionicons
                name="image"
                size={24}
                color={isLoading || isUploading ? theme.colors.subtext : theme.colors.primary}
              />
            </TouchableOpacity>

            {/* Text Input */}
            <TextInput
              style={styles.input}
              placeholder="Message..."
              placeholderTextColor={theme.colors.subtext}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isLoading && !isUploading}
            />

            {/* Send Button */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                ((!inputText.trim() && !selectedImage) || isLoading || isUploading) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={(!inputText.trim() && !selectedImage) || isLoading || isUploading}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.subtext,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.subtext,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  userText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 11,
    color: theme.colors.subtext,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  loadingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    alignSelf: 'flex-start',
    gap: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.subtext,
  },
  typingDotDelay1: {
    opacity: 0.7,
  },
  typingDotDelay2: {
    opacity: 0.4,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  uploadingText: {
    fontSize: 14,
    color: theme.colors.subtext,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.subtext,
    opacity: 0.5,
  },
});

// Markdown styles for AI responses
const markdownStyles = {
  body: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 20,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 8,
    color: theme.colors.text,
  },
  strong: {
    fontWeight: '700' as '700',
    color: theme.colors.text,
  },
  em: {
    fontStyle: 'italic' as 'italic',
  },
  code_inline: {
    backgroundColor: theme.colors.bg,
    color: theme.colors.primary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  code_block: {
    backgroundColor: theme.colors.bg,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  link: {
    color: theme.colors.primary,
    textDecorationLine: 'underline' as 'underline',
  },
};

export default ChatScreenNew;
