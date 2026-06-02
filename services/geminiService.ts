
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

// ── Fallback Helpers ────────────────────────────────────────────────────────

const COMMON_SKILLS = [
  'React', 'Angular', 'Vue', 'Next.js', 'Nuxt.js', 'Svelte', 'SolidJS',
  'Node.js', 'Express', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel', 'Ruby on Rails',
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
  'HTML', 'CSS', 'Tailwind', 'Sass', 'Bootstrap',
  'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Cassandra', 'DynamoDB', 'SQLite',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'GitHub', 'Linux',
  'GraphQL', 'REST API', 'WebSockets', 'Redux', 'Zustand', 'Recoil'
];

const extractSkills = (text: string): string[] => {
  const matched = new Set<string>();
  const textLower = text.toLowerCase();
  for (const skill of COMMON_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zA-Z0-9_])${escaped}([^a-zA-Z0-9_]|$)`, 'i');
    if (regex.test(textLower)) {
      matched.add(skill);
    }
  }
  if (/(^|[^a-zA-Z0-9_])spring\s*boot([^a-zA-Z0-9_]|$)/i.test(textLower)) matched.add('Spring Boot');
  if (/(^|[^a-zA-Z0-9_])next\s*js([^a-zA-Z0-9_]|$)/i.test(textLower)) matched.add('Next.js');
  if (/(^|[^a-zA-Z0-9_])node\s*js([^a-zA-Z0-9_]|$)/i.test(textLower)) matched.add('Node.js');
  if (/(^|[^a-zA-Z0-9_])nest\s*js([^a-zA-Z0-9_]|$)/i.test(textLower)) matched.add('NestJS');
  return Array.from(matched);
};

const HEADING_PATTERNS = [
  /\b(?:professional\s+)?summary\b/i,
  /\bprofile\b/i,
  /\babout\s+me\b/i,
  /\b(?:professional\s+)?experience\b/i,
  /\bwork\s+history\b/i,
  /\bemployment\b/i,
  /\beducation\b/i,
  /\bacademics?\b/i,
  /\bprojects\b/i,
  /\bkey\s+projects\b/i,
  /\bskills\b/i,
  /\btechnical\s+skills\b/i,
  /\bskills\s+&\s+tools\b/i
];

const getSectionText = (text: string, headingWords: string[], allHeadingPatterns: RegExp[]): string => {
  let bestStartIdx = -1;
  let matchedHeadingLength = 0;
  
  for (const word of headingWords) {
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    const match = text.match(regex);
    if (match && match.index !== undefined) {
      if (bestStartIdx === -1 || match.index < bestStartIdx) {
        bestStartIdx = match.index;
        matchedHeadingLength = match[0].length;
      }
    }
  }
  
  if (bestStartIdx === -1) return '';
  
  const startContentIdx = bestStartIdx + matchedHeadingLength;
  let closestEndIdx = text.length;
  
  for (const pattern of allHeadingPatterns) {
    const match = text.slice(startContentIdx).match(pattern);
    if (match && match.index !== undefined) {
      const absIndex = startContentIdx + match.index;
      if (absIndex < closestEndIdx && absIndex > startContentIdx) {
        closestEndIdx = absIndex;
      }
    }
  }
  
  let cleaned = text.slice(startContentIdx, closestEndIdx).trim();
  cleaned = cleaned.replace(/^[:\-\s•·|]+/, '').trim();
  return cleaned;
};

const fallbackExtractResumeInfo = (resumeText: string): ExtractedResumeInfo => {
  const lines = resumeText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const sentences = resumeText.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 0);
  
  let name = "Candidate Name";
  if (lines.length > 0) {
    if (lines[0].length < 40 && !/resume|cv|curriculum/i.test(lines[0])) {
      name = lines[0];
    } else if (lines.length > 1 && lines[1].length < 40) {
      name = lines[1];
    } else {
      const words = lines[0].split(/\s+/);
      if (words.length >= 2) name = words.slice(0, 2).join(' ');
    }
  }
  
  let email = "";
  let phone = "";
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const emailMatch = resumeText.match(emailRegex);
  if (emailMatch) email = emailMatch[0];
  const phoneMatch = resumeText.match(phoneRegex);
  if (phoneMatch) phone = phoneMatch[0];
  const contact = [email, phone].filter(Boolean).join(" | ") || "contact@example.com";
  
  const skills = extractSkills(resumeText);
  if (skills.length === 0) {
    skills.push("Software Development", "Communication", "Problem Solving");
  }
  
  let experienceSummary = getSectionText(resumeText, ['experience', 'work history', 'employment'], HEADING_PATTERNS);
  if (!experienceSummary) {
    const expMatch = resumeText.match(/(\d+\+?\s*years?(\s*of)?\s*experience)/i);
    if (expMatch) {
      experienceSummary = `Over ${expMatch[1].toLowerCase()}.`;
    } else {
      const expSentence = sentences.find(s => /experience|work|history|intern/i.test(s) && s.length > 20);
      experienceSummary = expSentence ? expSentence.substring(0, 150) + (expSentence.length > 150 ? '...' : '') : "1-2 years of professional experience.";
    }
  } else {
    if (experienceSummary.length > 4000) {
      experienceSummary = experienceSummary.substring(0, 4000) + '...';
    }
  }
  
  let education = getSectionText(resumeText, ['education', 'academic', 'academics'], HEADING_PATTERNS);
  if (!education) {
    const eduKeywords = ["btech", "b.tech", "bca", "mca", "b.s.", "m.s.", "bs", "ms", "degree", "university", "college", "graduate", "bachelor", "master"];
    const eduSentence = sentences.find(s => eduKeywords.some(k => s.toLowerCase().includes(k)) && s.length > 10);
    education = eduSentence ? eduSentence.substring(0, 150) + (eduSentence.length > 150 ? '...' : '') : "Bachelor's Degree";
  } else {
    if (education.length > 2000) {
      education = education.substring(0, 2000) + '...';
    }
  }
  
  return { name, contact, skills, experienceSummary, education };
};

const fallbackExtractJobInfo = (jobDescriptionText: string): ExtractedJobInfo => {
  const skills = extractSkills(jobDescriptionText);
  if (skills.length === 0) {
    skills.push("Software Engineering", "Team Collaboration");
  }
  let experienceSummary = "Experience required: Mid-Level (2-5 years)";
  const expMatch = jobDescriptionText.match(/(\d+\+?\s*years?(\s*of)?\s*experience)/i);
  if (expMatch) {
    experienceSummary = `Requires ${expMatch[1].toLowerCase()}.`;
  }
  return { requiredSkills: skills, experienceSummary };
};

const fallbackAnalyzeFit = (resumeInfo: ExtractedResumeInfo, jobInfo: ExtractedJobInfo) => {
  const resumeSkillsSet = new Set(resumeInfo.skills.map(s => s.toLowerCase()));
  const jobSkills = jobInfo.requiredSkills;
  if (jobSkills.length === 0) return { score: 100, justification: "Fully fits requirements." };
  let matches = 0;
  for (const s of jobSkills) {
    if (resumeSkillsSet.has(s.toLowerCase())) matches++;
  }
  const score = Math.round((matches / jobSkills.length) * 100);
  const justification = `Matched ${matches} out of ${jobSkills.length} key skills required for this position.`;
  return { score, justification };
};

const fallbackAnalyzeDetailedFit = (resumeInfo: ExtractedResumeInfo, jobTitle: string, jobDescription: string): DetailedAnalysis => {
  const jobInfo = fallbackExtractJobInfo(jobDescription);
  const fit = fallbackAnalyzeFit(resumeInfo, jobInfo);
  const resumeSkillsSet = new Set(resumeInfo.skills.map(s => s.toLowerCase()));
  const missingThings = jobInfo.requiredSkills.filter(s => !resumeSkillsSet.has(s.toLowerCase()));
  const improvements = [
    "Quantify your accomplishments using metrics (e.g. 'Improved performance by 20%').",
    "Tailor your profile summary to match key terms used in the job description."
  ];
  if (missingThings.length > 0) {
    improvements.unshift(`Consider highlighting experience or building projects using: ${missingThings.slice(0, 3).join(', ')}.`);
  }
  const prepGuide = [
    `Be prepared to talk in detail about: ${resumeInfo.skills.slice(0, 4).join(', ')}.`,
    `Review projects where you worked with: ${jobInfo.requiredSkills.slice(0, 3).join(', ')}.`,
    "Prepare CAR (Challenge, Action, Result) stories for your behavioral questions."
  ];
  return {
    score: fit.score,
    missingThings: missingThings.length > 0 ? missingThings : ["None major detected"],
    improvements,
    prepGuide
  };
};

// ── Existing functions ──────────────────────────────────────────────────────

export const extractResumeInfo = async (resumeText: string): Promise<ExtractedResumeInfo> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following resume text and extract the key information.\n\nRESUME:\n${resumeText}`,
      config: { responseMimeType: "application/json", responseSchema: resumeSchema },
    });
    return JSON.parse(response.text) as ExtractedResumeInfo;
  } catch (err) {
    return fallbackExtractResumeInfo(resumeText);
  }
};

