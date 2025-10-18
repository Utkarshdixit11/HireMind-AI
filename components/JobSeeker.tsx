
import React, { useState, useCallback } from 'react';
import type { Job, Applicant, JobFit } from '../types';
import { getTextFromPdf } from '../services/pdfService';
import { extractResumeInfo, analyzeFit, generateBio } from '../services/geminiService';
import { UploadIcon } from './icons/UploadIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface JobSeekerProps {
  jobs: Job[];
  applicants: Applicant[];
  addApplicant: (applicant: Applicant) => void;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-full animate-pulse bg-blue-600"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-blue-600" style={{animationDelay: '0.2s'}}></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-blue-600" style={{animationDelay: '0.4s'}}></div>
    </div>
);


export const JobSeeker: React.FC<JobSeekerProps> = ({ jobs, addApplicant, applicants }) => {
  const [currentApplicant, setCurrentApplicant] = useState<Applicant | null>(null);
  const [jobFits, setJobFits] = useState<JobFit[]>([]);
  const [bio, setBio] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isBioLoading, setIsBioLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setCurrentApplicant(null);
    setJobFits([]);
    setBio(null);
    setFileName(file.name);

    try {
      let resumeText = '';
      if (file.type === 'application/pdf') {
        resumeText = await getTextFromPdf(file);
      } else if (file.type === 'text/plain') {
        resumeText = await file.text();
      } else {
        throw new Error('Unsupported file type. Please upload a PDF or TXT file.');
      }

      const extractedInfo = await extractResumeInfo(resumeText);
      const newApplicant: Applicant = {
        id: `applicant-${Date.now()}`,
        fileName: file.name,
        resumeText,
        extractedInfo,
      };
      
      setCurrentApplicant(newApplicant);
      addApplicant(newApplicant); // Add to global state
    } catch (err: any) {
      setError(err.message || 'Failed to process resume.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const analyzeJobs = useCallback(async () => {
    if (!currentApplicant || jobs.length === 0) return;
    setIsAnalyzing(true);
    try {
        const fits: JobFit[] = await Promise.all(
            jobs.map(async (job) => {
                const { score, justification } = await analyzeFit(currentApplicant.extractedInfo, job.extractedInfo);
                return { jobId: job.id, jobTitle: job.title, score, justification };
            })
        );
        setJobFits(fits.sort((a, b) => b.score - a.score));
    } catch(err) {
        setError("Could not analyze job fits. The API might be busy.");
    }
    setIsAnalyzing(false);
  }, [currentApplicant, jobs]);

  React.useEffect(() => {
    if (currentApplicant && jobs.length > 0) {
        analyzeJobs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentApplicant, jobs.length]);


  const handleGenerateBio = async () => {
    if (!currentApplicant) return;
    setIsBioLoading(true);
    setBio(null);
    try {
        const generatedBio = await generateBio(currentApplicant.extractedInfo);
        setBio(generatedBio);
    } catch (err) {
        setError("Failed to generate bio.");
    } finally {
        setIsBioLoading(false);
    }
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left Column: Upload and Profile */}
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Upload Your Resume</h2>
          <p className="text-slate-600 mb-4">Upload your resume (PDF or TXT) to get started.</p>
          <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors disabled:opacity-50">
            <UploadIcon />
            <span>{isLoading ? 'Processing...' : (fileName || 'Choose File')}</span>
            <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.txt" disabled={isLoading} />
          </label>
          {isLoading && <div className="mt-4"><LoadingSpinner/></div>}
          {error && <p className="mt-4 text-red-500">{error}</p>}
        </div>

        {currentApplicant && (
          <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in">
            <h3 className="text-xl font-bold mb-4">{currentApplicant.extractedInfo.name}</h3>
            <div className="space-y-4 text-slate-700">
                <div>
                    <h4 className="font-semibold">Contact</h4>
                    <p>{currentApplicant.extractedInfo.contact}</p>
                </div>
                <div>
                    <h4 className="font-semibold">Education</h4>
                    <p>{currentApplicant.extractedInfo.education}</p>
                </div>
                <div>
                    <h4 className="font-semibold">Experience Summary</h4>
                    <p>{currentApplicant.extractedInfo.experienceSummary}</p>
                </div>
                 <div>
                    <h4 className="font-semibold">Skills</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {currentApplicant.extractedInfo.skills.map(skill => (
                            <span key={skill} className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">{skill}</span>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-6">
                 <button onClick={handleGenerateBio} disabled={isBioLoading} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                    <SparklesIcon/>
                    {isBioLoading ? 'Generating...' : 'Generate LinkedIn Bio'}
                </button>
                {isBioLoading && <div className="mt-4"><LoadingSpinner/></div>}
                {bio && <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h4 className="font-semibold text-indigo-800">Your LinkedIn Bio:</h4>
                    <p className="mt-2 text-indigo-700">{bio}</p>
                </div>}
            </div>
          </div>
        )}
      </div>
         
      {/* Right Column: Job Matches */}
      <div className="md:col-span-2 grid-rows-4 mb-8 ">
        
         <div className="bg-white p-6 rounded-xl shadow-lg min-h-[400px] mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Your Profile Review</h2>
            {!currentApplicant ? (
                <div className="flex items-center justify-center h-full text-slate-500">Upload your resume to see your profile review.</div>
            ) : isLoading ? (
                 <div className="flex items-center justify-center h-full text-slate-500"><LoadingSpinner/> <span className="ml-2">Analyzing profile...</span></div>
            ) : (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-700">Hello, {currentApplicant.extractedInfo.name}!</h3>
                    <p className="text-slate-600">Based on your uploaded resume, here is a Score of your profile:</p>
                    <ul className="list-disc list-inside text-slate-700">
                        <li>
                            <strong>SCORE: </strong>
                            {jobFits.length > 0 ? `${Math.round(jobFits.reduce((acc, f) => acc + f.score, 0) / jobFits.length)}%` : ' '}
                        </li>
                    </ul>
                    <p className="text-slate-600">You can now see how well you match with available job listings!</p>
                </div>
            )}
         </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg min-h-[400px]">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Job Matches</h2>
            {!currentApplicant ? (
                <div className="flex items-center justify-center h-full text-slate-500">Upload your resume to see job matches.</div>
            ) : isAnalyzing ? (
                 <div className="flex items-center justify-center h-full text-slate-500"><LoadingSpinner/> <span className="ml-2">Analyzing job fit...</span></div>
            ) : jobFits.length > 0 ? (
                <div className="space-y-4">
                    {jobFits.map(fit => (
                        <div key={fit.jobId} className="p-4 border border-slate-200 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-blue-700">{fit.jobTitle}</h3>
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
                <div className="flex items-center justify-center h-full text-slate-500">No jobs available to match against. Ask a provider to add one!</div>
            )}
        </div>
      </div>
    </div>
  );
};
