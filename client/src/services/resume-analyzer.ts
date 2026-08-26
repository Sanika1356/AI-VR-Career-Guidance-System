import { authenticatedRequest, authenticatedResponse } from './auth';

export interface ResumeAnalysis {
  overallScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  summary: string;
  provider: 'gemini' | 'groq' | 'ollama' | 'custom' | 'none';
}

export interface ResumeAnalysisResponse {
  analysisId: string;
  fileName: string;
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

export async function analyzeResume(input: {
  companyName: string;
  jobRole: string;
  jobDescription: string;
  file: File;
}): Promise<ResumeAnalysisResponse> {
  const formData = new FormData();
  formData.append('companyName', input.companyName);
  formData.append('jobRole', input.jobRole);
  formData.append('jobDescription', input.jobDescription);
  formData.append('resume', input.file, input.file.name);

  const response = await authenticatedResponse('/resume/analyze', {
    method: 'POST',
    body: formData,
  });
  return response.json() as Promise<ResumeAnalysisResponse>;
}
