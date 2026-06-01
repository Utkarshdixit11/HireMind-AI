
import { GoogleGenAI, Type } from "@google/genai";
import type { ExtractedJobInfo, ExtractedResumeInfo, ResumeTip, InterviewQA } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });

const resumeSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "The full name of the candidate." },
    contact: { type: Type.STRING, description: "The primary contact information (email or phone)." },
    skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of key technical and soft skills." },
    experienceSummary: { type: Type.STRING, description: "A 2-3 sentence summary of the candidate's professional work experience." },
    education: { type: Type.STRING, description: "A summary of the candidate's educational background, including degrees and institutions." },
  },
  required: ["name", "skills", "experienceSummary", "education"],
};

const jobSchema = {
  type: Type.OBJECT,
  properties: {
    requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of essential skills required for the job." },
    experienceSummary: { type: Type.STRING, description: "A summary of the required years and type of experience." },
  },
  required: ["requiredSkills", "experienceSummary"],
};

const fitScoreSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "A score from 0 to 100 indicating the match quality." },
    justification: { type: Type.STRING, description: "A brief, one-sentence justification for the score." },
  },
  required: ["score", "justification"],
};

const resumeTipsSchema = {
  type: Type.OBJECT,
  properties: {
    tips: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "Category of improvement e.g. Skills, Experience, Format, Keywords, Summary" },
          tip: { type: Type.STRING, description: "A specific, actionable improvement suggestion." },
          priority: { type: Type.STRING, description: "Priority level: high, medium, or low" },
        },
        required: ["category", "tip", "priority"],
      },
      description: "List of actionable resume improvement tips",
    },
  },
  required: ["tips"],
};

const interviewQASchema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "The interview question" },
          sampleAnswer: { type: Type.STRING, description: "A strong sample answer for this question" },
          type: { type: Type.STRING, description: "Type of question: Behavioral, Technical, Situational, General" },
        },
        required: ["question", "sampleAnswer", "type"],
      },
      description: "List of interview questions with sample answers",
    },
  },
  required: ["questions"],
};

const detailedAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "Match percentage between 0 and 100" },
    missingThings: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key requirements or skills missing from the candidate's resume" },
    improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Actionable tips to improve the resume for this specific role" },
    prepGuide: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific steps and focus areas on how to prepare for this job's interview" }
  },
  required: ["score", "missingThings", "improvements", "prepGuide"]
};

// ── Existing functions ──────────────────────────────────────────────────────

export const extractResumeInfo = async (resumeText: string): Promise<ExtractedResumeInfo> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Analyze the following resume text and extract the key information.\n\nRESUME:\n${resumeText}`,
    config: { responseMimeType: "application/json", responseSchema: resumeSchema },
  });
  return JSON.parse(response.text) as ExtractedResumeInfo;
};

export const extractJobInfo = async (jobDescriptionText: string): Promise<ExtractedJobInfo> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Analyze the following job description and extract the key requirements.\n\nJOB DESCRIPTION:\n${jobDescriptionText}`,
    config: { responseMimeType: "application/json", responseSchema: jobSchema },
  });
  return JSON.parse(response.text) as ExtractedJobInfo;
};

export const analyzeFit = async (resumeInfo: ExtractedResumeInfo, jobInfo: ExtractedJobInfo): Promise<{ score: number; justification: string }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Evaluate the candidate's fit for this role.\n\nCANDIDATE:\n- Skills: ${resumeInfo.skills.join(', ')}\n- Experience: ${resumeInfo.experienceSummary}\n\nJOB:\n- Required Skills: ${jobInfo.requiredSkills.join(', ')}\n- Required Experience: ${jobInfo.experienceSummary}\n\nProvide a score 0-100 and brief justification.`,
    config: { responseMimeType: "application/json", responseSchema: fitScoreSchema },
  });
  return JSON.parse(response.text) as { score: number; justification: string };
};

