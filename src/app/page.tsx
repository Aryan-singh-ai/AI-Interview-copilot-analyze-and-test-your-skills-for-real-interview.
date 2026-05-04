"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [showOTP, setShowOTP] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (data.success) {
        setShowOTP(true);
      } else {
        alert(data.error || "Failed to send OTP");
      }
    } catch (err) {
      alert("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      
      if (data.success) {
        router.push("/dashboard");
      } else {
        alert(data.error || "Invalid OTP");
      }
    } catch (err) {
      alert("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white text-slate-900 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[600px] h-[600px] bg-green-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-[400px] h-[400px] bg-green-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex mb-24">
        <p className="flex w-full justify-center lg:justify-start font-bold text-green-700 text-xl tracking-tight">
          InterviewPilot AI
        </p>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <h1 className="text-6xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl text-slate-900 mb-6">
          Ace Your Next <span className="text-green-600">Interview</span>
        </h1>
        
        <p className="text-xl text-slate-600 max-w-2xl mb-12">
          Your personal AI Interview Copilot. Practice with real-time feedback, behavioral analysis, and role-specific questions.
        </p>

        {/* OTP Authentication Box */}
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-[0_20px_50px_rgba(34,197,94,0.15)] border border-green-100">
          <h2 className="text-2xl font-bold mb-2 text-slate-800">Get Started</h2>
          <p className="text-slate-500 mb-6 text-sm">Sign in instantly with a secure code.</p>
          
          {!showOTP ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <input
                type="email"
                required
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all bg-slate-50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-all shadow-[0_10px_20px_rgba(34,197,94,0.2)] disabled:opacity-70 flex justify-center items-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Send Code"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <input
                type="text"
                required
                placeholder="Enter 4-digit code (e.g., 1234)"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all bg-slate-50 tracking-widest text-center text-lg font-semibold"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={4}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-all shadow-[0_10px_20px_rgba(34,197,94,0.2)] disabled:opacity-70 flex justify-center items-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Verify & Login"
                )}
              </button>
              <button 
                type="button" 
                onClick={() => setShowOTP(false)}
                className="w-full text-sm text-green-600 hover:text-green-700 mt-2 font-medium"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-3 gap-8 z-10">
        {[
          { title: 'Real-time Coaching', desc: 'Get instant feedback on your answers, tone, and confidence.' },
          { title: 'Resume Analysis', desc: 'Upload your resume and get personalized interview questions.' },
          { title: 'Performance Tracking', desc: 'Monitor your progress over time with detailed analytics.' },
        ].map((feature, i) => (
          <div key={i} className="group rounded-3xl border border-green-100 bg-white px-6 py-8 transition-all hover:border-green-300 hover:shadow-[0_20px_40px_rgba(34,197,94,0.08)]">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              {i + 1}
            </div>
            <h2 className="mb-3 text-xl font-bold text-slate-800">
              {feature.title}
            </h2>
            <p className="m-0 max-w-[30ch] text-sm text-slate-500 mx-auto">
              {feature.desc}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
