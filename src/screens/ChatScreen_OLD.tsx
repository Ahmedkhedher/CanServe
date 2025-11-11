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
  Animated,
  Easing,
  Dimensions,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { geminiAI, ChatMessage, generateMessageId } from '../services/geminiAI';
import { useAuth } from '../context/AuthContext';
import { loadProfile } from '../services/profile';
import Svg, { Path, Circle } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../services/minioStorage';
import Markdown from 'react-native-markdown-display';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const { width, height } = Dimensions.get('window');

// Message Bubble Component
const MessageBubble: React.FC<{ item: ChatMessage; index: number }> = ({ item, index }) => {
  const isUser = item.role === 'user';
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 80,
      friction: 8,
      useNativeDriver: true,
      delay: index * 50,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      {!isUser && (
        <View style={styles.aiAvatarContainer}>
          <LinearGradient colors={['#F9A8D4', '#93C5FD']} style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>🤖</Text>
          </LinearGradient>
        </View>
      )}
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {(item as any).imageUrl && (
          <Image 
            source={{ uri: (item as any).imageUrl }} 
            style={styles.messageImage}
            resizeMode="cover"
          />
        )}
        {isUser ? (
          <Text style={[styles.messageText, styles.userText]}>
            {item.content}
          </Text>
        ) : (
          <Markdown style={markdownStyles}>
            {item.content}
          </Markdown>
        )}
        <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {isUser && (
        <View style={styles.userAvatarContainer}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>👤</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const ChatScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<{ cancerType?: string; stage?: string; age?: number } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I\'m your AI health assistant. How can I help you today?',
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Floating animation
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Floating animation for background elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -15,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
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
    loadUserProfile();
  }, []);

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
      console.log('📤 UPLOADING IMAGE:', selectedImage);
      try {
        setIsUploading(true);
        const filename = `chat-${Date.now()}.jpg`;
        imageUrl = await uploadImage(selectedImage, 'chat', filename);
        console.log('✅ IMAGE UPLOADED SUCCESSFULLY:', imageUrl);
      } catch (error: any) {
        console.error('❌ Image upload error:', error);
        Alert.alert('Upload failed', error?.message || 'Could not upload image');
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    } else {
      console.log('⚠️ NO IMAGE SELECTED');
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
        console.log('🖼️ IMAGE DETECTED - Using Vision API for image analysis');
        console.log('📍 Image URL:', imageUrl);
        
        // Add user context for better analysis
        let prompt = trimmedText || 'Please analyze this image and provide relevant health insights.';
        if (userProfile?.cancerType) {
          prompt = `[Patient context: ${userProfile.cancerType}, Stage ${userProfile.stage || 'unknown'}]\n\n${prompt}`;
        }
        
        console.log('📝 Sending prompt to AI:', prompt);
        aiResponse = await geminiAI.sendMessageWithImage(prompt, imageUrl);
        console.log('✅ AI Response received:', aiResponse.substring(0, 100) + '...');
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
    <LinearGradient
      colors={['#A9D5E8', '#93C7DE']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Floating background elements */}
      <Animated.View
        style={[styles.floatingCircle, { top: 100, left: '10%', transform: [{ translateY: floatY }] }]}
        pointerEvents="none"
      >
        <View style={styles.circle1} />
      </Animated.View>
      <Animated.View
        style={[styles.floatingCircle, { top: 250, right: '15%', transform: [{ translateY: floatY }] }]}
        pointerEvents="none"
      >
        <View style={styles.circle2} />
      </Animated.View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>AI Assistant</Text>
              <Text style={styles.headerSubtitle}>Health Support Chat</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => <MessageBubble item={item} index={index} />}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
          />

          {/* Loading indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <View style={styles.typingDots}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
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
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Upload Progress */}
            {isUploading && (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator color="#F9A8D4" />
                <Text style={styles.uploadingText}>Uploading image...</Text>
              </View>
            )}

            <View style={styles.inputWrapper}>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={pickImage}
                disabled={isLoading || isUploading}
              >
                <Text style={styles.photoButtonText}>📷</Text>
              </TouchableOpacity>
              
              <TextInput
                style={styles.input}
                placeholder="Type your message..."
                placeholderTextColor="#9CA3AF"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                editable={!isLoading && !isUploading}
              />
              
              <TouchableOpacity
                style={[styles.sendButton, ((!inputText.trim() && !selectedImage) || isLoading || isUploading) && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={(!inputText.trim() && !selectedImage) || isLoading || isUploading}
              >
                <Text style={styles.sendButtonText}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  // Floating elements
  floatingCircle: {
    position: 'absolute',
    opacity: 0.3,
  },
  circle1: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  circle2: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  // Messages
  messagesContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  messageContainer: {
    marginBottom: 12,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#F9A8D4',
    borderBottomRightRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  aiText: {
    color: '#1F2937',
    fontWeight: '400',
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.4)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  // Avatars
  aiAvatarContainer: {
    marginRight: 8,
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatarText: {
    fontSize: 20,
  },
  userAvatarContainer: {
    marginLeft: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#93C5FD',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  userAvatarText: {
    fontSize: 18,
  },
  // Loading
  loadingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    alignSelf: 'flex-start',
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F9A8D4',
  },
  // Input
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F9A8D4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Photo button
  photoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  photoButtonText: {
    fontSize: 22,
  },
  // Image in message
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  // Image preview
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F9A8D4',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Uploading indicator
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  uploadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});

// Markdown styles for AI responses
const markdownStyles = {
  body: {
    color: '#1F2937',
    fontSize: 15,
    lineHeight: 22,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 8,
    color: '#1F2937',
  },
  strong: {
    fontWeight: '700' as '700',
    color: '#111827',
  },
  em: {
    fontStyle: 'italic' as 'italic',
    color: '#374151',
  },
  code_inline: {
    backgroundColor: '#F3F4F6',
    color: '#EF4444',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  code_block: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  fence: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  bullet_list: {
    marginVertical: 8,
  },
  ordered_list: {
    marginVertical: 8,
  },
  list_item: {
    marginVertical: 4,
    color: '#1F2937',
  },
  link: {
    color: '#3B82F6',
    textDecorationLine: 'underline' as 'underline',
  },
  blockquote: {
    backgroundColor: '#F9FAFB',
    borderLeftWidth: 4,
    borderLeftColor: '#F9A8D4',
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8,
    fontStyle: 'italic' as 'italic',
  },
  heading1: {
    fontSize: 20,
    fontWeight: '700' as '700',
    marginTop: 12,
    marginBottom: 8,
    color: '#111827',
  },
  heading2: {
    fontSize: 18,
    fontWeight: '700' as '700',
    marginTop: 10,
    marginBottom: 6,
    color: '#111827',
  },
  heading3: {
    fontSize: 16,
    fontWeight: '700' as '700',
    marginTop: 8,
    marginBottom: 4,
    color: '#111827',
  },
};

export default ChatScreen;
