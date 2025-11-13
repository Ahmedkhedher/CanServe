import { submissionService } from '../SubmissionService';

// Mock Firebase
jest.mock('../../firebase/app', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null
    }
  }
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  increment: jest.fn(),
  serverTimestamp: jest.fn(),
  runTransaction: jest.fn()
}));

describe('SubmissionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateQuestion', () => {
    it('should validate question successfully', async () => {
      const result = await submissionService.validateQuestion('What are the early signs of cancer?');
      expect(result.success).toBe(true);
      expect(result.validationErrors).toBeUndefined();
    });

    it('should fail validation for short question', async () => {
      const result = await submissionService.validateQuestion('Short?');
      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors?.title).toContain('at least 10 characters');
    });

    it('should fail validation for non-question format', async () => {
      const result = await submissionService.validateQuestion('This is just a statement without question format');
      expect(result.success).toBe(false);
      expect(result.validationErrors?.title).toContain('phrased as a question');
    });
  });

  describe('validateAnswer', () => {
    it('should validate answer successfully', async () => {
      const result = await submissionService.validateAnswer('This is a helpful answer with good content.');
      expect(result.success).toBe(true);
      expect(result.validationErrors).toBeUndefined();
    });

    it('should fail validation for short answer', async () => {
      const result = await submissionService.validateAnswer('No');
      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors?.body).toContain('at least 5 characters');
    });

    it('should fail validation for empty answer', async () => {
      const result = await submissionService.validateAnswer('');
      expect(result.success).toBe(false);
      expect(result.validationErrors?.body).toContain('required');
    });
  });
});
