import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  customMessage?: string;
}

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, initialMode = 'login', customMessage }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'seeker' | 'provider'>('seeker');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sliding Alert Banner State
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Field validation states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const overlayRef = useRef<HTMLDivElement>(null);
  const { login, signup, loginWithGoogle, loginAsGuest } = useAuth();

  // StrictMode-protected history stack manager to prevent double-mount race conditions
  useEffect(() => {
    // Access a global-like variable on window to coordinate instances across re-renders
    const win = window as any;
    win.__authModalCount = (win.__authModalCount || 0) + 1;

    if (win.__authModalCount === 1) {
      window.history.pushState({ modalOpen: true }, '');
    }

    const handlePopState = (e: PopStateEvent) => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      win.__authModalCount--;
      
      // Delay history rollback to let StrictMode's immediate remount complete
      setTimeout(() => {
        if (win.__authModalCount === 0) {
          if (window.history.state && window.history.state.modalOpen) {
            window.history.back();
          }
        }
      }, 50);
    };
  }, [onClose]);

  // Escape key handler to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll on mount
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Alert Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 4000);
    return () => clearTimeout(timer);
  }, [alert]);

  const clearErrors = () => {
    setNameError('');
    setEmailError('');
    setPasswordError('');
  };

  const isValidEmailFormat = (val: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  };

  // Sign up form submission (Direct Account Creation)
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    let hasErrors = false;

    if (!name.trim()) { setNameError('Full name is required.'); hasErrors = true; }
    if (!email.trim()) { setEmailError('Email address is required.'); hasErrors = true; }
    else if (!isValidEmailFormat(email)) { setEmailError('Please enter a valid email address.'); hasErrors = true; }

    if (!password) { setPasswordError('Password is required.'); hasErrors = true; }
    else if (password.length < 8) { setPasswordError('Password must be at least 8 characters.'); hasErrors = true; }

    if (hasErrors) return;

    setIsLoading(true);
    try {
      await signup({ name, email, password, role });
      setAlert({ message: 'Account created successfully! Welcome to HireMind AI.', type: 'success' });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setAlert({ message: err.message || 'Failed to create account. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Login form submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    let hasErrors = false;
    if (!email.trim()) { setEmailError('Email address is required.'); hasErrors = true; }
    else if (!isValidEmailFormat(email)) { setEmailError('Please enter a valid email address.'); hasErrors = true; }

    if (!password) { setPasswordError('Password is required.'); hasErrors = true; }

    if (hasErrors) return;

    setIsLoading(true);
    try {
      await login({ email, password });
      onClose();
    } catch (err: any) {
      setAlert({ message: err.message || 'Authentication failed. Please check credentials.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login');
    clearErrors();
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div ref={overlayRef} className="auth-overlay-fullscreen">
      
      {/* Sliding Top Banner Alert (Centered horizontally using left-0 right-0 mx-auto) */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className={`fixed top-6 left-0 right-0 mx-auto z-[3000] flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-lg w-[90%] max-w-md ${
              alert.type === 'success'
                ? 'bg-emerald-950/85 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-950/85 border-rose-500/30 text-rose-200'
            }`}
          >
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-sm font-medium leading-tight">{alert.message}</span>
            <button 
              onClick={() => setAlert(null)} 
              className="ml-auto text-white/40 hover:text-white/80 transition-colors shrink-0 bg-transparent border-none p-0 cursor-pointer outline-none"
              aria-label="Dismiss message"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="auth-split-container">
        
        {/* Left Side: Brand Showcase */}
        <div className="auth-right-panel">
          <div className="auth-right-overlay" />
          <div className="auth-glow-orb purple" />
          <div className="auth-glow-orb blue" />
          <div className="auth-right-content">
            <div className="auth-right-badge">
              <span className="auth-badge-dot" />
              AI Engine Active
            </div>
            <h2 className="auth-showcase-title">
              Where careers rise<br />through the silence.
            </h2>
            <p className="auth-showcase-desc">
              Experience the next generation of AI-driven recruitment. Smart resume scoring, matching, and preparation tools right at your fingertips.
            </p>
            
            <div className="auth-mock-cards-container">
              <div className="auth-mock-card card-1">
                <div className="auth-card-icon-wrap green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="auth-card-name">Utkarsh Dixit</div>
                  <div className="auth-card-sub">Ranked #1 Candidate</div>
                </div>
                <div className="auth-card-tag green">98% Match</div>
              </div>

              <div className="auth-mock-card card-2">
                <div className="auth-card-icon-wrap blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="auth-card-name">Product Architect</div>
                  <div className="auth-card-sub">JD Auto-Drafted</div>
                </div>
                <div className="auth-card-tag blue">AI Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Fields & Signup/Login */}
        <div className="auth-left-panel">
          <button className="auth-close-fullscreen" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          
          <div className="auth-left-content my-auto py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Title block */}
                <div className="auth-header" style={{ textAlign: 'left', marginBottom: '24px' }}>
                  <div className="auth-brand" style={{ marginBottom: '16px' }}>
                    <span className="auth-brand-dot" />
                    <span className="auth-brand-name">HireMind<sup>®</sup> <span className="auth-brand-ai">AI</span></span>
                  </div>
                  <h2 className="auth-title" style={{ fontSize: '1.85rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 6px 0', color: '#fff' }}>
                    {mode === 'login' ? 'Welcome back' : 'Create account'}
                  </h2>
                  <p className="auth-subtitle" style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                    {mode === 'login'
                      ? 'Sign in to access your personalized AI workspace'
                      : 'Join thousands of professionals using AI to advance their careers'}
                  </p>
                </div>

                {customMessage && (
                  <div style={{
                    background: 'rgba(95, 141, 252, 0.08)', border: '1px solid rgba(95, 141, 252, 0.2)',
                    borderRadius: '12px', padding: '12px 14px', fontSize: '0.82rem', color: '#93c5fd',
                    marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1.4
                  }}>
                    🔒 {customMessage}
                  </div>
                )}

                <button className="auth-google-btn" onClick={loginWithGoogle} type="button" id="btn-google-signin" style={{ width: '100%', marginBottom: '12px' }}>
                  <GoogleIcon /><span>Continue with Google</span>
                </button>

                <div className="auth-divider" style={{ margin: '14px 0' }}><span>or</span></div>

                {/* Forms */}
                <form onSubmit={mode === 'login' ? handleLoginSubmit : handleSignUpSubmit} noValidate className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {mode === 'signup' && (
                    <div className="auth-field">
                      <label className="auth-label" htmlFor="auth-name">Full Name</label>
                      <div className="relative">
                        <input
                          id="auth-name"
                          type="text"
                          className={`auth-input${nameError ? ' invalid-input' : ''}`}
                          placeholder="Enter your full name"
                          value={name}
                          onChange={e => { setName(e.target.value); setNameError(''); }}
                          autoComplete="off"
                          style={{ paddingLeft: '38px' }}
                        />
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      </div>
                      {nameError && <p className="auth-field-error-msg">⚠️ {nameError}</p>}
                    </div>
                  )}

                  <div className="auth-field">
                    <label className="auth-label" htmlFor="auth-email">Email Address</label>
                    <div className="relative">
                      <input
                        id="auth-email"
                        type="email"
                        className={`auth-input${emailError ? ' invalid-input' : ''}`}
                        placeholder="Enter your email address"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                        autoComplete="off"
                        style={{ paddingLeft: '38px' }}
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    </div>
                    {emailError && <p className="auth-field-error-msg">⚠️ {emailError}</p>}
                  </div>

                  <div className="auth-field">
                    <label className="auth-label" htmlFor="auth-password">Password</label>
                    <div className="auth-input-wrap relative">
                      <input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        className={`auth-input${passwordError ? ' invalid-input' : ''}`}
                        placeholder={mode === 'signup' ? 'Enter a secure password' : 'Enter your password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setPasswordError(''); }}
                        autoComplete="new-password"
                        style={{ paddingLeft: '38px', paddingRight: '40px' }}
                      />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                        onClick={() => { setShowPassword(p => !p); }}
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordError && <p className="auth-field-error-msg">⚠️ {passwordError}</p>}
                  </div>

                  {/* Role selection for signup */}
                  {mode === 'signup' && (
                    <div className="auth-field">
                      <label className="auth-label">I am a</label>
                      <div className="auth-role-wrap">
                        <button
                          type="button"
                          className={`auth-role-btn${role === 'seeker' ? ' active' : ''}`}
                          onClick={() => setRole('seeker')}
                          id="role-seeker"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                          Job Seeker
                        </button>
                        <button
                          type="button"
                          className={`auth-role-btn${role === 'provider' ? ' active' : ''}`}
                          onClick={() => setRole('provider')}
                          id="role-provider"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="2"/>
                            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                          </svg>
                          Recruiter
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={isLoading}
                    id="btn-auth-submit"
                    style={{ marginTop: '6px' }}
                  >
                    {isLoading ? (
                      <span className="auth-spinner"><span /><span /><span /></span>
                    ) : (
                      mode === 'login' ? 'Sign In' : 'Create Account'
                    )}
                  </button>
                </form>

                <p className="auth-switch" style={{ marginTop: '16px', textAlign: 'left' }}>
                  {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                  {' '}
                  <button type="button" className="auth-switch-btn" onClick={switchMode} id="btn-auth-switch">
                    {mode === 'login' ? 'Sign up free' : 'Sign in'}
                  </button>
                </p>

                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                    <span style={{ padding: '0 10px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>or use temporary access</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                  </div>
                  
                  <button 
                    type="button" 
                    className="hm-btn" 
                    style={{ 
                      width: '100%', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px dashed rgba(255,255,255,0.15)',
                      color: 'rgba(255,255,255,0.85)',
                      borderRadius: '12px',
                      padding: '10px 16px',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                      minHeight: '40px'
                    }}
                    onClick={() => {
                      loginAsGuest();
                      onClose();
                    }}
                    id="btn-guest-login"
                  >
                    👤 Continue as Guest
                  </button>
                  
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', margin: '4px 0 0 0', textAlign: 'center', lineHeight: 1.45 }}>
                    ⚠️ <strong>Guest Limit</strong>: Access ONLY the AI Resume & JD Scorer. Your resume & data will not be saved.
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
};
