
import { GoogleGenAI, Type } from "@google/genai";
import type { ExtractedJobInfo, ExtractedResumeInfo } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const resumeSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "The full name of the candidate." },
    contact: { type: Type.STRING, description: "The primary contact information (email or phone)." },
    skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of key technical and soft skills.",
    },
    experienceSummary: {
      type: Type.STRING,
      description: "A 2-3 sentence summary of the candidate's professional work experience.",
    },
    education: {
      type: Type.STRING,
      description: "A summary of the candidate's educational background, including degrees and institutions.",
    },
  },
  required: ["name", "skills", "experienceSummary", "education"],
};

const jobSchema = {
    type: Type.OBJECT,
    properties: {
        requiredSkills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of essential skills required for the job."
        },
        experienceSummary: {
            type: Type.STRING,
            description: "A summary of the required years and type of experience."
        }
    },
    required: ["requiredSkills", "experienceSummary"]
};

const fitScoreSchema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.NUMBER,
      description: "A score from 0 to 100 indicating the match quality.",
    },
    justification: {
      type: Type.STRING,
      description: "A brief, one-sentence justification for the score.",
    },
  },
  required: ["score", "justification"],
};


export const extractResumeInfo = async (resumeText: string): Promise<ExtractedResumeInfo> => {
  const prompt = `Analyze the following resume text and extract the key information according to the provided schema. If a field is not present, provide a reasonable default like 'Not found'.\n\nRESUME:\n${resumeText}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: resumeSchema,
    },
  });

  const jsonString = response.text;
  return JSON.parse(jsonString) as ExtractedResumeInfo;
};

export const extractJobInfo = async (jobDescriptionText: string): Promise<ExtractedJobInfo> => {
    const prompt = `Analyze the following job description text and extract the key requirements according to the schema.\n\nJOB DESCRIPTION:\n${jobDescriptionText}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: jobSchema
        }
    });

    const jsonString = response.text;
    return JSON.parse(jsonString) as ExtractedJobInfo;
};


export const analyzeFit = async (resumeInfo: ExtractedResumeInfo, jobInfo: ExtractedJobInfo): Promise<{ score: number; justification: string }> => {
  const prompt = `
    Based on the following candidate profile and job requirements, please provide a job fit score.
    
    CANDIDATE PROFILE:
    - Skills: ${resumeInfo.skills.join(', ')}
    - Experience: ${resumeInfo.experienceSummary}
    
    JOB REQUIREMENTS:
    - Required Skills: ${jobInfo.requiredSkills.join(', ')}
    - Required Experience: ${jobInfo.experienceSummary}
    
    Analyze the fit and provide a score from 0 to 100 and a brief justification.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: fitScoreSchema,
    },
  });

  const jsonString = response.text;
  return JSON.parse(jsonString) as { score: number; justification: string };
};

export const generateBio = async (resumeInfo: ExtractedResumeInfo): Promise<string> => {
    const prompt = `Based on the following resume information, generate a professional and engaging "short bio" suitable for a LinkedIn profile. The bio should be around 2-3 sentences long and highlight key strengths.\n\nRESUME INFO:\n- Name: ${resumeInfo.name}\n- Skills: ${resumeInfo.skills.join(', ')}\n- Experience Summary: ${resumeInfo.experienceSummary}\n- Education: ${resumeInfo.education}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text;
}
