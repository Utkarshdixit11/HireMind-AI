export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'seeker' | 'provider' | 'guest';
  avatar: string | null;
  provider: 'local' | 'google';
  isVerified: boolean;
  bio?: string;
  skills?: string[];
  companyName?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  role: 'seeker' | 'provider';
}

export interface ExtractedJobInfo {
  requiredSkills: string[];
  experienceSummary: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  extractedInfo: ExtractedJobInfo;
}

export interface ExtractedResumeInfo {
  skills: string[];
  experienceSummary: string;
  education: string;
  name: string;
  contact: string;
}

export interface Applicant {
  id: string;
  fileName: string;
  resumeText: string;
  extractedInfo: ExtractedResumeInfo;
}

export interface JobFit {
  jobId: string;
  jobTitle: string;
  score: number;
  justification: string;
}

export interface ApplicantFit {
  applicantId: string;
  applicantName: string;
  score: number;
  justification: string;
}

export interface ResumeTip {
  category: string;
  tip: string;
  priority: 'high' | 'medium' | 'low';
}

export interface InterviewQA {
  question: string;
  sampleAnswer: string;
  type: string;
}
