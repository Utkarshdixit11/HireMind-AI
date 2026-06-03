import React, { useState, useEffect } from 'react';
import type { Job, Applicant } from '../types';
import { getTextFromPdf } from '../services/pdfService';
import { extractJobInfo } from '../services/geminiService';
import { UploadIcon } from './icons/UploadIcon';
import { useAuth } from '../context/AuthContext';

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

const API_BASE = getApiBase();

interface Props {
  jobs: Job[];
  addJob: (j: Job) => void;
  onDeleteJob?: (jobId: string) => void;
  applicants: Applicant[];
  applications: any[];
  onUpdateStatus?: (appId: string, status: string) => void;
  view: string;
}

const BriefIco = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="2" y1="12" x2="22" y2="12"/></svg>;
const UsersIco = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const DownloadIco = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const TrashIco = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;

// Helper to check if experience criteria filters applicant out
const isExperienceFiltered = (jobDescription: string, expSummary: string) => {
  const jdLower = jobDescription.toLowerCase();
  const expLower = expSummary.toLowerCase();

  const requiresExperience = 
    /2\s*\+?\s*years?/i.test(jdLower) ||
    /3\s*\+?\s*years?/i.test(jdLower) ||
    /4\s*\+?\s*years?/i.test(jdLower) ||
    /5\s*\+?\s*years?/i.test(jdLower) ||
    /two\s*years?/i.test(jdLower) ||
    /three\s*years?/i.test(jdLower) ||
    /four\s*years?/i.test(jdLower) ||
    /five\s*years?/i.test(jdLower) ||
    /minimum\s*of\s*[2-9]\s*years?/i.test(jdLower) ||
    /experience\s*required\s*:\s*[2-9]/i.test(jdLower);

  if (!requiresExperience) return false;

  const isFresher =
    /0\s*(-\s*1)?\s*years?/i.test(expLower) ||
    /\b0\s*years?\b/i.test(expLower) ||
    /\bfresher\b/i.test(expLower) ||
    /\bno\s*experience\b/i.test(expLower) ||
    /\bentry\s*level\b/i.test(expLower);

  return isFresher;
};

