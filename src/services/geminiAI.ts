// Google Gemini AI Service
// This service handles interactions with Google Gemini API
import { GoogleGenerativeAI } from '@google/generative-ai';

// ⚠️ SECURITY WARNING: Your API key is visible in the code!
// For production, use environment variables.
// Get your free API key at: https://makersuite.google.com/app/apikey
const GEMINI_API_KEY = 'AIzaSyAQrXYke4ORHRG32Jy_zHUUAsKjL-cGlBc'; // Replace with your Gemini API key

export interface FoodAnalysisData {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  recommended: 'yes' | 'no';
  healthNotes: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  imageUri?: string; // For food images uploaded by user
  foodAnalysis?: FoodAnalysisData; // For AI analysis of food images
}


class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private conversationHistory: ChatMessage[] = [];
  
  // ========================================
  // 🔧 AI MODEL CONFIGURATION
  // ========================================
  
  // Gemini Models (using Flash for cost efficiency):
  // - 'gemini-1.5-flash' (⚡ RECOMMENDED - Fast, cheap, text + vision)
  // - 'gemini-1.5-pro' (💎 Best quality but costs more)
  // - 'gemini-1.0-pro' (Older, text-only)
  
  // Using Flash for both to minimize costs while maintaining quality
  private readonly TEXT_MODEL = 'gemini-2.5-flash';
  private readonly VISION_MODEL = 'gemini-2.5-flash';

  constructor(apiKey: string = GEMINI_API_KEY) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Send a message to Gemini AI and get a response
   */
  async sendMessage(userMessage: string): Promise<string> {
    try {
      console.log('Gemini: Sending message:', userMessage);
      
      const model = this.genAI.getGenerativeModel({ model: this.TEXT_MODEL });
      
      // Add system context
      const systemContext = `You are a compassionate AI assistant for LifeWeaver, a cancer awareness and support app. Provide helpful, empathetic information about cancer awareness, support, and general health. Always encourage users to seek professional medical advice when appropriate.`;
      
      const prompt = `${systemContext}\n\nUser question: ${userMessage}\n\nProvide a helpful, caring response:`;
      
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      console.log('Gemini: Response received');
      return response || 'I apologize, but I could not generate a response. Please try again.';
    } catch (error: any) {
      console.error('Gemini AI Error:', error);
      throw new Error(error?.message || 'Failed to get AI response');
    }
  }

  /**
   * Send a message with an image to Gemini Vision API
   */
  async sendMessageWithImage(userMessage: string, imageUrl: string): Promise<string> {
    try {
      console.log('Gemini Vision: Processing image:', imageUrl);
      
      // Use Gemini Vision to analyze the food image
      const model = this.genAI.getGenerativeModel({ model: this.VISION_MODEL });
      
      // Fetch and convert image to base64
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      const base64Data = await this.blobToBase64(imageBlob);
      
      // Remove data URL prefix to get just base64 string
      const base64Image = base64Data.split(',')[1];
      
      // Create image part for Gemini
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: imageBlob.type || 'image/jpeg'
        }
      };
      
      // Use provided prompt or default fallback
      const prompt = userMessage || `Analyze this food and provide simple nutritional guidance for cancer patients.`;
      
      console.log('🔍 Gemini Vision: Analyzing food image...');
      const result = await model.generateContent([prompt, imagePart]);
      const response = result.response.text();
      
      console.log('✅ Gemini Vision: Analysis complete');
      return response;
    } catch (error: any) {
      console.error('❌ Gemini Vision Error:', error);
      throw new Error(error?.message || 'Failed to analyze image. Please try again.');
    }
  }

  /**
   * Convert blob to base64 string
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
   * Add a message to conversation history
   */
  addToHistory(message: ChatMessage) {
    this.conversationHistory.push(message);
  }

  /**
   * Get conversation history
   */
  getHistory(): ChatMessage[] {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Get suggested prompts for cancer awareness
   */
  getSuggestedPrompts(): string[] {
    return [
      'What are early warning signs of cancer?',
      'How can I support a loved one with cancer?',
      'What lifestyle changes can reduce cancer risk?',
      'Tell me about cancer screening guidelines',
      'How to cope with cancer diagnosis anxiety?',
      'What are common cancer treatment side effects?',
    ];
  }
}

// Export singleton instance
export const geminiAI = new GeminiAIService();

// Helper function to generate unique message ID
export const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
