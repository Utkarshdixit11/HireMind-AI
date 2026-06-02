import React from 'react';

const SparkleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 3Q12 12 21 12Q12 12 12 21Q12 12 3 12Q12 12 12 3Z" fill="currentColor" />
    <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

const BrainIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.66z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.66z"/>
  </svg>
);

const RocketIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);

interface AboutPageProps {
  onBack: () => void;
}

const skills = [
  { name: 'React / TypeScript', level: 90, color: '#60a5fa' },
  { name: 'Node.js / Express', level: 82, color: '#34d399' },
  { name: 'AI / ML Integration', level: 78, color: '#a78bfa' },
  { name: 'UI/UX Design Systems', level: 85, color: '#fb923c' },
  { name: 'MongoDB / REST APIs', level: 80, color: '#f472b6' },
];

const highlights = [
  {
    icon: <CodeIcon />,
    color: '#60a5fa',
    title: 'Full-Stack Developer',
    desc: 'Building end-to-end applications with modern frameworks — React, TypeScript, Node.js, and cloud services.'
  },
  {
    icon: <BrainIcon />,
    color: '#a78bfa',
    title: 'AI Enthusiast',
    desc: 'Passionate about integrating AI into real-world products. HireMind AI leverages LLMs for resume analysis and job matching.'
  },
  {
    icon: <RocketIcon />,
    color: '#34d399',
    title: 'Product Builder',
    desc: 'Focused on crafting user-first products that solve genuine pain points — from concept to deployment.'
  }
];

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  return (
    <div className="about-page-wrap">
      
      {/* Hero Section */}
      <section className="about-hero">
        {/* Glow orbs */}
        <div className="about-glow-orb purple" />
        <div className="about-glow-orb blue" />

        <div className="about-hero-content animate-fade-rise">

          {/* Top bar: back button left, badge right */}
          <div className="about-hero-topbar">
            <button className="about-back-btn" onClick={onBack}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to App
            </button>

            <div className="about-badge">
              <span className="about-badge-dot" />
              HireMind AI — Creator's Story
            </div>
          </div>

          {/* Name block — no avatar */}
          <div className="about-profile-row">
            <div className="about-profile-info">
              <h1 className="about-name">Utkarsh Dixit</h1>
              <p className="about-role">Full-Stack Developer & AI Product Builder</p>
              <p className="about-location">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                India
              </p>
            </div>
          </div>

          {/* Contact Buttons */}
          <div className="about-contact-row">
            <a
              href="https://www.linkedin.com/in/utkarshdixit9"
              target="_blank"
              rel="noopener noreferrer"
              className="about-contact-btn linkedin"
            >
              <LinkedInIcon />
              Connect on LinkedIn
            </a>
            <a
              href="mailto:utkarshdixut925@gmail.com"
              className="about-contact-btn email"
            >
              <EmailIcon />
              utkarshdixut925@gmail.com
            </a>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="about-main-section">
        <div className="about-grid">

          {/* Left column: About + Story */}
          <div className="about-left-col">
            
            {/* About Me Card */}
            <div className="about-card animate-fade-rise">
              <div className="about-card-header">
                <div className="about-card-icon" style={{ background: 'rgba(95, 141, 252, 0.15)', color: '#5f8dfc' }}>
                  <SparkleIcon />
                </div>
                <h2 className="about-card-title">About Me</h2>
              </div>
              <div className="about-card-body">
                <p>
                  Hi! I'm <strong>Utkarsh Dixit</strong>, a passionate full-stack developer from India with a deep interest in building products that matter. I created <strong>HireMind AI</strong> to solve one of the most frustrating experiences in modern job searching — the mismatch between what candidates present and what recruiters actually need.
                </p>
                <p>
                  HireMind AI is my attempt to bridge that gap using AI-powered resume analysis, intelligent job matching, and real-time prep coaching — all in one platform built for both seekers and recruiters.
                </p>
                <p>
                  I believe technology should be accessible, intuitive, and beautiful. Every decision in HireMind's UI/UX is deliberate — from the glassmorphic dark theme to the animated data previews.
                </p>
              </div>
            </div>

            {/* What I Built Card */}
            <div className="about-card animate-fade-rise">
              <div className="about-card-header">
                <div className="about-card-icon" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }}>
                  <RocketIcon />
                </div>
                <h2 className="about-card-title">What is HireMind AI?</h2>
              </div>
              <div className="about-card-body">
                <div className="about-features-list">
                  <div className="about-feature-item">
                    <span className="about-feature-dot" style={{ background: '#60a5fa' }} />
                    <div>
                      <strong>Resume</strong>
                      <p>Upload any resume against a job description and get an instant match percentage with gap analysis and suggestions.</p>
                    </div>
                  </div>
                  <div className="about-feature-item">
                    <span className="about-feature-dot" style={{ background: '#a78bfa' }} />
                    <div>
                      <strong>Smart Job Board</strong>
                      <p>Recruiters post jobs; seekers browse, apply, and track their applications — all in one real-time dashboard.</p>
                    </div>
                  </div>
                  <div className="about-feature-item">
                    <span className="about-feature-dot" style={{ background: '#34d399' }} />
                    <div>
                      <strong>Candidate Ranking</strong>
                      <p>Recruiters get AI-ranked applicants with automatic filtering of underqualified profiles.</p>
                    </div>
                  </div>
                  <div className="about-feature-item">
                    <span className="about-feature-dot" style={{ background: '#fb923c' }} />
                    <div>
                      <strong>Interview Prep Coach</strong>
                      <p>AI generates personalised preparation tips, likely questions, and improvement roadmaps for each job role.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Skills + Highlights */}
          <div className="about-right-col">

            {/* Highlights */}
            <div className="about-highlights-grid">
              {highlights.map((h, i) => (
                <div key={i} className="about-highlight-card animate-fade-rise">
                  <div className="about-highlight-icon" style={{ color: h.color, background: `${h.color}18` }}>
                    {h.icon}
                  </div>
                  <h3 className="about-highlight-title">{h.title}</h3>
                  <p className="about-highlight-desc">{h.desc}</p>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="about-card animate-fade-rise">
              <div className="about-card-header">
                <div className="about-card-icon" style={{ background: 'rgba(167, 139, 250, 0.12)', color: '#a78bfa' }}>
                  <CodeIcon />
                </div>
                <h2 className="about-card-title">Core Skills</h2>
              </div>
              <div className="about-card-body">
                <div className="about-skills-list">
                  {skills.map((skill, i) => (
                    <div key={i} className="about-skill-row">
                      <div className="about-skill-label">
                        <span>{skill.name}</span>
                        <span style={{ color: skill.color, fontSize: '0.78rem', fontWeight: 600 }}>{skill.level}%</span>
                      </div>
                      <div className="about-skill-track">
                        <div
                          className="about-skill-fill"
                          style={{
                            width: `${skill.level}%`,
                            background: `linear-gradient(90deg, ${skill.color}88, ${skill.color})`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Get in Touch Card */}
            <div className="about-card about-contact-card animate-fade-rise">
              <div className="about-card-header">
                <div className="about-card-icon" style={{ background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa' }}>
                  <EmailIcon />
                </div>
                <h2 className="about-card-title">Get in Touch</h2>
              </div>
              <div className="about-card-body">
                <p style={{ marginBottom: '16px' }}>
                  Open to collaborations, freelance projects, and opportunities. Feel free to reach out!
                </p>
                <div className="about-contact-details">
                  <div className="about-contact-detail-row">
                    <EmailIcon />
                    <a href="mailto:utkarshdixut925@gmail.com" className="about-detail-link">
                      utkarshdixut925@gmail.com
                    </a>
                  </div>
                  <div className="about-contact-detail-row">
                    <LinkedInIcon />
                    <a href="https://www.linkedin.com/in/utkarshdixit9" target="_blank" rel="noopener noreferrer" className="about-detail-link">
                      linkedin.com/in/utkarshdixit9
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};
