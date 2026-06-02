import React, { useState, useEffect } from 'react';
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

interface JobPosting {
  _id: string;
  title: string;
  description: string;
  companyName: string;
  extractedInfo: { requiredSkills: string[]; experienceSummary: string };
  postedBy: { name: string; companyName?: string; avatar?: string };
  createdAt: string;
  status: string;
}

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
};

const BriefIco = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
  </svg>
);

interface JobBoardProps {
  applications?: any[];
}

export const JobBoard: React.FC<JobBoardProps> = ({ applications }) => {
  const { token, isAuthenticated, user } = useAuth();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState<string | null>(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (applications) {
      const userAppliedIds = applications.map(app => app.jobId);
      setApplied(new Set(userAppliedIds));
    }
  }, [applications]);

  const isJobShortlisted = (jobId: string) => {
    return (applications || []).some(app => app.jobId === jobId && app.status === 'Shortlisted');
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/jobs`);
      const data = await res.json();
      if (data.jobs) {
        setJobs(data.jobs);
        if (data.jobs.length > 0) setSelectedJob(data.jobs[0]);
      }
    } catch {
      console.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId: string) => {
    if (!isAuthenticated) return;
    setApplying(jobId);
    // Simulate apply (in production this would POST to /api/applications)
    await new Promise(r => setTimeout(r, 1200));
    setApplied(prev => new Set([...prev, jobId]));
    setApplying(null);
  };

  const filtered = jobs.filter(j => {
    const isShortlisted = isJobShortlisted(j._id);
    const hasApplied = (applications || []).some(app => app.jobId === j._id);
    
    // Hide closed/shortlisted jobs unless this seeker applied to them
    if (isShortlisted && !hasApplied) {
      return false;
    }

    return (
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      j.extractedInfo?.requiredSkills?.some(s => s.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="jobboard-wrap">
      {/* Header */}
      <div className="jobboard-header">
        <div>
          <h2 className="jobboard-title">
            <span className="jobboard-title-dot" />
            Open Positions
          </h2>
          <p className="jobboard-sub">{jobs.length} active job{jobs.length !== 1 ? 's' : ''} available right now</p>
        </div>
        <div className="jobboard-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="jobboard-search-icon">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="jobboard-search"
            placeholder="Search jobs, skills, company…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="jobboard-loading">
          {[1,2,3].map(i => <div key={i} className="jobboard-skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="hm-empty" style={{ minHeight: 320 }}>
          <div className="hm-empty-icon"><BriefIco /></div>
          <p>{jobs.length === 0 ? 'No jobs posted yet. Employers — post your first vacancy above!' : 'No jobs match your search.'}</p>
        </div>
      ) : (
        <div className={`jobboard-grid${mobileShowDetail ? ' show-detail' : ''}`}>
          {/* ── Left: Job List ── */}
          <div className="jobboard-list">
            {filtered.map(job => (
              <button
                key={job._id}
                className={`jobboard-item${selectedJob?._id === job._id ? ' selected' : ''}`}
                onClick={() => {
                  setSelectedJob(job);
                  setMobileShowDetail(true);
                }}
              >
                <div className="jobboard-item-header">
                  <div className="jobboard-company-avatar">
                    {job.postedBy?.avatar ? (
                      <img src={job.postedBy.avatar} alt="" />
                    ) : (
                      <span>{(job.companyName || job.postedBy?.name || 'C')[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="jobboard-item-title">{job.title}</div>
                    <div className="jobboard-item-company">{job.companyName || job.postedBy?.name}</div>
                  </div>
                  {applied.has(job._id) && (
                    isJobShortlisted(job._id) ? (
                      <span className="jobboard-applied-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}>Job Expired</span>
                    ) : (
                      <span className="jobboard-applied-badge">Applied ✓</span>
                    )
                  )}
                </div>
                <div className="jobboard-item-skills">
                  {job.extractedInfo?.requiredSkills?.slice(0, 3).map(skill => (
                    <span key={skill} className="hm-skill">{skill}</span>
                  ))}
                </div>
                <div className="jobboard-item-meta">
                  {isJobShortlisted(job._id) ? (
                    <>
                      <span className="jobboard-status-dot" style={{ background: '#ef4444' }} />
                      <span style={{ color: '#f87171', fontWeight: 600 }}>Job Expired</span>
                    </>
                  ) : (
                    <>
                      <span className="jobboard-status-dot" />
                      Active · {timeAgo(job.createdAt)}
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* ── Right: Job Detail ── */}
          {selectedJob && (
            <div className="jobboard-detail glass-card animate-fade-rise">
              <button 
                className="jobboard-back-btn" 
                onClick={() => setMobileShowDetail(false)}
              >
                ← Back to Jobs
              </button>
              <div className="jobboard-detail-header">
                <div className="jobboard-detail-company-avatar">
                  {selectedJob.postedBy?.avatar ? (
                    <img src={selectedJob.postedBy.avatar} alt="" />
                  ) : (
                    <span>{(selectedJob.companyName || selectedJob.postedBy?.name || 'C')[0].toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h3 className="jobboard-detail-title">{selectedJob.title}</h3>
                  <p className="jobboard-detail-company">
                    {selectedJob.companyName || selectedJob.postedBy?.name} · Posted {timeAgo(selectedJob.createdAt)}
                  </p>
                </div>
              </div>

              {/* Skills */}
              {selectedJob.extractedInfo?.requiredSkills?.length > 0 && (
                <div className="jobboard-detail-section">
                  <div className="jobboard-detail-section-label">Required Skills</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedJob.extractedInfo.requiredSkills.map(s => (
                      <span key={s} className="hm-skill">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {selectedJob.extractedInfo?.experienceSummary && (
                <div className="jobboard-detail-section">
                  <div className="jobboard-detail-section-label">Experience Required</div>
                  <p className="jobboard-detail-text">{selectedJob.extractedInfo.experienceSummary}</p>
                </div>
              )}

              {/* Description */}
              <div className="jobboard-detail-section">
                <div className="jobboard-detail-section-label">Job Description</div>
                <p className="jobboard-detail-text" style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto' }}>
                  {selectedJob.description}
                </p>
              </div>

              {/* Apply Button */}
              <div className="jobboard-detail-actions">
                {!isAuthenticated || user?.role === 'guest' ? (
                  <div className="jobboard-auth-notice">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {user?.role === 'guest' ? 'Please register or sign in as a Candidate to apply' : 'Sign in to apply for this position'}
                  </div>
                ) : isJobShortlisted(selectedJob._id) ? (
                  <div className="jobboard-applied-confirm" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Job Expired
                  </div>
                ) : applied.has(selectedJob._id) ? (
                  <div className="jobboard-applied-confirm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Application Submitted
                  </div>
                ) : (
                  <button
                    className="jobboard-apply-btn"
                    onClick={() => handleApply(selectedJob._id)}
                    disabled={applying === selectedJob._id}
                    id={`btn-apply-${selectedJob._id}`}
                  >
                    {applying === selectedJob._id ? (
                      <span className="auth-spinner"><span /><span /><span /></span>
                    ) : (
                      <>
                        Apply Now
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12"/>
                          <polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
