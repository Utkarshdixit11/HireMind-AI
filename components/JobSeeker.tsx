import React, { useState, useCallback, useEffect } from 'react';
import type { Job, Applicant } from '../types';
import { getTextFromPdf } from '../services/pdfService';
import { 
  extractResumeInfo, 
  analyzeFit, 
  generateBio, 
  analyzeDetailedFit, 
  DetailedAnalysis,
  chatPrepCoach,
  ChatMessage
} from '../services/geminiService';
import { UploadIcon } from './icons/UploadIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface Props {
  jobs: Job[];
  applicants: Applicant[];
  addApplicant: (a: Applicant) => void;
  applications: any[];
  onApply: (jobId: string, applicant: Applicant, score: number, justification: string) => void;
  view: string;
}

const FileIco = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const BriefIco = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="2" y1="12" x2="22" y2="12"/></svg>;
const PersonIco = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const LightIco = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M12 2a7 7 0 0 1 7 7c0 3.5-2.5 6-4 7H9c-1.5-1-4-3.5-4-7a7 7 0 0 1 7-7z"/><line x1="9" y1="21" x2="15" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/></svg>;
const ExclamationIco = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

const Dot = () => <><div className="hm-dot"/><div className="hm-dot"/><div className="hm-dot"/></>;
const Spin = ({ label }: { label?: string }) => (
  <div className="hm-spinner"><Dot />{label && <span style={{marginLeft:8,fontSize:'0.82rem',color:'rgba(255,255,255,0.3)'}}>{label}</span>}</div>
);

const ChatMessageBubble: React.FC<{ msg: ChatMessage; isLatest: boolean }> = ({ msg, isLatest }) => {
  const isModel = msg.role === 'model';
  const [displayedText, setDisplayedText] = useState(isModel && isLatest ? '' : msg.text);
  const [isTyping, setIsTyping] = useState(isModel && isLatest);

  useEffect(() => {
    if (isModel && isLatest && displayedText === '') {
      let index = 0;
      let current = '';
      const timer = setInterval(() => {
        if (index < msg.text.length) {
          current += msg.text.charAt(index);
          setDisplayedText(current);
          index++;
        } else {
          setIsTyping(false);
          clearInterval(timer);
        }
      }, 3);
      return () => clearInterval(timer);
    } else {
      setDisplayedText(msg.text);
      setIsTyping(false);
    }
  }, [msg.text, isLatest, isModel]);

  const renderFormattedText = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, idx) => {
      if (idx % 2 === 1) {
        return <strong key={idx} style={{ color: '#fff', fontWeight: 600 }}>{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div
      style={{
        alignSelf: isModel ? 'flex-start' : 'flex-end',
        maxWidth: '85%',
        background: isModel ? 'rgba(255,255,255,0.03)' : 'rgba(96,165,250,0.12)',
        border: isModel ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(96,165,250,0.25)',
        borderRadius: isModel ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
        padding: '12px 14px',
        transition: 'all 0.25s ease'
      }}
    >
      {isModel && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
          <SparklesIcon />
          Prep Coach
        </div>
      )}
      <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
        {renderFormattedText(displayedText)}
        {isTyping && (
          <span 
            style={{ 
              marginLeft: '2px', 
              color: '#34d399', 
              fontWeight: 'bold',
            }}
          >
            |
          </span>
        )}
      </p>
    </div>
  );
};

