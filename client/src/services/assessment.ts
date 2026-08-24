import { authenticatedRequest } from './auth';
import type {
  AssessmentQuestionSet,
  NextAssessmentQuestionResponse,
  AssessmentResultResponse,
  AssessmentSubmission,
} from '../types/domain';

export function getAssessmentQuestions(): Promise<AssessmentQuestionSet> {
  return authenticatedRequest<AssessmentQuestionSet>('/assessment/questions');
}

export function getNextAssessmentQuestion(
  assessmentId: string,
  answeredQuestionIds: string[] = [],
): Promise<NextAssessmentQuestionResponse> {
  const params = new URLSearchParams({ assessmentId });
  if (answeredQuestionIds.length > 0) {
    params.set('answeredQuestionIds', answeredQuestionIds.join(','));
  }
  return authenticatedRequest<NextAssessmentQuestionResponse>(
    `/assessment/next?${params.toString()}`,
  );
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
