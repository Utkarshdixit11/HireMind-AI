
import React, { useState, useCallback, useEffect } from 'react';
import type { Job, Applicant, ApplicantFit } from '../types';
import { getTextFromPdf } from '../services/pdfService';
import { extractJobInfo, analyzeFit } from '../services/geminiService';
import { UploadIcon } from './icons/UploadIcon';

interface JobProviderProps {
  jobs: Job[];
  addJob: (job: Job) => void;
  applicants: Applicant[];
}

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-full animate-pulse bg-blue-600"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-blue-600" style={{animationDelay: '0.2s'}}></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-blue-600" style={{animationDelay: '0.4s'}}></div>
    </div>
);

export const JobProvider: React.FC<JobProviderProps> = ({ jobs, addJob, applicants }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicantFits, setApplicantFits] = useState<ApplicantFit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    try {
      let jdText = '';
      if (file.type === 'application/pdf') {
        jdText = await getTextFromPdf(file);
      } else if (file.type === 'text/plain') {
        jdText = await file.text();
      } else {
        throw new Error('Unsupported file type. Please upload a PDF  file.');
      }
      setJobDescription(jdText);
    } catch (err: any) {
      setError(err.message || 'Failed to process file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!jobTitle || !jobDescription) {
      setError('Please provide a job title and description.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const extractedInfo = await extractJobInfo(jobDescription);
      const newJob: Job = {
        id: `job-${Date.now()}`,
        title: jobTitle,
        description: jobDescription,
        extractedInfo
      };
      addJob(newJob);
      setJobTitle('');
      setJobDescription('');
      setSelectedJob(newJob);
    } catch (err) {
      setError('Failed to create job. Could not extract information.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const analyzeApplicants = useCallback(async () => {
    if (!selectedJob || applicants.length === 0) {
      setApplicantFits([]);
      return;
    }

    setIsAnalyzing(true);
    try {
      const fits = await Promise.all(
        applicants.map(async (applicant) => {
          const { score, justification } = await analyzeFit(applicant.extractedInfo, selectedJob.extractedInfo);
          return {
            applicantId: applicant.id,
            applicantName: applicant.extractedInfo.name,
            score,
            justification
          };
        })
      );
      setApplicantFits(fits.sort((a, b) => b.score - a.score));
    } catch (err) {
      setError('Could not analyze applicants.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedJob, applicants]);

  useEffect(() => {
    analyzeApplicants();
  }, [selectedJob, applicants, analyzeApplicants]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left Column: Create JD & Job List */}
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Create Job Description</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Job Title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <textarea
              placeholder="Paste job description here or upload a file."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors">
              <UploadIcon />
              <span>Upload JD (PDF)</span>
              <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.txt" />
            </label>
            <button onClick={handleCreateJob} disabled={isLoading} className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              {isLoading ? 'Creating...' : 'Create Job'}
            </button>
            {isLoading && !isAnalyzing && <div className="mt-4"><LoadingSpinner/></div>}
            {error && <p className="mt-2 text-red-500">{error}</p>}
          </div>
        </div>

        {jobs.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Posted Jobs</h2>
            <div className="space-y-2">
              {jobs.map(job => (
                <button
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${selectedJob?.id === job.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-100'}`}
                >
                  <span className="font-semibold">{job.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Candidate Matches */}
      <div className="md:col-span-2">
        <div className="bg-white p-6 rounded-xl shadow-lg min-h-[400px]">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            {selectedJob ? `Candidate Matches for ${selectedJob.title}` : 'Select a Job'}
          </h2>
          {!selectedJob ? (
            <div className="flex items-center justify-center h-full text-slate-500">Select a job on the left to see matching candidates.</div>
          ) : isAnalyzing ? (
            <div className="flex items-center justify-center h-full text-slate-500"><LoadingSpinner/> <span className="ml-2">Analyzing applicants...</span></div>
          ) : applicantFits.length > 0 ? (
            <div className="space-y-4">
              {applicantFits.map(fit => (
                <div key={fit.applicantId} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-blue-700">{fit.applicantName}</h3>
                      <p className="text-sm text-slate-600 mt-1">{fit.justification}</p>
                    </div>
                    <div className={`text-lg font-bold px-3 py-1 rounded-full ${getScoreColor(fit.score)}`}>
                      {fit.score}%
                    </div>
                  </div>
                </div>  
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">No applicants yet. Ask a job seeker to upload their resume!</div>
          )}
        </div>
      </div>
    </div>
  );
};
