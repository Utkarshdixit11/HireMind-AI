import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onGoToDashboard?: () => void;
}

// ── Premium Sparkle Brand Logo Icon ───────────────────────────────────

const StepSparkleIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color }} className="step-sparkle-logo">
    <path d="M12 3Q12 12 21 12Q12 12 12 21Q12 12 3 12Q12 12 12 3Z" fill="currentColor" />
    <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

// ── Workflow Steps Definitions ────────────────────────────────────────

const SEEKER_STEPS = [
  {
    title: 'Smart Resume Parse',
    color: '#34d399',
    desc: 'Our advanced AI engine extracts skills, experience levels, and potential career paths from your PDF in seconds.',
    type: 'seeker-parse'
  },
  {
    title: 'Automated Job Match',
    color: '#60a5fa',
    desc: 'Instantly view a compatibility score showing how well your profile matches any active listing.',
    type: 'seeker-match'
  },
  {
    title: 'Interactive Interview Coach',
    color: '#fbbf24',
    desc: 'Practice tailored behavioral and technical questions based on your background and match score.',
    type: 'seeker-coach'
  },
  {
    title: 'Tailored Cover Letters',
    color: '#a78bfa',
    desc: 'Autogenerate contextual cover letters optimized for the specific requirements of each role.',
    type: 'seeker-letter'
  }
];

const EMPLOYER_STEPS = [
  {
    title: 'Job Architect',
    color: '#f472b6',
    desc: 'Draft simple bullet points and let AI generate clear, SEO-friendly, high-attraction job descriptions.',
    type: 'employer-architect'
  },
  {
    title: 'AI Candidate Ranking',
    color: '#34d399',
    desc: 'Applicants are automatically scored and ranked, giving you an instant shortlist of top fits.',
    type: 'employer-rank'
  },
  {
    title: 'Candidate Fit Analysis',
    color: '#60a5fa',
    desc: 'Analyze candidates with detailed breakdowns of matched requirements and skill gap analysis.',
    type: 'employer-analysis'
  },
  {
    title: 'Seamless Hiring Pipeline',
    color: '#f472b6',
    desc: 'Move candidates through stages and manage communications and interviews in one central hub.',
    type: 'employer-pipeline'
  }
];

// ── Mini Animation Previews ───────────────────────────────────────────

