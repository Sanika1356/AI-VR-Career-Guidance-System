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

export interface CareerComparison {
  id: string;
  name: string;
  domain: string;
  description: string;
  skills: string[];
  workActivities: string[];
  learningEffort: {
    label: string;
    roadmapStepCount: number;
    resourceCount: number;
  };
  transferableSkills: string[];
  environment: VREnvironment | null;
  uncertainty: string[];
}

export interface CareerComparisonResponse {
  careers: CareerComparison[];
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

export interface NextAssessmentQuestionResponse {
  assessmentId: string;
  done: boolean;
  question: AssessmentQuestion | null;
  selection: {
    strategy: 'coverage-first-deterministic';
    reason: string;
  };
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

export interface AssessmentExplanation {
  careerId: string;
  score: number;
  confidence: 'low' | 'medium' | 'high';
  supportingSignals: string[];
  caveat: string;
}

export interface AssessmentResultResponse extends AssessmentResultSummary {
  categoryScores: Record<string, number>;
  explanations?: AssessmentExplanation[];
}

export interface AssessmentRetakeComparisonResponse {
  currentResultId: string;
  previousResultId: string;
  currentCompletedAt: string;
  previousCompletedAt: string;
  currentQuestionBankVersion: number;
  previousQuestionBankVersion: number;
  questionBankVersionMatches: boolean;
  changedAnswers: Array<{
    questionId: string;
    questionText: string;
    previousOptionId: string | null;
    previousOptionLabel: string | null;
    currentOptionId: string | null;
    currentOptionLabel: string | null;
  }>;
  scoreChanges: Array<{
    careerId: string;
    previousScore: number;
    currentScore: number;
    delta: number;
  }>;
  topCareerChanges: { added: string[]; removed: string[] };
  explanation: string[];
}

export interface RecommendationEvidence {
  assessmentScore: number;
  matchedSkillCount: number;
  missingSkillCount: number;
  confidence: 'low' | 'medium' | 'high';
  tradeOffs: string[];
}

export interface Recommendation {
  careerId: string;
  career: string;
  score: number;
  reason: string;
  matchedSkills: string[];
  missingSkills: string[];
  evidence: RecommendationEvidence;
}

export interface RecommendationResponse {
  resultId: string;
  recommendations: Recommendation[];
}

export type SkillGapStatus = 'matched' | 'missing';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export type SkillGapPriority = 'high' | 'medium' | 'low';

export interface SkillGapItem {
  name: string;
  status: SkillGapStatus;
  level: SkillLevel;
  priority: SkillGapPriority;
  prerequisites: string[];
  blockedBy: string[];
  transferableTo: string[];
  priorityReason: string;
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
  confidence?: 'low' | 'medium' | 'high';
  caveat?: string;
  feedbackHelpful?: boolean;
}
export type AdvisorFeedbackReason =
  'clear' | 'actionable' | 'grounded' | 'incorrect' | 'unsafe' | 'other';
export interface AdvisorFeedbackRequest {
  conversationId: string;
  messageCreatedAt: string;
  helpful: boolean;
  reason?: AdvisorFeedbackReason;
}
export interface AdvisorFeedbackResponse {
  recorded: true;
  conversationId: string;
  messageCreatedAt: string;
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
  confidence?: 'low' | 'medium' | 'high';
  caveat?: string;
  createdAt: string;
}
export interface ClearAdvisorHistoryResponse {
  conversationId: string;
  deletedMessageCount: number;
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

export interface PrivacyConsent {
  analytics: boolean;
  personalizedAi: boolean;
  vrTelemetry: boolean;
  policyVersion: string;
  updatedAt: string | null;
}

export interface PrivacyConsentResponse {
  consent: PrivacyConsent;
}

export interface AccountDeletionResponse {
  deleted: true;
  userId: string;
}
