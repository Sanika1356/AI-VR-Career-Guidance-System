import { authenticatedRequest, authenticatedResponse } from './auth';

export type ResumeOutputFocus =
  | 'role_fit'
  | 'ats_keywords'
  | 'skill_gaps'
  | 'writing_improvements'
  | 'interview_prep'
  | 'learning_plan';

export interface ResumeCategoryDetail {
  score: number | null;
  tips: string[];
}

export interface ResumeAnalysis {
  overallScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  summary: string;
  roleFit: string;
  atsKeywords: string[];
  priorityActions: string[];
  interviewTopics: string[];
  learningPlan: string[];
  categoryBreakdown: {
    ats: ResumeCategoryDetail;
    toneAndStyle: ResumeCategoryDetail;
    content: ResumeCategoryDetail;
    structure: ResumeCategoryDetail;
    skills: ResumeCategoryDetail;
  };
  preferredOutputs: ResumeOutputFocus[];
  provider: 'gemini' | 'groq' | 'ollama' | 'custom' | 'none' | 'puter';
}

export interface ResumeAnalysisResponse {
  analysisId: string;
  fileName: string;
  companyName: string;
  jobRole: string;
  analysis: ResumeAnalysis;
  analyzedAt: string;
}

export interface ResumeAnalysisHistoryItem {
  id: string;
  fileName: string;
  companyName: string;
  jobRole: string;
  overallScore: number;
  status: 'completed';
  analyzedAt: string;
}

export async function listResumeAnalyses(): Promise<{ analyses: ResumeAnalysisHistoryItem[] }> {
  return authenticatedRequest<{ analyses: ResumeAnalysisHistoryItem[] }>('/resume/analyses');
}

export async function getResumeAnalysis(id: string): Promise<ResumeAnalysisResponse> {
  return authenticatedRequest<ResumeAnalysisResponse>(`/resume/analyses/${encodeURIComponent(id)}`);
}

export async function deleteResumeAnalysis(id: string): Promise<void> {
  await authenticatedResponse(`/resume/analyses/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function persistPuterResumeAnalysis(input: {
  companyName: string;
  jobRole: string;
  preferredOutputs?: ResumeOutputFocus[];
  fileName: string;
  analysis: ResumeAnalysis;
}): Promise<ResumeAnalysisResponse> {
  const response = await authenticatedResponse('/resume/analyses/puter', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  return response.json() as Promise<ResumeAnalysisResponse>;
}

export async function analyzeResume(input: {
  companyName: string;
  jobRole: string;
  jobDescription: string;
  preferredOutputs: ResumeOutputFocus[];
  file: File;
}): Promise<ResumeAnalysisResponse> {
  const formData = new FormData();
  formData.append('companyName', input.companyName);
  formData.append('jobRole', input.jobRole);
  formData.append('jobDescription', input.jobDescription);
  formData.append('preferredOutputs', JSON.stringify(input.preferredOutputs));
  formData.append('resume', input.file, input.file.name);

  const response = await authenticatedResponse('/resume/analyze', {
    method: 'POST',
    body: formData,
  });
  return response.json() as Promise<ResumeAnalysisResponse>;
}