const StepAnimation: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    // Seeker Animations
    case 'seeker-parse':
      return (
        <div className="wf-anim-box parse-anim">
          <div className="wf-doc">
            <div className="wf-doc-title">Resume.pdf</div>
            <div className="wf-doc-text">Vansh Sharma — Software Engineer</div>
            <div className="wf-doc-text sm">Experience: 5 years</div>
            <div className="wf-doc-skills">
              <span className="wf-tag">React</span>
              <span className="wf-tag">Node</span>
            </div>
          </div>
          <div className="wf-scanner-bar" />
          <div className="wf-extracted-tags">
            <span className="wf-glow-tag green">✦ React extracted</span>
            <span className="wf-glow-tag blue">✦ TypeScript extracted</span>
          </div>
        </div>
      );
    case 'seeker-match':
      return (
        <div className="wf-anim-box match-anim">
          <div className="wf-match-card">
            <div className="wf-match-header">
              <span className="wf-icon"><StepSparkleIcon color="#60a5fa" /></span>
              <div>
                <div className="wf-match-title" style={{ marginLeft: '6px' }}>Senior React Engineer</div>
                <div className="wf-match-comp" style={{ marginLeft: '6px' }}>TechCorp Inc.</div>
              </div>
            </div>
            <div className="wf-match-score-circle">
              <svg width="60" height="60" viewBox="0 0 36 36" className="wf-circular-chart">
                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="circle" strokeDasharray="94, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <text x="18" y="21" className="percentage">94%</text>
              </svg>
            </div>
          </div>
        </div>
      );
    case 'seeker-coach':
      return (
        <div className="wf-anim-box coach-anim">
          <div className="wf-bubble ai">✦ Explain how useEffect works?</div>
          <div className="wf-bubble user">It runs side effects after render...</div>
          <div className="wf-tip-box">💡 Pro-Tip: Mention cleanups for events!</div>
        </div>
      );
    case 'seeker-letter':
      return (
        <div className="wf-anim-box letter-anim">
          <div className="wf-letter-paper">
            <div className="wf-letter-text">Dear Hiring Manager,</div>
            <div className="wf-letter-text indent typing-text">I am excited to apply for the Senior React Developer role... My 5+ years of experience with React, TypeScript and AI integration aligns perfectly...</div>
          </div>
        </div>
      );

    // Employer Animations
    case 'employer-architect':
      return (
        <div className="wf-anim-box architect-anim">
          <div className="wf-architect-split">
            <div className="wf-draft">
              <div className="wf-draft-title">Raw Notes</div>
              <p>"need react dev fast. remote, pay well, senior, 5yr"</p>
            </div>
            <div className="wf-arrow">✦</div>
            <div className="wf-jd">
              <div className="wf-jd-title">Senior React Architect</div>
              <div className="wf-jd-tag">✦ Remote-first</div>
              <div className="wf-jd-points">
                <span>· 5+ Years Frontend Architecture</span>
                <span>· Competitive compensation ($120k+)</span>
              </div>
            </div>
          </div>
        </div>
      );
    case 'employer-rank':
      return (
        <div className="wf-anim-box rank-anim">
          <div className="wf-rank-list">
            <div className="wf-rank-item top">
              <span className="wf-num">#1</span>
              <span className="wf-name">Shreya Sharma</span>
              <span className="wf-score high">96% fit</span>
            </div>
            <div className="wf-rank-item mid">
              <span className="wf-num">#2</span>
              <span className="wf-name">Alex Kumar</span>
              <span className="wf-score mid">88% fit</span>
            </div>
            <div className="wf-rank-item low">
              <span className="wf-num">#3</span>
              <span className="wf-name">Manish Verma</span>
              <span className="wf-score low">61% fit</span>
            </div>
          </div>
        </div>
      );
    case 'employer-analysis':
      return (
        <div className="wf-anim-box analysis-anim">
          <div className="wf-analysis-card">
            <div className="wf-analysis-item matched">
              <span className="wf-check">✓</span>
              <span className="wf-label">TypeScript & React Architecture</span>
            </div>
            <div className="wf-analysis-item matched">
              <span className="wf-check">✓</span>
              <span className="wf-label">5+ Years Industry Experience</span>
            </div>
            <div className="wf-analysis-item missing">
              <span className="wf-cross">✗</span>
              <span className="wf-label">Kubernetes & DevOps experience</span>
            </div>
          </div>
        </div>
      );
    case 'employer-pipeline':
      return (
        <div className="wf-anim-box pipeline-anim">
          <div className="wf-pipeline-cols">
            <div className="wf-pipe-col">
              <span className="wf-col-title">Shortlist</span>
              <div className="wf-pipe-card placeholder">Shreya S.</div>
            </div>
            <div className="wf-pipe-col">
              <span className="wf-col-title">Interview</span>
              <div className="wf-pipe-card placeholder pulse-card">Alok K.</div>
            </div>
            <div className="wf-pipe-col">
              <span className="wf-col-title">Offered</span>
              <div className="wf-pipe-card offer-card">Priya S. 🎉</div>
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
};

