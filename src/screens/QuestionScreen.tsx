import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform, ScrollView, Image, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import {
  getQuestionById,
  getAnswersFor,
  toggleFollow,
  upvoteQuestionOnce,
  upvoteAnswerOnce,
  addAnswer,
  Question as QType,
  Answer as AType,
} from '../data/store';
import { Card, Tag, MetaText } from '../ui/components';
import { theme } from '../ui/theme';
import { isSmartwatch, scaleFontSize } from '../ui/responsive';
import Svg, { Path } from 'react-native-svg';

type Props = NativeStackScreenProps<RootStackParamList, 'Question'>;

const QuestionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { user } = useAuth();
  const id = route.params?.id ?? 'unknown';
  const [q, setQ] = useState<QType | null>(null);
  const [answers, setAnswers] = useState<AType[]>([]);
  const [answerText, setAnswerText] = useState('');

  useEffect(() => {
    (async () => {
      const qd = await getQuestionById(id);
      setQ(qd);
      const ads = await getAnswersFor(id);
      setAnswers(ads);
    })();
  }, [id]);

  if (!q) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Question not found</Text>
      </View>
    );
  }

  const handleUpvoteQuestion = async () => {
    try {
      const res = await upvoteQuestionOnce(q.id);
      if (res?.changed) {
        setQ((prev) => (prev ? { ...prev, upvotes: prev.upvotes + 1 } : prev));
      }
    } catch (e: any) {
      Alert.alert('Upvote failed', e?.message || 'Please check Firestore rules for votes collection.');
    } finally {
      const qd = await getQuestionById(id);
      setQ(qd);
    }
  };

  const handleUpvoteAnswer = async (answerId: string) => {
    try {
      const res = await upvoteAnswerOnce(answerId);
      if (res?.changed) {
        setAnswers((prev) => prev.map((a) => (a.id === answerId ? { ...a, upvotes: a.upvotes + 1 } : a)));
      }
    } catch (e: any) {
      Alert.alert('Upvote failed', e?.message || 'Please check Firestore rules for votes collection.');
    } finally {
      const ads = await getAnswersFor(id);
      setAnswers(ads);
    }
  };

  const submitAnswer = async () => {
    const text = answerText.trim();
    if (!text) {
      Alert.alert('Empty answer', 'Please write an answer');
      return;
    }
    try {
      await addAnswer(id, text);
      setAnswerText('');
      const ads = await getAnswersFor(id);
      setAnswers(ads);
      Alert.alert('Success', 'Your answer has been posted!');
    } catch (e: any) {
      Alert.alert('Unable to post', e?.message || 'Try again later.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header like MainScreen */}
      <View style={styles.header}>
        <View style={styles.headerWrap}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={scaleFontSize(20)} color="#6B7280" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigation.navigate('Profile', {})} style={styles.headerRow} activeOpacity={0.85}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatarFallback}>
                <Text style={styles.headerAvatarText}>{(user?.displayName || 'U').slice(0,1).toUpperCase()}</Text>
              </View>
            )}
            <View>
              <Text style={styles.hey}>Hey</Text>
              <Text style={styles.name} numberOfLines={1}>{user?.displayName || 'Member'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Profile', {})} style={styles.settingsBtn} activeOpacity={0.85}>
            <Svg width={34} height={34} viewBox="0 0 34 34">
              <Path d="M6 10 H28" stroke="#6B7280" strokeWidth="2.4" strokeLinecap="round"/>
              <Path d="M6 17 H28" stroke="#6B7280" strokeWidth="2.4" strokeLinecap="round"/>
              <Path d="M6 24 H28" stroke="#6B7280" strokeWidth="2.4" strokeLinecap="round"/>
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: theme.spacing(4), paddingTop: theme.spacing(10) }}>
        {/* Enhanced Question Card */}
        <Card elevated style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Tag text={q.topic} />
            <View style={styles.questionStats}>
              <View style={styles.statBadge}>
                <Ionicons name="chatbubble-outline" size={scaleFontSize(14)} color="#5B9AB8" />
                <Text style={styles.statText}>{q.answersCount}</Text>
              </View>
              <View style={styles.statBadge}>
                <Ionicons name="arrow-up-circle-outline" size={scaleFontSize(14)} color="#4A90A4" />
                <Text style={styles.statText}>{q.upvotes}</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.title}>{q.title}</Text>
          
          {/* Author Info with Enhanced Design */}
          <View style={styles.authorSection}>
            <View style={styles.authorBadge}>
              <Text style={styles.authorBadgeText}>{q.author.name[0].toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.authorName}>{q.author.name}</Text>
              <MetaText>Asked • Just now</MetaText>
            </View>
          </View>

          <View style={styles.divider} />
          
          {/* Enhanced Action Buttons */}
          <View style={styles.actionsRow}>
            {isSmartwatch ? (
              <>
                <TouchableOpacity style={styles.iconButton} onPress={handleUpvoteQuestion}>
                  <Ionicons name="arrow-up-circle" size={scaleFontSize(20)} color="#4A90A4" />
                  <Text style={styles.iconButtonText}>{q.upvotes}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => navigation.navigate('Compose', { mode: 'answer', questionId: q.id })}
                >
                  <Ionicons name="create-outline" size={scaleFontSize(20)} color="#5B9AB8" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={[styles.actionButton, styles.upvoteButton]} onPress={handleUpvoteQuestion}>
                  <Ionicons name="arrow-up-circle" size={scaleFontSize(18)} color="#4A90A4" />
                  <Text style={styles.actionButtonText}>Upvote ({q.upvotes})</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, q.following && styles.followingButton]}
                  onPress={async () => { 
                    toggleFollow(q.id); 
                    const qd = await getQuestionById(id); 
                    setQ(qd); 
                  }}
                >
                  <Ionicons 
                    name={q.following ? "checkmark-circle" : "bookmark-outline"} 
                    size={scaleFontSize(18)} 
                    color={q.following ? theme.colors.success : "#5B9AB8"} 
                  />
                  <Text style={styles.actionButtonText}>{q.following ? 'Following' : 'Follow'}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.answerButton]}
                  onPress={() => navigation.navigate('Compose', { mode: 'answer', questionId: q.id })}
                >
                  <Ionicons name="create" size={scaleFontSize(18)} color={theme.colors.primaryText} />
                  <Text style={styles.answerButtonText}>Answer</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Card>

        <View style={{ height: theme.spacing(2) }} />

        {/* Inline Answer Composer */}
        {!isSmartwatch && (
          <View style={styles.answerComposer}>
            <TextInput
              placeholder="Write your answer..."
              placeholderTextColor={theme.colors.subtext}
              value={answerText}
              onChangeText={setAnswerText}
              style={styles.answerInput}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.submitAnswerButton, !answerText.trim() && styles.submitAnswerButtonDisabled]}
              onPress={submitAnswer}
              disabled={!answerText.trim()}
            >
              <Ionicons name="send" size={scaleFontSize(20)} color={theme.colors.primaryText} />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={{ height: theme.spacing(2) }} />
        
        {/* Enhanced Answers Section */}
        <View style={styles.answersHeader}>
          <View style={styles.answersTitleContainer}>
            <MaterialCommunityIcons name="comment-text-multiple" size={scaleFontSize(22)} color="#5B9AB8" />
            <Text style={styles.section}> Answers</Text>
            <View style={styles.answerCountBadge}>
              <Text style={styles.answerCountText}>{answers.length}</Text>
            </View>
          </View>
        </View>

        {answers.length === 0 ? (
          <Card elevated style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons name="comment-alert-outline" size={scaleFontSize(48)} color={theme.colors.subtext} />
            </View>
            <Text style={styles.empty}>No answers yet</Text>
            <Text style={styles.emptySubtext}>Be the first to answer this question!</Text>
            <View style={{ height: theme.spacing(2) }} />
            <TouchableOpacity 
              style={styles.firstAnswerButton}
              onPress={() => navigation.navigate('Compose', { mode: 'answer', questionId: q.id })}
            >
              <Ionicons name="create" size={scaleFontSize(18)} color={theme.colors.primaryText} />
              <Text style={styles.firstAnswerButtonText}>Write Answer</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          answers.map((item, index) => (
            <Card key={item.id} elevated style={styles.answerCard}>
              <View style={styles.answerHeader}>
                {item.author?.photoURL ? (
                  <Image source={{ uri: item.author.photoURL }} style={styles.authorAvatar} />
                ) : (
                  <LinearGradient
                    colors={['#A9D5E8', '#5B9AB8']}
                    style={styles.authorAvatar}
                  >
                    <Text style={styles.authorAvatarText}>{item.author.name[0].toUpperCase()}</Text>
                  </LinearGradient>
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.answerAuthorRow}>
                    <Text style={styles.answerAuthor}>{item.author.name}</Text>
                    {index === 0 && answers.length > 1 && (
                      <View style={styles.topAnswerBadge}>
                        <Ionicons name="trophy" size={scaleFontSize(12)} color={theme.colors.warning} />
                        <Text style={styles.topAnswerText}>Top Answer</Text>
                      </View>
                    )}
                  </View>
                  {!isSmartwatch && (
                    <View style={styles.answerMeta}>
                      <Ionicons name="time-outline" size={scaleFontSize(12)} color={theme.colors.subtext} />
                      <MetaText> Just now</MetaText>
                    </View>
                  )}
                </View>
              </View>
              
              <Text style={styles.answerBody}>{item.body}</Text>
              
              <View style={styles.answerFooter}>
                <TouchableOpacity 
                  style={styles.upvoteAnswerButton}
                  onPress={() => handleUpvoteAnswer(item.id)}
                >
                  <Ionicons name="arrow-up-circle" size={scaleFontSize(20)} color="#4A90A4" />
                  <Text style={styles.upvoteCount}>{item.upvotes}</Text>
                </TouchableOpacity>
                
                {!isSmartwatch && (
                  <TouchableOpacity style={styles.replyButton}>
                    <Ionicons name="chatbubble-outline" size={scaleFontSize(16)} color="#5B9AB8" />
                    <Text style={styles.replyText}>Reply</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const scriptFont = Platform.select({ web: '"Dancing Script", cursive', default: 'System' });

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
  },
  header: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 20,
    elevation: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  headerAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    color: '#1F2937',
    fontWeight: '700',
    fontSize: 16,
  },
  hey: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  name: {
    color: '#1F2937',
    fontWeight: '700',
    fontSize: 16,
  },
  settingsBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  questionCard: {
    marginTop: theme.spacing(2),
    marginHorizontal: theme.spacing(isSmartwatch ? 1 : 2),
    marginBottom: theme.spacing(1),
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1.5),
  },
  questionStats: {
    flexDirection: 'row',
    gap: theme.spacing(1),
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.spacing(1),
    paddingVertical: theme.spacing(0.5),
    borderRadius: theme.radius.md,
    gap: theme.spacing(0.5),
  },
  statText: {
    fontSize: scaleFontSize(12),
    fontWeight: '700',
    color: theme.colors.text,
  },
  title: { 
    fontSize: scaleFontSize(isSmartwatch ? 14 : 22), 
    fontWeight: '700', 
    marginBottom: theme.spacing(1),
    color: theme.colors.text,
    lineHeight: scaleFontSize(isSmartwatch ? 18 : 30),
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  authorBadge: {
    width: scaleFontSize(36),
    height: scaleFontSize(36),
    borderRadius: scaleFontSize(18),
    backgroundColor: '#A9D5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing(1),
  },
  authorBadgeText: {
    fontSize: scaleFontSize(16),
    fontWeight: '700',
    color: '#5B9AB8',
  },
  authorName: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing(2),
  },
  actionsRow: { 
    flexDirection: 'row', 
    gap: theme.spacing(1),
    flexWrap: 'wrap',
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(1),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg,
    gap: theme.spacing(0.5),
  },
  iconButtonText: {
    fontSize: scaleFontSize(12),
    fontWeight: '600',
    color: theme.colors.text,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.25),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg,
    gap: theme.spacing(0.75),
    ...theme.shadows.sm,
  },
  upvoteButton: {
    borderWidth: 1.5,
    borderColor: '#4A90A4',
  },
  followingButton: {
    borderWidth: 1.5,
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.bg,
  },
  answerButton: {
    backgroundColor: '#5B9AB8',
    flex: 1,
  },
  actionButtonText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: theme.colors.text,
  },
  answerButtonText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: theme.colors.primaryText,
  },
  answersHeader: {
    marginHorizontal: theme.spacing(isSmartwatch ? 1 : 2),
    marginBottom: theme.spacing(1.5),
  },
  answersTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: { 
    fontSize: scaleFontSize(isSmartwatch ? 14 : 20),
    fontWeight: '700',
    color: theme.colors.text,
    marginLeft: theme.spacing(0.5),
  },
  answerCountBadge: {
    backgroundColor: '#5B9AB8',
    borderRadius: theme.radius.full,
    minWidth: scaleFontSize(24),
    height: scaleFontSize(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing(1),
    paddingHorizontal: theme.spacing(0.75),
  },
  answerCountText: {
    fontSize: scaleFontSize(12),
    fontWeight: '700',
    color: theme.colors.primaryText,
  },
  emptyCard: {
    marginHorizontal: theme.spacing(isSmartwatch ? 1 : 2),
    alignItems: 'center',
    paddingVertical: theme.spacing(4),
  },
  emptyIconContainer: {
    marginBottom: theme.spacing(2),
    opacity: 0.4,
  },
  empty: { 
    color: theme.colors.text,
    textAlign: 'center',
    fontSize: scaleFontSize(isSmartwatch ? 12 : 16),
    fontWeight: '600',
    marginBottom: theme.spacing(0.5),
  },
  emptySubtext: {
    color: theme.colors.subtext,
    textAlign: 'center',
    fontSize: scaleFontSize(isSmartwatch ? 11 : 14),
  },
  firstAnswerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5B9AB8',
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(1.5),
    borderRadius: theme.radius.md,
    gap: theme.spacing(1),
    ...theme.shadows.md,
  },
  firstAnswerButtonText: {
    color: theme.colors.primaryText,
    fontSize: scaleFontSize(16),
    fontWeight: '600',
  },
  answerCard: { 
    marginHorizontal: theme.spacing(isSmartwatch ? 1 : 2),
    marginBottom: theme.spacing(2),
  },
  topAnswerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '20',
    paddingHorizontal: theme.spacing(1),
    paddingVertical: theme.spacing(0.25),
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.warning,
    gap: theme.spacing(0.5),
    marginLeft: theme.spacing(1),
  },
  topAnswerText: {
    fontSize: scaleFontSize(10),
    fontWeight: '700',
    color: theme.colors.warning,
  },
  answerAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing(1.5),
  },
  authorAvatar: {
    width: scaleFontSize(isSmartwatch ? 32 : 44),
    height: scaleFontSize(isSmartwatch ? 32 : 44),
    borderRadius: scaleFontSize(isSmartwatch ? 16 : 22),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing(1),
    overflow: 'hidden',
  },
  authorAvatarText: {
    fontSize: scaleFontSize(isSmartwatch ? 12 : 16),
    fontWeight: '700',
    color: theme.colors.card,
  },
  answerAuthor: { 
    fontWeight: '700', 
    marginBottom: 2, 
    color: theme.colors.text,
    fontSize: scaleFontSize(isSmartwatch ? 12 : 16),
  },
  answerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerBody: { 
    color: theme.colors.text,
    fontSize: scaleFontSize(isSmartwatch ? 12 : 15),
    lineHeight: scaleFontSize(isSmartwatch ? 16 : 22),
    marginBottom: theme.spacing(2),
  },
  answerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2),
    paddingTop: theme.spacing(1.5),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  upvoteAnswerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(0.75),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg,
  },
  upvoteCount: {
    fontSize: scaleFontSize(14),
    fontWeight: '700',
    color: theme.colors.text,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  replyText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#5B9AB8',
  },
  answerComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing(isSmartwatch ? 1 : 2),
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(1),
    borderRadius: theme.radius.md,
    ...theme.shadows.sm,
    gap: theme.spacing(1),
  },
  answerInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: scaleFontSize(14),
    minHeight: scaleFontSize(50),
    maxHeight: scaleFontSize(100),
    paddingVertical: theme.spacing(1),
  },
  submitAnswerButton: {
    backgroundColor: '#5B9AB8',
    width: scaleFontSize(40),
    height: scaleFontSize(40),
    borderRadius: scaleFontSize(20),
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  submitAnswerButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },
});

export default QuestionScreen;