export const extractJobInfo = async (jobDescriptionText: string): Promise<ExtractedJobInfo> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following job description and extract the key requirements.\n\nJOB DESCRIPTION:\n${jobDescriptionText}`,
      config: { responseMimeType: "application/json", responseSchema: jobSchema },
    });
    return JSON.parse(response.text) as ExtractedJobInfo;
  } catch (err) {
    return fallbackExtractJobInfo(jobDescriptionText);
  }
};

export const analyzeFit = async (resumeInfo: ExtractedResumeInfo, jobInfo: ExtractedJobInfo): Promise<{ score: number; justification: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Evaluate the candidate's fit for this role.\n\nCANDIDATE:\n- Skills: ${resumeInfo.skills.join(', ')}\n- Experience: ${resumeInfo.experienceSummary}\n\nJOB:\n- Required Skills: ${jobInfo.requiredSkills.join(', ')}\n- Required Experience: ${jobInfo.experienceSummary}\n\nProvide a score 0-100 and brief justification.`,
      config: { responseMimeType: "application/json", responseSchema: fitScoreSchema },
    });
    return JSON.parse(response.text) as { score: number; justification: string };
  } catch (err) {
    return fallbackAnalyzeFit(resumeInfo, jobInfo);
  }
};

export const generateBio = async (resumeInfo: ExtractedResumeInfo): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a professional 2-3 sentence LinkedIn bio for this candidate.\n\nName: ${resumeInfo.name}\nSkills: ${resumeInfo.skills.join(', ')}\nExperience: ${resumeInfo.experienceSummary}\nEducation: ${resumeInfo.education}`,
    });
    return response.text;
  } catch (err) {
    return `Experienced software professional specializing in ${resumeInfo.skills.slice(0, 4).join(', ')}. Passionate about developing scalable, high-performance web applications and building seamless user interfaces.`;
  }
};

// ── New AI features ─────────────────────────────────────────────────────────

export const generateCoverLetter = async (resumeInfo: ExtractedResumeInfo, jobTitle: string, jobDescription: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a compelling, personalized cover letter for the following applicant applying for the role described below. The letter should be professional, concise (3 paragraphs), and highlight relevant skills. Do NOT include address headers or date — just the body paragraphs.\n\nAPPLICANT:\n- Name: ${resumeInfo.name}\n- Skills: ${resumeInfo.skills.join(', ')}\n- Experience: ${resumeInfo.experienceSummary}\n- Education: ${resumeInfo.education}\n\nJOB TITLE: ${jobTitle}\nJOB DESCRIPTION:\n${jobDescription}`,
    });
    return response.text;
  } catch (err) {
    return `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${jobTitle} position. With my solid background in ${resumeInfo.skills.slice(0, 4).join(', ')}, I am confident that my technical skills and experience align perfectly with the requirements of this role.\n\nOver the course of my career, I have developed a strong skill set in software development: ${resumeInfo.experienceSummary}. I am passionate about engineering clean, maintainable, and high-performance solutions.\n\nThank you for your time and consideration. I welcome the opportunity to discuss how my qualifications can add value to your engineering team.\n\nSincerely,\n${resumeInfo.name}`;
  }
};

