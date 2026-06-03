import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';

interface HeaderProps {
  view: string;
  setView: (view: string) => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
}

const SparkleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 3Q12 12 21 12Q12 12 12 21Q12 12 3 12Q12 12 12 3Z" fill="currentColor" />
    <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" x2="6" y1="6" y2="18" />
    <line x1="6" x2="18" y1="6" y2="18" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({ view, setView, onOpenAuth }) => {
  const { user, isAuthenticated, logout, isLoading, loginAsGuest } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authMessage, setAuthMessage] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openLogin = () => {
    setAuthMessage('');
    if (onOpenAuth) { onOpenAuth('login'); return; }
    setAuthMode('login'); setShowAuthModal(true);
  };
  const openSignup = () => {
    setAuthMessage('');
    if (onOpenAuth) { onOpenAuth('signup'); return; }
    setAuthMode('signup'); setShowAuthModal(true);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated && user && user.role !== 'guest') {
      setView('board');
    } else {
      setView('landing');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className={`nav2-root${scrolled ? ' scrolled' : ''}`}>
        <nav className="nav2-bar">

          {/* ── Logo ── */}
          <a className="nav2-logo" href="#" onClick={handleLogoClick}>
            <span className="nav2-logo-icon"><SparkleIcon /></span>
            <span className="nav2-logo-name">HireMind</span>
            <span className="nav2-logo-ai">AI</span>
          </a>

          {/* ── Center Nav (Unified Tabs with Underlines) ── */}
          <div className="nav2-center">
            <div className="nav2-links">
              {/* Home */}
              <button
                className={`nav2-link${(view === 'landing' || (isAuthenticated && user && user.role !== 'guest' && view === 'board')) ? ' active' : ''}`}
                onClick={() => {
                  if (isAuthenticated && user && user.role !== 'guest') {
                    setView('board');
                  } else {
                    setView('landing');
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Home
              </button>

              {/* Resume - Hidden for Recruiter (provider) */}
              {(!isAuthenticated || user?.role !== 'provider') && (
                <button
                  className={`nav2-link${view === 'guest-scorer' || view === 'resume' ? ' active' : ''}`}
                  onClick={() => {
                    if (!isAuthenticated) {
                      loginAsGuest();
                      setView('guest-scorer');
                    } else if (user?.role === 'seeker') {
                      setView('resume');
                    } else {
                      setView('guest-scorer');
                    }
                  }}
                >
                  Resume
                </button>
              )}



              {/* About Us - Hidden for logged-in real users, visible to guests */}
              {(!isAuthenticated || user?.role === 'guest') && (
                <button
                  className={`nav2-link${view === 'about' ? ' active' : ''}`}
                  onClick={() => setView('about')}
                >
                  About Us
                </button>
              )}

              {/* Role-Specific Tabs (For seeker/provider) */}
              {isAuthenticated && user && user.role === 'seeker' && (
                <>
                  <button
                    className={`nav2-link${view === 'matches' ? ' active' : ''}`}
                    onClick={() => setView('matches')}
                  >
                    Suitable Matches
                  </button>
                  <button
                    className={`nav2-link${view === 'prep' ? ' active' : ''}`}
                    onClick={() => setView('prep')}
                  >
                    Prep Coach
                  </button>
                </>
              )}

              {isAuthenticated && user && user.role === 'provider' && (
                <>
                  <button
                    className={`nav2-link${view === 'post' ? ' active' : ''}`}
                    onClick={() => setView('post')}
                  >
                    Post Job
                  </button>
                  <button
                    className={`nav2-link${view === 'tracker' ? ' active' : ''}`}
                    onClick={() => setView('tracker')}
                  >
                    Candidate Tracker
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── Right Side ── */}
          <div className="nav2-right">

            {isLoading ? (
              <div className="nav2-loading-dot" />
            ) : isAuthenticated && user ? (
              /* Logged-in user menu */
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button className="nav2-user-btn" onClick={() => setShowUserMenu(p => !p)} id="btn-user-pill">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="nav2-avatar-img" />
                  ) : (
                    <span className="nav2-avatar-init">
                      {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="nav2-user-name">{user.name.split(' ')[0]}</span>
                  <span className={`nav2-chevron${showUserMenu ? ' open' : ''}`}><ChevronDown /></span>
                </button>

                {showUserMenu && (
                  <div className="nav2-dropdown animate-fade-rise">
                    <div className="nav2-dropdown-header">
                      <div className="nav2-dropdown-avatar">
                        {user.avatar
                          ? <img src={user.avatar} alt="" />
                          : <span>{user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                        }
                      </div>
                      <div>
                        <p className="nav2-dropdown-name">{user.name}</p>
                        <p className="nav2-dropdown-email">{user.email}</p>
                      </div>
                    </div>
                    <div className="nav2-dropdown-divider" />
                    <div className="nav2-dropdown-role">
                      {user.role === 'seeker' ? '👤 Job Seeker' : user.role === 'guest' ? '👤 Guest Visitor' : '💼 Recruiter / Company'}
                    </div>
                    <div className="nav2-dropdown-divider" />
                    <button className="nav2-dropdown-item" onClick={() => { setShowUserMenu(false); logout(); }} id="btn-signout">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Guest auth buttons */
              <>
                <button className="nav2-signin-btn" onClick={openLogin} id="btn-signin">
                  Sign in
                </button>
                <button className="nav2-getstarted-btn" onClick={openSignup} id="btn-getstarted">
                  Get started
                </button>
              </>
            )}

            {/* Hamburger Menu Toggle (Mobile) */}
            <button className="nav2-hamburger" onClick={() => setIsMobileMenuOpen(p => !p)} aria-label="Toggle menu">
              {isMobileMenuOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="nav2-mobile-menu">
              {/* Home */}
              <button
                className={`nav2-mobile-link${(view === 'landing' || (isAuthenticated && user && user.role !== 'guest' && view === 'board')) ? ' active' : ''}`}
                onClick={() => {
                  if (isAuthenticated && user && user.role !== 'guest') {
                    setView('board');
                  } else {
                    setView('landing');
                  }
                  setIsMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Home
              </button>

              {/* Resume - Hidden for Recruiter (provider) */}
              {(!isAuthenticated || user?.role !== 'provider') && (
                <button
                  className={`nav2-mobile-link${view === 'guest-scorer' || view === 'resume' ? ' active' : ''}`}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (!isAuthenticated) {
                      loginAsGuest();
                      setView('guest-scorer');
                    } else if (user?.role === 'seeker') {
                      setView('resume');
                    } else {
                      setView('guest-scorer');
                    }
                  }}
                >
                  Resume
                </button>
              )}



              {/* About Us - Hidden for logged-in real users, visible to guests */}
              {(!isAuthenticated || user?.role === 'guest') && (
                <button
                  className={`nav2-mobile-link${view === 'about' ? ' active' : ''}`}
                  onClick={() => {
                    setView('about');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  About Us
                </button>
              )}

              {/* Seeker Specific */}
              {isAuthenticated && user && user.role === 'seeker' && (
                <>
                  <button
                    className={`nav2-mobile-link${view === 'matches' ? ' active' : ''}`}
                    onClick={() => {
                      setView('matches');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Suitable Matches
                  </button>
                  <button
                    className={`nav2-mobile-link${view === 'prep' ? ' active' : ''}`}
                    onClick={() => {
                      setView('prep');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Prep Coach
                  </button>
                </>
              )}

              {/* Recruiter Specific */}
              {isAuthenticated && user && user.role === 'provider' && (
                <>
                  <button
                    className={`nav2-mobile-link${view === 'post' ? ' active' : ''}`}
                    onClick={() => {
                      setView('post');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Post Job
                  </button>
                  <button
                    className={`nav2-mobile-link${view === 'tracker' ? ' active' : ''}`}
                    onClick={() => {
                      setView('tracker');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Candidate Tracker
                  </button>
                </>
              )}
            </div>
          )}
        </nav>
      </header>

      {showAuthModal && (
        <AuthModal 
          onClose={() => { setShowAuthModal(false); setAuthMessage(''); }} 
          initialMode={authMode} 
          customMessage={authMessage} 
        />
      )}
    </>
  );
};
