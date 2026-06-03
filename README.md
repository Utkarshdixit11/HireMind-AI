# HireMind AI — Where Careers Rise

![HireMind AI Banner](./Screenshot/intro.png)

**HireMind AI** is a premium, high-performance, cinematic recruitment ecosystem designed to streamline the career journey for job seekers and scale talent pipelines for companies. By utilizing state-of-the-art server-side integration with **Google Gemini AI**, HireMind parses resumes, checks matching scores, guides applicants with an interactive AI prep coach, and automates recruiter workflows.

---

## 🚀 Key Features

### 👤 For Job Seekers
* **Smart Resume Parser:** Automatically extract technical/soft skills, education, and career experience from your resume document.
* **Automated Job Match:** Review real-time suitability compatibility scores (0-100%) against open vacancies with detailed gap justifications.
* **Interactive Prep Coach:** Chat with a tailored AI interview coach that references your resume history and target job details to prepare you for technical, behavioral, and situational questions.
* **Cover Letter Builder:** Instantly generate bespoke cover letters tailored to your profile and the target job description.

### 💼 For Recruiters & Companies
* **Job Architect:** Auto-generate professional, SEO-friendly job listings from raw drafts or bullet points.
* **AI Candidate Ranking:** View a clean shortlist of top applicants automatically scored and ranked by profile compatibility.
* **Fit Analysis:** Get granular analysis on candidates' missing skills, improvements, and interview preparation points.
* **Sleek Pipeline Tracker:** Manage candidate stages from shortlisted to interviewed and offered in a smooth Kanban-style interface.

---

## 🛠️ Tech Stack

### Frontend
* **Core:** React, TypeScript, Vite
* **Styling:** Custom Vanilla CSS (with sleek dark-mode, glassmorphism, and responsive layouts)
* **API Communication:** Fetch API proxying to secure server-side routes

### Backend
* **Server Runtime:** Node.js, Express
* **Database:** MongoDB Atlas (Mongoose ODM)
* **Authentication:** JWT, Express-Session, and Passport.js (Google OAuth 2.0 & Local verification)
* **AI Engine:** `@google/genai` (utilizing Gemini 2.5 Flash with custom rate-limiting retry policies)

---

## 📸 Application Showcase

### 1. Home Dashboard & Authentication
Landing page overview with seamless secure Local & Google login overlays.
![Home Dashboard](./Screenshot/home.png)
![Authentication Overlays](./Screenshot/loginandsignup.png)

### 2. The Job Seeker Experience
Upload resumes, view suitable listings, check compatibility scores, and prepare with the AI Prep Coach.
![Resume Upload](./Screenshot/UploadResume.png)
![Job Search & Suitability Match](./Screenshot/home_jobseeker.png)
![Matching Scores](./Screenshot/matching_job.png)
![AI Prep Coach Chat](./Screenshot/prep_Coach_Message.png)

### 3. The Recruiter Workspace
Post new job openings, manage active listings, review candidate rankings, and view fit analyses.
![Recruiter Dashboard](./Screenshot/recruiterHome.png)
![Create Job Postings](./Screenshot/PostJob_recruiter.png)
![Detailed Fit Analysis](./Screenshot/Detailed analysis.png)
![Candidate Tracker Pipeline](./Screenshot/Candigate tracker.png)
