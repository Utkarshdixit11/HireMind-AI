
import React from 'react';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { UserIcon } from './icons/UserIcon';

interface HeaderProps {
  view: 'seeker' | 'provider';
  setView: (view: 'seeker' | 'provider') => void;
}

export const Header: React.FC<HeaderProps> = ({ view, setView }) => {
  const seekerClasses = view === 'seeker' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100';
  const providerClasses = view === 'provider' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100';

  return (
    <header className="text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-blue-800">
       PanScience
      </h1>
      <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">
        Your personal AI career assistant. Optimize your resume, find the perfect job, and discover top talent.
      </p>
      <div className="mt-8 flex justify-center items-center bg-white p-2 rounded-xl shadow-md max-w-md mx-auto">
        <button
          onClick={() => setView('seeker')}
          className={`w-1/2 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-lg font-semibold transition-all duration-300 ${seekerClasses}`}
        >
          <UserIcon />
          Job Seeker
        </button>
        <button
          onClick={() => setView('provider')}
          className={`w-1/2 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-lg font-semibold transition-all duration-300 ${providerClasses}`}
        >
          <BriefcaseIcon />
          Job Provider
        </button>
      </div>
    </header>
  );
};
