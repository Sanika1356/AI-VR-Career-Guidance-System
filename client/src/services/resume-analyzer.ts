import { authenticatedResponse } from './auth';

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
  analysis: ResumeAnalysis;
  analyzedAt: string;
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
