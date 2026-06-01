import React, { useState } from 'react';
import { getTextFromPdf } from '../services/pdfService';
import { extractResumeInfo, analyzeDetailedFit, DetailedAnalysis } from '../services/geminiService';
import { UploadIcon } from './icons/UploadIcon';
import { SparklesIcon } from './icons/SparklesIcon';

const FileIco = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const BriefIco = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="2" y1="12" x2="22" y2="12"/></svg>;
const SparkleIco = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/></svg>;
const ExclamationIco = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

const Dot = () => <><div className="hm-dot"/><div className="hm-dot"/><div className="hm-dot"/></>;
const Spin = ({ label }: { label?: string }) => (
  <div className="hm-spinner"><Dot />{label && <span style={{marginLeft:8,fontSize:'0.82rem',color:'rgba(255,255,255,0.3)'}}>{label}</span>}</div>
);

export const GuestScorer: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [jdTitle, setJdTitle] = useState('');
  const [jdText, setJdText] = useState('');

  const [loadingResume, setLoadingResume] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Custom Validation Error States
  const [resumeError, setResumeError] = useState('');
  const [jdTitleError, setJdTitleError] = useState('');
  const [jdTextError, setJdTextError] = useState('');
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<DetailedAnalysis | null>(null);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setLoadingResume(true);
    setResumeError('');
    setGeneralError(null);
    setResumeName(file.name);
    try {
      const text = file.type === 'application/pdf' ? await getTextFromPdf(file) : await file.text();
      setResumeText(text);
    } catch (err: any) {
      setResumeError('Failed to extract text from resume PDF.');
      setResumeName('');
    } finally {
      setLoadingResume(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setResumeError('');
    setJdTitleError('');
    setJdTextError('');
    setGeneralError(null);

    let hasErrors = false;
    if (!resumeText) {
      setResumeError('Please upload a resume file (PDF or TXT) first.');
      hasErrors = true;
    }
    if (!jdTitle.trim()) {
      setJdTitleError('Job title is required.');
      hasErrors = true;
    }
    if (!jdText.trim()) {
      setJdTextError('Job description details are required.');
      hasErrors = true;
    }

    if (hasErrors) return;

    setAnalyzing(true);
    setAnalysis(null);
    try {
      const resumeInfo = await extractResumeInfo(resumeText);
      const res = await analyzeDetailedFit(resumeInfo, jdTitle, jdText);
      setAnalysis(res);
    } catch (err: any) {
      setGeneralError(err.message || 'AI analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const scoreClass = (s: number) => s >= 85 ? 'hm-score-high' : s >= 70 ? 'hm-score-mid' : 'hm-score-low';

  return (
    <div className="hm-grid-seeker-resume" style={{ gap: '24px' }}>
      
      {/* Left Column: Upload Resume & Input JD */}
      <div className="flex-col-gap-4">
        
        {/* Guest Lock Banner */}
        <div style={{
          background: 'rgba(95,141,252,0.06)',
          border: '1px solid rgba(95,141,252,0.15)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontWeight: 600, fontSize: '0.85rem' }}>
            🔒 TEMPORARY GUEST ACCESS
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>
            You can use <strong>only the Resume & JD Scorer</strong> feature in guest mode. 
            No information is stored on our servers. To search vacancies, get AI prep guides, or post jobs, please sign in or register.
          </p>
        </div>

        {/* Resume Input Card */}
        <div className="hm-card glass-card">
          <div className="hm-card-title">
            <div className="hm-card-icon"><FileIco /></div>
            Step 1: Upload Resume
          </div>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
            PDF or TXT format. This data will not be persisted.
          </p>
          
          <label className={`hm-upload-label${resumeError ? ' invalid-input' : ''}`} htmlFor="guest-resume">
            <UploadIcon />
            <span>{loadingResume ? 'Reading resume...' : resumeName || 'Select Resume File'}</span>
            <input 
              id="guest-resume" 
              type="file" 
              style={{ display: 'none' }} 
              onChange={handleResumeUpload} 
              accept=".pdf,.txt" 
              disabled={loadingResume || analyzing}
            />
          </label>
          {resumeError && <p className="auth-field-error-msg">⚠️ {resumeError}</p>}
          {loadingResume && <Spin label="Parsing PDF text..."/>}
        </div>

        {/* JD Input Card */}
        <div className="hm-card glass-card">
          <div className="hm-card-title">
            <div className="hm-card-icon"><BriefIco /></div>
            Step 2: Enter Job Description (JD)
          </div>
          <form onSubmit={handleAnalyze} noValidate className="flex-col-gap-3">
            <div>
              <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>
                Job Title
              </label>
              <input 
                type="text" 
                className={`hm-input${jdTitleError ? ' invalid-input' : ''}`} 
                placeholder="e.g. Senior React Developer" 
                value={jdTitle}
                onChange={e => { setJdTitle(e.target.value); setJdTitleError(''); }}
                disabled={analyzing}
                style={{ width: '100%' }}
              />
              {jdTitleError && <p className="auth-field-error-msg">⚠️ {jdTitleError}</p>}
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>
                Job Description Details
              </label>
              <textarea 
                className={`hm-textarea${jdTextError ? ' invalid-input' : ''}`} 
                placeholder="Paste the full job requirements, skills, and experience summary here..." 
                value={jdText}
                onChange={e => { setJdText(e.target.value); setJdTextError(''); }}
                disabled={analyzing}
                rows={6}
                style={{ width: '100%', resize: 'vertical' }}
              />
              {jdTextError && <p className="auth-field-error-msg">⚠️ {jdTextError}</p>}
            </div>

            {generalError && <div className="hm-error">{generalError}</div>}

            <button 
              type="submit" 
              className="hm-btn hm-btn-accent" 
              disabled={analyzing || loadingResume}
              style={{ marginTop: '6px' }}
            >
              <SparklesIcon />
              {analyzing ? 'Analyzing with AI engine...' : 'Analyze Match Score'}
            </button>
          </form>
        </div>

      </div>

      {/* Right Column: AI Analysis Results */}
      <div className="hm-card glass-card" style={{ minHeight: '320px' }}>
        <div className="hm-card-title">
          <div className="hm-card-icon"><SparkleIco /></div>
          AI Alignment Report
        </div>

        {analyzing ? (
          <div className="hm-empty">
            <Spin label="Comparing resume skills against JD requirements..."/>
          </div>
        ) : !analysis ? (
          <div className="hm-empty">
            <div className="hm-empty-icon"><SparkleIco /></div>
            <p>Upload a resume and enter the target JD to view the AI match details.</p>
          </div>
        ) : (
          <div className="flex-col-gap-4 animate-fade-rise">
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: '0 0 6px 0' }}>{jdTitle}</h3>
              <span className={`hm-score ${scoreClass(analysis.score)}`}>
                {analysis.score}% Match Score
              </span>
            </div>

            {/* Missing Things */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                <ExclamationIco />
                Missing Skills & Gaps
              </div>
              {analysis.missingThings.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: '#34d399' }}>✓ No critical missing requirements identified!</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {analysis.missingThings.map((thing, idx) => (
                    <li key={idx} style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', lineHeight: '1.45' }}>
                      {thing}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Resume Suggestions */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
              <div style={{ color: '#60a5fa', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                ✦ Resume Suggestions
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {analysis.improvements.map((tip, idx) => (
                  <li key={idx} style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', lineHeight: '1.45' }}>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
