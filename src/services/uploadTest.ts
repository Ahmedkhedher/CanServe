/**
 * Simple test to verify upload functionality
 */

import { uploadImageSimple } from './simpleFirebaseStorage';

export async function testUpload(): Promise<void> {
  try {
    console.log('🧪 Testing upload functionality...');
    
    // Create a simple test image data URL
    const testImageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const result = await uploadImageSimple(testImageDataUrl, 'test', 'test-image.png');
    
    console.log('✅ Upload test successful:', {
      method: result.method,
      urlLength: result.url.length,
      isBase64: result.url.startsWith('data:')
    });
    
    return;
  } catch (error) {
    console.error('❌ Upload test failed:', error);
    throw error;
  }
}
