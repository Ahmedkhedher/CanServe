import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import {
  getQuestions,
  toggleFollow,
  upvoteQuestionOnce,
  Question,
  Answer,
  getAnswersFor,
  addQuestion,
  addAnswer,
} from '../data/store';
import { theme } from '../ui/theme';
import { useSubmission } from '../hooks/useSubmission';

type Props = NativeStackScreenProps<RootStackParamList, 'Feed'>;

const FeedScreenNew: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Question[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [askText, setAskText] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [showAnswersForQuestion, setShowAnswersForQuestion] = useState<string | null>(null);
  const [answersMap, setAnswersMap] = useState<Record<string, Answer[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // New submission system
  const {
    submitQuestion,
    submitAnswer,
    isSubmitting,
    error: submissionError,
    validationErrors,
    reset: resetSubmission
  } = useSubmission();

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await getQuestions();
      setItems(data);
    } catch (e) {
      console.error('Failed to load questions:', e);
      Alert.alert('Error', 'Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadQuestions();
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Optimized text change handlers to prevent re-render issues
  const handleAskTextChange = useCallback((text: string) => {
    setAskText(text);
  }, []);

  const handleAnswerTextChange = useCallback((text: string) => {
    setAnswerText(text);
  }, []);

  const onFollow = async (id: string) => {
    toggleFollow(id);
    await loadQuestions();
  };

  const onUpvote = async (id: string) => {
    try {
      const res = await upvoteQuestionOnce(id);
      if (res?.changed) {
        setItems((prev) =>
          prev.map((q) => (q.id === id ? { ...q, upvotes: q.upvotes + 1 } : q))
        );
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to upvote');
    } finally {
      await loadQuestions();
    }
  };

  const handleSubmitQuestion = async () => {
    const text = askText.trim();
    
    if (!text || text.length < 10) {
      Alert.alert('Invalid Question', 'Please write at least 10 characters and make sure it\'s a proper question.');
      return;
    }
    
    Alert.alert(
      'Post Question?',
      'Your question will be visible to the community.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Post',
          onPress: async () => {
            try {
              console.log('Submitting question:', text);
              const question = await addQuestion(text);
              console.log('Question submitted successfully:', question.id);
              setAskText('');
              setShowComposer(false);
              await loadQuestions();
              Alert.alert('✅ Posted!', 'Your question is now live');
            } catch (error: any) {
              console.error('Failed to submit question:', error);
              Alert.alert('Error', error?.message || 'Failed to post question. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleToggleAnswer = (questionId: string) => {
    if (expandedQuestionId === questionId) {
      setExpandedQuestionId(null);
      setAnswerText('');
    } else {
      setExpandedQuestionId(questionId);
    }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    const text = answerText.trim();
    
    if (!text) {
      Alert.alert('Empty answer', 'Please enter your answer');
      return;
    }
    
    // Check if user is authenticated
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to post an answer');
      return;
    }
    
    try {
      console.log('Submitting answer:', { questionId, answerText: text.substring(0, 50) });
      await addAnswer(questionId, text);
      console.log('Answer submitted successfully');
      Alert.alert('Success', 'Your answer has been posted!');
      // Only clear text and collapse after successful submission
      setAnswerText('');
      setExpandedQuestionId(null);
      // Reload answers for this question
      await loadAnswersForQuestion(questionId);
      await loadQuestions();
    } catch (e: any) {
      console.error('Error submitting answer:', e);
      Alert.alert('Error', e?.message || 'Failed to post answer');
      // Don't clear text or collapse on error so user can retry
    }
  };

  const loadAnswersForQuestion = async (questionId: string) => {
    try {
      const answers = await getAnswersFor(questionId);
      setAnswersMap(prev => ({ ...prev, [questionId]: answers }));
    } catch (e) {
      console.error('Failed to load answers:', e);
    }
  };

  const toggleShowAnswers = async (questionId: string) => {
    if (showAnswersForQuestion === questionId) {
      setShowAnswersForQuestion(null);
    } else {
      setShowAnswersForQuestion(questionId);
      if (!answersMap[questionId]) {
        await loadAnswersForQuestion(questionId);
      }
    }
  };

  const renderPost = ({ item }: { item: Question }) => (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.author?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        </View>
        <View style={styles.postHeaderInfo}>
          <Text style={styles.authorName}>{item.author?.name || 'Anonymous'}</Text>
          <Text style={styles.postTime}>
            {item.createdAt
              ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Recently'}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.subtext} />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <View style={styles.postContent}>
        <Text style={styles.postTitle}>{item.title}</Text>
        {item.topic && (
          <View style={styles.tagsContainer}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>#{item.topic}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Post Stats */}
      <View style={styles.postStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={16} color={theme.colors.danger} />
          <Text style={styles.statText}>{item.upvotes || 0}</Text>
        </View>
        <TouchableOpacity
          style={styles.statItem}
          onPress={(e) => {
            e.stopPropagation();
            toggleShowAnswers(item.id);
          }}
        >
          <Ionicons name="chatbubble" size={16} color={theme.colors.subtext} />
          <Text style={styles.statText}>{item.answersCount || 0} answers</Text>
        </TouchableOpacity>
      </View>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            onUpvote(item.id);
          }}
        >
          <Ionicons name="heart-outline" size={20} color={theme.colors.subtext} />
          <Text style={styles.actionText}>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleToggleAnswer(item.id);
          }}
        >
          <Ionicons name="chatbubble-outline" size={20} color={theme.colors.subtext} />
          <Text style={styles.actionText}>Answer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color={theme.colors.subtext} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Display Answers */}
      {showAnswersForQuestion === item.id && answersMap[item.id] && answersMap[item.id].length > 0 && (
        <View style={styles.answersSection}>
          <View style={styles.answersSectionHeader}>
            <Text style={styles.answersSectionTitle}>
              {answersMap[item.id].length} {answersMap[item.id].length === 1 ? 'Answer' : 'Answers'}
            </Text>
          </View>
          {answersMap[item.id].map((answer) => (
            <View key={answer.id} style={styles.answerItem}>
              <View style={styles.answerItemHeader}>
                <View style={styles.answerItemAvatar}>
                  <Text style={styles.answerItemAvatarText}>
                    {answer.author?.name?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.answerItemInfo}>
                  <Text style={styles.answerItemAuthor}>{answer.author?.name || 'Anonymous'}</Text>
                  <Text style={styles.answerItemTime}>
                    {answer.createdAt
                      ? new Date(answer.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Recently'}
                  </Text>
                </View>
              </View>
              <Text style={styles.answerItemBody}>{answer.body}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Inline Answer Box */}
      {expandedQuestionId === item.id && (
        <View style={styles.answerBox}>
          <View style={styles.answerHeader}>
            <View style={styles.answerAvatar}>
              <Text style={styles.answerAvatarText}>
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <Text style={styles.answerLabel}>Write your answer...</Text>
          </View>
          <TextInput
            style={styles.answerInput}
            placeholder="Share your thoughts and help others..."
            placeholderTextColor={theme.colors.subtext}
            value={answerText}
            onChangeText={handleAnswerTextChange}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={500}
            autoFocus
            returnKeyType="default"
            blurOnSubmit={false}
            autoCorrect={true}
            autoCapitalize="sentences"
            keyboardType="default"
            scrollEnabled={true}
            selectTextOnFocus={false}
            clearTextOnFocus={false}
          />
          <Text style={styles.characterCount}>
            {answerText.length}/500
          </Text>
          <View style={styles.answerActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setExpandedQuestionId(null);
                setAnswerText('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitAnswerButton,
                (!answerText || !answerText.trim()) && styles.submitAnswerButtonDisabled
              ]}
              onPress={() => handleSubmitAnswer(item.id)}
              disabled={!answerText || !answerText.trim()}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.submitAnswerButtonText,
                (!answerText || !answerText.trim()) && styles.submitAnswerButtonTextDisabled
              ]}>Post Answer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const ListHeader = () => (
    <View>
      {/* Composer */}
      {showComposer ? (
        <View style={styles.composer}>
          <View style={styles.composerHeader}>
            <Text style={styles.composerTitle}>Create Post</Text>
            <TouchableOpacity 
              onPress={() => setShowComposer(false)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={theme.colors.subtext} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.composerInput}
            placeholder="What's on your mind?"
            placeholderTextColor={theme.colors.subtext}
            value={askText}
            onChangeText={handleAskTextChange}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={300}
            autoFocus={true}
            blurOnSubmit={false}
            returnKeyType="default"
            autoCorrect={true}
            autoCapitalize="sentences"
            keyboardType="default"
            scrollEnabled={true}
            selectTextOnFocus={false}
            clearTextOnFocus={false}
          />
          <Text style={styles.characterCount}>
            {askText.length}/300 characters
          </Text>
          <TouchableOpacity 
            style={[
              styles.postButton, 
              (askText.length < 10 || isSubmitting) && styles.postButtonDisabled
            ]} 
            onPress={handleSubmitQuestion}
            disabled={askText.length < 10 || isSubmitting}
            activeOpacity={0.8}
          >
            <Text style={styles.postButtonText}>
              {isSubmitting ? 'Posting...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.quickComposer}
          onPress={() => setShowComposer(true)}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.displayName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.quickComposerText}>What's on your mind?</Text>
        </TouchableOpacity>
      )}

      {/* Separator */}
      <View style={styles.separator} />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Profile', {})}
          >
            <Ionicons name="person-circle" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={80} color={theme.colors.subtext} />
          <Text style={styles.emptyTitle}>No Questions Yet</Text>
          <Text style={styles.emptyText}>
            Be the first to ask a question!
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => setShowComposer(true)}
          >
            <Text style={styles.emptyButtonText}>Ask Question</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedContent: {
    paddingBottom: 16,
  },
  quickComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
  },
  quickComposerText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.subtext,
  },
  composer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  composerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  composerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  composerInput: {
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 100,
    marginBottom: 16,
  },
  postButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  separator: {
    height: 8,
    backgroundColor: theme.colors.bg,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postHeaderInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  postTime: {
    fontSize: 13,
    color: theme.colors.subtext,
  },
  moreButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  postTitle: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: theme.colors.subtext,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.subtext,
  },
  // Inline Answer Box
  answerBox: {
    padding: 16,
    backgroundColor: theme.colors.bg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  answerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  answerInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    fontSize: 15,
    color: theme.colors.text,
    minHeight: 80,
    marginBottom: 12,
  },
  answerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.subtext,
  },
  submitAnswerButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  submitAnswerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitAnswerButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },
  submitAnswerButtonTextDisabled: {
    color: theme.colors.subtext,
  },
  // Answers Display Section
  answersSection: {
    padding: 16,
    backgroundColor: theme.colors.bg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  answersSectionHeader: {
    marginBottom: 12,
  },
  answersSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  answerItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  answerItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  answerItemAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  answerItemAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  answerItemInfo: {
    flex: 1,
  },
  answerItemAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  answerItemTime: {
    fontSize: 12,
    color: theme.colors.subtext,
  },
  answerItemBody: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  // Character counter
  characterCount: {
    fontSize: 12,
    color: theme.colors.subtext,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 8,
  },
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.subtext,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.subtext,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    ...theme.shadows.sm,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Post button disabled state
  postButtonDisabled: {
    backgroundColor: theme.colors.subtext,
    opacity: 0.5,
  },
});

export default FeedScreenNew;
