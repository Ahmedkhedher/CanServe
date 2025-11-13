import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Upload an image to Firebase Storage
 * @param imageUri - Local file URI from image picker
 * @param folder - Folder name (e.g., 'chat', 'profile', 'food-analysis')
 * @param filename - Custom filename (optional, will generate if not provided)
 * @returns Promise with download URL and storage path
 */
export async function uploadImageToFirebase(
  imageUri: string,
  folder: string,
  filename?: string
): Promise<string> {
  try {
    console.log('🔄 Starting Firebase upload...', { imageUri, folder, filename });

    // Generate filename if not provided
    if (!filename) {
      const timestamp = Date.now();
      const extension = imageUri.split('.').pop() || 'jpg';
      filename = `${timestamp}.${extension}`;
    }

    // Create storage reference
    const storageRef = ref(storage, `${folder}/${filename}`);

    // Read file as blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    console.log('📤 Uploading to Firebase Storage...', {
      path: `${folder}/${filename}`,
      size: blob.size,
      type: blob.type
    });

    // Upload file
    const snapshot = await uploadBytes(storageRef, blob);
    console.log('✅ Upload successful:', snapshot.metadata.fullPath);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('🔗 Download URL generated:', downloadURL);

    return downloadURL;
  } catch (error: any) {
    console.error('❌ Firebase upload error:', error);
    throw new Error(`Firebase upload failed: ${error.message}`);
  }
}

/**
 * Upload image with retry logic
 */
export async function uploadImageWithRetry(
  imageUri: string,
  folder: string,
  filename?: string,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Upload attempt ${attempt}/${maxRetries}`);
      return await uploadImageToFirebase(imageUri, folder, filename);
    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ Upload attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Check if Firebase Storage is available
 */
export async function checkFirebaseConnection(): Promise<boolean> {
  try {
    // Try to create a reference (doesn't require network)
    const testRef = ref(storage, 'test/connection-check.txt');
    console.log('✅ Firebase Storage connection available');
    return true;
  } catch (error) {
    console.error('❌ Firebase Storage connection failed:', error);
    return false;
  }
}
