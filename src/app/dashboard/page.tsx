"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ResumeUpload from "@/components/ResumeUpload";
import { JOB_ROLES } from "@/lib/ai/prompts";

export default function Dashboard() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("Software Engineer");
  const [selectedFeedback, setSelectedFeedback] = useState<null | {
    role: string; score: number; strengths: string[]; weaknesses: string[]; improved: string;
  }>(null);

  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const res = await fetch("/api/interviews");
        const data = await res.json();
        if (data.interviews) setInterviews(data.interviews);
      } catch (e) {
        console.error("Failed to fetch interviews:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 p-8 relative">
      <header className="flex justify-between items-center mb-12 max-w-6xl mx-auto border-b border-green-100 pb-6">
        <h1 className="text-3xl font-extrabold text-green-700">Dashboard</h1>
        <div className="flex items-center gap-3">
          {/* Manual Role Picker */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-2 bg-white border border-green-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-400 cursor-pointer"
          >
            {JOB_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button
            onClick={() => router.push(`/interview?role=${encodeURIComponent(selectedRole)}&experience=2`)}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-[0_10px_20px_rgba(34,197,94,0.2)]"
          >
            Start Interview
          </button>
          <button onClick={() => router.push("/")} className="text-slate-500 hover:text-green-600 font-medium">
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-1 md:col-span-2 space-y-8">
          <section className="bg-white border border-green-100 p-8 rounded-3xl shadow-[0_10px_30px_rgba(34,197,94,0.05)]">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Interview History</h2>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Loading your history...</p>
                </div>
              ) : interviews.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-500 text-sm mb-4">No interviews yet. Start your first one!</p>
                  <button 
                    onClick={() => router.push(`/interview?role=${encodeURIComponent(selectedRole)}&experience=2`)}
                    className="text-green-600 font-bold hover:underline"
                  >
                    Start Now →
                  </button>
                </div>
              ) : (
                interviews.map((interview) => (
                  <div key={interview.id} className="flex justify-between items-center p-6 bg-green-50/50 rounded-2xl border border-green-100 hover:border-green-300 transition-colors">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{interview.role}</h3>
                      <p className="text-sm text-slate-500 font-medium">
                        Score: <span className="text-green-600 font-bold">{interview.overallScore?.toFixed(1) || "N/A"}/10</span> • {new Date(interview.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => setSelectedFeedback({
                        role: interview.role,
                        score: interview.overallScore || 0,
                        strengths: interview.responses[0]?.strengths || [],
                        weaknesses: interview.responses[0]?.weaknesses || [],
                        improved: interview.responses[0]?.improvedAnswer || "No detailed feedback available yet."
                      })}
                      className="px-4 py-2 bg-white text-green-600 hover:bg-green-50 border border-green-200 rounded-lg text-sm font-bold shadow-sm"
                    >
                      View Feedback
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <ResumeUpload />
        </div>

        <div className="space-y-8">
          <section className="bg-white border border-green-100 p-8 rounded-3xl shadow-[0_10px_30px_rgba(34,197,94,0.05)]">
            <h2 className="text-xl font-bold mb-6 text-slate-800">Weekly Progress</h2>
            <div className="h-40 flex items-end gap-2 justify-between">
              {[40, 60, 45, 80, 55, 90, 75].map((h, i) => (
                <div key={i} className="w-8 bg-green-500/80 rounded-t-lg hover:bg-green-400 transition-colors cursor-pointer" style={{ height: `${h}%` }}></div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-xs font-bold text-slate-400">
              <span>Mon</span><span>Sun</span>
            </div>
          </section>

          <section className="bg-white border border-green-100 p-8 rounded-3xl shadow-[0_10px_30px_rgba(34,197,94,0.05)]">
            <h2 className="text-xl font-bold mb-6 text-slate-800">Skill Weaknesses</h2>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <span className="text-sm font-bold text-slate-600 w-24">System Design</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div className="bg-green-300 h-3 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <span className="text-sm font-bold text-slate-600 w-24">React Hooks</span>
              </li>
            </ul>
          </section>
        </div>
      </main>

      {/* Feedback Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl border border-green-100 relative">
            <button 
              onClick={() => setSelectedFeedback(null)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 font-bold"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-2">Feedback: {selectedFeedback.role}</h2>
            <div className="inline-block px-3 py-1 bg-green-100 text-green-700 font-bold rounded-lg mb-6">
              Score: {selectedFeedback.score}/10
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><span className="text-green-500">✓</span> Strengths</h3>
                <ul className="list-disc pl-5 text-slate-600 space-y-1">
                  {selectedFeedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><span className="text-orange-500">⚠</span> Areas for Improvement</h3>
                <ul className="list-disc pl-5 text-slate-600 space-y-1">
                  {selectedFeedback.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                <h3 className="font-bold text-green-800 mb-2">💡 How to Improve</h3>
                <p className="text-sm text-green-700 leading-relaxed">{selectedFeedback.improved}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