export const JobSeeker: React.FC<Props> = ({ jobs, addApplicant, applicants, applications, onApply, view }) => {
  // Load resume dynamically from localStorage so seeker does not need to re-upload on tab change / refresh
  const [applicant, setApplicant] = useState<Applicant | null>(() => {
    const saved = localStorage.getItem('hm_seeker_resume');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [jobFits, setJobFits] = useState<any[]>([]);
  const [bio, setBio] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');

  // Detailed JD matching state
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailedAnalysis, setDetailedAnalysis] = useState<DetailedAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [errorAnalysis, setErrorAnalysis] = useState<string | null>(null);

  // Chat prep coach state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading]);

  // Initial welcome message setup
  const startPrepChat = () => {
    if (!selectedJob || !detailedAnalysis || !applicant) return;
    
    const initialMsg: ChatMessage = {
      role: 'model',
      text: `Hello! I am your HireMind AI Prep Coach. 

I've analyzed your resume and the **${selectedJob.title}** job description. Here are your key prep notes:

📌 **Key Focus Areas:**
${detailedAnalysis.prepGuide.map(step => `• ${step}`).join('\n')}

💡 **Strong Matches on Resume:**
${applicant.extractedInfo.skills.slice(0, 5).join(', ')}

⚠️ **Identified Skill Gaps:**
${detailedAnalysis.missingThings.length > 0 ? detailedAnalysis.missingThings.map(gap => `• ${gap}`).join('\n') : '• None! You meet the skill requirements.'}

How would you like to prepare today? You can ask me to test you with mock questions, explain concepts, or review your answers!`
    };
    
    setChatMessages([initialMsg]);
    setShowChat(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading || !applicant || !selectedJob) return;

    const userMsg = chatInput.trim();
    const updatedHistory = [...chatMessages, { role: 'user' as const, text: userMsg }];
    setChatMessages(updatedHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await chatPrepCoach(
        applicant.extractedInfo,
        selectedJob.title,
        selectedJob.description,
        chatMessages,
        userMsg
      );
      setChatMessages([...updatedHistory, { role: 'model' as const, text: response }]);
    } catch (err) {
      setChatMessages([...updatedHistory, { role: 'model' as const, text: "Sorry, I had trouble generating a response. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setLoading(true); setError(null); setApplicant(null); setJobFits([]); setBio(null);
    setDetailedAnalysis(null); setSelectedJob(null); setFileName(file.name);
    try {
      const text = file.type === 'application/pdf' ? await getTextFromPdf(file) : await file.text();
      const info = await extractResumeInfo(text);
      const a: Applicant = { id: `a-${Date.now()}`, fileName: file.name, resumeText: text, extractedInfo: info };
      setApplicant(a); 
      addApplicant(a);
      
      // Persist resume locally
      localStorage.setItem('hm_seeker_resume', JSON.stringify(a));
    } catch (err: any) { 
      setError(err.message || 'Failed to process resume.'); 
    } finally { 
      setLoading(false); 
    }
  };

  const analyzeJobs = useCallback(async (a: Applicant) => {
    if (!a || jobs.length === 0) return;
    setAnalyzing(true);
    try {
      const fits = await Promise.all(jobs.map(async j => {
        const { score, justification } = await analyzeFit(a.extractedInfo, j.extractedInfo);
        return { jobId: j.id, jobTitle: j.title, score, justification };
      }));
      setJobFits(fits.sort((x, y) => y.score - x.score));
      if (fits.length > 0) {
        const topJob = jobs.find(j => j.id === fits[0].jobId);
        if (topJob) setSelectedJob(topJob);
      }
    } catch { 
      setError('Could not analyze job fits.'); 
    } finally {
      setAnalyzing(false);
    }
  }, [jobs]);

  useEffect(() => { 
    if (applicant && jobs.length > 0) {
      analyzeJobs(applicant); 
    }
  }, [applicant, jobs, analyzeJobs]);

  const loadDetailedAnalysis = async (job: Job) => {
    if (!applicant) return;
    setLoadingAnalysis(true);
    setErrorAnalysis(null);
    setDetailedAnalysis(null);
    try {
      const analysis = await analyzeDetailedFit(applicant.extractedInfo, job.title, job.description);
      setDetailedAnalysis(analysis);
    } catch {
      setErrorAnalysis('Failed to generate detailed match analysis.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    if (selectedJob && applicant) {
      loadDetailedAnalysis(selectedJob);
      setShowChat(false);
      setChatMessages([]);
    }
  }, [selectedJob]);

  const scoreClass = (s: number) => s >= 85 ? 'hm-score-high' : s >= 70 ? 'hm-score-mid' : 'hm-score-low';

  const getApplicationStatus = (jobId: string) => {
    const app = applications.find(app => app.jobId === jobId && app.applicantId === applicant?.id);
    return app ? app.status : 'Not Applied';
  };

  // ── PAGE 1: RESUME PARSER & BIO GENERATOR ──
  if (view === 'resume') {
    return (
      <div className="hm-grid-seeker-resume">
        
        {/* Left Side: Upload Resume */}
        <div className="flex-col-gap-4">
          <div className="hm-card glass-card">
            <div className="hm-card-title">
              <div className="hm-card-icon"><FileIco /></div>
              Upload Resume
            </div>
            <p style={{fontSize:'0.85rem',color:'rgba(255,255,255,0.35)',marginBottom:14}}>
              PDF or TXT — AI extracts and scores your profile instantly.
            </p>

            {applicant && (
              <div style={{
                background: 'rgba(52,211,153,0.06)',
                border: '1px solid rgba(52,211,153,0.15)',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>✓ ACTIVE RESUME LOADED</div>
                <div style={{ fontSize: '0.84rem', color: '#fff', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {applicant.fileName || 'parsed_resume.pdf'}
                </div>
              </div>
            )}

            <label className="hm-upload-label" htmlFor="resume-upload">
              <UploadIcon />
              <span>{loading ? 'Processing…' : applicant ? 'Upload New Resume' : fileName || 'Choose your resume'}</span>
              <input id="resume-upload" type="file" style={{display:'none'}} onChange={handleFile} accept=".pdf,.txt" disabled={loading}/>
            </label>
            {loading && <Spin label="Extracting profile data…"/>}
            {error && <div className="hm-error">{error}</div>}
          </div>
        </div>

        {/* Right Side: Parsed profile & LinkedIn Bio */}
        <div className="flex-col-gap-4">
          {!applicant ? (
            <div className="hm-card glass-card" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="hm-empty">
                <div className="hm-empty-icon"><PersonIco /></div>
                <p>Upload your resume to see your parsed profile here.</p>
              </div>
            </div>
          ) : (
            <div className="hm-card glass-card animate-fade-rise">
              <div className="hm-card-title">
                <div className="hm-card-icon"><PersonIco /></div>
                {applicant.extractedInfo.name}
              </div>
              <div className="flex-col-gap-3">
                {[
                  ['Contact', applicant.extractedInfo.contact],
                  ['Education', applicant.extractedInfo.education],
                  ['Experience Summary', applicant.extractedInfo.experienceSummary]
                ].map(([l, v]) => (
                  <div key={l} className="hm-stat">
                    <div className="hm-stat-label">{l}</div>
                    <div className="hm-stat-value" style={{ fontSize: '0.86rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap' }}>{v}</div>
                  </div>
                ))}
                <div>
                  <div className="hm-stat-label" style={{marginBottom:8}}>Skills</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {applicant.extractedInfo.skills.map(s => <span key={s} className="hm-skill">{s}</span>)}
                  </div>
                </div>
              </div>
              <div className="hm-divider"/>
              <button 
                onClick={async () => {
                  setBioLoading(true); setBio(null);
                  try { setBio(await generateBio(applicant.extractedInfo)); }
                  catch { setError('Failed to generate bio.'); }
                  finally { setBioLoading(false); }
                }} 
                disabled={bioLoading} 
                className="hm-btn hm-btn-accent"
              >
                <SparklesIcon/>
                {bioLoading ? 'Generating…' : 'Generate LinkedIn Bio'}
              </button>
              {bioLoading && <Spin label="Crafting your bio…"/>}
              {bio && (
                <div className="hm-bio" style={{ marginTop: '16px' }}>
                  <div className="hm-bio-label"><SparklesIcon/> LinkedIn Bio</div>
                  <div className="hm-bio-text" style={{ whiteSpace: 'pre-wrap' }}>{bio}</div>
                  <button className="hm-btn hm-btn-ghost" style={{ marginTop: '10px' }} onClick={() => navigator.clipboard.writeText(bio)}>
                    📋 Copy LinkedIn Bio
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    );
  }

  // ── PAGE 2: SUITABLE JOB MATCHES ──
  if (view === 'matches') {
    return (
      <div className="hm-card glass-card" style={{ minHeight: '400px' }}>
        <div className="hm-card-title">
          <div className="hm-card-icon"><BriefIco /></div>
          Suitable Roles Mapped to Your Resume
          {jobFits.length > 0 && <span className="hm-count">{jobFits.length} roles</span>}
        </div>

        {!applicant ? (
          <div className="hm-empty">
            <div className="hm-empty-icon"><BriefIco /></div>
            <p>Upload your resume first on the <strong>Resume Parser</strong> page to discover matched roles.</p>
          </div>
        ) : analyzing ? (
          <div className="hm-empty">
            <Spin label="Matching jobs with AI..."/>
          </div>
        ) : jobFits.length === 0 ? (
          <div className="hm-empty">
            <div className="hm-empty-icon"><BriefIco /></div>
            <p>No active job postings on the board to match against.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', marginTop: '16px' }}>
            {jobFits.map((fit) => {
              const status = getApplicationStatus(fit.jobId);
              return (
                <div
                  key={fit.jobId}
                  className="hm-match-card"
                  style={{
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '18px',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
                        {fit.jobTitle}
                      </h4>
                      <span className={`hm-score ${scoreClass(fit.score)}`} style={{ padding: '3px 8px', fontSize: '0.8rem' }}>
                        {fit.score}% Fit
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginTop: '8px', lineHeight: '1.4' }}>
                      {fit.justification}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                    <div style={{ fontsize: '0.78rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Status: </span>
                      <span style={{ color: status === 'Applied' ? '#60a5fa' : status === 'Shortlisted' ? '#34d399' : 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                        {status}
                      </span>
                    </div>

                    {status === 'Not Applied' ? (
                      <button
                        className="hm-btn hm-btn-accent"
                        style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '8px', minHeight: 'unset' }}
                        onClick={() => onApply(fit.jobId, applicant, fit.score, fit.justification)}
                      >
                        Apply Now
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>
                        Applied ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── PAGE 3: PREPARATION COACH / DETAILED JD ANALYSIS ──
  if (view === 'prep') {
    return (
      <div className="hm-grid-seeker-prep">
        
        {/* Left: Matched roles list to select from */}
        <div className="flex-col-gap-4">
          <div className="hm-card glass-card">
            <div className="hm-card-title">
              <div className="hm-card-icon"><BriefIco /></div>
              Select Job to Analyze
            </div>
            {!applicant ? (
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)' }}>Upload a resume first to select matching jobs.</p>
            ) : jobFits.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)' }}>No matching jobs available.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {jobFits.map((fit) => (
                  <button
                    key={fit.jobId}
                    className={`hm-job-item${selectedJob?.id === fit.jobId ? ' selected' : ''}`}
                    onClick={() => {
                      const job = jobs.find(j => j.id === fit.jobId);
                      if (job) setSelectedJob(job);
                    }}
                    style={{ width: '100%', textAlign: 'left' }}
                  >
                    <div className="hm-job-dot" />
                    {fit.jobTitle} ({fit.score}%)
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Detailed analysis panel */}
        <div className="hm-card glass-card" style={{ minHeight: '400px' }}>
          <div className="hm-card-title">
            <div className="hm-card-icon"><LightIco /></div>
            Detailed Fit Analysis & Interview Prep
          </div>

          {!applicant ? (
            <div className="hm-empty">
              <div className="hm-empty-icon"><LightIco /></div>
              <p>Upload a resume first on the <strong>Resume Parser</strong> page.</p>
            </div>
          ) : !selectedJob ? (
            <div className="hm-empty">
              <div className="hm-empty-icon"><LightIco /></div>
              <p>Select a job from the list on the left to display its preparation guide.</p>
            </div>
          ) : loadingAnalysis ? (
            <div className="hm-empty">
              <Spin label="Analyzing alignment with AI engine..."/>
            </div>
          ) : errorAnalysis ? (
            <div className="hm-error">{errorAnalysis}</div>
          ) : detailedAnalysis ? (
            showChat ? (
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: '450px' }}>
                {/* Chat Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', color: '#fff', fontWeight: 600, margin: 0 }}>💬 Interview Prep Coach</h3>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0 0' }}>Role: {selectedJob.title}</p>
                  </div>
                  <button
                    className="hm-btn hm-btn-ghost"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', minHeight: 'unset', border: '1px solid rgba(255,255,255,0.1)' }}
                    onClick={() => setShowChat(false)}
                  >
                    ← Back to Guide
                  </button>
                </div>

                {/* Messages List */}
                <div 
                  className="hide-scrollbar" 
                  style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    maxHeight: '350px', 
                    paddingRight: '4px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px', 
                    marginBottom: '16px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  {chatMessages.map((msg, idx) => (
                    <ChatMessageBubble 
                      key={idx} 
                      msg={msg} 
                      isLatest={idx === chatMessages.length - 1} 
                    />
                  ))}
                  {chatLoading && (
                    <div style={{ alignSelf: 'flex-start', maxWidth: '80%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px 16px 16px 4px', padding: '12px 14px' }}>
                      <Spin label="AI Coach is thinking..." />
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                  <input
                    type="text"
                    placeholder="Ask prep coach anything about this role..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    disabled={chatLoading}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    className="hm-btn hm-btn-accent"
                    disabled={chatLoading || !chatInput.trim()}
                    style={{ padding: '0 24px', minHeight: 'unset', width: 'auto', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    Send
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-col-gap-4">
                
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 600 }}>{selectedJob.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                    <span className={`hm-score ${scoreClass(detailedAnalysis.score)}`}>
                      {detailedAnalysis.score}% Match Score
                    </span>
                  </div>
                </div>

                {/* Section 1: Missing Things */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    <ExclamationIco />
                    Missing Skills & Requirements
                  </div>
                  {detailedAnalysis.missingThings.length === 0 ? (
                    <p style={{ fontSize: '0.82rem', color: '#34d399' }}>✓ You satisfy all requirements!</p>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {detailedAnalysis.missingThings.map((thing, idx) => (
                        <li key={idx} style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', lineHeight: '1.4' }}>
                          {thing}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Section 2: Resume Improvements */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                  <div style={{ color: '#60a5fa', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    ✦ Resume Suggestions
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {detailedAnalysis.improvements.map((tip, idx) => (
                      <li key={idx} style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', lineHeight: '1.4' }}>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Section 3: Interview Prep */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px', marginTop: '10px' }}>
                  <div style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                    💡 Interview Preparation Guide
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {detailedAnalysis.prepGuide.map((step, idx) => (
                      <li key={idx} style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.4' }}>
                        {step}
                      </li>
                    ))}
                  </ol>

                  {/* Let's Prepare Button */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="hm-btn hm-btn-accent"
                      style={{ padding: '8px 18px', fontSize: '0.82rem', borderRadius: '10px' }}
                      onClick={startPrepChat}
                    >
                      <SparklesIcon />
                      Let's Prepare!
                    </button>
                  </div>
                </div>

              </div>
            )
          ) : (
            <div className="hm-empty">
              <p>Could not load analysis details.</p>
            </div>
          )}
        </div>

      </div>
    );
  }

  return null;
};
