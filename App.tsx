import React, { useState } from 'react';
import { JobProvider } from './components/JobProvider';
import { JobSeeker } from './components/JobSeeker';
import { Header } from './components/Header';
import type { Job, Applicant } from './types';


const App: React.FC = () => {
  const [view, setView] = useState<'seeker' | 'provider'>('seeker');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);

  const addJob = (job: Job) => {
    setJobs(prevJobs => [...prevJobs, job]);
  };

  const addApplicant = (applicant: Applicant) => {
    setApplicants(prevApplicants => [...prevApplicants, applicant]);
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      <div className="container mx-auto p-4 md:p-8">
        <Header view={view} setView={setView} />
        <main className="mt-8">
          {view === 'seeker' ? (
            <JobSeeker jobs={jobs} addApplicant={addApplicant} applicants={applicants} />
          ) : ( 
            <JobProvider jobs={jobs} addJob={addJob} applicants={applicants} />
          )}
        </main>
      </div>
    </div>
   
  );
};

export default App; 
