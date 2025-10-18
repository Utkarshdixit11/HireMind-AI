
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
  id:string;
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