// ── Main Landing Page ────────────────────────────────────────────────

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, onGoToDashboard }) => {
  const [viewMode, setViewMode] = useState<'seeker' | 'employer'>('seeker');
  const [activeStep, setActiveStep] = useState(0);
  const { loginWithGoogle, isAuthenticated } = useAuth();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 4);
    }, 4500);
  };

  const handleStepHover = (index: number) => {
    setActiveStep(index);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleStepLeave = () => {
    startTimer();
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="lp-wrap">

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-badge animate-fade-rise">
          <span className="lp-badge-dot" />
          Powered by HireMind AI Engine
          <span className="lp-badge-sep">·</span>
          Built for careers
        </div>

        <h1 className="lp-hero-title animate-fade-rise">
          Where <em>careers</em> rise<br />
          through the <em>silence.</em>
        </h1>
        <p className="lp-hero-sub animate-fade-rise-delay">
          The AI-powered workspace for job seekers and recruiters. See it in action below.
        </p>

        {isAuthenticated ? (
          <div className="lp-hero-ctas animate-fade-rise-delay-2">
            <button className="lp-btn-primary" onClick={onGoToDashboard} id="btn-hero-dashboard">
              Go to Dashboard
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        ) : (
          <div className="lp-hero-ctas animate-fade-rise-delay-2">
            <button className="lp-btn-primary" onClick={() => onOpenAuth('signup')} id="btn-hero-signup">
              Get Started Free
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <button className="lp-btn-google" onClick={() => loginWithGoogle(viewMode === 'employer' ? 'provider' : 'seeker')} id="btn-hero-google">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
          </div>
        )}

        {/* Scroll hint */}
        <div className="lp-scroll-hint animate-fade-rise-delay-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          See how it works
        </div>
      </section>

      {/* ── INTERACTIVE WORKFLOW SECTION ── */}
      <section className="lp-workflow-section">
        <div className="lp-workflow-header">
          <span className="lp-workflow-tag">How it works</span>
          <h2 className="lp-workflow-title">Inside HireMind AI</h2>
          <p className="lp-workflow-sub">
            A comprehensive, dual-sided ecosystem designed to streamline careers for talents and scale pipelines for enterprise.
          </p>
        </div>

        {/* Interactive Toggle Switch */}
        <div className="workflow-toggle-container">
          <button 
            className={`workflow-toggle-btn${viewMode === 'seeker' ? ' active' : ''}`}
            onClick={() => { setViewMode('seeker'); setActiveStep(0); }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <StepSparkleIcon color={viewMode === 'seeker' ? '#fff' : 'rgba(255,255,255,0.4)'} />
              Job Seekers
            </span>
          </button>
          <button 
            className={`workflow-toggle-btn${viewMode === 'employer' ? ' active' : ''}`}
            onClick={() => { setViewMode('employer'); setActiveStep(0); }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <StepSparkleIcon color={viewMode === 'employer' ? '#fff' : 'rgba(255,255,255,0.4)'} />
              Recruiters & Co.
            </span>
          </button>
          <div className={`workflow-toggle-slider ${viewMode}`} />
        </div>

        <div className="workflow-grid single-col">
          {/* Seeker Column */}
          {viewMode === 'seeker' && (
            <div className="workflow-card seeker-card animate-fade-in">
              <div className="workflow-card-header">
                <h3 className="workflow-card-title">For Job Seekers</h3>
                <p className="workflow-card-desc">Optimize your resume, coach with AI, and land the ideal role.</p>
              </div>

              <div className="workflow-steps">
                {SEEKER_STEPS.map((step, i) => (
                  <button
                    key={step.type}
                    className={`workflow-step${activeStep === i ? ' active' : ''}`}
                    style={{ '--accent-color': step.color } as React.CSSProperties}
                    onMouseEnter={() => handleStepHover(i)}
                    onMouseLeave={handleStepLeave}
                  >
                    <div className="wf-step-header">
                      <span className="wf-step-num">0{i + 1}</span>
                      <div className="wf-step-title-wrap">
                        <span className="wf-step-icon"><StepSparkleIcon color={step.color} /></span>
                        <span className="wf-step-title" style={{ marginLeft: '4px' }}>{step.title}</span>
                      </div>
                    </div>
                    <div className="wf-step-body">
                      <p className="wf-step-desc">{step.desc}</p>
                      <div className="wf-anim-container">
                        <StepAnimation type={step.type} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Employer Column */}
          {viewMode === 'employer' && (
            <div className="workflow-card employer-card animate-fade-in">
              <div className="workflow-card-header">
                <h3 className="workflow-card-title">For Recruiters & Companies</h3>
                <p className="workflow-card-desc">Draft descriptions, rank applicants, and select premium fits.</p>
              </div>

              <div className="workflow-steps">
                {EMPLOYER_STEPS.map((step, i) => (
                  <button
                    key={step.type}
                    className={`workflow-step${activeStep === i ? ' active' : ''}`}
                    style={{ '--accent-color': step.color } as React.CSSProperties}
                    onMouseEnter={() => handleStepHover(i)}
                    onMouseLeave={handleStepLeave}
                  >
                    <div className="wf-step-header">
                      <span className="wf-step-num">0{i + 1}</span>
                      <div className="wf-step-title-wrap">
                        <span className="wf-step-icon"><StepSparkleIcon color={step.color} /></span>
                        <span className="wf-step-title" style={{ marginLeft: '4px' }}>{step.title}</span>
                      </div>
                    </div>
                    <div className="wf-step-body">
                      <p className="wf-step-desc">{step.desc}</p>
                      <div className="wf-anim-container">
                        <StepAnimation type={step.type} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      {!isAuthenticated && (
        <section className="lp-cta-section">
          <div className="lp-cta-inner">
            <div className="lp-cta-glow" />
            <h2 className="lp-cta-title">Ready to start?</h2>
            <p className="lp-cta-sub">Join thousands of professionals and companies using HireMind AI.</p>
            <button className="lp-btn-primary lg" onClick={() => onOpenAuth('signup')} id="btn-cta-final">
              Create Free Account
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <button className="lp-cta-signin" onClick={() => onOpenAuth('login')} id="btn-cta-signin">
              Already have an account? Sign in
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
