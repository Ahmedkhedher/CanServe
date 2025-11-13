/**
 * Multi-API Key Gemini Service
 * Rotates between multiple API keys to handle rate limits and overload
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

interface ApiKeyConfig {
  key: string;
  name: string;
  requestCount: number;
  lastUsed: number;
  isBlocked: boolean;
  blockUntil: number;
}

interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  retryAttempts: number;
  baseDelay: number;
  keyRotationDelay: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  imageUri?: string;
  foodAnalysis?: any;
}

class GeminiMultiKeyService {
  private apiKeys: ApiKeyConfig[] = [];
  private currentKeyIndex: number = 0;
  private readonly TEXT_MODEL = 'gemini-2.5-flash';
  private readonly VISION_MODEL = 'gemini-2.5-flash';
  
  private rateLimitConfig: RateLimitConfig = {
    maxRequestsPerMinute: 15,
    maxRequestsPerHour: 100,
    retryAttempts: 3,
    baseDelay: 2000,
    keyRotationDelay: 5000 // 5 seconds between key switches
  };

  constructor(apiKeys: string[]) {
    this.initializeApiKeys(apiKeys);
  }

  /**
   * Initialize API keys with tracking data
   */
  private initializeApiKeys(keys: string[]): void {
    this.apiKeys = keys.map((key, index) => ({
      key,
      name: `Key-${index + 1}`,
      requestCount: 0,
      lastUsed: 0,
      isBlocked: false,
      blockUntil: 0
    }));
    
    console.log(`🔑 Initialized ${this.apiKeys.length} API keys for rotation`);
  }

  /**
   * Get the next available API key
   */
  private getNextAvailableKey(): ApiKeyConfig | null {
    const now = Date.now();
    
    // Unblock keys that have waited long enough
    this.apiKeys.forEach(keyConfig => {
      if (keyConfig.isBlocked && now > keyConfig.blockUntil) {
        keyConfig.isBlocked = false;
        keyConfig.requestCount = 0;
        console.log(`🔓 ${keyConfig.name} unblocked and reset`);
      }
    });

    // Find next available key
    for (let i = 0; i < this.apiKeys.length; i++) {
      const keyIndex = (this.currentKeyIndex + i) % this.apiKeys.length;
      const keyConfig = this.apiKeys[keyIndex];
      
      if (!keyConfig.isBlocked && this.canUseKey(keyConfig)) {
        this.currentKeyIndex = keyIndex;
        return keyConfig;
      }
    }

    // If no keys available, return the least recently used one
    const sortedKeys = [...this.apiKeys].sort((a, b) => a.lastUsed - b.lastUsed);
    return sortedKeys[0];
  }

  /**
   * Check if a key can be used based on rate limits
   */
  private canUseKey(keyConfig: ApiKeyConfig): boolean {
    const now = Date.now();
    const timeSinceLastUse = now - keyConfig.lastUsed;
    
    // Enforce minimum delay between requests for same key
    return timeSinceLastUse >= this.rateLimitConfig.keyRotationDelay;
  }

  /**
   * Mark a key as blocked due to rate limiting
   */
  private blockKey(keyConfig: ApiKeyConfig, duration: number = 60000): void {
    keyConfig.isBlocked = true;
    keyConfig.blockUntil = Date.now() + duration;
    console.log(`🚫 ${keyConfig.name} blocked for ${duration/1000}s due to rate limit`);
  }

  /**
   * Update key usage statistics
   */
  private updateKeyUsage(keyConfig: ApiKeyConfig): void {
    keyConfig.requestCount++;
    keyConfig.lastUsed = Date.now();
  }

  /**
   * Get fallback response for overload situations
   */
  private getFallbackResponse(userMessage: string): string {
    const fallbackResponses = [
      "All AI services are currently experiencing high demand. For cancer-related questions, please consult with your healthcare provider for personalized advice.",
      "The AI is temporarily overloaded across all servers. For urgent health concerns, please contact your doctor or a cancer helpline directly.",
      "Due to high usage on all AI services, I can't process requests right now. Please try again in a few minutes, or consult reliable cancer resources.",
      "All AI systems are busy. For immediate cancer support and information, consider visiting cancer.org or contacting your healthcare provider."
    ];

    // Context-aware fallbacks
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('food') || lowerMessage.includes('nutrition')) {
      return "All AI services are overloaded. For nutrition guidance: Focus on a balanced diet with fruits, vegetables, and lean proteins. Consult a nutritionist for personalized cancer nutrition advice.";
    }
    
    if (lowerMessage.includes('pain') || lowerMessage.includes('symptom')) {
      return "AI services are currently unavailable. For symptoms or pain management, please contact your healthcare provider immediately for proper evaluation and care.";
    }

    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  /**
   * Send message with multi-key rotation
   */
  async sendMessage(userMessage: string): Promise<string> {
    console.log('🤖 Multi-Key Gemini: Processing message...');

    for (let attempt = 0; attempt < this.rateLimitConfig.retryAttempts; attempt++) {
      const keyConfig = this.getNextAvailableKey();
      
      if (!keyConfig) {
        console.warn('⚠️ No API keys available');
        return this.getFallbackResponse(userMessage);
      }

      try {
        console.log(`🔄 Attempt ${attempt + 1} using ${keyConfig.name}`);
        
        const genAI = new GoogleGenerativeAI(keyConfig.key);
        const model = genAI.getGenerativeModel({ model: this.TEXT_MODEL });
        
        const systemContext = `You are a compassionate AI assistant for a cancer awareness app. Provide helpful, empathetic information. Keep responses concise and encourage professional medical consultation when appropriate.`;
        
        const prompt = `${systemContext}\n\nUser: ${userMessage}\n\nResponse:`;
        
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        // Update usage stats on success
        this.updateKeyUsage(keyConfig);
        
        console.log(`✅ Success with ${keyConfig.name} (${keyConfig.requestCount} requests)`);
        return response || 'I apologize, but I could not generate a response. Please try again.';
        
      } catch (error: any) {
        console.error(`❌ ${keyConfig.name} failed:`, error.message);
        
        // Check if it's a rate limit error
        if (error.message?.includes('429') || 
            error.message?.includes('quota') || 
            error.message?.includes('rate limit') ||
            error.message?.includes('overloaded')) {
          
          // Block this key temporarily
          this.blockKey(keyConfig, 60000); // Block for 1 minute
          
          // Try next key immediately
          continue;
        }
        
        // For other errors, wait before retry
        if (attempt < this.rateLimitConfig.retryAttempts - 1) {
          const delay = this.rateLimitConfig.baseDelay * Math.pow(2, attempt);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts failed
    console.warn('⚠️ All API keys and retries exhausted');
    return this.getFallbackResponse(userMessage);
  }

  /**
   * Send message with image using multi-key rotation
   */
  async sendMessageWithImage(userMessage: string, imageUrl: string): Promise<string> {
    console.log('🖼️ Multi-Key Gemini Vision: Processing image...');

    for (let attempt = 0; attempt < this.rateLimitConfig.retryAttempts; attempt++) {
      const keyConfig = this.getNextAvailableKey();
      
      if (!keyConfig) {
        return "All AI services are currently overloaded and can't analyze images. Please try again in a few minutes, or describe the food item for general nutritional guidance.";
      }

      try {
        console.log(`🔄 Image analysis attempt ${attempt + 1} using ${keyConfig.name}`);
        
        const genAI = new GoogleGenerativeAI(keyConfig.key);
        const model = genAI.getGenerativeModel({ model: this.VISION_MODEL });
        
        // Handle base64 images directly
        let imagePart;
        if (imageUrl.startsWith('data:image/')) {
          const base64Data = imageUrl.split(',')[1];
          const mimeType = imageUrl.split(';')[0].split(':')[1];
          
          imagePart = {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          };
        } else {
          // Handle URL images
          const imageResponse = await fetch(imageUrl);
          const imageBlob = await imageResponse.blob();
          const base64Data = await this.blobToBase64(imageBlob);
          const base64Image = base64Data.split(',')[1];
          
          imagePart = {
            inlineData: {
              data: base64Image,
              mimeType: imageBlob.type || 'image/jpeg'
            }
          };
        }
        
        const prompt = userMessage || "Analyze this food image and provide brief nutritional guidance for cancer patients.";
        
        const result = await model.generateContent([prompt, imagePart]);
        const response = result.response.text();
        
        // Update usage stats on success
        this.updateKeyUsage(keyConfig);
        
        console.log(`✅ Image analysis success with ${keyConfig.name}`);
        return response;
        
      } catch (error: any) {
        console.error(`❌ ${keyConfig.name} image analysis failed:`, error.message);
        
        if (error.message?.includes('429') || 
            error.message?.includes('quota') || 
            error.message?.includes('overloaded')) {
          
          this.blockKey(keyConfig, 60000);
          continue;
        }
        
        if (attempt < this.rateLimitConfig.retryAttempts - 1) {
          const delay = this.rateLimitConfig.baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return "All AI services are overloaded and can't analyze images right now. Please describe the food item, and I'll provide general nutritional guidance for cancer patients.";
  }

  /**
   * Convert blob to base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Get status of all API keys
   */
  getKeyStatus(): { keyName: string; requests: number; isBlocked: boolean; lastUsed: string }[] {
    return this.apiKeys.map(key => ({
      keyName: key.name,
      requests: key.requestCount,
      isBlocked: key.isBlocked,
      lastUsed: key.lastUsed ? new Date(key.lastUsed).toLocaleTimeString() : 'Never'
    }));
  }

  /**
   * Reset all keys (useful for testing)
   */
  resetAllKeys(): void {
    this.apiKeys.forEach(key => {
      key.requestCount = 0;
      key.isBlocked = false;
      key.blockUntil = 0;
      key.lastUsed = 0;
    });
    console.log('🔄 All API keys reset');
  }
}

// Initialize with your API keys
const API_KEYS = [
  'AIzaSyAQrXYke4ORHRG32Jy_zHUUAsKjL-cGlBc', // Key 1
  'AIzaSyBTeu1xb7kHHNUskM4QCYnf9Iv4rPIZNWM', // Key 2
  'AIzaSyBAdLsY1Gd5wzoAbf0p2NBcoJ8SZNpXb2M'  // Key 3
];

// Export multi-key service
export const geminiMultiKey = new GeminiMultiKeyService(API_KEYS);

export const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
