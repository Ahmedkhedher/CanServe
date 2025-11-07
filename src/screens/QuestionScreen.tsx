import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  getQuestionById,
  getAnswersFor,
  toggleFollow,
  upvoteQuestionOnce,
  upvoteAnswerOnce,
  Question as QType,
  Answer as AType,
} from '../data/store';
import { ButtonPrimary, ButtonSecondary, Card, Tag, MetaText } from '../ui/components';
import { theme } from '../ui/theme';
import { isSmartwatch, scaleFontSize } from '../ui/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'Question'>;

const QuestionScreen: React.FC<Props> = ({ route, navigation }) => {
  const id = route.params?.id ?? 'unknown';
  const [q, setQ] = useState<QType | null>(null);
  const [answers, setAnswers] = useState<AType[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBadge}>
          <Text style={styles.backBadgeText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.brandWord}>LifeWeaver</Text>
        <View style={{ width: scaleFontSize(28) }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card elevated style={styles.questionCard}>
          <Tag text={q.topic} />
          <Text style={styles.title}>{q.title}</Text>
          <MetaText>
            {isSmartwatch 
              ? `${q.answersCount} Ans • ${q.upvotes} 👍` 
              : `By ${q.author.name} • ${q.answersCount} Answers • ${q.upvotes} Upvotes`}
          </MetaText>
          <View style={{ height: theme.spacing(1) }} />
          <View style={styles.actionsRow}>
            {isSmartwatch ? (
              <>
                <ButtonSecondary title={`👍 ${q.upvotes}`} onPress={async () => {
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
          }} size="sm" style={{ flex: 1 }} />
                <View style={{ width: theme.spacing(0.5) }} />
                <ButtonPrimary title="✏️" onPress={() => navigation.navigate('Compose', { mode: 'answer', questionId: q.id })} size="sm" style={{ flex: 1 }} />
              </>
            ) : (
              <>
                <ButtonSecondary title={`Upvote (${q.upvotes})`} onPress={async () => {
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
                }} size="sm" />
                <View style={{ width: theme.spacing(1) }} />
                <ButtonSecondary title={q.following ? 'Following' : 'Follow'} onPress={async () => { toggleFollow(q.id); const qd = await getQuestionById(id); setQ(qd); }} size="sm" />
                <View style={{ width: theme.spacing(1) }} />
                <ButtonPrimary title="Answer" onPress={() => navigation.navigate('Compose', { mode: 'answer', questionId: q.id })} size="sm" />
              </>
            )}
          </View>
        </Card>
        <View style={{ height: theme.spacing(2) }} />
        <Text style={styles.section}>💬 Answers ({answers.length})</Text>
        {answers.length === 0 ? (
          <Card elevated>
            <Text style={styles.empty}>No answers yet. Be the first to answer!</Text>
          </Card>
        ) : (
          answers.map((item) => (
            <Card key={item.id} elevated style={styles.answerCard}>
              <View style={styles.answerHeader}>
                <View style={styles.authorAvatar}>
                  <Text style={styles.authorAvatarText}>{item.author.name[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.answerAuthor}>{item.author.name}</Text>
                  {!isSmartwatch && <MetaText>Just now</MetaText>}
                </View>
              </View>
              <Text style={styles.answerBody}>{item.body}</Text>
              <View style={{ height: theme.spacing(1) }} />
              <ButtonSecondary title={isSmartwatch ? `👍 ${item.upvotes}` : `Upvote (${item.upvotes})`} onPress={async () => {
              try {
                const res = await upvoteAnswerOnce(item.id);
                if (res?.changed) {
                  setAnswers((prev) => prev.map((a) => (a.id === item.id ? { ...a, upvotes: a.upvotes + 1 } : a)));
                }
              } catch (e: any) {
                Alert.alert('Upvote failed', e?.message || 'Please check Firestore rules for votes collection.');
                } finally {
                  const ads = await getAnswersFor(id);
                  setAnswers(ads);
                }
              }} size="sm" />
            </Card>
          ))
        )}
        <View style={{ height: theme.spacing(2) }} />
        {!isSmartwatch && (
          <ButtonSecondary title="🚩 Report Question" onPress={() => navigation.navigate('Report', { targetType: 'question', targetId: id })} />
        )}
        <View style={{ height: theme.spacing(4) }} />
      </ScrollView>
    </View>
  );
};

const scriptFont = Platform.select({ web: '"Dancing Script", cursive', default: 'System' });

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: theme.spacing(isSmartwatch ? 1 : 2), 
    backgroundColor: theme.colors.bg,
  },
  topHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: theme.spacing(1),
    paddingVertical: theme.spacing(1),
  },
  backBadge: { 
    width: scaleFontSize(28), 
    height: scaleFontSize(28), 
    borderRadius: scaleFontSize(14), 
    backgroundColor: theme.colors.card, 
    alignItems: 'center', 
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  backBadgeText: { 
    color: theme.colors.text, 
    fontWeight: '800',
    fontSize: scaleFontSize(16),
  },
  brandWord: { 
    color: theme.colors.text, 
    fontSize: scaleFontSize(isSmartwatch ? 14 : 24), 
    fontWeight: '700', 
    letterSpacing: 0.5, 
    fontFamily: scriptFont as any,
  },
  questionCard: {
    marginBottom: theme.spacing(1),
  },
  title: { 
    fontSize: scaleFontSize(isSmartwatch ? 14 : 20), 
    fontWeight: '700', 
    marginBottom: theme.spacing(0.75),
    color: theme.colors.text,
    lineHeight: scaleFontSize(isSmartwatch ? 18 : 26),
  },
  actionsRow: { 
    flexDirection: 'row', 
    marginTop: theme.spacing(1),
    flexWrap: 'wrap',
  },
  section: { 
    marginTop: theme.spacing(1), 
    marginBottom: theme.spacing(1), 
    fontSize: scaleFontSize(isSmartwatch ? 14 : 18),
    fontWeight: '700',
    color: theme.colors.text,
  },
  answerCard: { 
    marginBottom: theme.spacing(1.5),
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  authorAvatar: {
    width: scaleFontSize(isSmartwatch ? 24 : 32),
    height: scaleFontSize(isSmartwatch ? 24 : 32),
    borderRadius: scaleFontSize(isSmartwatch ? 12 : 16),
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing(1),
  },
  authorAvatarText: {
    fontSize: scaleFontSize(isSmartwatch ? 10 : 14),
    fontWeight: '700',
    color: theme.colors.primary,
  },
  answerAuthor: { 
    fontWeight: '700', 
    marginBottom: 2, 
    color: theme.colors.text,
    fontSize: scaleFontSize(isSmartwatch ? 12 : 16),
  },
  answerBody: { 
    color: theme.colors.text,
    fontSize: scaleFontSize(isSmartwatch ? 12 : 15),
    lineHeight: scaleFontSize(isSmartwatch ? 16 : 22),
  },
  empty: { 
    color: theme.colors.subtext,
    textAlign: 'center',
    fontSize: scaleFontSize(isSmartwatch ? 12 : 14),
    fontStyle: 'italic',
  },
});

export default QuestionScreen;
