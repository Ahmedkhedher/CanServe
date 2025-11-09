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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { geminiAI, ChatMessage, generateMessageId } from '../services/geminiAI';
import { useAuth } from '../context/AuthContext';
import { loadProfile } from '../services/profile';
import Svg, { Path, Circle } from 'react-native-svg';

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
        <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
          {item.content}
        </Text>
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

  const handleSend = async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: trimmedText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    scrollToBottom();

    try {
      let contextualMessage = trimmedText;
      if (userProfile?.cancerType) {
        const context = `[User: ${userProfile.cancerType}, Stage ${userProfile.stage || 'unknown'}]\n\n`;
        contextualMessage = context + trimmedText;
      }

      const aiResponse = await geminiAI.sendMessage(contextualMessage);
      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      scrollToBottom();
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: '⚠️ Sorry, I encountered an error. Please try again.',
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
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Type your message..."
                placeholderTextColor="#9CA3AF"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!inputText.trim() || isLoading}
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
});

export default ChatScreen;
