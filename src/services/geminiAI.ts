// Gemini AI Service
// This service handles interactions with Google's Gemini AI API
import { GoogleGenerativeAI } from '@google/generative-ai';

// ⚠️ SECURITY WARNING: Your API key is visible in the code!
// For production, use environment variables. See GEMINI_AI_SETUP.md
const GEMINI_API_KEY = 'AIzaSyA1MStjl__YE2EsZeyIqoD3x60x4Ea99bU'; // Replace with your API key

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

  constructor(apiKey: string = GEMINI_API_KEY) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Send a message to Gemini AI and get a response
   */
  async sendMessage(userMessage: string): Promise<string> {
    try {
      // Get the generative model
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        systemInstruction: `You are a compassionate AI assistant for LifeWeaver, a cancer awareness and support app. 
Your role is to provide helpful, empathetic information about cancer awareness, support, and general health information.
You should be supportive, understanding, and encourage users to seek professional medical advice when appropriate.
IMPORTANT: Always remind users that you are not a substitute for professional medical advice, diagnosis, or treatment.`,
      });

      // Generate content
      const result = await model.generateContent(userMessage);
      const response = await result.response;
      const text = response.text();
      
      return text;
    } catch (error) {
      console.error('Gemini AI Error:', error);
      throw error;
    }
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
