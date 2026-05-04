"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ResumeAnalysis = {
  topRoles: string[];
  experienceYears: string;
  experienceLevel: string;
  profileSummary: string;
};

export default function ResumeUpload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setAnalysis(null);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze resume");
      setAnalysis(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  const startInterview = (role: string, experience: string) => {
    router.push(`/interview?role=${encodeURIComponent(role)}&experience=${encodeURIComponent(experience)}`);
  };

  return (
    <section className="bg-white border border-green-100 p-8 rounded-3xl shadow-[0_10px_30px_rgba(34,197,94,0.05)]">
      <h2 className="text-xl font-bold mb-1 text-slate-800">🎯 Resume-Based Interview</h2>
      <p className="text-sm text-slate-500 mb-6 font-medium">
        Upload your resume and our AI will detect your best-fit roles and tailor the interview just for you.
      </p>

      {/* Upload Zone */}
      {!analysis && (
        <>
          <div className="border-2 border-dashed border-green-200 rounded-2xl p-8 text-center hover:border-green-400 hover:bg-green-50/50 transition-all bg-white cursor-pointer group">
            <input
              type="file"
              id="resume-upload"
              className="hidden"
              accept=".pdf"
              onChange={handleFileChange}
            />
            <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-sm">
                📄
              </div>
              <div>
                <span className="text-slate-700 font-bold block">
                  {file ? file.name : "Click to upload your Resume (PDF)"}
                </span>
                {!file && <span className="text-slate-400 text-xs mt-1 block">Only PDF files supported</span>}
              </div>
            </label>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-500 font-medium text-center">{error}</p>
          )}

          {file && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full mt-5 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-[0_10px_20px_rgba(34,197,94,0.2)] flex justify-center items-center gap-2"
            >
              {uploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing Resume with AI...
                </>
              ) : (
                "🔍 Analyze Resume"
              )}
            </button>
          )}
        </>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-5 animate-in fade-in duration-500">
          {/* Profile Summary */}
          <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center text-xl shrink-0">🧑‍💼</div>
              <div>
                <p className="font-bold text-slate-800">{analysis.experienceLevel} Professional</p>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{analysis.profileSummary}</p>
                <span className="inline-block mt-2 text-xs bg-green-200 text-green-800 font-bold px-3 py-1 rounded-full">
                  ~{analysis.experienceYears} years experience
                </span>
              </div>
            </div>
          </div>

          {/* Detected Roles */}
          <div>
            <p className="text-sm font-bold text-slate-700 mb-3">
              🎯 AI detected <span className="text-green-600">{analysis.topRoles.length} best-fit roles</span> from your resume. Pick one to start:
            </p>
            <div className="space-y-3">
              {analysis.topRoles.map((role, i) => (
                <button
                  key={i}
                  onClick={() => startInterview(role, analysis.experienceYears)}
                  className="w-full flex items-center justify-between p-4 bg-white border border-green-200 hover:border-green-400 hover:bg-green-50 rounded-2xl transition-all group shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-black text-sm">
                      {i + 1}
                    </span>
                    <span className="font-bold text-slate-800">{role}</span>
                  </div>
                  <span className="text-green-500 font-bold group-hover:translate-x-1 transition-transform">→ Start</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={() => { setFile(null); setAnalysis(null); }}
            className="w-full text-sm text-slate-400 hover:text-green-600 font-medium mt-2"
          >
            Upload a different resume
          </button>
        </div>
      )}
    </section>
  );
}
