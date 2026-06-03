const express = require('express');
const router = express.Router();
const path = require('path');
const { GoogleGenAI, Type } = require("@google/genai");

// Try fallback load from parent folder's .env if local development
try {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });
} catch (e) {
  // Ignore
}

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
let ai = null;
if (apiKey && !apiKey.includes("AIzaSyC0acuXiy03cN5IkLQQr4oc9hbmATcfsrU")) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.warn("⚠️ Warning: No valid GEMINI_API_KEY or VITE_GEMINI_API_KEY found on backend server.");
}

// Rate-limiting retry wrapper to automatically wait and try again
const generateContentWithRetry = async (aiClient, options, maxRetries = 3) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await aiClient.models.generateContent(options);
    } catch (error) {
      attempt++;
      const errorStr = String(error);
      const isRateLimit = error.status === 'RESOURCE_EXHAUSTED' || 
                          error.statusCode === 429 || 
                          errorStr.includes('429') || 
                          errorStr.includes('quota') || 
                          errorStr.includes('RESOURCE_EXHAUSTED') ||
                          errorStr.includes('exhausted');
      
      if (isRateLimit && attempt < maxRetries) {
        // Wait 3.5 seconds before retrying to let the minute window clear
        console.warn(`[Gemini Rate Limit] Attempt ${attempt} failed with 429. Retrying in 3.5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3500));
        continue;
      }
      throw error;
    }
  }
};

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

router.post('/generate', async (req, res) => {
  const { type, payload, clientApiKey } = req.body;

  let activeApiKey = apiKey;
  // Fallback to clientApiKey if backend is missing key or using leaked key
  if ((!activeApiKey || activeApiKey.includes("AIzaSyC0acuXiy03cN5IkLQQr4oc9hbmATcfsrU")) && clientApiKey && !clientApiKey.includes("AIzaSyC0acuXiy03cN5IkLQQr4oc9hbmATcfsrU")) {
    activeApiKey = clientApiKey;
  }

  if (!activeApiKey || activeApiKey.includes("AIzaSyC0acuXiy03cN5IkLQQr4oc9hbmATcfsrU")) {
    return res.status(500).json({ error: "Gemini API key is not configured or has been disabled." });
  }

  let activeAi = null;
  try {
    activeAi = new GoogleGenAI({ apiKey: activeApiKey });
  } catch (err) {
    return res.status(500).json({ error: "Failed to initialize Gemini AI client: " + err.message });
  }

  try {
    let result;
    switch (type) {
      case 'extractResumeInfo': {
        const response = await generateContentWithRetry(activeAi, {
          model: 'gemini-2.5-flash',
          contents: `Analyze the following resume text and extract the key information.\n\nRESUME:\n${payload.resumeText}`,
          config: { responseMimeType: "application/json", responseSchema: resumeSchema },
        });
        result = JSON.parse(response.text);
        break;
      }
      case 'extractJobInfo': {
        const response = await generateContentWithRetry(activeAi, {
          model: 'gemini-2.5-flash',
          contents: `Analyze the following job description and extract the key requirements.\n\nJOB DESCRIPTION:\n${payload.jobDescriptionText}`,
          config: { responseMimeType: "application/json", responseSchema: jobSchema },
        });
        result = JSON.parse(response.text);
        break;
      }
      case 'analyzeFit': {
        const response = await generateContentWithRetry(activeAi, {
          model: 'gemini-2.5-flash',
          contents: `Evaluate the candidate's fit for this role.\n\nCANDIDATE:\n- Skills: ${payload.resumeInfo.skills.join(', ')}\n- Experience: ${payload.resumeInfo.experienceSummary}\n- Education: ${payload.resumeInfo.education}\n\nJOB:\n- Required Skills: ${payload.jobInfo.requiredSkills.join(', ')}\n- Required Experience: ${payload.jobInfo.experienceSummary}\n\nProvide a score 0-100 and brief justification.`,
          config: { responseMimeType: "application/json", responseSchema: fitScoreSchema },
        });
        result = JSON.parse(response.text);
        break;
      }
      case 'generateBio': {
        const response = await generateContentWithRetry(activeAi, {
          model: 'gemini-2.5-flash',
          contents: `Generate a professional 2-3 sentence LinkedIn bio for this candidate.\n\nName: ${payload.resumeInfo.name}\nSkills: ${payload.resumeInfo.skills.join(', ')}\nExperience: ${payload.resumeInfo.experienceSummary}\nEducation: ${payload.resumeInfo.education}`,
        });
        result = response.text;
        break;
      }
      case 'generateCoverLetter': {
        const response = await generateContentWithRetry(activeAi, {
          model: 'gemini-2.5-flash',
          contents: `Write a compelling, personalized cover letter for the following applicant applying for the role described below. The letter should be professional, concise (3 paragraphs), and highlight relevant skills. Do NOT include address headers or date — just the body paragraphs.\n\nAPPLICANT:\n- Name: ${payload.resumeInfo.name}\n- Skills: ${payload.resumeInfo.skills.join(', ')}\n- Experience: ${payload.resumeInfo.experienceSummary}\n- Education: ${payload.resumeInfo.education}\n\nJOB TITLE: ${payload.jobTitle}\nJOB DESCRIPTION:\n${payload.jobDescription}`,
        });
        result = response.text;
        break;
      }
      case 'generateResumeTips': {
        const response = await generateContentWithRetry(activeAi, {
          model: 'gemini-2.5-flash',
          contents: `Analyze this candidate profile and provide 6-8 specific, actionable resume improvement suggestions. Focus on what's missing or weak. Be direct and practical.\n\nCANDIDATE:\n- Name: ${payload.resumeInfo.name}\n- Skills: ${payload.resumeInfo.skills.join(', ')}\n- Experience: ${payload.resumeInfo.experienceSummary}\n- Education: ${payload.resumeInfo.education}`,
          config: { responseMimeType: "application/json", responseSchema: resumeTipsSchema },
        });
        const resultObj = JSON.parse(response.text);
        result = resultObj.tips;
        break;
      }
      case 'generateInterviewPrep': {
        const response = await generateContentWithRetry(activeAi, {
          model: 'gemini-2.5-flash',
          contents: `Generate 6 realistic interview questions for this candidate preparing for the following job. Mix Behavioral, Technical, and Situational types. Include strong sample answers tailored to the candidate's background.\n\nCANDIDATE:\n- Skills: ${payload.resumeInfo.skills.join(', ')}\n- Experience: ${payload.resumeInfo.experienceSummary}\n\nJOB TITLE: ${payload.jobTitle}\nJOB DESCRIPTION: ${payload.jobDescription}`,
          config: { responseMimeType: "application/json", responseSchema: interviewQASchema },
        });
        const resultObj = JSON.parse(response.text);
        result = resultObj.questions;
        break;
      }
      case 'generateInterviewQuestions': {
        const response = await generateContentWithRetry(activeAi, {
          model: 'gemini-2.5-flash',
          contents: `Generate 8 high-quality interview questions for the role below. Include Technical, Behavioral, Situational, and Culture-fit types. Provide ideal answer guidance for interviewers.\n\nROLE: ${payload.jobTitle}\nREQUIRED SKILLS: ${payload.jobInfo.requiredSkills.join(', ')}\nREQUIRED EXPERIENCE: ${payload.jobInfo.experienceSummary}`,
          config: { responseMimeType: "application/json", responseSchema: interviewQASchema },
        });
        const resultObj = JSON.parse(response.text);
        result = resultObj.questions;
        break;
      }
      case 'enhanceJobDescription': {
        const response = await generateContentWithRetry(activeAi, {
          model: 'gemini-2.5-flash',
          contents: `Rewrite and enhance the following job description into a compelling, structured, and professional listing. Include: a short engaging intro, responsibilities (bullet list), requirements (bullet list), and a brief "Why join us" closing. Keep it under 400 words.\n\nJOB TITLE: ${payload.jobTitle}\nORIGINAL JD:\n${payload.basicJD}`,
        });
        result = response.text;
        break;
      }
      case 'analyzeDetailedFit': {
        const response = await generateContentWithRetry(activeAi, {
          model: 'gemini-2.5-flash',
          contents: `Compare the applicant's resume details against the target job role. Highlight what is missing, suggestions to improve their resume to align better, and how they should prepare for the interview.\n\nAPPLICANT:\n- Skills: ${payload.resumeInfo.skills.join(', ')}\n- Experience: ${payload.resumeInfo.experienceSummary}\n- Education: ${payload.resumeInfo.education}\n\nJOB TITLE: ${payload.jobTitle}\nJOB DESCRIPTION:\n${payload.jobDescription}`,
          config: { responseMimeType: "application/json", responseSchema: detailedAnalysisSchema },
        });
        result = JSON.parse(response.text);
        break;
      }
      case 'chatPrepCoach': {
        const systemPrompt = `You are a helpful AI Prep Coach for HireMind. You are helping the applicant prepare for an interview for the position of "${payload.jobTitle}".
        
APPLICANT RESUME DETAILS:
- Name: ${payload.resumeInfo.name}
- Skills: ${payload.resumeInfo.skills.join(', ')}
- Experience: ${payload.resumeInfo.experienceSummary}
- Education: ${payload.resumeInfo.education}

JOB DETAILS:
- Title: ${payload.jobTitle}
- Description: ${payload.jobDescription}

Be extremely encouraging, concise, professional, and practical. Offer actionable interview advice, answer technical questions, explain concepts, and critique answers they offer. Always ground your advice in the reference resume and job details.`;

        const contents = [
          { role: 'user', parts: [{ text: "Hello! I need help preparing for the interview." }] },
          ...payload.chatHistory.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
          })),
          { role: 'user', parts: [{ text: payload.newMessage }] }
        ];

        const response = await generateContentWithRetry(activeAi, {
          model: 'gemini-2.5-flash',
          contents: contents,
          config: {
            systemInstruction: systemPrompt
          }
        });
        result = response.text || "I apologize, but I received an empty response. Please try again.";
        break;
      }
      default:
        return res.status(400).json({ error: `Unknown generation type: ${type}` });
    }

    res.json({ result });
  } catch (error) {
    console.error(`Gemini Generation Error [${type}]:`, error);
    res.status(500).json({ error: error.message || "Failed to generate content from Gemini." });
  }
});

module.exports = router;
