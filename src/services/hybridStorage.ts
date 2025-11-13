/**
 * Hybrid Storage Service
 * Tries MinIO first, falls back to a simple base64 solution if MinIO fails
 * This ensures the app works even when MinIO is not accessible
 */

import { uploadImage as uploadToMinio } from './minioStorage';

export interface UploadResult {
  url: string;
  method: 'minio' | 'base64';
}

/**
 * Convert image to base64 data URL for local storage/display
 */
async function convertToBase64(imageUri: string): Promise<string> {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(`Base64 conversion failed: ${error}`);
  }
}

/**
 * Test if MinIO is accessible
 */
async function testMinioConnection(): Promise<boolean> {
  try {
    // Try to reach the MinIO proxy health endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch('http://172.16.30.88:3001/health', {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('MinIO not accessible:', error);
    return false;
  }
}

/**
 * Upload image with automatic fallback
 * 1. Try MinIO first (if accessible)
 * 2. Fall back to base64 encoding for local display
 */
export async function uploadImageHybrid(
  imageUri: string,
  folder: string,
  filename: string
): Promise<UploadResult> {
  console.log('🔄 Starting hybrid upload...', { imageUri, folder, filename });

  // First, try MinIO
  try {
    console.log('🔄 Attempting MinIO upload...');
    const minioUrl = await uploadToMinio(imageUri, folder, filename);
    console.log('✅ MinIO upload successful:', minioUrl);
    
    return {
      url: minioUrl,
      method: 'minio'
    };
  } catch (minioError) {
    console.warn('⚠️ MinIO upload failed, trying fallback...', minioError);
    
    // Fallback to base64
    try {
      console.log('🔄 Converting to base64...');
      const base64Url = await convertToBase64(imageUri);
      console.log('✅ Base64 conversion successful');
      
      return {
        url: base64Url,
        method: 'base64'
      };
    } catch (base64Error) {
      console.error('❌ Both upload methods failed:', { minioError, base64Error });
      throw new Error(`Upload failed: MinIO (${minioError}) and Base64 (${base64Error})`);
    }
  }
}

/**
 * Check storage availability
 */
export async function checkStorageAvailability(): Promise<{
  minio: boolean;
  base64: boolean;
}> {
  const minioAvailable = await testMinioConnection();
  
  return {
    minio: minioAvailable,
    base64: true // Base64 is always available
  };
}

/**
 * Get storage status for debugging
 */
export async function getStorageStatus(): Promise<string> {
  const status = await checkStorageAvailability();
  
  if (status.minio) {
    return '✅ MinIO available - using cloud storage';
  } else {
    return '⚠️ MinIO unavailable - using local base64 storage';
  }
}
