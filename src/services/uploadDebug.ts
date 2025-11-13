/**
 * Debug upload functionality
 */

import { uploadImageSimple } from './simpleFirebaseStorage';
import * as ImagePicker from 'expo-image-picker';

export async function debugUpload(): Promise<void> {
  try {
    console.log('🔍 Starting upload debug...');
    
    // Test 1: Check permissions
    console.log('📋 Checking permissions...');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log('📋 Permission status:', perm.status);
    
    if (perm.status !== 'granted') {
      console.error('❌ Permission denied');
      return;
    }
    
    // Test 2: Try to pick image
    console.log('📷 Launching image picker...');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });
    
    console.log('📷 Image picker result:', {
      canceled: result.canceled,
      hasAssets: !!result.assets,
      assetsLength: result.assets?.length,
      firstAssetUri: result.assets?.[0]?.uri
    });
    
    if (result.canceled || !result.assets?.[0]?.uri) {
      console.log('📷 No image selected');
      return;
    }
    
    // Test 3: Try upload
    const imageUri = result.assets[0].uri;
    console.log('⬆️ Attempting upload...', imageUri);
    
    const uploadResult = await uploadImageSimple(imageUri, 'debug', `debug-${Date.now()}.jpg`);
    
    console.log('✅ Upload successful!', {
      method: uploadResult.method,
      urlLength: uploadResult.url.length,
      isBase64: uploadResult.url.startsWith('data:')
    });
    
  } catch (error: any) {
    console.error('❌ Debug upload failed:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }
}

export async function testBase64Upload(): Promise<void> {
  try {
    console.log('🧪 Testing base64 upload...');
    
    // Create a simple test image (1x1 pixel red dot)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    const result = await uploadImageSimple(testImageBase64, 'test', 'test.png');
    
    console.log('✅ Base64 test successful!', {
      method: result.method,
      urlLength: result.url.length
    });
    
  } catch (error: any) {
    console.error('❌ Base64 test failed:', error);
  }
}