export const generateResumeTips = async (resumeInfo: ExtractedResumeInfo): Promise<ResumeTip[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this candidate profile and provide 6-8 specific, actionable resume improvement suggestions. Focus on what's missing or weak. Be direct and practical.\n\nCANDIDATE:\n- Name: ${resumeInfo.name}\n- Skills: ${resumeInfo.skills.join(', ')}\n- Experience: ${resumeInfo.experienceSummary}\n- Education: ${resumeInfo.education}`,
      config: { responseMimeType: "application/json", responseSchema: resumeTipsSchema },
    });
    const result = JSON.parse(response.text) as { tips: ResumeTip[] };
    return result.tips;
  } catch (err) {
    return [
      { category: "Skills", tip: `Highlight your proficiency in core technologies like ${resumeInfo.skills.slice(0, 3).join(', ')} prominently at the top.`, priority: "high" },
      { category: "Experience", tip: "Quantify your achievements in each role using concrete metrics, numbers, and key project outcomes.", priority: "high" },
      { category: "Format", tip: "Ensure clear visual hierarchy, using bold text for job titles and bullet points for readability.", priority: "medium" },
      { category: "Summary", tip: "Refine your profile summary to match the specific terms used in modern tech listings.", priority: "medium" }
    ];
  }
};

export const generateInterviewPrep = async (resumeInfo: ExtractedResumeInfo, jobTitle: string, jobDescription: string): Promise<InterviewQA[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 6 realistic interview questions for this candidate preparing for the following job. Mix Behavioral, Technical, and Situational types. Include strong sample answers tailored to the candidate's background.\n\nCANDIDATE:\n- Skills: ${resumeInfo.skills.join(', ')}\n- Experience: ${resumeInfo.experienceSummary}\n\nJOB TITLE: ${jobTitle}\nJOB DESCRIPTION: ${jobDescription}`,
      config: { responseMimeType: "application/json", responseSchema: interviewQASchema },
    });
    const result = JSON.parse(response.text) as { questions: InterviewQA[] };
    return result.questions;
  } catch (err) {
    return [
      { question: `Can you walk me through a technical challenge you faced while implementing ${resumeInfo.skills[0] || 'software components'}?`, sampleAnswer: "In a recent project, we faced performance bottlenecks during load times. I addressed this by profiling components, identifying unnecessary renders, and optimizing resource queries to reduce latency by 35%.", type: "Technical" },
      { question: "How do you handle changing product requirements or tight deadlines?", sampleAnswer: "I focus on open communication with product managers, break the work down into prioritised items, and ensure that core functional paths are developed and tested first.", type: "Behavioral" },
      { question: `Why does the ${jobTitle} role at our company align with your career goals?`, sampleAnswer: "This role allows me to apply my skills in engineering while growing in technical architecture and contributing to product scalability.", type: "General" }
    ];
  }
};

