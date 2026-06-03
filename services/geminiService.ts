import type { ExtractedJobInfo, ExtractedResumeInfo, ResumeTip, InterviewQA } from '../types';

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
  const res = await fetch(`${apiBase}/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, payload })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI generation failed: ${errText || res.statusText}`);
  }
  const data = await res.json();
  return data.result;
}

// ── Exported AI Service Functions ───────────────────────────────────────────

export const extractResumeInfo = async (resumeText: string): Promise<ExtractedResumeInfo> => {
  try {
    return await callBackendAI('extractResumeInfo', { resumeText });
  } catch (err) {
    return fallbackExtractResumeInfo(resumeText);
  }
};

export const extractJobInfo = async (jobDescriptionText: string): Promise<ExtractedJobInfo> => {
  try {
    return await callBackendAI('extractJobInfo', { jobDescriptionText });
  } catch (err) {
    return fallbackExtractJobInfo(jobDescriptionText);
  }
};

export const analyzeFit = async (resumeInfo: ExtractedResumeInfo, jobInfo: ExtractedJobInfo): Promise<{ score: number; justification: string }> => {
  try {
    return await callBackendAI('analyzeFit', { resumeInfo, jobInfo });
  } catch (err) {
    return fallbackAnalyzeFit(resumeInfo, jobInfo);
  }
};

export const generateBio = async (resumeInfo: ExtractedResumeInfo): Promise<string> => {
  try {
    return await callBackendAI('generateBio', { resumeInfo });
  } catch (err) {
    return `Experienced software professional specializing in ${resumeInfo.skills.slice(0, 4).join(', ')}. Passionate about developing scalable, high-performance web applications and building seamless user interfaces.`;
  }
};

export const generateCoverLetter = async (resumeInfo: ExtractedResumeInfo, jobTitle: string, jobDescription: string): Promise<string> => {
  try {
    return await callBackendAI('generateCoverLetter', { resumeInfo, jobTitle, jobDescription });
  } catch (err) {
    return `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${jobTitle} position. With my solid background in ${resumeInfo.skills.slice(0, 4).join(', ')}, I am confident that my technical skills and experience align perfectly with the requirements of this role.\n\nOver the course of my career, I have developed a strong skill set in software development: ${resumeInfo.experienceSummary}. I am passionate about engineering clean, maintainable, and high-performance solutions.\n\nThank you for your time and consideration. I welcome the opportunity to discuss how my qualifications can add value to your engineering team.\n\nSincerely,\n${resumeInfo.name}`;
  }
};

export const generateResumeTips = async (resumeInfo: ExtractedResumeInfo): Promise<ResumeTip[]> => {
  try {
    return await callBackendAI('generateResumeTips', { resumeInfo });
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
    return await callBackendAI('generateInterviewPrep', { resumeInfo, jobTitle, jobDescription });
  } catch (err) {
    return [
      { question: `Can you walk me through a technical challenge you faced while implementing ${resumeInfo.skills[0] || 'software components'}?`, sampleAnswer: "In a recent project, we faced performance bottlenecks during load times. I addressed this by profiling components, identifying unnecessary renders, and optimizing resource queries to reduce latency by 35%.", type: "Technical" },
      { question: "How do you handle changing product requirements or tight deadlines?", sampleAnswer: "I focus on open communication with product managers, break the work down into prioritised items, and ensure that code quality and core requirements are met first.", type: "Behavioral" },
      { question: `Why does the ${jobTitle} role at our company align with your career goals?`, sampleAnswer: "This role allows me to apply my skills in engineering while growing in technical architecture and contributing to product scalability.", type: "General" }
    ];
  }
};

export const generateInterviewQuestions = async (jobTitle: string, jobInfo: ExtractedJobInfo): Promise<InterviewQA[]> => {
  try {
    return await callBackendAI('generateInterviewQuestions', { jobTitle, jobInfo });
  } catch (err) {
    return [
      { question: `Explain the core concepts and design patterns of ${jobInfo.requiredSkills[0] || 'software architecture'}.`, sampleAnswer: "Look for candidates explaining MVC, design patterns, separation of concerns, and framework-specific optimization techniques.", type: "Technical" },
      { question: "How do you ensure code quality, test coverage, and documentation consistency in collaborative teams?", sampleAnswer: "Look for mentions of code reviews, CI/CD automated linting and tests, and writing clear inline comments/specs.", type: "Behavioral" }
    ];
  }
};

