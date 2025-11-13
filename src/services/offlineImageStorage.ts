/**
 * Completely Offline Image Storage
 * No network calls, no server dependencies, 100% reliable
 */

export interface OfflineUploadResult {
  url: string;
  method: 'base64';
  success: boolean;
}

/**
 * Convert image to base64 with no network calls
 */
async function imageToBase64Offline(imageUri: string): Promise<string> {
  console.log('🔄 Converting image to base64 (offline)...', imageUri);
  
  try {
    // If already base64, return as-is
    if (imageUri.startsWith('data:image/')) {
      console.log('✅ Image already in base64 format');
      return imageUri;
    }
    
    // Use fetch to read local file (no network call for file:// URIs)
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Convert blob to base64 using FileReader (pure client-side)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          console.log('✅ Base64 conversion successful (offline)');
          resolve(reader.result);
        } else {
          reject(new Error('FileReader returned non-string result'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
  } catch (error: any) {
    console.error('❌ Offline base64 conversion failed:', error);
    throw new Error(`Offline conversion failed: ${error.message}`);
  }
}

/**
 * Upload image with guaranteed offline processing
 * No server calls, no network dependencies
 */
export async function uploadImageOffline(
  imageUri: string,
  folder?: string,
  filename?: string
): Promise<OfflineUploadResult> {
  console.log('🔄 Starting guaranteed offline upload...', { imageUri, folder, filename });

  try {
    const base64Url = await imageToBase64Offline(imageUri);
    
    console.log('✅ Offline upload successful - no server calls made');
    return {
      url: base64Url,
      method: 'base64',
      success: true
    };
  } catch (error: any) {
    console.error('❌ Offline upload failed:', error);
    
    // Return a minimal 1x1 transparent pixel as absolute fallback
    console.log('🔄 Using emergency fallback image...');
    return {
      url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      method: 'base64',
      success: false
    };
  }
}

/**
 * Check if URL is base64 encoded
 */
export function isBase64Image(url: string): boolean {
  return url.startsWith('data:image/');
}

/**
 * Get upload status message
 */
export function getOfflineUploadMessage(result: OfflineUploadResult): string {
  if (result.success) {
    return '📱 Image stored locally (no network required)';
  } else {
    return '⚠️ Using placeholder image (conversion failed)';
  }
}