export const generateInterviewQuestions = async (jobTitle: string, jobInfo: ExtractedJobInfo): Promise<InterviewQA[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 8 high-quality interview questions for the role below. Include Technical, Behavioral, Situational, and Culture-fit types. Provide ideal answer guidance for interviewers.\n\nROLE: ${jobTitle}\nREQUIRED SKILLS: ${jobInfo.requiredSkills.join(', ')}\nREQUIRED EXPERIENCE: ${jobInfo.experienceSummary}`,
      config: { responseMimeType: "application/json", responseSchema: interviewQASchema },
    });
    const result = JSON.parse(response.text) as { questions: InterviewQA[] };
    return result.questions;
  } catch (err) {
    return [
      { question: `Explain the core concepts and design patterns of ${jobInfo.requiredSkills[0] || 'software architecture'}.`, sampleAnswer: "Look for candidates explaining MVC, design patterns, separation of concerns, and framework-specific optimization techniques.", type: "Technical" },
      { question: "How do you ensure code quality, test coverage, and documentation consistency in collaborative teams?", sampleAnswer: "Look for mentions of code reviews, CI/CD automated linting and tests, and writing clear inline comments/specs.", type: "Behavioral" }
    ];
  }
};

export const enhanceJobDescription = async (basicJD: string, jobTitle: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Rewrite and enhance the following job description into a compelling, structured, and professional listing. Include: a short engaging intro, responsibilities (bullet list), requirements (bullet list), and a brief "Why join us" closing. Keep it under 400 words.\n\nJOB TITLE: ${jobTitle}\nORIGINAL JD:\n${basicJD}`,
    });
    return response.text;
  } catch (err) {
    return `### Job Role: ${jobTitle}\n\nWe are looking for a skilled ${jobTitle} to join our growing team. You will be responsible for creating robust applications and collaborating on system architecture.\n\n### Responsibilities:\n- Design, develop, and maintain clean, scalable code.\n- Collaborate with product designers and backend developers.\n- Build responsive frontend features and integrate REST APIs.\n\n### Requirements:\n- Proficient in technical stack needed for the role.\n- Solid problem-solving and communication skills.\n- Experience working in agile development environments.\n\n### Why Join Us:\nJoin a remote-first, inclusive engineering team with flexible working hours, health benefits, and learning allowances.`;
  }
};