export const enhanceJobDescription = async (basicJD: string, jobTitle: string): Promise<string> => {
  try {
    return await callBackendAI('enhanceJobDescription', { basicJD, jobTitle });
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
    return await callBackendAI('analyzeDetailedFit', { resumeInfo, jobTitle, jobDescription });
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
    return await callBackendAI('chatPrepCoach', { resumeInfo, jobTitle, jobDescription, chatHistory, newMessage });
  } catch (err: any) {
    console.error("Prep Coach Chat Error:", err);
    const errStr = JSON.stringify(err) + " " + String(err);
    let errorSuffix = "";
    if (errStr.toLowerCase().includes("leaked") || errStr.toLowerCase().includes("api key") || errStr.toLowerCase().includes("permission_denied") || errStr.toLowerCase().includes("not configured")) {
      errorSuffix = "\n\n⚠️ **System Note:** The Gemini API Key is not configured correctly or has been disabled. Please ensure VITE_GEMINI_API_KEY or GEMINI_API_KEY is configured on your backend hosting platform (e.g. Render).";
    }
    return fallbackChatPrepCoach(resumeInfo, jobTitle, newMessage) + errorSuffix;
  }
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

export const fallbackChatPrepCoach = (
  resumeInfo: ExtractedResumeInfo,
  jobTitle: string,
  newMessage: string
): string => {
  const query = newMessage.toLowerCase();
  
  // 1. Printing statements / Basic Syntax / console.log
  if (query.includes('print') || query.includes('printing') || query.includes('console.log') || query.includes('syntax')) {
    return `### Basic Syntax & Printing Statements (JavaScript / Node.js)

Since you are preparing for a **${jobTitle}** role, JavaScript is key. Here is the basic syntax to print output:

1. **Standard Output (console.log):**
   \`\`\`javascript
   console.log("Hello, World!");
   \`\`\`

2. **Formatted / Table Output (console.table):**
   Perfect for printing arrays or objects cleanly during debugging:
   \`\`\`javascript
   const user = { name: "${resumeInfo.name || 'Candidate'}", role: "${jobTitle}" };
   console.table(user);
   \`\`\`

3. **Warnings & Errors:**
   \`\`\`javascript
   console.warn("This is a warning!");
   console.error("This is an error!");
   \`\`\`

*Would you like to try writing a function that prints a specific pattern or output?*`;
  }

  // 2. React specifics
  if (query.includes('react') || query.includes('hooks') || query.includes('useeffect') || query.includes('usestate')) {
    return `### React.js Interview Focus for **${jobTitle}**

Based on your resume matches, here are core React.js concepts you must know:

1. **State vs. Props:**
   * **State** is internal data managed within the component itself (e.g. \`const [val, setVal] = useState(init)\`).
   * **Props** are read-only properties passed down from parent to child components.

2. **React Lifecycle & Hooks:**
   * \`useState\`: Manages local reactive state variables.
   * \`useEffect\`: Performs side effects (API calls, subscriptions, DOM manipulation) in functional components.
   * \`useMemo\`: Memoizes expensive computations so they don't re-run on every render.
   * \`useCallback\`: Memoizes function instances to prevent unnecessary re-rendering of child components.

3. **Virtual DOM:**
   React keeps a lightweight representation of the real DOM in memory. When state changes, it diffs the virtual DOM with a snapshot, and updates only the changed elements in the real DOM (a process called *Reconciliation*).`;
  }

  // 3. Backend (Node, Express, APIs, MERN)
  if (query.includes('node') || query.includes('express') || query.includes('api') || query.includes('backend') || query.includes('mern')) {
    return `### Backend Architecture (Node.js & Express) for **${jobTitle}**

As a MERN Stack developer, here is a quick overview of key backend concepts:

1. **What is Node.js?**
   Node.js is an open-source, cross-platform JavaScript runtime built on Chrome's V8 engine. It uses an **Event-Driven, Non-blocking I/O model** which makes it lightweight and efficient for real-time applications.

2. **Creating a basic Express Server:**
   \`\`\`javascript
   const express = require('express');
   const app = express();
   
   app.use(express.json()); // Middleware to parse JSON request bodies
   
   app.get('/api/greeting', (req, res) => {
     res.json({ message: "Hello from HireMind AI Prep Coach!" });
   });
   
   app.listen(5000, () => console.log('Server running on port 5000'));
   \`\`\`

3. **Middlewares:**
   Middlewares are functions that have access to the request (\`req\`), response (\`res\`), and next middleware function (\`next\`) in the request-response cycle. They are commonly used for authentication, logging, and error handling.`;
  }

  // 4. Database (MongoDB, SQL)
  if (query.includes('mongo') || query.includes('db') || query.includes('database') || query.includes('mongoose')) {
    return `### Database Fundamentals (MongoDB & Mongoose)

Since you are matching for the **${jobTitle}** position, MongoDB is a critical skill.

1. **Document-Oriented Database:**
   MongoDB stores data in flexible, JSON-like documents. A table is called a **Collection**, and a row is a **Document**.

2. **Defining a schema in Mongoose:**
   \`\`\`javascript
   const mongoose = require('mongoose');
   
   const UserSchema = new mongoose.Schema({
     name: { type: String, required: true },
     skills: [String],
     createdAt: { type: Date, default: Date.now }
   });
   
   module.exports = mongoose.model('User', UserSchema);
   \`\`\`

3. **Common Mongoose Operations:**
   * **Create:** \`await User.create({ name: 'Utkarsh', skills: ['React'] })\`
   * **Read:** \`await User.find({ skills: 'React' })\`
   * **Update:** \`await User.updateOne({ name: 'Utkarsh' }, { $push: { skills: 'Node.js' } })\`
   * **Delete:** \`await User.deleteOne({ name: 'Utkarsh' })\``;
  }

  // 5. Mock Interview requests
  if (query.includes('question') || query.includes('test') || query.includes('mock') || query.includes('ask') || query.includes('practice')) {
    return `### Mock Interview Session for **${jobTitle}**

Let's run a quick mock test! Here is a question tailored to your background:

*"Can you explain how you would design a scalable feature matching your skill in ${resumeInfo.skills[0] || 'software engineering'}? What key performance trade-offs or optimizations would you consider?"*

Take a moment to draft your response, and I will critique it and suggest enhancements!`;
  }
  
  // 6. Generic Default
  return `### **Prep Coach Reference Guide**

For a **${jobTitle}** role, here is what you should focus on based on your background:

1. **Leverage your strengths:** Emphasize your background in **${resumeInfo.skills.slice(0, 4).join(', ') || 'software development'}**.
2. **Be ready for key questions:** Be prepared to talk about design patterns, APIs, and testing.
3. **Ask great questions:** Show interest in the team's agile process, deployment cycle, and code review standards.

*What specific technical topic or interview stage (e.g. React hooks, Express middlewares, MongoDB queries) would you like to prepare for next?*`;
};
