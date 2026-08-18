export interface HealthResponse {
  status: 'ok';
  service: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

export interface CareerSummary {
  id: string;
  name: string;
  description: string;
  skills: string[];
  environmentKey?: string;
}