export interface DetailedAnalysis {
  score: number;
  missingThings: string[];
  improvements: string[];
  prepGuide: string[];
}

export const analyzeDetailedFit = async (resumeInfo: ExtractedResumeInfo, jobTitle: string, jobDescription: string): Promise<DetailedAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Compare the applicant's resume details against the target job role. Highlight what is missing, suggestions to improve their resume to align better, and how they should prepare for the interview.\n\nAPPLICANT:\n- Skills: ${resumeInfo.skills.join(', ')}\n- Experience: ${resumeInfo.experienceSummary}\n- Education: ${resumeInfo.education}\n\nJOB TITLE: ${jobTitle}\nJOB DESCRIPTION:\n${jobDescription}`,
      config: { responseMimeType: "application/json", responseSchema: detailedAnalysisSchema },
    });
    return JSON.parse(response.text) as DetailedAnalysis;
  } catch (err) {
    return fallbackAnalyzeDetailedFit(resumeInfo, jobTitle, jobDescription);
  }
};

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const chatPrepCoach = async (
  resumeInfo: ExtractedResumeInfo,
  jobTitle: string,
  jobDescription: string,
  chatHistory: ChatMessage[],
  newMessage: string
): Promise<string> => {
  try {
    const systemPrompt = `You are a helpful AI Prep Coach for HireMind. You are helping the applicant prepare for an interview for the position of "${jobTitle}".
    
APPLICANT RESUME DETAILS:
- Name: ${resumeInfo.name}
- Skills: ${resumeInfo.skills.join(', ')}
- Experience: ${resumeInfo.experienceSummary}
- Education: ${resumeInfo.education}

JOB DETAILS:
- Title: ${jobTitle}
- Description: ${jobDescription}

Be extremely encouraging, concise, professional, and practical. Offer actionable interview advice, answer technical questions, explain concepts, and critique answers they offer. Always ground your advice in the reference resume and job details.`;

    const contents = [
      { role: 'user', parts: [{ text: "Hello! I need help preparing for the interview." }] },
      ...chatHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      })),
      { role: 'user', parts: [{ text: newMessage }] }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents as any,
      config: {
        systemInstruction: systemPrompt
      }
    });
    
    return response.text || "I apologize, but I received an empty response. Please try again.";
  } catch (err) {
    console.error("Prep Coach Chat Error:", err);
    return fallbackChatPrepCoach(resumeInfo, jobTitle, newMessage);
  }
};

export const fallbackChatPrepCoach = (
  resumeInfo: ExtractedResumeInfo,
  jobTitle: string,
  newMessage: string
): string => {
  const query = newMessage.toLowerCase();
  
  if (query.includes('question') || query.includes('test') || query.includes('mock') || query.includes('ask') || query.includes('practice')) {
    return `Sure! Let's do a mock interview question for the **${jobTitle}** role.

Here is a question to get us started:
*"Can you explain how you would design a scalable feature matching your skill in ${resumeInfo.skills[0] || 'software engineering'}? What trade-offs would you consider?"*

Take a moment to draft your response, and I will give you feedback!`;
  }
  
  if (query.includes('html') || query.includes('css') || query.includes('redux') || query.includes('react') || query.includes('node') || query.includes('js') || query.includes('javascript') || query.includes('ts') || query.includes('typescript')) {
    return `That's a key area for a **${jobTitle}**. 

Based on your resume, highlighting your experience with **${resumeInfo.skills.slice(0, 3).join(', ') || 'modern libraries'}** will help you stand out. For technical questions on this, make sure to:
1. Explain the core architecture/concept clearly.
2. Share a real-world scenario where you resolved a bottleneck or implemented a major feature using it.
3. Be prepared to discuss optimization techniques (like memoization or store organization).`;
  }

  return `For a **${jobTitle}** role, here is what you should focus on based on your background:

1. **Leverage your strengths:** Emphasize your background in **${resumeInfo.skills.slice(0, 3).join(', ') || 'software development'}**.
2. **Be ready for key questions:** Be prepared to talk about design patterns, APIs, and testing.
3. **Ask great questions:** Show interest in the team's agile process, deployment cycle, and code review standards.

What specific technical topic or interview stage would you like to prepare for next?`;
};
