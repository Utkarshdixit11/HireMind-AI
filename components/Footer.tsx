import React from 'react';

const SparkleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 3Q12 12 21 12Q12 12 12 21Q12 12 3 12Q12 12 12 3Z" fill="currentColor" />
    <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

interface FooterProps {
  onAbout?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onAbout }) => {
  return (
    <footer className="hm-footer">
      <div className="hm-footer-grid">
        <div className="hm-footer-brand">
          <div className="hm-footer-logo">
            <span style={{ color: '#5f8dfc', display: 'flex', alignItems: 'center' }}><SparkleIcon /></span>
            <span style={{ marginLeft: 6, fontWeight: 500 }}>HireMind</span>
            <span className="hm-footer-logo-ai">AI</span>
          </div>
          <p className="hm-footer-desc">
            Experience the next generation of AI-driven recruitment. Smart resume scoring, matching, and preparation tools right at your fingertips.
          </p>

          {/* Developer Information */}
          <div className="hm-footer-developer-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
              <span>👨‍💻</span>
              <span>Developed by <a href="https://www.linkedin.com/in/utkarshdixit9" target="_blank" rel="noopener noreferrer" className="hm-footer-dev-link">Utkarsh Dixit</a></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>
              <span>✉️</span>
              <a href="mailto:utkarshdixut925@gmail.com" className="hm-footer-dev-sublink">utkarshdixut925@gmail.com</a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
              <span>🔗</span>
              <a href="https://www.linkedin.com/in/utkarshdixit9" target="_blank" rel="noopener noreferrer" className="hm-footer-dev-sublink">linkedin.com/in/utkarshdixit9</a>
            </div>
          </div>
        </div>

        <div className="hm-footer-col">
          <h4 className="hm-footer-col-title">Products</h4>
          <ul className="hm-footer-links">
            <li><a href="#">Resume Parser</a></li>
            <li><a href="#">Match Scorer</a></li>
            <li><a href="#">Interview Coach</a></li>
            <li><a href="#">JD Architect</a></li>
          </ul>
        </div>

        <div className="hm-footer-col">
          <h4 className="hm-footer-col-title">Company</h4>
          <ul className="hm-footer-links">
            <li>
              <button
                onClick={onAbout}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', textAlign: 'left' }}
                className="hm-footer-links-btn"
              >
                About Us
              </button>
            </li>
            <li><a href="mailto:utkarshdixut925@gmail.com">Contact</a></li>
            <li><a href="#">Privacy Policy</a></li>
          </ul>
        </div>
      </div>

      <div className="hm-footer-bottom">
        <div className="hm-footer-copy">
          © {new Date().getFullYear()} HireMind AI. All rights reserved.
        </div>
        <div className="hm-footer-socials">
          <a href="https://www.linkedin.com/in/utkarshdixit9" target="_blank" rel="noopener noreferrer" className="hm-footer-social-link" aria-label="LinkedIn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
              <rect x="2" y="9" width="4" height="12"/>
              <circle cx="4" cy="4" r="2"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
};
