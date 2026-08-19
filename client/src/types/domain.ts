export interface User {
  id: string;
  name: string;
  email: string;
  interests?: string[];
  skills?: string[];
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  learningPreferences?: string[];
}

export interface Career {
  id: string;
  name: string;
  description: string;
  skills: string[];
  responsibilities?: string[];
  requiredSkills?: string[];
  learningResources?: LearningResource[];
  environmentKey?: string;
  vrAvailable?: boolean;
}

export interface LearningResource {
  id?: string;
  title: string;
  description?: string;
  url?: string;
  provider?: string;
  type?: string;
  free?: boolean;
}

export interface CareerSummary {
  id: string;
  name: string;
  description: string;
  skills: string[];
  environmentKey: string | null;
}

export interface CareerDetailRoadmapStep {
  id: string;
  title: string;
  description: string;
  skill: string;
  displayOrder: number;
}

export interface CareerDetail extends CareerSummary {
  learningResources: LearningResource[];
  environment: VREnvironment | null;
  roadmap: CareerDetailRoadmapStep[];
}

export type AssessmentQuestionType = 'single-choice' | 'multiple-choice' | 'scale' | 'text';

export interface AssessmentOption {
  id: string;
  label: string;
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: AssessmentQuestionType;
  options?: AssessmentOption[];
  required?: boolean;
}

export interface AssessmentQuestionSet {
  assessmentId: string;
  questions: AssessmentQuestion[];
}

export interface AssessmentAnswer {
  questionId: string;
  optionId?: string;
  optionIds?: string[];
  value?: string | number;
}

export interface AssessmentSubmissionAnswer {
  questionId: string;
  optionId: string;
}

export interface AssessmentSubmission {
  assessmentId: string;
  answers: AssessmentSubmissionAnswer[];
}

export interface AssessmentResultSummary {
  resultId: string;
  completedAt: string;
  topCareerIds: string[];
}

export interface AssessmentResultResponse extends AssessmentResultSummary {
  categoryScores: Record<string, number>;
}

export interface Recommendation {
  careerId: string;
  career: string;
  score: number;
  reason: string;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface RecommendationResponse {
  resultId: string;
  recommendations: Recommendation[];
}

export type SkillGapStatus = 'matched' | 'missing';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface SkillGapItem {
  name: string;
  status: SkillGapStatus;
  level: SkillLevel;
}

export interface SkillGapResponse {
  careerId: string;
  skills: SkillGapItem[];
}

export interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  skill: string;
  order: number;
  completed: boolean;
}

export interface RoadmapResponse {
  careerId: string;
  steps: RoadmapStep[];
}

export interface RoadmapStepUpdate {
  completed: boolean;
}

export type ChatMessageRole = 'user' | 'advisor';

export interface ChatMessage {
  id?: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
  sources?: string[];
}

export interface AdvisorChatRequest {
  message: string;
  careerId?: string;
  conversationId?: string;
}

export interface AdvisorChatResponse {
  conversationId: string;
  answer: string;
  sources: string[];
  createdAt: string;
}

export interface VREnvironment {
  key: string;
  careerId: string;
  title: string;
  description: string;
  available: boolean;
}

export interface VREnvironmentResponse {
  environments: VREnvironment[];
}

export interface ProfileData {
  interests: string[];
  currentSkills: string[];
  experience: string;
  learningPreferences: Record<string, unknown>;
}

export interface ProfileResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  profile: ProfileData;
}

export interface ProfileUpdateInput {
  name?: string;
  interests?: string[];
  currentSkills?: string[];
  experience?: string;
  learningPreferences?: Record<string, unknown>;
}
