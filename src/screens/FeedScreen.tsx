import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { getQuestions, toggleFollow, upvoteQuestionOnce, Question, seedSampleData, addQuestion } from '../data/store';
import { Card, Tag, MetaText } from '../ui/components';
import { theme } from '../ui/theme';
import { isSmartwatch, scaleFontSize } from '../ui/responsive';
import Svg, { Path } from 'react-native-svg';

type Props = NativeStackScreenProps<RootStackParamList, 'Feed'>;

const FeedScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Question[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'most' | 'nearby' | 'latest'>('most');
  const [askText, setAskText] = useState('');

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

  const submitQuestion = async () => {
    const text = askText.trim();
    if (!text) {
      Alert.alert('Empty question', 'Please enter a question');
      return;
    }
    try {
      await addQuestion(text);
      setAskText('');
      await onRefresh();
      Alert.alert('Success', 'Your question has been posted!');
    } catch (e: any) {
      Alert.alert('Unable to post', e?.message || 'Try again later.');
    }
  };

  const filtered = items.filter((i) => i.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <View style={styles.container}>
      {/* Header like MainScreen */}
      <View style={styles.header}>
        <View style={styles.headerWrap}>
          <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.backButton}>
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={scaleFontSize(20)} color={theme.colors.subtext} />
        <TextInput
          placeholder="Search questions..."
          placeholderTextColor={theme.colors.subtext}
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={scaleFontSize(20)} color={theme.colors.subtext} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Pills */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.filterContainer}
        style={styles.filterScrollView}
      >
        <TouchableOpacity onPress={() => setFilter('most')}>
          <LinearGradient
            colors={filter === 'most' ? ['#5B9AB8', '#4A90A4'] : [theme.colors.card, theme.colors.card]}
            style={[styles.filterPill, filter === 'most' && styles.filterPillActive]}
          >
            <MaterialCommunityIcons 
              name="fire" 
              size={scaleFontSize(16)} 
              color={filter === 'most' ? theme.colors.primaryText : theme.colors.text} 
            />
            <Text style={[styles.filterText, filter === 'most' && styles.filterTextActive]}>
              Most Viewed
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setFilter('nearby')}>
          <LinearGradient
            colors={filter === 'nearby' ? ['#5B9AB8', '#4A90A4'] : [theme.colors.card, theme.colors.card]}
            style={[styles.filterPill, filter === 'nearby' && styles.filterPillActive]}
          >
            <MaterialCommunityIcons 
              name="map-marker" 
              size={scaleFontSize(16)} 
              color={filter === 'nearby' ? theme.colors.primaryText : theme.colors.text} 
            />
            <Text style={[styles.filterText, filter === 'nearby' && styles.filterTextActive]}>
              Nearby
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setFilter('latest')}>
          <LinearGradient
            colors={filter === 'latest' ? ['#5B9AB8', '#4A90A4'] : [theme.colors.card, theme.colors.card]}
            style={[styles.filterPill, filter === 'latest' && styles.filterPillActive]}
          >
            <MaterialCommunityIcons 
              name="clock-outline" 
              size={scaleFontSize(16)} 
              color={filter === 'latest' ? theme.colors.primaryText : theme.colors.text} 
            />
            <Text style={[styles.filterText, filter === 'latest' && styles.filterTextActive]}>
              Latest
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {!isSmartwatch && (
          <TouchableOpacity onPress={async () => { await seedSampleData(); await onRefresh(); }}>
            <View style={styles.filterPill}>
              <MaterialCommunityIcons name="seed" size={scaleFontSize(16)} color={theme.colors.accent} />
              <Text style={styles.filterText}>Seed Data</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Questions List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => navigation.navigate('Question', { id: item.id })}
            activeOpacity={0.7}
          >
            <Card elevated style={styles.questionCard}>
              {/* Header with Topic and Stats */}
              <View style={styles.cardHeader}>
                <Tag text={item.topic} />
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="chatbubble" size={scaleFontSize(14)} color="#5B9AB8" />
                    <Text style={styles.statValue}>{item.answersCount}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="arrow-up-circle" size={scaleFontSize(14)} color="#4A90A4" />
                    <Text style={styles.statValue}>{item.upvotes}</Text>
                  </View>
                </View>
              </View>

              {/* Question Title */}
              <Text style={styles.questionTitle} numberOfLines={2}>
                {item.title}
              </Text>

              {/* Author Info */}
              <View style={styles.authorRow}>
                <View style={styles.authorAvatar}>
                  <Text style={styles.authorAvatarText}>
                    {item.author.name[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>{item.author.name}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={scaleFontSize(12)} color={theme.colors.subtext} />
                    <MetaText> Just now</MetaText>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onUpvote(item.id);
                  }}
                >
                  <Ionicons name="arrow-up-circle-outline" size={scaleFontSize(20)} color="#4A90A4" />
                  <Text style={styles.actionText}>Upvote</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onFollow(item.id);
                  }}
                >
                  <Ionicons 
                    name={item.following ? "bookmark" : "bookmark-outline"} 
                    size={scaleFontSize(20)} 
                    color={item.following ? theme.colors.success : "#5B9AB8"} 
                  />
                  <Text style={styles.actionText}>
                    {item.following ? 'Saved' : 'Save'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionButton, styles.answerAction]}
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate('Compose', { mode: 'answer', questionId: item.id });
                  }}
                >
                  <Ionicons name="create" size={scaleFontSize(20)} color={theme.colors.primaryText} />
                  <Text style={styles.answerText}>Answer</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="comment-question-outline" 
              size={scaleFontSize(64)} 
              color={theme.colors.subtext} 
            />
            <Text style={styles.emptyTitle}>No questions found</Text>
            <Text style={styles.emptySubtitle}>
              {query ? 'Try a different search term' : 'Be the first to ask a question!'}
            </Text>
            {!query && (
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Compose', { mode: 'question' })}
              >
                <Ionicons name="add-circle" size={scaleFontSize(20)} color={theme.colors.primaryText} />
                <Text style={styles.emptyButtonText}>Ask Question</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing(2) }} />}
        contentContainerStyle={styles.listContent}
      />

      {/* Inline Question Composer - Bottom */}
      {!isSmartwatch && (
        <View style={styles.askComposerBottom}>
          <TextInput
            placeholder="Ask a question..."
            placeholderTextColor={theme.colors.subtext}
            value={askText}
            onChangeText={setAskText}
            style={styles.askInput}
            multiline
            maxLength={200}
          />
          <TouchableOpacity 
            style={[styles.askButton, !askText.trim() && styles.askButtonDisabled]}
            onPress={submitQuestion}
            disabled={!askText.trim()}
          >
            <Ionicons name="send" size={scaleFontSize(20)} color={theme.colors.primaryText} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.25),
    gap: theme.spacing(1),
    ...theme.shadows.sm,
    marginTop: 110,
    marginHorizontal: theme.spacing(2),
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: scaleFontSize(14),
  },
  filterScrollView: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  filterContainer: {
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(2),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(15),
    gap: theme.spacing(1),
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1),
    borderRadius: theme.radius.full,
    gap: theme.spacing(0.75),
    marginRight: theme.spacing(1),
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterPillActive: {
    borderColor: 'transparent',
  },
  filterText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: theme.colors.text,
  },
  filterTextActive: {
    color: theme.colors.primaryText,
  },
  listContent: {
    padding: theme.spacing(2),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(2),
  },
  questionCard: {
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1.5),
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing(1.5),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.spacing(1),
    paddingVertical: theme.spacing(0.5),
    borderRadius: theme.radius.md,
  },
  statValue: {
    fontSize: scaleFontSize(12),
    fontWeight: '700',
    color: theme.colors.text,
  },
  questionTitle: {
    fontSize: scaleFontSize(isSmartwatch ? 14 : 18),
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: scaleFontSize(isSmartwatch ? 18 : 24),
    marginBottom: theme.spacing(2),
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  authorAvatar: {
    width: scaleFontSize(36),
    height: scaleFontSize(36),
    borderRadius: scaleFontSize(18),
    backgroundColor: '#A9D5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing(1),
  },
  authorAvatarText: {
    fontSize: scaleFontSize(14),
    fontWeight: '700',
    color: '#5B9AB8',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    gap: theme.spacing(1),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing(1),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg,
    gap: theme.spacing(0.5),
  },
  answerAction: {
    backgroundColor: '#5B9AB8',
  },
  actionText: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
    color: theme.colors.text,
  },
  answerText: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
    color: theme.colors.primaryText,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing(8),
  },
  emptyTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  emptySubtitle: {
    fontSize: scaleFontSize(14),
    color: theme.colors.subtext,
    marginBottom: theme.spacing(3),
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5B9AB8',
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(1.5),
    borderRadius: theme.radius.md,
    gap: theme.spacing(1),
    ...theme.shadows.md,
  },
  emptyButtonText: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: theme.colors.primaryText,
  },
  askComposerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.5),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing(1),
    ...theme.shadows.lg,
  },
  askInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: scaleFontSize(14),
    minHeight: scaleFontSize(40),
    maxHeight: scaleFontSize(80),
    paddingVertical: theme.spacing(1),
  },
  askButton: {
    backgroundColor: '#5B9AB8',
    width: scaleFontSize(40),
    height: scaleFontSize(40),
    borderRadius: scaleFontSize(20),
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  askButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },
});

export default FeedScreen;
