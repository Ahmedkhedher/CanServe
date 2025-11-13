import { Alert } from 'react-native';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  increment, 
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase/app';
import { UserRef, Question, Answer } from '../data/store';

// Submission states
export enum SubmissionState {
  IDLE = 'idle',
  VALIDATING = 'validating',
  SUBMITTING = 'submitting',
  SUCCESS = 'success',
  ERROR = 'error'
}

// Submission types
export enum SubmissionType {
  QUESTION = 'question',
  ANSWER = 'answer'
}

// Validation rules
interface ValidationRule {
  field: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  pattern?: RegExp;
  customValidator?: (value: any) => string | null;
}

// Submission result
export interface SubmissionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string>;
}

// Submission options
export interface SubmissionOptions {
  showSuccessAlert?: boolean;
  showErrorAlert?: boolean;
  customSuccessMessage?: string;
  customErrorMessage?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  validateOnly?: boolean;
}

class SubmissionService {
  private validationRules: Record<string, ValidationRule[]> = {
    question: [
      {
        field: 'title',
        required: true,
        minLength: 10,
        maxLength: 300,
        customValidator: (value: string) => {
          if (!value.includes('?') && !value.toLowerCase().includes('how') && 
              !value.toLowerCase().includes('what') && !value.toLowerCase().includes('why')) {
            return 'Question should be phrased as a question';
          }
          return null;
        }
      }
    ],
    answer: [
      {
        field: 'body',
        required: true,
        minLength: 5,
        maxLength: 1000
      }
    ]
  };

  /**
   * Get current authenticated user
   */
  private getCurrentUser(): UserRef {
    const u = auth?.currentUser;
    const name = u?.displayName || u?.email || 'User';
    const photoURL = u?.photoURL || undefined;
    return { id: u?.uid || 'anon', name, photoURL };
  }

  /**
   * Enrich user with profile data
   */
  private async enrichUserProfile(user: UserRef): Promise<UserRef> {
    if (!db || user.id === 'anon') return user;

    try {
      const prof = await getDoc(doc(db, 'users', user.id));
      const profileData = prof.exists() ? prof.data() : null;
      
      if (profileData) {
        // Only add fields if they have actual values (not undefined)
        if (profileData.cancerType) (user as any).cancerType = profileData.cancerType;
        if (profileData.stage) (user as any).stage = profileData.stage;
        if (typeof profileData.age === 'number') (user as any).age = profileData.age;
      }
    } catch (error) {
      console.warn('Could not fetch user profile:', error);
    }

    return user;
  }

  /**
   * Validate submission data
   */
  private validateSubmission(type: string, data: any): Record<string, string> {
    const rules = this.validationRules[type] || [];
    const errors: Record<string, string> = {};

    for (const rule of rules) {
      const value = data[rule.field];

      // Required field check
      if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
        errors[rule.field] = `${rule.field} is required`;
        continue;
      }

      // Skip other validations if field is empty and not required
      if (!value) continue;

      const stringValue = typeof value === 'string' ? value.trim() : String(value);

      // Length validations
      if (rule.minLength && stringValue.length < rule.minLength) {
        errors[rule.field] = `${rule.field} must be at least ${rule.minLength} characters`;
      }

      if (rule.maxLength && stringValue.length > rule.maxLength) {
        errors[rule.field] = `${rule.field} must be no more than ${rule.maxLength} characters`;
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(stringValue)) {
        errors[rule.field] = `${rule.field} format is invalid`;
      }

      // Custom validation
      if (rule.customValidator) {
        const customError = rule.customValidator(stringValue);
        if (customError) {
          errors[rule.field] = customError;
        }
      }
    }

