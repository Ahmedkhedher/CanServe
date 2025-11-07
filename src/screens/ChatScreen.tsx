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
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ButtonPrimary, Card, LoadingSpinner, FooterBar } from '../ui/components';
import { theme } from '../ui/theme';
import { isSmartwatch, scaleFontSize } from '../ui/responsive';
import { geminiAI, ChatMessage, generateMessageId } from '../services/geminiAI';
import Markdown from 'react-native-markdown-display';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

// Message Bubble Component
const MessageBubble: React.FC<{ item: ChatMessage }> = ({ item }) => {
  const isUser = item.role === 'user';
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      {!isUser && !isSmartwatch && (
        <View style={styles.avatarContainer}>
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>🤖</Text>
          </View>
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          isSmartwatch && styles.messageBubbleCompact,
        ]}
      >
        {isUser ? (
          <Text
            style={[
              styles.messageText,
              styles.userText,
            ]}
          >
            {item.content}
          </Text>
        ) : (
          <Markdown
            style={{
              body: styles.markdownBody,
              paragraph: styles.markdownParagraph,
              strong: styles.markdownBold,
              bullet_list: styles.markdownList,
              ordered_list: styles.markdownList,
              list_item: styles.markdownListItem,
              heading1: styles.markdownH1,
              heading2: styles.markdownH2,
              heading3: styles.markdownH3,
              text: styles.assistantText,
            }}
          >
            {item.content}
          </Markdown>
        )}
        {!isSmartwatch && (
          <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
      </View>
      {isUser && !isSmartwatch && (
        <View style={styles.avatarContainer}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>👤</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const ChatScreen: React.FC<Props> = ({ navigation }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m here to help answer your questions about cancer awareness and support. How can I assist you today?\n\n💡 Remember: I provide general information, but always consult healthcare professionals for medical advice.',
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText || isLoading) return;

    // Create user message
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: trimmedText,
      timestamp: Date.now(),
    };

    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    scrollToBottom();

    try {
      // Get AI response
      const aiResponse = await geminiAI.sendMessage(trimmedText);

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
      };

      // Add assistant message to chat
      setMessages((prev) => [...prev, assistantMessage]);
      scrollToBottom();
    } catch (error: any) {
      console.error('Chat error:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: '⚠️ Sorry, I encountered an error. Please check your API key configuration or try again later.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    return <MessageBubble item={item} />;
  };

  const suggestedPrompts = geminiAI.getSuggestedPrompts();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>AI Assistant🤖 : ADD CHAT HISTORY!!</Text>
            <Text style={styles.headerSubtitle}>Cancer Awareness Support</Text>
          </View>
          <View style={{ width: scaleFontSize(28) }} />
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            messages.length === 1 && !isSmartwatch ? (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>💡 Suggested Questions:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {suggestedPrompts.slice(0, 3).map((prompt, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSuggestedPrompt(prompt)}
                      style={styles.suggestionChip}
                    >
                      <Text style={styles.suggestionText}>{prompt}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : null
          }
        />

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <View style={styles.typingIndicator}>
              <LoadingSpinner size="sm" />
              <Text style={styles.typingText}>Thinking...</Text>
            </View>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder={isSmartwatch ? "Ask..." : "Ask a question..."}
              placeholderTextColor={theme.colors.subtext}
              value={inputText}
              onChangeText={setInputText}
              multiline={!isSmartwatch}
              maxLength={500}
              editable={!isLoading}
            />
            <ButtonPrimary
              title={isSmartwatch ? "→" : "Send"}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
              size={isSmartwatch ? 'sm' : 'md'}
              style={styles.sendButton}
            />
          </View>
        </View>
      </Animated.View>

      <FooterBar
        active="chat"
        onHome={() => navigation.navigate('Main')}
        onQA={() => navigation.navigate('Feed')}
        onChat={() => {}}
        onProfile={() => navigation.navigate('Profile', {})}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(isSmartwatch ? 1 : 2),
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  backButton: {
    width: scaleFontSize(28),
    height: scaleFontSize(28),
    borderRadius: scaleFontSize(14),
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: scaleFontSize(16),
    fontWeight: '800',
    color: theme.colors.text,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scaleFontSize(isSmartwatch ? 14 : 18),
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: scaleFontSize(isSmartwatch ? 10 : 12),
    color: theme.colors.subtext,
  },

  // Messages
  messagesContainer: {
    padding: theme.spacing(isSmartwatch ? 1 : 2),
    paddingBottom: theme.spacing(2),
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing(1.5),
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginHorizontal: theme.spacing(1),
  },
  aiAvatar: {
    width: scaleFontSize(32),
    height: scaleFontSize(32),
    borderRadius: scaleFontSize(16),
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatarText: {
    fontSize: scaleFontSize(18),
  },
  userAvatar: {
    width: scaleFontSize(32),
    height: scaleFontSize(32),
    borderRadius: scaleFontSize(16),
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: scaleFontSize(18),
  },
  messageBubble: {
    maxWidth: '75%',
    padding: theme.spacing(1.5),
    borderRadius: theme.radius.lg,
    ...theme.shadows.sm,
  },
  messageBubbleCompact: {
    maxWidth: '90%',
    padding: theme.spacing(1),
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: theme.radius.xs,
  },
  assistantBubble: {
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: theme.radius.xs,
  },
  messageText: {
    fontSize: scaleFontSize(isSmartwatch ? 11 : 15),
    lineHeight: scaleFontSize(isSmartwatch ? 14 : 22),
  },
  userText: {
    color: theme.colors.primaryText,
  },
  assistantText: {
    color: theme.colors.text,
  },
  
  // Markdown styles
  markdownBody: {
    color: theme.colors.text,
  },
  markdownParagraph: {
    marginTop: 0,
    marginBottom: theme.spacing(1),
    fontSize: scaleFontSize(isSmartwatch ? 11 : 15),
    lineHeight: scaleFontSize(isSmartwatch ? 14 : 22),
    color: theme.colors.text,
  },
  markdownBold: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  markdownList: {
    marginVertical: theme.spacing(0.5),
  },
  markdownListItem: {
    marginVertical: theme.spacing(0.25),
    fontSize: scaleFontSize(isSmartwatch ? 11 : 15),
    lineHeight: scaleFontSize(isSmartwatch ? 14 : 22),
    color: theme.colors.text,
  },
  markdownH1: {
    fontSize: scaleFontSize(isSmartwatch ? 16 : 20),
    fontWeight: '800',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
    color: theme.colors.text,
  },
  markdownH2: {
    fontSize: scaleFontSize(isSmartwatch ? 14 : 18),
    fontWeight: '700',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
    color: theme.colors.text,
  },
  markdownH3: {
    fontSize: scaleFontSize(isSmartwatch ? 13 : 16),
    fontWeight: '700',
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(0.25),
    color: theme.colors.text,
  },
  
  timestamp: {
    fontSize: scaleFontSize(10),
    color: theme.colors.subtext,
    marginTop: theme.spacing(0.5),
  },
  userTimestamp: {
    color: theme.colors.primaryText,
    opacity: 0.8,
  },

  // Suggestions
  suggestionsContainer: {
    marginBottom: theme.spacing(2),
  },
  suggestionsTitle: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing(1),
  },
  suggestionChip: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1),
    marginRight: theme.spacing(1),
  },
  suggestionText: {
    fontSize: scaleFontSize(12),
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // Loading
  loadingContainer: {
    paddingHorizontal: theme.spacing(2),
    paddingBottom: theme.spacing(1),
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing(1.5),
    alignSelf: 'flex-start',
    ...theme.shadows.sm,
  },
  typingText: {
    marginLeft: theme.spacing(1),
    fontSize: scaleFontSize(14),
    color: theme.colors.subtext,
    fontStyle: 'italic',
  },

  // Input
  inputContainer: {
    padding: theme.spacing(isSmartwatch ? 1 : 2),
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(isSmartwatch ? 0.75 : 1.25),
    fontSize: scaleFontSize(isSmartwatch ? 12 : 15),
    color: theme.colors.text,
    maxHeight: isSmartwatch ? 40 : 100,
  },
  sendButton: {
    minWidth: scaleFontSize(isSmartwatch ? 50 : 80),
  },
});

export default ChatScreen;
