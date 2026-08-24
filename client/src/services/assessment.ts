import { authenticatedRequest } from './auth';
import type {
  AssessmentQuestionSet,
  NextAssessmentQuestionResponse,
  AssessmentResultResponse,
  AssessmentRetakeComparisonResponse,
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

export function getAssessmentRetakeComparison(
  currentResultId: string,
  previousResultId: string,
): Promise<AssessmentRetakeComparisonResponse> {
  const query = new URLSearchParams({ previousResultId });
  return authenticatedRequest<AssessmentRetakeComparisonResponse>(
    `/assessment/results/${encodeURIComponent(currentResultId)}/comparison?${query.toString()}`,
  );
}
