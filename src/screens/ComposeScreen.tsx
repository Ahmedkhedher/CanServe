import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, Image, ScrollView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { addQuestion, addAnswer } from '../data/store';
import { theme } from '../ui/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

type Props = NativeStackScreenProps<RootStackParamList, 'Compose'>;

const ComposeScreen: React.FC<Props> = React.memo(({ route, navigation }) => {
  const mode = route.params?.mode ?? 'question';
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  // Optimized text change handler to prevent re-render issues
  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
  }, []);

  const handleLinkChange = useCallback((newLink: string) => {
    setLinkUrl(newLink);
  }, []);

  const pickImage = async () => {
    try {
      console.log('🔄 Starting compose image picker for platform:', Platform.OS);
      
      if (Platform.OS === 'web') {
        // Web implementation using HTML file input
        console.log('🌐 Creating web file input...');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        return new Promise<void>((resolve, reject) => {
          input.onchange = async (event: any) => {
            console.log('🌐 Web file input change event triggered');
            const file = event.target.files?.[0];
            console.log('🌐 Selected file:', file ? { name: file.name, size: file.size, type: file.type } : 'No file');
            if (file) {
              try {
                console.log('🔄 Converting web compose image to base64...');
                
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (typeof reader.result === 'string') {
                    console.log('✅ Web compose image base64 conversion successful');
                    setAttachedImages(prev => [...prev, reader.result as string]);
                    console.log('📎 Web compose image attached:', reader.result.substring(0, 50) + '...');
                    resolve();
                  } else {
                    reject(new Error('Failed to convert to base64'));
                  }
                };
                reader.onerror = () => reject(new Error('FileReader error'));
                reader.readAsDataURL(file);
              } catch (e: any) {
                console.error('❌ Web compose image conversion failed:', e);
                Alert.alert('Upload failed', e?.message ?? 'Could not process image');
                reject(e);
              }
            } else {
              resolve(); // User canceled
            }
          };
          
          input.oncancel = () => {
            console.log('🌐 Web file input canceled');
            resolve();
          };
          
          console.log('🌐 Clicking file input...');
          input.click();
          console.log('🌐 File input clicked');
        });
      } else {
        // Mobile implementation using expo-image-picker
        console.log('📱 Starting mobile image picker...');
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('📱 Mobile permissions status:', status);
        if (status !== 'granted') {
          console.log('❌ Mobile permissions denied');
          Alert.alert('Permission needed', 'Please grant photo library access to attach images.');
          return;
        }

        console.log('📱 Launching mobile image library...');
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
        
        console.log('📱 Mobile image picker result:', {
          canceled: result.canceled,
          hasAssets: !!result.assets,
          assetCount: result.assets?.length || 0
        });

        if (!result.canceled && result.assets[0]) {
          console.log('🔄 Converting mobile compose image to base64...', {
            originalUri: result.assets[0].uri,
            width: result.assets[0].width,
            height: result.assets[0].height,
            fileSize: result.assets[0].fileSize
          });
          
          try {
            // Convert to base64 for consistency
            const response = await fetch(result.assets[0].uri);
            console.log('📱 Mobile fetch response:', {
              ok: response.ok,
              status: response.status,
              type: response.type
            });
            
            const blob = await response.blob();
            console.log('📱 Mobile blob created:', {
              size: blob.size,
              type: blob.type
            });
            
            const base64Url = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                  console.log('✅ Mobile compose image base64 conversion successful:', {
                    resultLength: reader.result.length,
                    startsWithData: reader.result.startsWith('data:image/'),
                    mimeType: reader.result.split(';')[0]
                  });
                  resolve(reader.result);
                } else {
                  console.error('❌ Mobile FileReader result invalid:', typeof reader.result);
                  reject(new Error('Failed to convert to base64'));
                }
              };
              reader.onerror = (error) => {
                console.error('❌ Mobile FileReader error:', error);
                reject(new Error('FileReader error'));
              };
              reader.readAsDataURL(blob);
            });
            
            setAttachedImages(prev => {
              const newImages = [...prev, base64Url];
              console.log('📎 Mobile compose image attached:', {
                preview: base64Url.substring(0, 50) + '...',
                totalLength: base64Url.length,
                isValidBase64: base64Url.startsWith('data:image/'),
                previousCount: prev.length,
                newCount: newImages.length
              });
              return newImages;
            });
          } catch (error: any) {
            console.error('❌ Mobile image conversion failed:', error);
            Alert.alert('Error', 'Failed to process image: ' + (error?.message || 'Unknown error'));
          }
        }
      }
    } catch (e: any) {
      console.error('❌ Compose image picker failed:', e);
      Alert.alert('Upload failed', e?.message ?? 'Could not process image');
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Camera not available', 'Camera access is not available on web. Please use "Choose from Library" instead.');
      return;
    }
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Convert to base64 for consistency
      try {
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        
        const base64Url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('Failed to convert to base64'));
            }
          };
          reader.onerror = () => reject(new Error('FileReader error'));
          reader.readAsDataURL(blob);
        });
        
        setAttachedImages(prev => [...prev, base64Url]);
      } catch (e) {
        console.error('Camera image conversion failed:', e);
        // Fallback to original URI if conversion fails
        setAttachedImages(prev => [...prev, result.assets[0].uri]);
      }
    }
  };

  const removeImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const showImageOptions = () => {
    if (Platform.OS === 'web') {
      // On web, directly open file picker
      console.log('🌐 Web: Opening file picker directly');
      pickImage();
    } else {
      // On mobile, show options for camera or library
      Alert.alert(
        'Add Photo',
        'Choose an option',
        [
          { text: 'Camera', onPress: takePhoto },
          { text: 'Photo Library', onPress: pickImage },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleSubmit = async () => {
    const content = text.trim();
    if (!content) {
      Alert.alert('Please enter some text.');
      return;
    }
    
    if (mode === 'question' && content.length < 10) {
      Alert.alert('Please write at least 10 characters.');
      return;
    }
    
    if (mode === 'answer' && content.length < 5) {
      Alert.alert('Please write at least 5 characters.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (mode === 'question') {
        console.log('📝 Submitting question with images:', {
          contentLength: content.length,
          imageCount: attachedImages.length,
          hasImages: attachedImages.length > 0,
          firstImage: attachedImages[0] ? attachedImages[0].substring(0, 50) + '...' : 'No first image',
          allImages: attachedImages
        });
        
        const imagesToSend = attachedImages.length > 0 ? attachedImages : undefined;
        console.log('🚀 Calling addQuestion with images:', imagesToSend ? `${imagesToSend.length} images` : 'undefined');
        
        const q = await addQuestion(content, imagesToSend);
        navigation.navigate('Feed');
      } else {
        const qid = route.params?.questionId;
        if (!qid) {
          Alert.alert('Missing question context');
          return;
        }
        await addAnswer(qid, content);
        navigation.replace('Question', { id: qid });
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {mode === 'question' ? 'Ask a Question' : 'Write an Answer'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <TextInput
          key={`compose-input-${mode}`}
          multiline
          placeholder={mode === 'question' ? 'Describe your question in detail...' : 'Share your insights and help others...'}
          placeholderTextColor={theme.colors.subtext}
          value={text}
          onChangeText={handleTextChange}
          style={styles.input}
          maxLength={mode === 'question' ? 300 : 1000}
          textAlignVertical="top"
          autoFocus
          returnKeyType="default"
          blurOnSubmit={false}
          autoCorrect={true}
          autoCapitalize="sentences"
          keyboardType="default"
          scrollEnabled={false}
          selectTextOnFocus={false}
          clearTextOnFocus={false}
          editable={!isSubmitting}
        />
        
        <Text style={styles.characterCount}>
          {text.length}/{mode === 'question' ? 300 : 1000} characters
        </Text>

        {/* Attachment Actions */}
        <View style={styles.attachmentActions}>
          <TouchableOpacity 
            style={styles.attachmentButton} 
            onPress={showImageOptions}
          >
            <Ionicons name="camera" size={20} color={theme.colors.primary} />
            <Text style={styles.attachmentButtonText}>
              Photo
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.attachmentButton} 
            onPress={() => setShowLinkInput(!showLinkInput)}
          >
            <Ionicons name="link" size={20} color={theme.colors.primary} />
            <Text style={styles.attachmentButtonText}>Link</Text>
          </TouchableOpacity>
        </View>

        {/* Link Input */}
        {showLinkInput && (
          <View style={styles.linkInputContainer}>
            <TextInput
              placeholder="Enter URL (e.g., https://example.com)"
              placeholderTextColor={theme.colors.subtext}
              value={linkUrl}
              onChangeText={handleLinkChange}
              style={styles.linkInput}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            {linkUrl.length > 0 && (
              <TouchableOpacity 
                style={styles.removeLinkButton}
                onPress={() => {
                  setLinkUrl('');
                  setShowLinkInput(false);
                }}
              >
                <Ionicons name="close" size={16} color={theme.colors.subtext} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Attached Images */}
        {attachedImages.length > 0 && (
          <View style={styles.attachedImagesContainer}>
            <Text style={styles.attachedImagesTitle}>
              Attached Photos ({attachedImages.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
              {attachedImages.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.attachedImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={theme.colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (text.length < (mode === 'question' ? 10 : 5) || isSubmitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={text.length < (mode === 'question' ? 10 : 5) || isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>
              {mode === 'question' ? 'Post Question' : 'Post Answer'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

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
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  placeholder: {
    width: 40, // Same width as back button for centering
  },
  content: {
    flex: 1,
    padding: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.card,
    textAlignVertical: 'top',
    minHeight: 200,
  },
  characterCount: {
    fontSize: 12,
    color: theme.colors.subtext,
    textAlign: 'right',
    marginTop: 8,
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  attachmentActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  attachmentButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  linkInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  linkInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.colors.text,
  },
  removeLinkButton: {
    padding: 12,
  },
  attachedImagesContainer: {
    marginTop: 16,
  },
  attachedImagesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  imagesScroll: {
    flexDirection: 'row',
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  attachedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
});

export default ComposeScreen;
