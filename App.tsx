import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { JobProvider } from './components/JobProvider';
import { JobSeeker } from './components/JobSeeker';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { JobBoard } from './components/JobBoard';
import { AuthModal } from './components/AuthModal';
import type { Job, Applicant } from './types';
import { GuestScorer } from './components/GuestScorer';
import { Footer } from './components/Footer';
import { AboutPage } from './components/AboutPage';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4';

type AppView = 'board' | 'resume' | 'matches' | 'prep' | 'post' | 'tracker' | 'guest-scorer' | 'landing' | 'about';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AppInner: React.FC = () => {
  const { isAuthenticated, isLoading, user, token, loginAsGuest } = useAuth();
  const [view, setViewInternal] = useState<AppView>(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash || hash === 'home') return 'landing';
    return hash as AppView;
  });

  const setView = (newView: AppView) => {
    setViewInternal(newView);
    const targetHash = newView === 'landing' ? '#home' : `#${newView}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState(null, '', targetHash);
    }
  };

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const nextView = (!hash || hash === 'home') ? 'landing' : (hash as AppView);
      setViewInternal(nextView);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);

  // Track active applications
  const [applications, setApplications] = useState<any[]>(() => {
    const saved = localStorage.getItem('hm_applications');
    return saved ? JSON.parse(saved) : [];
  });

  React.useEffect(() => {
    localStorage.setItem('hm_applications', JSON.stringify(applications));
  }, [applications]);

  // Auth modal state (for landing page CTAs)
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const addJob = (job: Job) => setJobs(prev => [job, ...prev]);

  const deleteJob = async (jobId: string) => {
    // Delete locally
    setJobs(prev => prev.filter(j => j.id !== jobId));
    // Clear associated applications
    setApplications(prev => prev.filter(app => app.jobId !== jobId));
    
    // Call server API
    try {
      if (token) {
        await fetch(`${API_BASE}/jobs/${jobId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.log('Failed to delete job from backend API, deleted locally', e);
    }
  };

  const addApplicant = (applicant: Applicant) => setApplicants(prev => [...prev, applicant]);

  const handleApplyJob = (jobId: string, applicant: Applicant, score: number, justification: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    // Check if already applied
    const exists = applications.some(app => app.jobId === jobId && app.applicantId === applicant.id);
    if (exists) return;

    const newApp = {
      id: `app-${Date.now()}`,
      jobId,
      jobTitle: job.title,
      jobDescription: job.description,
      applicantId: applicant.id,
      applicantName: applicant.extractedInfo.name,
      resumeText: applicant.resumeText,
      extractedInfo: applicant.extractedInfo,
      score,
      justification,
      status: 'Applied',
      appliedAt: new Date().toISOString()
    };
    setApplications(prev => [newApp, ...prev]);
  };

  const handleUpdateApplicationStatus = (appId: string, status: string) => {
    setApplications(prev => prev.map(app => app.id === appId ? { ...app, status } : app));
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/jobs`);
      const data = await res.json();
      if (data.jobs && data.jobs.length > 0) {
        const mappedJobs = data.jobs.map((j: any) => ({
          id: j._id || j.id,
          title: j.title,
          description: j.description,
          extractedInfo: j.extractedInfo || { requiredSkills: [], experienceSummary: '' }
        }));
        setJobs(mappedJobs);
      }
    } catch (e) {
      console.log('Failed to fetch jobs from API, using local mock/state', e);
    }
  };

  React.useEffect(() => {
    fetchJobs();
  }, [isAuthenticated]);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Redirect guard: Enforce page restrictions by role
  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'guest') {
        if (view !== 'guest-scorer' && view !== 'about') {
          setView('guest-scorer');
        }
      } else if (user.role === 'seeker') {
        if (view === 'post' || view === 'tracker' || view === 'guest-scorer') {
          setView('board');
        }
      } else if (user.role === 'provider') {
        if (view === 'resume' || view === 'matches' || view === 'prep' || view === 'guest-scorer') {
          setView('board');
        }
      }
    } else {
      // If not authenticated, restrict views to landing, about, or guest-scorer
      if (view !== 'landing' && view !== 'about' && view !== 'guest-scorer') {
        setView('landing');
      }
    }
  }, [view, isAuthenticated, user]);

  // On login, redirect from landing to board
  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'guest') {
        setView('guest-scorer');
      } else if (view === 'landing') {
        setView('board');
      }
    }
  }, [isAuthenticated]);

  return (
    <>
      {/* Fullscreen video background */}
      <video className="video-bg" autoPlay loop muted playsInline src={VIDEO_URL} />
      <div className="video-overlay" />

      <div style={{ position: 'relative', zIndex: 2, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header — always shown */}
        <Header view={view} setView={(v: any) => setView(v)} onOpenAuth={handleOpenAuth} />

        {/* Dashboard greeting banner (rendered in flow under sticky header) */}
        {isAuthenticated && user && !isLoading && view !== 'landing' && (
          <div className="nav2-dashboard-hero" style={{ marginTop: '24px', marginBottom: '8px' }}>
            <div className="nav2-hero-inner">
              <div>
                <p className="nav2-greeting">
                  Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} ·{' '}
                  <span style={{ color: '#fff' }}>{user.name.split(' ')[0]}</span> 👋
                </p>
                <p className="nav2-greeting-sub">
                  {user.role === 'seeker'
                    ? 'Upload your resume or browse open vacancies below.'
                    : user.role === 'guest'
                    ? 'Test your resume alignment with any job description instantly.'
                    : 'Post new jobs, rank candidates, and manage your hiring pipeline.'}
                </p>
              </div>
              <div className="nav2-ai-pill">
                <span className="nav2-ai-dot" />
                HireMind AI · Active
              </div>
            </div>
          </div>
        )}

        {/* About Page – available to everyone */}
        {view === 'about' && (
          <main style={{ flex: 1 }}>
            <AboutPage onBack={() => setView(isAuthenticated && user && user.role !== 'guest' ? 'board' : 'landing')} />
          </main>
        )}

        {view !== 'about' && (
          <main style={{ flex: 1 }}>
            {isLoading ? (
              /* Loading skeleton */
              <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'center', minHeight: '60vh' }}>
                <div className="hm-spinner">
                  <div className="hm-dot" />
                  <div className="hm-dot" />
                  <div className="hm-dot" />
                </div>
              </div>
            ) : (!isAuthenticated || view === 'landing') ? (
              /* ── Landing page ── */
              <LandingPage onOpenAuth={handleOpenAuth} onGoToDashboard={() => setView('board')} />
            ) : (
              /* ── AUTHENTICATED: Dashboard ── */
              <div className="hm-dashboard-wrap">
                {view === 'board' && (
                  <div className="hm-content">
                    <JobBoard applications={applications} />
                  </div>
                )}
                {user?.role === 'seeker' && (view === 'resume' || view === 'matches' || view === 'prep') && (
                  <div className="hm-content">
                    <JobSeeker 
                      jobs={jobs} 
                      addApplicant={addApplicant} 
                      applicants={applicants} 
                      applications={applications}
                      onApply={handleApplyJob}
                      view={view}
                    />
                  </div>
                )}
                {user?.role === 'provider' && (view === 'post' || view === 'tracker') && (
                  <div className="hm-content">
                    <JobProvider 
                      jobs={jobs} 
                      addJob={addJob} 
                      onDeleteJob={deleteJob}
                      applicants={applicants} 
                      applications={applications}
                      onUpdateStatus={handleUpdateApplicationStatus}
                      view={view}
                    />
                  </div>
                )}
                {user?.role === 'guest' && view === 'guest-scorer' && (
                  <div className="hm-content">
                    <GuestScorer />
                  </div>
                )}
              </div>
            )}
          </main>
        )}

        {/* Footer */}
        <Footer onAbout={() => setView('about')} />
      </div>

      {/* Auth modal (from landing page CTAs) */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      )}
    </>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppInner />
  </AuthProvider>
);

export default App;
