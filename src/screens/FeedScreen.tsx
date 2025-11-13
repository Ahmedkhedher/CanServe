import React, { useEffect, useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
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
import { loadProfile, AppProfile } from '../services/profile';
import { theme } from '../ui/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Feed'>;

const FeedScreenNew: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Question[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [answerImage, setAnswerImage] = useState<string | null>(null);
  const [showAnswersForQuestion, setShowAnswersForQuestion] = useState<string | null>(null);
  const [answersMap, setAnswersMap] = useState<Record<string, Answer[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState<AppProfile | null>(null);
  
  // Refs to maintain focus
  const answerInputRef = useRef<TextInput>(null);
  

  useEffect(() => {
    loadQuestions();
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  // Refresh profile when screen comes into focus (e.g., returning from ProfileScreen)
  useFocusEffect(
    React.useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    try {
      console.log('🔄 FeedScreen: Loading user profile for quick composer...');
      
      // Load profile from database to get base64 photo
      const profile = await loadProfile();
      setUserProfile(profile);
      
      console.log('Profile data loaded for quick composer:', {
        hasProfile: !!profile,
        hasPhotoURL: !!profile?.photoURL,
        photoType: profile?.photoURL?.startsWith('data:image/') ? 'base64' : 'other',
        displayName: profile?.displayName
      });
      
      if (profile?.photoURL) {
        console.log('📸 Profile has photo URL for quick composer');
      } else {
        console.log('👤 No profile photo for quick composer, will show initials');
      }
    } catch (error) {
      console.error('❌ Failed to load profile for quick composer:', error);
    }
  };

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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadQuestions();
      loadUserProfile(); // Check Firebase user data
    } finally {
      setRefreshing(false);
    }
  };

  // Optimized text change handlers to prevent re-render issues
  const handleAnswerTextChange = (text: string) => {
    setAnswerText(text);
  };

  const pickAnswerImage = async () => {
    try {
      console.log('🔄 Starting image picker for platform:', Platform.OS);
      
      if (Platform.OS === 'web') {
        // Web implementation using HTML file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        return new Promise<void>((resolve, reject) => {
          input.onchange = async (event: any) => {
            const file = event.target.files?.[0];
            if (file) {
              try {
                console.log('🔄 Converting web image to base64...');
                
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (typeof reader.result === 'string') {
                    console.log('✅ Web image base64 conversion successful');
                    setAnswerImage(reader.result);
                    console.log('📎 Web answer image attached:', reader.result.substring(0, 50) + '...');
                    resolve();
                  } else {
                    reject(new Error('Failed to convert to base64'));
                  }
                };
                reader.onerror = () => reject(new Error('FileReader error'));
                reader.readAsDataURL(file);
              } catch (e: any) {
                console.error('❌ Web image conversion failed:', e);
                Alert.alert('Upload failed', e?.message ?? 'Could not process image');
                reject(e);
              }
            } else {
              resolve(); // User canceled
            }
          };
          
          input.oncancel = () => resolve(); // User canceled
          input.click();
        });
      } else {
        // Mobile implementation using expo-image-picker
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
          return Alert.alert('Permission required', 'Please allow photo library access.');
        }

        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
        });

        if (!res.canceled && res.assets?.[0]?.uri) {
          console.log('🔄 Converting mobile image to base64...');
          
          console.log('📱 Mobile image URI:', res.assets[0].uri);
        
          let base64Url: string;
        
          if (res.assets[0].uri.startsWith('data:')) {
            // Already base64
            base64Url = res.assets[0].uri;
            console.log('✅ Image already in base64 format');
          } else {
            // Convert to base64
            try {
              const response = await fetch(res.assets[0].uri);
              if (!response.ok) {
                throw new Error(`Fetch failed: ${response.status}`);
              }
              const blob = await response.blob();
              console.log('📦 Blob created, size:', blob.size, 'type:', blob.type);
            
              base64Url = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (typeof reader.result === 'string' && reader.result.startsWith('data:')) {
                    console.log('✅ Mobile image base64 conversion successful, length:', reader.result.length);
                    resolve(reader.result);
                  } else {
                    console.error('❌ FileReader result is not a valid data URL:', typeof reader.result, reader.result?.toString().substring(0, 50));
                    reject(new Error('Failed to convert to base64 - invalid result'));
                  }
                };
                reader.onerror = (error) => {
                  console.error('❌ FileReader error:', error);
                  reject(new Error('FileReader error'));
                };
                reader.readAsDataURL(blob);
              });
            } catch (fetchError) {
              console.error('❌ Fetch or conversion error:', fetchError);
              throw new Error(`Image conversion failed: ${fetchError}`);
            }
          }
          
          setAnswerImage(base64Url);
          console.log('📎 Mobile answer image attached:', base64Url.substring(0, 50) + '...');
        }
      }
    } catch (e: any) {
      console.error('❌ Answer image conversion failed:', e);
      Alert.alert('Upload failed', e?.message ?? 'Could not process image');
    }
  };

  const removeAnswerImage = () => {
    setAnswerImage(null);
    console.log('🗑️ Answer image removed');
  };

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
    
    if (!text && !answerImage) {
      Alert.alert('Empty answer', 'Please enter your answer or attach an image');
      return;
    }
    
    // Check if user is authenticated
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to post an answer');
      return;
    }
    
    try {
      console.log('Submitting answer:', { 
        questionId, 
        answerText: text.substring(0, 50),
        hasImage: !!answerImage
      });
      await addAnswer(questionId, text || 'Image attachment', answerImage || undefined);
      console.log('Answer submitted successfully');
      Alert.alert('Success', 'Your answer has been posted!');
      // Only clear text and collapse after successful submission
      setAnswerText('');
      setAnswerImage(null);
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
          {(() => {
            console.log('🔍 Post author data:', {
              authorName: item.author?.name,
              hasPhotoURL: !!item.author?.photoURL,
              photoURL: item.author?.photoURL ? item.author.photoURL.substring(0, 50) + '...' : 'No photo URL'
            });
            // Accept base64 images and filter out old MinIO URLs
            const isValidPhotoURL = item.author?.photoURL && (
              item.author.photoURL.startsWith('data:image/') || // Base64 images
              (!item.author.photoURL.includes('192.168.1.9:9000') && 
               !item.author.photoURL.includes('test-bucket')) // Filter out old MinIO URLs
            );
            
            return isValidPhotoURL ? (
              <Image 
                source={{ uri: item.author.photoURL }} 
                style={styles.profileImage}
                onLoad={() => {
                  console.log('✅ Post author image loaded successfully');
                }}
                onError={(e) => {
                  console.log('❌ Post author image load error:', e.nativeEvent.error);
                  console.log('📷 Failed author URL:', item.author.photoURL);
                }}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.author?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            );
          })()}
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
        {/* Question Images - Moved to top */}
        {item.images && item.images.length > 0 && (
          <View style={styles.questionImagesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
              {item.images.map((imageUrl, index) => {
                const isValidImage = imageUrl && imageUrl.startsWith('data:image/');
                return isValidImage ? (
                  <Image 
                    key={index}
                    source={{ uri: imageUrl }} 
                    style={styles.questionImage}
                    resizeMode="cover"
                  />
                ) : null;
              })}
            </ScrollView>
          </View>
        )}

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
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            Alert.alert('Share', 'Share functionality coming soon!');
          }}
        >
          <Ionicons name="share-outline" size={20} color={theme.colors.subtext} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            Alert.alert('Bookmark', 'Post bookmarked!');
          }}
        >
          <Ionicons name="bookmark-outline" size={20} color={theme.colors.subtext} />
          <Text style={styles.actionText}>Save</Text>
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
          {answersMap[item.id].map((answer) => {
            console.log('🔍 Rendering answer:', {
              id: answer.id,
              hasImageUrl: !!answer.imageUrl,
              imageUrl: answer.imageUrl ? answer.imageUrl.substring(0, 30) + '...' : 'No image'
            });
            return (
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
              {(() => {
                console.log('🔍 Answer image data:', {
                  answerId: answer.id,
                  hasImageUrl: !!answer.imageUrl,
                  imageType: answer.imageUrl?.startsWith('data:image/') ? 'base64' : 
                           answer.imageUrl?.startsWith('blob:') ? 'blob' : 'other',
                  imageUrl: answer.imageUrl ? answer.imageUrl.substring(0, 50) + '...' : 'No image',
                  fullUrl: answer.imageUrl
                });
                
                // Handle different image URL types
                const isBase64Image = answer.imageUrl && answer.imageUrl.startsWith('data:image/');
                const isBlobUrl = answer.imageUrl && answer.imageUrl.startsWith('blob:');
                
                if (isBlobUrl) {
                  console.log('⚠️ Found blob URL, this will likely fail to load:', answer.imageUrl);
                }
                
                const isValidImageUrl = isBase64Image;
                
                return isValidImageUrl ? (
                  <View style={styles.answerImageContainer}>
                    <Image 
                      source={{ uri: answer.imageUrl }} 
                      style={styles.answerImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : null;
              })()}
            </View>
            );
          })}
        </View>
      )}

      {/* Inline Answer Box */}
      {expandedQuestionId === item.id && (
        <View style={styles.answerBox}>
          {(() => {
            console.log('🔧 Answer box rendering for question:', item.id);
            return null;
          })()}
          <View style={styles.answerHeader}>
            <View style={styles.answerAvatar}>
              <Text style={styles.answerAvatarText}>
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <Text style={styles.answerLabel}>Write your answer...</Text>
          </View>
          <TextInput
            ref={answerInputRef}
            key={`answer-input-${expandedQuestionId}`}
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
            enablesReturnKeyAutomatically={false}
          />
          
          {/* Image Attachment Preview */}
          {answerImage && (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: answerImage }} 
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={removeAnswerImage}
              >
                <Ionicons name="close-circle" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>
          )}
          
          {/* Attachment Actions */}
          <View style={styles.attachmentActions}>
            <Text style={styles.imageDebugText}>🔧 Debug: Attachment section rendering</Text>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => {
                console.log('🔧 Add Image button pressed!');
                pickAnswerImage();
              }}
            >
              <Ionicons name="image" size={20} color={theme.colors.primary} />
              <Text style={styles.attachButtonText}>Add Image</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.answerActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setExpandedQuestionId(null);
                setAnswerText('');
                setAnswerImage(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitAnswerButton,
                (!answerText?.trim() && !answerImage) && styles.submitAnswerButtonDisabled
              ]}
              onPress={() => handleSubmitAnswer(item.id)}
              disabled={!answerText?.trim() && !answerImage}
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
      {/* Ask Question Button */}
      <TouchableOpacity
        style={styles.quickComposer}
        onPress={() => navigation.navigate('Compose', { mode: 'question' })}
      >
        {(() => {
          console.log('🔍 Quick composer profile data:', {
            hasUserProfile: !!userProfile,
            hasPhotoURL: !!userProfile?.photoURL,
            photoType: userProfile?.photoURL?.startsWith('data:image/') ? 'base64' : 'other',
            displayName: userProfile?.displayName
          });
          
          // Use base64 profile photo from database
          const isValidPhotoURL = userProfile?.photoURL && 
            userProfile.photoURL.startsWith('data:image/');
          
          return isValidPhotoURL ? (
            <Image 
              source={{ uri: userProfile.photoURL }} 
              style={styles.profileImage}
              onLoad={() => {
                console.log('✅ Quick composer profile image loaded successfully');
              }}
              onError={(e) => {
                console.log('❌ Quick composer profile image load error:', e.nativeEvent.error);
                console.log('📷 Failed quick composer URL:', userProfile.photoURL);
              }}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(() => {
                  const initials = userProfile?.displayName?.charAt(0).toUpperCase() ||
                                 user?.displayName?.charAt(0).toUpperCase() || 
                                 user?.email?.charAt(0).toUpperCase() || 'U';
                  console.log('👤 Quick composer showing initials:', initials, 'Has profile photo:', !!userProfile?.photoURL);
                  return initials;
                })()}
              </Text>
            </View>
          );
        })()}
        <Text style={styles.quickComposerText}>Ask a question...</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
      </TouchableOpacity>

      {/* Separator */}
      <View style={styles.separator} />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Community</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => {
              console.log('🔄 Manual refresh triggered');
              loadUserProfile();
            }}
          >
            <Ionicons name="refresh" size={24} color={theme.colors.text} />
          </TouchableOpacity>
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
            onPress={() => navigation.navigate('Compose', { mode: 'question' })}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  answerImage: {
    width: '100%',
    height: Platform.OS === 'web' ? 400 : 250,
    borderRadius: 12,
    marginTop: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: 12,
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: Platform.OS === 'web' ? 250 : 150,
    borderRadius: 8,
    backgroundColor: theme.colors.border,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  attachmentActions: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 12,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: theme.colors.border,
    gap: 6,
  },
  attachButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  answerImageContainer: {
    marginTop: 8,
  },
  imageDebugText: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  questionImagesContainer: {
    marginTop: 0,
    marginBottom: 12,
  },
  imagesScroll: {
    flexDirection: 'row',
  },
  questionImage: {
    width: Platform.OS === 'web' ? 300 : 150,
    height: Platform.OS === 'web' ? 300 : 150,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: theme.colors.border,
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
