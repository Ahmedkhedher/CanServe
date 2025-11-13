import { useState, useCallback } from 'react';
import { submissionService, SubmissionState, SubmissionType, SubmissionOptions, SubmissionResult } from '../services/SubmissionService';
import { Question, Answer } from '../data/store';

interface UseSubmissionState {
  state: SubmissionState;
  isSubmitting: boolean;
  error: string | null;
  validationErrors: Record<string, string>;
}

interface UseSubmissionActions {
  submitQuestion: (title: string, options?: SubmissionOptions) => Promise<SubmissionResult<Question>>;
  submitAnswer: (questionId: string, body: string, options?: SubmissionOptions) => Promise<SubmissionResult<Answer>>;
  validateQuestion: (title: string) => Promise<SubmissionResult>;
  validateAnswer: (body: string) => Promise<SubmissionResult>;
  reset: () => void;
  clearError: () => void;
}

export interface UseSubmissionReturn extends UseSubmissionState, UseSubmissionActions {}

/**
 * Hook for managing submission state and actions
 */
export function useSubmission(): UseSubmissionReturn {
  const [state, setState] = useState<SubmissionState>(SubmissionState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const isSubmitting = state === SubmissionState.SUBMITTING || state === SubmissionState.VALIDATING;

  const reset = useCallback(() => {
    setState(SubmissionState.IDLE);
    setError(null);
    setValidationErrors({});
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setValidationErrors({});
  }, []);

  const submitQuestion = useCallback(async (title: string, options: SubmissionOptions = {}): Promise<SubmissionResult<Question>> => {
    setState(SubmissionState.VALIDATING);
    setError(null);
    setValidationErrors({});

    try {
      setState(SubmissionState.SUBMITTING);
      
      const result = await submissionService.submitQuestion(title, {
        ...options,
        onSuccess: (data) => {
          setState(SubmissionState.SUCCESS);
          options.onSuccess?.(data);
        },
        onError: (errorMsg) => {
          setState(SubmissionState.ERROR);
          setError(errorMsg);
          options.onError?.(errorMsg);
        }
      });

      if (result.validationErrors) {
        setValidationErrors(result.validationErrors);
        setState(SubmissionState.ERROR);
      } else if (result.success) {
        setState(SubmissionState.SUCCESS);
      } else {
        setState(SubmissionState.ERROR);
        setError(result.error || 'Unknown error');
      }

      return result;
    } catch (err: any) {
      setState(SubmissionState.ERROR);
      const errorMsg = err?.message || 'Submission failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  const submitAnswer = useCallback(async (questionId: string, body: string, options: SubmissionOptions = {}): Promise<SubmissionResult<Answer>> => {
    setState(SubmissionState.VALIDATING);
    setError(null);
    setValidationErrors({});

    try {
      setState(SubmissionState.SUBMITTING);
      
      const result = await submissionService.submitAnswer(questionId, body, {
        ...options,
        onSuccess: (data) => {
          setState(SubmissionState.SUCCESS);
          options.onSuccess?.(data);
        },
        onError: (errorMsg) => {
          setState(SubmissionState.ERROR);
          setError(errorMsg);
          options.onError?.(errorMsg);
        }
      });

      if (result.validationErrors) {
        setValidationErrors(result.validationErrors);
        setState(SubmissionState.ERROR);
      } else if (result.success) {
        setState(SubmissionState.SUCCESS);
      } else {
        setState(SubmissionState.ERROR);
        setError(result.error || 'Unknown error');
      }

      return result;
    } catch (err: any) {
      setState(SubmissionState.ERROR);
      const errorMsg = err?.message || 'Submission failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  const validateQuestion = useCallback(async (title: string): Promise<SubmissionResult> => {
    setState(SubmissionState.VALIDATING);
    setError(null);
    setValidationErrors({});

    try {
      const result = await submissionService.validateQuestion(title);
      
      if (result.validationErrors) {
        setValidationErrors(result.validationErrors);
        setState(SubmissionState.ERROR);
      } else {
        setState(SubmissionState.IDLE);
      }

      return result;
    } catch (err: any) {
      setState(SubmissionState.ERROR);
      const errorMsg = err?.message || 'Validation failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  const validateAnswer = useCallback(async (body: string): Promise<SubmissionResult> => {
    setState(SubmissionState.VALIDATING);
    setError(null);
    setValidationErrors({});

    try {
      const result = await submissionService.validateAnswer(body);
      
      if (result.validationErrors) {
        setValidationErrors(result.validationErrors);
        setState(SubmissionState.ERROR);
      } else {
        setState(SubmissionState.IDLE);
      }

      return result;
    } catch (err: any) {
      setState(SubmissionState.ERROR);
      const errorMsg = err?.message || 'Validation failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  return {
    // State
    state,
    isSubmitting,
    error,
    validationErrors,
    
    // Actions
    submitQuestion,
    submitAnswer,
    validateQuestion,
    validateAnswer,
    reset,
    clearError,
  };
}

export default useSubmission;