export const JobProvider: React.FC<Props> = ({ jobs, addJob, onDeleteJob, applicants, applications, onUpdateStatus, view }) => {
  const { token } = useAuth();
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState('');
  const [descError, setDescError] = useState('');

  useEffect(() => {
    if (jobs.length > 0 && !selectedJob) {
      setSelectedJob(jobs[0]);
    }
  }, [jobs, selectedJob]);

  useEffect(() => {
    setSelectedApplicant(null);
  }, [selectedJob]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setLoading(true); setError(null); setUploadedFile(file.name);
    try {
      const text = file.type === 'application/pdf' ? await getTextFromPdf(file) : await file.text();
      setJobDesc(text);
    } catch (err: any) {
      setError(err.message || 'Failed to process file.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    setTitleError('');
    setDescError('');
    setError(null);
    let hasErrors = false;
    if (!jobTitle.trim()) {
      setTitleError('Job title is required.');
      hasErrors = true;
    }
    if (!jobDesc.trim()) {
      setDescError('Job description details are required.');
      hasErrors = true;
    }
    if (hasErrors) return;
    setLoading(true); setSaveSuccess(false);
    try {
      const info = await extractJobInfo(jobDesc);
      
      let finalJob: Job;
      if (token) {
        const res = await fetch(`${API_BASE}/jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: jobTitle, description: jobDesc, extractedInfo: info }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to create job on server.');
        }
        if (data.job) {
          finalJob = {
            id: data.job._id || data.job.id,
            title: data.job.title,
            description: data.job.description,
            extractedInfo: data.job.extractedInfo || info
          };
        } else {
          throw new Error('Failed to create job on server.');
        }
      } else {
        finalJob = { id: `job-${Date.now()}`, title: jobTitle, description: jobDesc, extractedInfo: info };
      }

      addJob(finalJob);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setJobTitle(''); setJobDesc(''); setUploadedFile(''); setSelectedJob(finalJob);
    } catch (err: any) {
      console.error('Job creation failed:', err);
      setError(`Failed to post job. [Endpoint: ${API_BASE}/jobs] [Error: ${err.message || err}]`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResume = (app: any) => {
    const blob = new Blob([app.resumeText || 'No Resume Text Available'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${app.applicantName.replace(/\s+/g, '_')}_Resume.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadResumePDF = (app: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const skillsHtml = app.extractedInfo?.skills ? app.extractedInfo.skills.map((s: string) => 
      `<span style="display:inline-block;background:#e5e7eb;color:#1f2937;padding:4px 10px;margin:4px;border-radius:6px;font-size:0.85rem;font-family:sans-serif;">${s}</span>`
    ).join('') : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>${app.applicantName} - Resume</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f2937; padding: 40px; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 2.2rem; margin-bottom: 5px; color: #1e3a8a; font-weight: 700; }
            .contact { font-size: 0.95rem; color: #4b5563; margin-bottom: 25px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
            .section-title { font-size: 1.25rem; font-weight: 700; color: #1e3a8a; margin-top: 25px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
            .content-block { margin-bottom: 15px; font-size: 1rem; color: #374151; }
            .skills-container { margin-top: 10px; }
          </style>
        </head>
        <body>
          <h1>${app.applicantName}</h1>
          <div class="contact">${app.extractedInfo?.contact || 'No contact details provided'}</div>
          
          <div class="section-title">Professional Summary</div>
          <div class="content-block" style="white-space: pre-wrap;">${app.extractedInfo?.experienceSummary || 'No summary available.'}</div>
          
          <div class="section-title">Education</div>
          <div class="content-block">${app.extractedInfo?.education || 'No education listed.'}</div>
          
          <div class="section-title">Skills</div>
          <div class="skills-container">${skillsHtml || 'No skills listed.'}</div>
          
          <div class="section-title">Full Resume Text</div>
          <div class="content-block" style="white-space: pre-wrap; font-size: 0.9rem; color: #4b5563;">${app.resumeText || ''}</div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const rawJobApps = applications.filter(app => app.jobId === selectedJob?.id);

  const jobRequiresExp = selectedJob ? (
    /2\s*\+?\s*years?/i.test(selectedJob.description) ||
    /two\s*years?/i.test(selectedJob.description) ||
    /minimum\s*of\s*2\s*years?/i.test(selectedJob.description)
  ) : false;

  const filteredJobApps = rawJobApps.filter(app => {
    if (!selectedJob) return true;
    return !isExperienceFiltered(selectedJob.description, app.extractedInfo.experienceSummary);
  });

  const sortedJobApps = [...filteredJobApps].sort((a, b) => b.score - a.score);
  const getScoreClass = (s: number) => s >= 85 ? 'hm-score-high' : s >= 70 ? 'hm-score-mid' : 'hm-score-low';

  // ── PAGE 1: POST A JOB ──
  if (view === 'post') {
    return (
      <div className="hm-grid-provider-post">
        
        {/* Form to post a job */}
        <div className="hm-card glass-card">
          <div className="hm-card-title">
            <div className="hm-card-icon"><BriefIco /></div>
            Post a New Position
          </div>
          <div className="flex-col-gap-3">
            <div>
              <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>
                Job Title
              </label>
              <input 
                id="job-title-input" 
                className={`hm-input${titleError ? ' invalid-input' : ''}`} 
                placeholder="e.g. Senior React Developer" 
                value={jobTitle} 
                onChange={e=>{ setJobTitle(e.target.value); setTitleError(''); }}
                style={{ width: '100%' }}
              />
              {titleError && <p className="auth-field-error-msg">⚠️ {titleError}</p>}
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>
                Job Description Details
              </label>
              <textarea 
                id="job-desc-input" 
                className={`hm-textarea${descError ? ' invalid-input' : ''}`} 
                placeholder="Provide clear specifications, required skills, and experience constraints (e.g. 'requires 2+ years of experience')" 
                rows={8} 
                value={jobDesc} 
                onChange={e=>{ setJobDesc(e.target.value); setDescError(''); }}
                style={{ width: '100%', resize: 'vertical' }}
              />
              {descError && <p className="auth-field-error-msg">⚠️ {descError}</p>}
            </div>
            <label className="hm-upload-label" htmlFor="jd-upload">
              <UploadIcon/>
              <span>{uploadedFile || 'Upload JD (PDF or TXT)'}</span>
              <input id="jd-upload" type="file" style={{display:'none'}} onChange={e => { handleFile(e); setDescError(''); }} accept=".pdf,.txt"/>
            </label>
            <button id="post-job-btn" className="hm-btn hm-btn-primary" disabled={loading} onClick={handleCreateJob}>
              {loading ? 'Publishing...' : 'Post Job'}
            </button>
            {saveSuccess && (
              <div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:10,padding:'10px 14px',fontSize:'0.83rem',color:'#6ee7b7'}}>
                ✓ Job successfully published to the public board!
              </div>
            )}
            {error && <div className="hm-error">{error}</div>}
          </div>
        </div>

        {/* List of active and past postings */}
        {(() => {
          const openJobs = jobs.filter(j => 
            !applications.some(app => app.jobId === j.id && app.status === 'Shortlisted')
          );
          const pastJobs = jobs.filter(j => 
            applications.some(app => app.jobId === j.id && app.status === 'Shortlisted')
          );
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
              {/* Active Postings */}
              <div className="hm-card glass-card">
                <div className="hm-card-title">
                  <div className="hm-card-icon"><BriefIco /></div>
                  Active Postings
                  <span className="hm-count">{openJobs.length}</span>
                </div>
                {openJobs.length === 0 ? (
                  <div className="hm-empty">
                    <div className="hm-empty-icon"><BriefIco /></div>
                    <p>You have not published any open job listings yet.</p>
                  </div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {openJobs.map(j => (
                      <div 
                        key={j.id} 
                        className="hm-match-card"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          border: '1px solid rgba(255,255,255,0.05)',
                          background: 'rgba(255,255,255,0.02)',
                          padding: '16px',
                          borderRadius: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.94rem' }}>{j.title}</div>
                          {onDeleteJob && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete the job opening: "${j.title}"?`)) {
                                  onDeleteJob(j.id);
                                }
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifycontent: 'center',
                                borderRadius: '6px',
                                transition: 'background 0.2s'
                              }}
                              title="Delete Job"
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <TrashIco />
                            </button>
                          )}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '8px', lineHeight: '1.5', whiteSpace: 'pre-wrap', width: '100%' }}>
                          {j.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Postings (Closed) */}
              <div className="hm-card glass-card">
                <div className="hm-card-title">
                  <div className="hm-card-icon" style={{ color: 'rgba(255,255,255,0.4)' }}><BriefIco /></div>
                  Past Postings (Closed)
                  <span className="hm-count" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>{pastJobs.length}</span>
                </div>
                {pastJobs.length === 0 ? (
                  <div className="hm-empty">
                    <div className="hm-empty-icon"><BriefIco /></div>
                    <p>No past or closed listings found.</p>
                  </div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {pastJobs.map(j => (
                      <div 
                        key={j.id} 
                        className="hm-match-card"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          border: '1px solid rgba(255,255,255,0.03)',
                          background: 'rgba(255,255,255,0.01)',
                          padding: '16px',
                          borderRadius: '12px',
                          opacity: 0.75
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)', fontSize: '0.94rem' }}>
                            {j.title} <span style={{ fontSize: '0.72rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px' }}>Filled / Shortlisted</span>
                          </div>
                          {onDeleteJob && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete the past job opening: "${j.title}"?`)) {
                                  onDeleteJob(j.id);
                                }
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifycontent: 'center',
                                borderRadius: '6px',
                                transition: 'background 0.2s'
                              }}
                              title="Delete Job"
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <TrashIco />
                            </button>
                          )}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '8px', lineHeight: '1.5', whiteSpace: 'pre-wrap', width: '100%' }}>
                          {j.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      </div>
    );
  }

  // ── PAGE 2: CANDIDATE TRACKER ──
  if (view === 'tracker') {
    return (
      <div className={`hm-grid-provider-tracker${mobileShowDetail ? ' show-detail' : ''}`}>
        
        {/* Left Side: Selected Job selector + Applicants list */}
        <div className="flex-col-gap-4">
          
          {/* Posted Job Selector */}
          <div className="hm-card glass-card">
            <div className="hm-card-title">
              <div className="hm-card-icon"><BriefIco /></div>
              Select Job to Track
            </div>
            {jobs.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)' }}>No jobs posted yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {jobs.map(j => (
                  <div
                    key={j.id}
                    className={`hm-job-item${selectedJob?.id === j.id ? ' selected' : ''}`}
                    style={{ padding: 0, justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}
                  >
                    <button 
                      onClick={() => setSelectedJob(j)} 
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: 'inherit', 
                        font: 'inherit',
                        cursor: 'pointer',
                        textAlign: 'left',
                        flex: 1,
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        borderRadius: 'inherit'
                      }}
                    >
                      <div className="hm-job-dot" />
                      {j.title}
                    </button>
                    {onDeleteJob && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete the job opening: "${j.title}"?`)) {
                            onDeleteJob(j.id);
                            if (selectedJob?.id === j.id) {
                              setSelectedJob(jobs.find(x => x.id !== j.id) || null);
                            }
                          }
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0.7,
                          transition: 'opacity 0.2s, background 0.2s',
                          borderTopRightRadius: 'inherit',
                          borderBottomRightRadius: 'inherit'
                        }}
                        title="Delete Job"
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.background = 'transparent'; }}
                      >
                        <TrashIco />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ranked Applicants */}
          {selectedJob && (
            <div className="hm-card glass-card">
              <div className="hm-card-title">
                <div className="hm-card-icon"><UsersIco /></div>
                Applicants
                <span className="hm-count">{sortedJobApps.length}</span>
              </div>
              
              <div className="flex-col-gap-3">
                {jobRequiresExp && (
                  <div style={{ fontSize: '0.78rem', background: 'rgba(95, 141, 252, 0.08)', border: '1px solid rgba(95, 141, 252, 0.15)', borderRadius: '8px', padding: '8px 12px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.4' }}>
                    ℹ️ <strong>Auto-Filter Active</strong>: Candidates with 0 years experience are automatically filtered out.
                  </div>
                )}

                {sortedJobApps.length === 0 ? (
                  <div className="hm-empty" style={{ paddingTop: '20px' }}>
                    <div className="hm-empty-icon"><UsersIco /></div>
                    <p>No candidates match the criteria yet.</p>
                    {rawJobApps.length > filteredJobApps.length && (
                      <p style={{ fontSize: '0.75rem', color: 'rgba(239, 68, 68, 0.7)', marginTop: '4px' }}>
                        ({rawJobApps.length - filteredJobApps.length} fresher applicants auto-filtered out)
                      </p>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sortedJobApps.map((app, index) => (
                      <button
                        key={app.id}
                        onClick={() => {
                          setSelectedApplicant(app);
                          setMobileShowDetail(true);
                        }}
                        className={`hm-match-card${selectedApplicant?.id === app.id ? ' active' : ''}`}
                        style={{ 
                          width: '100%', 
                          textAlign: 'left', 
                          background: selectedApplicant?.id === app.id ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                          border: selectedApplicant?.id === app.id ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.05)',
                          padding: '12px', 
                          cursor: 'pointer',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                      >
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', width: '22px' }}>
                          #{index + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {app.applicantName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                            Status: <span style={{ color: app.status === 'Applied' ? '#60a5fa' : '#34d399' }}>{app.status}</span>
                          </div>
                        </div>
                        <div className={`hm-score ${getScoreClass(app.score)}`}>
                          {app.score}%
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Detailed candidate review */}
        <div className="hm-card glass-card" style={{ minHeight: '400px' }}>
          <button 
            className="jobboard-back-btn" 
            onClick={() => setMobileShowDetail(false)}
          >
            ← Back to Applicants
          </button>
          <div className="hm-card-title">
            <div className="hm-card-icon"><UsersIco /></div>
            Candidate Review & AI Summary
          </div>

          {!selectedApplicant ? (
            <div className="hm-empty">
              <div className="hm-empty-icon"><UsersIco /></div>
              <p>Select a candidate from the list to display their summary and options.</p>
            </div>
          ) : (
            <div className="flex-col-gap-4">
              
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 600 }}>{selectedApplicant.applicantName}</h3>
                  <div className={`hm-score ${getScoreClass(selectedApplicant.score)}`}>
                    {selectedApplicant.score}% Fit
                  </div>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
                  Applied on {new Date(selectedApplicant.appliedAt).toLocaleDateString()}
                </p>
              </div>

              {/* AI Resume Summary */}
              <div className="hm-bio" style={{ marginTop: 0 }}>
                <div className="hm-bio-label">✦ Resume AI Summary</div>
                <p className="hm-bio-text" style={{ fontSize: '0.84rem', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.8)', whiteSpace: 'pre-wrap' }}>
                  {selectedApplicant.extractedInfo.experienceSummary}
                </p>
              </div>

              {/* Education */}
              {selectedApplicant.extractedInfo.education && (
                <div className="hm-stat">
                  <div className="hm-stat-label">Education</div>
                  <div className="hm-stat-value" style={{ fontSize: '0.82rem', color: '#fff', whiteSpace: 'pre-wrap' }}>
                    {selectedApplicant.extractedInfo.education}
                  </div>
                </div>
              )}

              {/* Skills */}
              {selectedApplicant.extractedInfo.skills && selectedApplicant.extractedInfo.skills.length > 0 && (
                <div>
                  <div className="hm-stat-label" style={{ marginBottom: '8px' }}>Extracted Skills</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedApplicant.extractedInfo.skills.map((skill: string) => (
                      <span key={skill} className="hm-skill">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Fit explanation */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>
                  Fit Justification
                </div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>
                  {selectedApplicant.justification}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                <button 
                  className="hm-btn hm-btn-ghost" 
                  style={{ flex: 1, minWidth: '140px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => handleDownloadResume(selectedApplicant)}
                >
                  <DownloadIco />
                  Download TXT
                </button>

                <button 
                  className="hm-btn hm-btn-primary" 
                  style={{ flex: 1, minWidth: '140px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => handleDownloadResumePDF(selectedApplicant)}
                >
                  <DownloadIco />
                  Download PDF
                </button>
                
                {onUpdateStatus && selectedApplicant.status === 'Applied' && (
                  <button 
                    className="hm-btn hm-btn-accent" 
                    style={{ width: '100%', marginTop: '4px' }}
                    onClick={() => {
                      onUpdateStatus(selectedApplicant.id, 'Shortlisted');
                      setSelectedApplicant(p => ({ ...p, status: 'Shortlisted' }));
                    }}
                  >
                    ✓ Shortlist Candidate
                  </button>
                )}
              </div>

            </div>
          )}
        </div>

      </div>
    );
  }

  return null;
};