export const generateBio = async (resumeInfo: ExtractedResumeInfo): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Generate a professional 2-3 sentence LinkedIn bio for this candidate.\n\nName: ${resumeInfo.name}\nSkills: ${resumeInfo.skills.join(', ')}\nExperience: ${resumeInfo.experienceSummary}\nEducation: ${resumeInfo.education}`,
  });
  return response.text;
};

// ── New AI features ─────────────────────────────────────────────────────────

/** Generate a personalized cover letter for a job application */
export const generateCoverLetter = async (resumeInfo: ExtractedResumeInfo, jobTitle: string, jobDescription: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Write a compelling, personalized cover letter for the following applicant applying for the role described below. The letter should be professional, concise (3 paragraphs), and highlight relevant skills. Do NOT include address headers or date — just the body paragraphs.\n\nAPPLICANT:\n- Name: ${resumeInfo.name}\n- Skills: ${resumeInfo.skills.join(', ')}\n- Experience: ${resumeInfo.experienceSummary}\n- Education: ${resumeInfo.education}\n\nJOB TITLE: ${jobTitle}\nJOB DESCRIPTION:\n${jobDescription}`,
  });
  return response.text;
};

/** Generate actionable resume improvement tips */
export const generateResumeTips = async (resumeInfo: ExtractedResumeInfo): Promise<ResumeTip[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Analyze this candidate profile and provide 6-8 specific, actionable resume improvement suggestions. Focus on what's missing or weak. Be direct and practical.\n\nCANDIDATE:\n- Name: ${resumeInfo.name}\n- Skills: ${resumeInfo.skills.join(', ')}\n- Experience: ${resumeInfo.experienceSummary}\n- Education: ${resumeInfo.education}`,
    config: { responseMimeType: "application/json", responseSchema: resumeTipsSchema },
  });
  const result = JSON.parse(response.text) as { tips: ResumeTip[] };
  return result.tips;
};

/** Generate interview prep Q&A for a candidate based on a job */
export const generateInterviewPrep = async (resumeInfo: ExtractedResumeInfo, jobTitle: string, jobDescription: string): Promise<InterviewQA[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Generate 6 realistic interview questions for this candidate preparing for the following job. Mix Behavioral, Technical, and Situational types. Include strong sample answers tailored to the candidate's background.\n\nCANDIDATE:\n- Skills: ${resumeInfo.skills.join(', ')}\n- Experience: ${resumeInfo.experienceSummary}\n\nJOB TITLE: ${jobTitle}\nJOB DESCRIPTION: ${jobDescription}`,
    config: { responseMimeType: "application/json", responseSchema: interviewQASchema },
  });
  const result = JSON.parse(response.text) as { questions: InterviewQA[] };
  return result.questions;
};

/** Generate interview questions for a job role (for HR use) */
export const generateInterviewQuestions = async (jobTitle: string, jobInfo: ExtractedJobInfo): Promise<InterviewQA[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Generate 8 high-quality interview questions for the role below. Include Technical, Behavioral, Situational, and Culture-fit types. Provide ideal answer guidance for interviewers.\n\nROLE: ${jobTitle}\nREQUIRED SKILLS: ${jobInfo.requiredSkills.join(', ')}\nREQUIRED EXPERIENCE: ${jobInfo.experienceSummary}`,
    config: { responseMimeType: "application/json", responseSchema: interviewQASchema },
  });
  const result = JSON.parse(response.text) as { questions: InterviewQA[] };
  return result.questions;
};

/** Enhance / rewrite a basic job description into a compelling one */
export const enhanceJobDescription = async (basicJD: string, jobTitle: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Rewrite and enhance the following job description into a compelling, structured, and professional listing. Include: a short engaging intro, responsibilities (bullet list), requirements (bullet list), and a brief "Why join us" closing. Keep it under 400 words.\n\nJOB TITLE: ${jobTitle}\nORIGINAL JD:\n${basicJD}`,
  });
  return response.text;
};

export interface DetailedAnalysis {
  score: number;
  missingThings: string[];
  improvements: string[];
  prepGuide: string[];
}

/** Generate a detailed analysis of a resume against a specific JD */
export const analyzeDetailedFit = async (resumeInfo: ExtractedResumeInfo, jobTitle: string, jobDescription: string): Promise<DetailedAnalysis> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Compare the applicant's resume details against the target job role. Highlight what is missing, suggestions to improve their resume to align better, and how they should prepare for the interview.\n\nAPPLICANT:\n- Skills: ${resumeInfo.skills.join(', ')}\n- Experience: ${resumeInfo.experienceSummary}\n- Education: ${resumeInfo.education}\n\nJOB TITLE: ${jobTitle}\nJOB DESCRIPTION:\n${jobDescription}`,
    config: { responseMimeType: "application/json", responseSchema: detailedAnalysisSchema },
  });
  return JSON.parse(response.text) as DetailedAnalysis;
};
