/**
 * Enhanced Gemini AI Service with Overload Protection
 * Handles rate limits, retries, and provides fallback responses
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Rate limiting configuration
interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  retryAttempts: number;
  baseDelay: number; // milliseconds
}

interface RequestLog {
  timestamp: number;
  count: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  imageUri?: string;
  foodAnalysis?: any;
}

class GeminiWithRetryService {
  private genAI: GoogleGenerativeAI;
  private readonly TEXT_MODEL = 'gemini-1.5-flash'; // More stable model
  private readonly VISION_MODEL = 'gemini-1.5-flash';
  
  // Rate limiting
  private rateLimitConfig: RateLimitConfig = {
    maxRequestsPerMinute: 15, // Conservative limit
    maxRequestsPerHour: 100,
    retryAttempts: 3,
    baseDelay: 2000 // 2 seconds
  };
  
  private requestLog: RequestLog[] = [];
  private lastRequestTime: number = 0;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Check if we're within rate limits
   */
  private isWithinRateLimit(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    // Clean old logs
    this.requestLog = this.requestLog.filter(log => log.timestamp > oneHourAgo);

    // Count recent requests
    const recentMinute = this.requestLog.filter(log => log.timestamp > oneMinuteAgo).length;
    const recentHour = this.requestLog.length;

    return recentMinute < this.rateLimitConfig.maxRequestsPerMinute && 
           recentHour < this.rateLimitConfig.maxRequestsPerHour;
  }

  /**
   * Add request to log
   */
  private logRequest(): void {
    this.requestLog.push({
      timestamp: Date.now(),
      count: 1
    });
  }

  /**
   * Wait between requests to avoid overload
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1000; // Minimum 1 second between requests

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Exponential backoff delay
   */
  private async exponentialBackoff(attempt: number): Promise<void> {
    const delay = this.rateLimitConfig.baseDelay * Math.pow(2, attempt);
    console.log(`⏳ Retry attempt ${attempt + 1}, waiting ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Get fallback response for overload situations
   */
  private getFallbackResponse(userMessage: string): string {
    const fallbackResponses = [
      "I'm experiencing high demand right now. Here's some general guidance: For cancer-related questions, please consult with your healthcare provider for personalized advice.",
      "The AI service is temporarily busy. In the meantime, consider reaching out to cancer support organizations or your medical team for immediate assistance.",
      "I'm currently overloaded with requests. For urgent health concerns, please contact your doctor or a cancer helpline directly.",
      "Due to high usage, I can't process your request right now. Please try again in a few minutes, or consult reliable cancer resources like the American Cancer Society.",
      "The AI is temporarily unavailable due to high demand. For cancer support and information, consider visiting cancer.org or contacting your healthcare provider."
    ];

    // Simple keyword matching for more relevant fallbacks
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('food') || lowerMessage.includes('nutrition')) {
      return "I'm currently overloaded, but here's general advice: Focus on a balanced diet with plenty of fruits, vegetables, and lean proteins. Consult a nutritionist for personalized cancer nutrition guidance.";
    }
    
    if (lowerMessage.includes('pain') || lowerMessage.includes('symptom')) {
      return "I'm experiencing high demand right now. For symptoms or pain management, please contact your healthcare provider immediately for proper evaluation and care.";
    }

    // Return random fallback
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  /**
   * Send message with retry logic and overload protection
   */
  async sendMessage(userMessage: string): Promise<string> {
    console.log('🤖 Gemini: Processing message with overload protection...');

    // Check rate limits first
    if (!this.isWithinRateLimit()) {
      console.warn('⚠️ Rate limit exceeded, using fallback response');
      return this.getFallbackResponse(userMessage);
    }

    for (let attempt = 0; attempt < this.rateLimitConfig.retryAttempts; attempt++) {
      try {
        // Wait between requests
        await this.waitForRateLimit();
        
        // Log the request
        this.logRequest();

        console.log(`🔄 Attempt ${attempt + 1}/${this.rateLimitConfig.retryAttempts}`);
        
        const model = this.genAI.getGenerativeModel({ model: this.TEXT_MODEL });
        
        const systemContext = `You are a compassionate AI assistant for a cancer awareness app. Provide helpful, empathetic information. Keep responses concise and encourage professional medical consultation when appropriate.`;
        
        const prompt = `${systemContext}\n\nUser: ${userMessage}\n\nResponse:`;
        
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        console.log('✅ Gemini: Response received successfully');
        return response || 'I apologize, but I could not generate a response. Please try again.';
        
      } catch (error: any) {
        console.error(`❌ Attempt ${attempt + 1} failed:`, error.message);
        
        // Check if it's a rate limit or overload error
        if (error.message?.includes('429') || 
            error.message?.includes('quota') || 
            error.message?.includes('rate limit') ||
            error.message?.includes('overloaded')) {
          
          if (attempt < this.rateLimitConfig.retryAttempts - 1) {
            await this.exponentialBackoff(attempt);
            continue;
          } else {
            console.warn('⚠️ All retry attempts failed due to overload, using fallback');
            return this.getFallbackResponse(userMessage);
          }
        }
        
        // For other errors, retry with backoff
        if (attempt < this.rateLimitConfig.retryAttempts - 1) {
          await this.exponentialBackoff(attempt);
        } else {
          // Final fallback
          return this.getFallbackResponse(userMessage);
        }
      }
    }

    // Should never reach here, but just in case
    return this.getFallbackResponse(userMessage);
  }

  /**
   * Send message with image (with overload protection)
   */
  async sendMessageWithImage(userMessage: string, imageUrl: string): Promise<string> {
    console.log('🖼️ Gemini Vision: Processing image with overload protection...');

    // Check rate limits
    if (!this.isWithinRateLimit()) {
      console.warn('⚠️ Rate limit exceeded for image analysis');
      return "I'm currently experiencing high demand and can't analyze images right now. Please try again in a few minutes, or describe the food item for general nutritional guidance.";
    }

    for (let attempt = 0; attempt < this.rateLimitConfig.retryAttempts; attempt++) {
      try {
        await this.waitForRateLimit();
        this.logRequest();

        console.log(`🔄 Image analysis attempt ${attempt + 1}/${this.rateLimitConfig.retryAttempts}`);
        
        const model = this.genAI.getGenerativeModel({ model: this.VISION_MODEL });
        
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
        
        console.log('✅ Gemini Vision: Analysis complete');
        return response;
        
      } catch (error: any) {
        console.error(`❌ Image analysis attempt ${attempt + 1} failed:`, error.message);
        
        if (error.message?.includes('429') || 
            error.message?.includes('quota') || 
            error.message?.includes('overloaded')) {
          
          if (attempt < this.rateLimitConfig.retryAttempts - 1) {
            await this.exponentialBackoff(attempt);
            continue;
          } else {
            return "I'm currently overloaded and can't analyze images. Please describe the food item, and I'll provide general nutritional guidance for cancer patients.";
          }
        }
        
        if (attempt < this.rateLimitConfig.retryAttempts - 1) {
          await this.exponentialBackoff(attempt);
        } else {
          return "I'm having trouble analyzing the image right now. Please try again later or describe the food for general guidance.";
        }
      }
    }

    return "Image analysis is temporarily unavailable due to high demand. Please try again in a few minutes.";
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
   * Get current rate limit status
   */
  getRateLimitStatus(): { requestsThisMinute: number; requestsThisHour: number; canMakeRequest: boolean } {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    const requestsThisMinute = this.requestLog.filter(log => log.timestamp > oneMinuteAgo).length;
    const requestsThisHour = this.requestLog.filter(log => log.timestamp > oneHourAgo).length;

    return {
      requestsThisMinute,
      requestsThisHour,
      canMakeRequest: this.isWithinRateLimit()
    };
  }
}

// Export enhanced service
export const geminiWithRetry = new GeminiWithRetryService('AIzaSyAQrXYke4ORHRG32Jy_zHUUAsKjL-cGlBc');

export const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
