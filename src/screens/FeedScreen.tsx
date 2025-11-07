import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, ImageBackground, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { getQuestions, toggleFollow, upvoteQuestionOnce, Question, seedSampleData, getAnswersFor, Answer, addAnswer, addQuestion } from '../data/store';
import { ButtonPrimary, ButtonSecondary, Card, Tag, MetaText } from '../ui/components';
import { theme } from '../ui/theme';
import { isSmartwatch, scaleFontSize } from '../ui/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'Feed'>;

const FeedScreen: React.FC<Props> = ({ navigation }) => {
  const { signOut } = useAuth();
  const [items, setItems] = useState<Question[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'most' | 'nearby' | 'latest'>('most');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [answersMap, setAnswersMap] = useState<Record<string, Answer[]>>({});
  const [answersLoading, setAnswersLoading] = useState<Record<string, boolean>>({});
  const [imgFallback, setImgFallback] = useState<Record<string, boolean>>({});
  const [askText, setAskText] = useState('');
  const [answerInputs, setAnswerInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const data = await getQuestions();
        setItems(data);
      } catch (e) {
        // noop
      }
    })();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getQuestions();
      setItems(data);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const onFollow = async (id: string) => {
    toggleFollow(id);
    const data = await getQuestions();
    setItems(data);
  };

  const submitQuestion = async () => {
    const t = askText.trim();
    if (!t) return;
    try {
      const q = await addQuestion(t);
      setAskText('');
      // Refresh feed and open the created question
      await onRefresh();
      // Optionally navigate: navigation.navigate('Question', { id: q.id });
    } catch (e: any) {
      Alert.alert('Unable to post', e?.message || 'Try again later.');
    }
  };

  const submitAnswer = async (qid: string) => {
    const body = (answerInputs[qid] || '').trim();
    if (!body) return;
    try {
      await addAnswer(qid, body);
      setAnswerInputs((prev) => ({ ...prev, [qid]: '' }));
      const ads = await getAnswersFor(qid);
      setAnswersMap((prev) => ({ ...prev, [qid]: ads }));
    } catch (e: any) {
      Alert.alert('Unable to answer', e?.message || 'Try again later.');
    }
  };

  const toggleExpand = async (id: string) => {
    const next = !expanded[id];
    setExpanded((prev) => ({ ...prev, [id]: next }));
    if (next && !answersMap[id]) {
      setAnswersLoading((prev) => ({ ...prev, [id]: true }));
      try {
        const ans = await getAnswersFor(id);
        setAnswersMap((prev) => ({ ...prev, [id]: ans }));
      } finally {
        setAnswersLoading((prev) => ({ ...prev, [id]: false }));
      }
    }
  };

  const imageFor = (id: string) => {
    const n = parseInt(id.replace(/\D/g, ''), 10) || 1;
    const picks = [
      // Purple ribbon / awareness themed images with richer colors
      'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=1600&auto=format&fit=crop',
      // Support hands with warm tones
      'https://images.unsplash.com/photo-1519336555923-59661f41bb36?q=80&w=1600&auto=format&fit=crop',
      // Healthcare consultation (no white background)
      'https://images.unsplash.com/photo-1580281657701-829e6f4c0b09?q=80&w=1600&auto=format&fit=crop',
      // Group support, soft purple lighting
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1600&auto=format&fit=crop',
    ];
    const url = picks[n % picks.length];
    if (imgFallback[id]) {
      return 'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?q=80&w=1600&auto=format&fit=crop';
    }
    return url;
  };

  const filtered = items.filter((i) => i.title.toLowerCase().includes(query.toLowerCase()));

  const onUpvote = async (id: string) => {
    try {
      const res = await upvoteQuestionOnce(id);
      if (res?.changed) {
        setItems((prev) => prev.map((q) => (q.id === id ? { ...q, upvotes: q.upvotes + 1 } : q)));
      }
    } catch (e: any) {
      Alert.alert('Upvote failed', e?.message || 'Please check Firestore rules for votes collection.');
    } finally {
      const data = await getQuestions();
      setItems(data);
    }
  };
  return (
    <View style={styles.container}>
      {!isSmartwatch && (
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Text style={styles.brandText}>LifeWeaver</Text>
          </View>
          <View style={styles.headerCenter}><Text style={styles.headerTitle}>Home</Text></View>
          <View style={styles.headerActions}>
            <ButtonSecondary title="Seed" onPress={async () => { await seedSampleData(); await onRefresh(); }} size="sm" />
            <View style={{ width: theme.spacing(1) }} />
            <ButtonPrimary title="Ask" onPress={() => navigation.navigate('Compose', { mode: 'question' })} size="sm" />
          </View>
        </View>
      )}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            {!isSmartwatch ? (
              <View style={styles.heroWrap}>
                <ImageBackground
                  source={{ uri: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=1600&auto=format&fit=crop' }}
                  style={styles.hero}
                  imageStyle={{ borderRadius: theme.radius.lg }}
                >
                  <View style={styles.heroOverlay}>
                    <View style={styles.heroTopRow}>
                      <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.backBadge}><Text style={styles.backBadgeText}>←</Text></TouchableOpacity>
                      <View style={{ flex: 1 }} />
                      <View style={styles.brandRow}><View style={styles.brandLogo}><Text style={styles.brandLogoText}>LW</Text></View><Text style={styles.brandWord}>LifeWeaver</Text></View>
                    </View>
                    <Text style={styles.heroTitle}>Explore Q&A</Text>
                    <Text style={styles.heroSubtitle}>Ask questions and find answers</Text>
                  </View>
                </ImageBackground>
              </View>
            ) : (
              <View style={styles.compactHeader}>
                <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.backBadge}>
                  <Text style={styles.backBadgeText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.compactTitle}>Q&A Feed</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Compose', { mode: 'question' })} style={styles.askBadge}>
                  <Text style={styles.askBadgeText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={{ height: theme.spacing(1) }} />
            <View style={styles.searchBox}>
              <TextInput
                placeholder="Search questions"
                placeholderTextColor={theme.colors.subtext}
                value={query}
                onChangeText={setQuery}
                style={styles.searchInput}
              />
            </View>
            {!isSmartwatch && (
              <View style={styles.askBox}>
                <TextInput
                  placeholder="Ask a question…"
                  placeholderTextColor={theme.colors.subtext}
                  value={askText}
                  onChangeText={setAskText}
                  style={styles.askInput}
                />
                <ButtonPrimary title="Post" onPress={submitQuestion} size="sm" />
              </View>
            )}
            <View style={styles.pillsRow}>
              <TouchableOpacity onPress={() => setFilter('most')}><View style={[styles.pill, filter==='most' && styles.pillActive]}><Text style={[styles.pillText, filter==='most' && styles.pillTextActive]}>Most Viewed</Text></View></TouchableOpacity>
              <TouchableOpacity onPress={() => setFilter('nearby')}><View style={[styles.pill, filter==='nearby' && styles.pillActive]}><Text style={[styles.pillText, filter==='nearby' && styles.pillTextActive]}>Nearby</Text></View></TouchableOpacity>
              <TouchableOpacity onPress={() => setFilter('latest')}><View style={[styles.pill, filter==='latest' && styles.pillActive]}><Text style={[styles.pillText, filter==='latest' && styles.pillTextActive]}>Latest</Text></View></TouchableOpacity>
            </View>
            <View style={{ height: theme.spacing(1) }} />
          </View>
        }
        renderItem={({ item }) => (
          <View>
            <Card style={styles.card}>
              <TouchableOpacity onPress={() => toggleExpand(item.id)} activeOpacity={0.8}>
                <View style={styles.imageWrap}>
                  <ImageBackground
                  source={{ uri: imageFor(item.id) }}
                  style={styles.cardImage}
                  imageStyle={{ borderRadius: theme.radius.lg }}
                  onError={() => setImgFallback((prev) => ({ ...prev, [item.id]: true }))}
                >
                  <View style={styles.imageOverlay}>
                    <Text style={styles.imageTitle} numberOfLines={1}>{item.title}</Text>
                    <MetaText>{item.topic}  •  {item.answersCount} Answers  •  {item.upvotes} Upvotes</MetaText>
                  </View>
                </ImageBackground>
                </View>
              </TouchableOpacity>
              <View style={styles.actions}>
                {isSmartwatch ? (
                  <>
                    <ButtonPrimary title={`👍 ${item.upvotes}`} onPress={() => onUpvote(item.id)} size="sm" style={styles.actionBtnWatch} />
                    <ButtonSecondary title={expanded[item.id] ? '▼' : '▶'} onPress={() => toggleExpand(item.id)} size="sm" style={styles.actionBtnWatch} />
                  </>
                ) : (
                  <>
                    <ButtonSecondary title={`Upvote (${item.upvotes})`} onPress={() => onUpvote(item.id)} size="sm" />
                    <View style={{ width: theme.spacing(1) }} />
                    <ButtonSecondary title={item.following ? 'Following' : 'Follow'} onPress={() => onFollow(item.id)} size="sm" />
                    <View style={{ width: theme.spacing(1) }} />
                    <ButtonPrimary title="Answer" onPress={() => { if (!expanded[item.id]) toggleExpand(item.id); }} size="sm" />
                    <View style={{ width: theme.spacing(1) }} />
                    <ButtonSecondary title={expanded[item.id] ? 'Hide' : 'Open'} onPress={() => toggleExpand(item.id)} size="sm" />
                  </>
                )}
              </View>
              {expanded[item.id] && (
                <View style={styles.expandArea}>
                  {answersLoading[item.id] ? (
                    <MetaText>Loading answers…</MetaText>
                  ) : (
                    <>
                      {(answersMap[item.id] || []).slice(0, 3).map((a) => (
                        <View key={a.id} style={styles.answerRow}>
                          <Text style={styles.answerAuthor}>{a.author?.name || 'User'}</Text>
                          <Text style={styles.answerBody} numberOfLines={3}>{a.body}</Text>
                        </View>
                      ))}
                      <View style={styles.inlineAnswerBox}>
                        <TextInput
                          placeholder="Write an answer…"
                          placeholderTextColor={theme.colors.subtext}
                          value={answerInputs[item.id] || ''}
                          onChangeText={(t) => setAnswerInputs((prev) => ({ ...prev, [item.id]: t }))}
                          style={styles.inlineAnswerInput}
                          multiline
                        />
                        <ButtonSecondary title="Submit" onPress={() => submitAnswer(item.id)} />
                      </View>
                      <View style={{ height: theme.spacing(1) }} />
                      <ButtonSecondary title="View full thread" onPress={() => navigation.navigate('Question', { id: item.id })} />
                    </>
                  )}
                </View>
              )}
            </Card>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing(1) }} />}
        contentContainerStyle={{ padding: theme.spacing(2) }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { 
    padding: theme.spacing(2), 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    ...theme.shadows.sm,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  headerActions: { flexDirection: 'row' },
  title: { ...theme.typography.title as any },
  card: { 
    ...theme.shadows.sm,
  },
  cardTitle: { ...theme.typography.h2 as any },
  cardExcerpt: { marginTop: 6, color: theme.colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  metaDot: { color: theme.colors.subtext, marginHorizontal: 6 },
  actions: { flexDirection: 'row', marginTop: theme.spacing(2) },
  footer: { flexDirection: 'row', justifyContent: 'space-around', padding: theme.spacing(2), borderTopWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card },
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing(2) },
  hello: { ...theme.typography.title as any },
  subtitle: { color: theme.colors.subtext },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.border },
  searchBox: { backgroundColor: theme.colors.card, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: theme.spacing(2), paddingVertical: 10 },
  searchInput: { color: theme.colors.text },
  pillsRow: { flexDirection: 'row', marginTop: theme.spacing(2) },
  pill: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginRight: theme.spacing(1) },
  pillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  pillText: { color: theme.colors.text },
  pillTextActive: { color: theme.colors.primaryText, fontWeight: '700' },
  imageWrap: { borderRadius: theme.radius.lg, overflow: 'hidden' },
  cardImage: { 
    height: isSmartwatch ? 100 : 180, 
    justifyContent: 'flex-end',
  },
  imageOverlay: { backgroundColor: 'rgba(0,0,0,0.35)', padding: theme.spacing(2) },
  imageTitle: { 
    color: '#fff', 
    fontSize: scaleFontSize(isSmartwatch ? 12 : 16), 
    fontWeight: '700', 
    marginBottom: 4,
  },
  expandArea: { marginTop: theme.spacing(1) },
  answerRow: { paddingVertical: 8, borderTopWidth: 1, borderColor: theme.colors.border },
  answerAuthor: { fontWeight: '600', color: theme.colors.text, marginBottom: 4 },
  answerBody: { color: theme.colors.subtext },
  // Brand header styles
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandLogo: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  brandLogoText: { color: theme.colors.primaryText, fontWeight: '800' },
  brandText: { marginLeft: 8, color: theme.colors.text, fontWeight: '700' },
  headerCenter: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  headerTitle: { ...theme.typography.title as any, color: theme.colors.text },
  // Hero header (to match Main)
  heroWrap: { borderRadius: theme.radius.lg, overflow: 'hidden' },
  hero: { height: 160, justifyContent: 'flex-end' },
  heroOverlay: { backgroundColor: 'rgba(0,0,0,0.35)', padding: theme.spacing(2) },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing(1) },
  backBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center' },
  backBadgeText: { color: theme.colors.text, fontWeight: '800' },
  brandWord: { color: '#fff', fontWeight: '700', marginLeft: 6 },
  heroTitle: { 
    color: '#fff', 
    fontSize: scaleFontSize(20), 
    fontWeight: '800',
  },
  heroSubtitle: { color: '#E5E7EB', marginTop: 4 },
  // Ask composer at top
  askBox: { marginTop: theme.spacing(1), backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: theme.spacing(1), flexDirection: 'row', alignItems: 'center' },
  askInput: { flex: 1, marginRight: theme.spacing(1), color: theme.colors.text },
  // Inline answer composer
  inlineAnswerBox: { marginTop: theme.spacing(1), backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: theme.spacing(1) },
  inlineAnswerInput: { 
    minHeight: isSmartwatch ? 40 : 60, 
    color: theme.colors.text,
  },
  // Smartwatch specific styles
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing(1),
    paddingHorizontal: theme.spacing(0.5),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing(1),
  },
  compactTitle: {
    fontSize: scaleFontSize(12),
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  askBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askBadgeText: {
    color: theme.colors.primaryText,
    fontSize: scaleFontSize(16),
    fontWeight: '800',
  },
  actionBtnWatch: {
    flex: 1,
    marginHorizontal: 2,
  },
});

export default FeedScreen;
