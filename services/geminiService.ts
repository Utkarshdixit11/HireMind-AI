import type { ExtractedJobInfo, ExtractedResumeInfo, ResumeTip, InterviewQA } from '../types';

export interface DetailedAnalysis {
  score: number;
  missingThings: string[];
  improvements: string[];
  prepGuide: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// ── API Routing Helpers ──────────────────────────────────────────────────────

const getApiBase = () => {
  let base = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:5000/api')
    ? import.meta.env.VITE_API_URL
    : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api'
      : `${window.location.origin}/api`);

  if (base.endsWith('/')) {
    base = base.slice(0, -1);
  }
  if (!base.endsWith('/api')) {
    base = `${base}/api`;
  }
  return base;
};

async function callBackendAI(type: string, payload: any) {
  const apiBase = getApiBase();
  const clientApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const res = await fetch(`${apiBase}/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, payload, clientApiKey })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const errMsg = errData.error || errData.message || res.statusText;
    throw new Error(errMsg);
  }
  const data = await res.json();
  return data.result;
}

// ── Exported AI Service Functions ───────────────────────────────────────────

export const extractResumeInfo = async (resumeText: string): Promise<ExtractedResumeInfo> => {
  return await callBackendAI('extractResumeInfo', { resumeText });
};

export const extractJobInfo = async (jobDescriptionText: string): Promise<ExtractedJobInfo> => {
  return await callBackendAI('extractJobInfo', { jobDescriptionText });
};

export const analyzeFit = async (resumeInfo: ExtractedResumeInfo, jobInfo: ExtractedJobInfo): Promise<{ score: number; justification: string }> => {
  return await callBackendAI('analyzeFit', { resumeInfo, jobInfo });
};

export const generateBio = async (resumeInfo: ExtractedResumeInfo): Promise<string> => {
  return await callBackendAI('generateBio', { resumeInfo });
};

export const generateCoverLetter = async (resumeInfo: ExtractedResumeInfo, jobTitle: string, jobDescription: string): Promise<string> => {
  return await callBackendAI('generateCoverLetter', { resumeInfo, jobTitle, jobDescription });
};

export const generateResumeTips = async (resumeInfo: ExtractedResumeInfo): Promise<ResumeTip[]> => {
  return await callBackendAI('generateResumeTips', { resumeInfo });
};

export const generateInterviewPrep = async (resumeInfo: ExtractedResumeInfo, jobTitle: string, jobDescription: string): Promise<InterviewQA[]> => {
  return await callBackendAI('generateInterviewPrep', { resumeInfo, jobTitle, jobDescription });
};

export const generateInterviewQuestions = async (jobTitle: string, jobInfo: ExtractedJobInfo): Promise<InterviewQA[]> => {
  return await callBackendAI('generateInterviewQuestions', { jobTitle, jobInfo });
};

export const enhanceJobDescription = async (basicJD: string, jobTitle: string): Promise<string> => {
  return await callBackendAI('enhanceJobDescription', { basicJD, jobTitle });
};

export const analyzeDetailedFit = async (resumeInfo: ExtractedResumeInfo, jobTitle: string, jobDescription: string): Promise<DetailedAnalysis> => {
  return await callBackendAI('analyzeDetailedFit', { resumeInfo, jobTitle, jobDescription });
};

export const chatPrepCoach = async (
  resumeInfo: ExtractedResumeInfo,
  jobTitle: string,
  jobDescription: string,
  chatHistory: ChatMessage[],
  newMessage: string
): Promise<string> => {
  try {
    return await callBackendAI('chatPrepCoach', { resumeInfo, jobTitle, jobDescription, chatHistory, newMessage });
  } catch (err: any) {
    console.error("Prep Coach Chat Error:", err);
    return `❌ **Error connecting to Prep Coach AI:**\n\n${err.message || err}`;
  }
};
