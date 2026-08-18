import { authenticatedRequest } from './auth';
import type {
  AssessmentQuestionSet,
  AssessmentResultResponse,
  AssessmentSubmission,
} from '../types/domain';

export function getAssessmentQuestions(): Promise<AssessmentQuestionSet> {
  return authenticatedRequest<AssessmentQuestionSet>('/assessment/questions');
}

export function submitAssessment(input: AssessmentSubmission): Promise<AssessmentResultResponse> {
  return authenticatedRequest<AssessmentResultResponse>('/assessment/submit', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getAssessmentResult(resultId: string): Promise<AssessmentResultResponse> {
  return authenticatedRequest<AssessmentResultResponse>(`/assessment/results/${resultId}`);
}