    return errors;
  }

  /**
   * Check if user is authenticated
   */
  private checkAuthentication(): boolean {
    return auth?.currentUser != null;
  }

  /**
   * Submit a question
   */
  async submitQuestion(title: string, options: SubmissionOptions = {}): Promise<SubmissionResult<Question>> {
    console.log('SubmissionService: submitQuestion called', { titleLength: title.length });

    try {
      // Authentication check
      if (!this.checkAuthentication()) {
        const error = 'Please log in to post a question';
        if (options.showErrorAlert !== false) {
          Alert.alert('Authentication Required', error);
        }
        options.onError?.(error);
        return { success: false, error };
      }

      // Validation
      const validationErrors = this.validateSubmission('question', { title });
      if (Object.keys(validationErrors).length > 0) {
        const firstError = Object.values(validationErrors)[0];
        if (options.showErrorAlert !== false) {
          Alert.alert('Validation Error', firstError);
        }
        options.onError?.(firstError);
        return { success: false, error: firstError, validationErrors };
      }

      if (options.validateOnly) {
        return { success: true };
      }

      // Firebase check
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      // Get and enrich user
      let author = this.getCurrentUser();
      author = await this.enrichUserProfile(author);

      // Prepare data
      const questionData = {
        title: title.trim(),
        author,
        topic: 'General',
        excerpt: title.trim().slice(0, 140),
        upvotes: 0,
        answersCount: 0,
        createdAt: serverTimestamp(),
      };

      console.log('SubmissionService: Adding question to Firestore', questionData);

      // Submit to Firestore
      const ref = await addDoc(collection(db, 'questions'), questionData);
      const question: Question = { id: ref.id, ...questionData } as Question;

      console.log('SubmissionService: Question submitted successfully', { id: ref.id });

      // Success handling
      const successMessage = options.customSuccessMessage || 'Your question has been posted!';
      if (options.showSuccessAlert !== false) {
        Alert.alert('Success', successMessage);
      }
      options.onSuccess?.(question);

      return { success: true, data: question };

    } catch (error: any) {
      console.error('SubmissionService: Error submitting question:', error);
      const errorMessage = options.customErrorMessage || error?.message || 'Failed to post question';
      
      if (options.showErrorAlert !== false) {
        Alert.alert('Error', errorMessage);
      }
      options.onError?.(errorMessage);

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Submit an answer
   */
  async submitAnswer(questionId: string, body: string, options: SubmissionOptions = {}): Promise<SubmissionResult<Answer>> {
    console.log('SubmissionService: submitAnswer called', { questionId, bodyLength: body.length });

    try {
      // Authentication check
      if (!this.checkAuthentication()) {
        const error = 'Please log in to post an answer';
        if (options.showErrorAlert !== false) {
          Alert.alert('Authentication Required', error);
        }
        options.onError?.(error);
        return { success: false, error };
      }

      // Validation
      const validationErrors = this.validateSubmission('answer', { body });
      if (Object.keys(validationErrors).length > 0) {
        const firstError = Object.values(validationErrors)[0];
        if (options.showErrorAlert !== false) {
          Alert.alert('Validation Error', firstError);
        }
        options.onError?.(firstError);
        return { success: false, error: firstError, validationErrors };
      }

      if (options.validateOnly) {
        return { success: true };
      }

      // Firebase check
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      // Get and enrich user
      let author = this.getCurrentUser();
      author = await this.enrichUserProfile(author);

      // Prepare answer data
      const answerData = {
        questionId,
        author,
        body: body.trim(),
        upvotes: 0,
        createdAt: serverTimestamp(),
      };

      console.log('SubmissionService: Adding answer to Firestore', answerData);

      // Add answer
      const answerRef = await addDoc(collection(db, 'answers'), answerData);
      console.log('SubmissionService: Answer added with ID:', answerRef.id);
      
      // Update question answer count
      const questionRef = doc(db, 'questions', questionId);
      await updateDoc(questionRef, { answersCount: increment(1) });
      console.log('SubmissionService: Question answer count incremented');

      const result = { id: answerRef.id, ...answerData } as Answer;

      console.log('SubmissionService: Answer submitted successfully', { id: result.id });

      // Success handling
      const successMessage = options.customSuccessMessage || 'Your answer has been posted!';
      if (options.showSuccessAlert !== false) {
        Alert.alert('Success', successMessage);
      }
      options.onSuccess?.(result);

      return { success: true, data: result };

    } catch (error: any) {
      console.error('SubmissionService: Error submitting answer:', error);
      const errorMessage = options.customErrorMessage || error?.message || 'Failed to post answer';
      
      if (options.showErrorAlert !== false) {
        Alert.alert('Error', errorMessage);
      }
      options.onError?.(errorMessage);

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Validate question without submitting
   */
  async validateQuestion(title: string): Promise<SubmissionResult> {
    return this.submitQuestion(title, { validateOnly: true, showSuccessAlert: false, showErrorAlert: false });
  }

  /**
   * Validate answer without submitting
   */
  async validateAnswer(body: string): Promise<SubmissionResult> {
    return this.submitAnswer('', body, { validateOnly: true, showSuccessAlert: false, showErrorAlert: false });
  }
}

// Export singleton instance
export const submissionService = new SubmissionService();
export default submissionService;
