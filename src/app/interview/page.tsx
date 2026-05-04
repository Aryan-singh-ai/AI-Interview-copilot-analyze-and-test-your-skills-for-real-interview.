"use client";

import "regenerator-runtime/runtime";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

type Evaluation = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  improvedAnswer: string;
};

type Message = {
  role: "ai" | "user";
  text: string;
};

function InterviewRoom() {
  const searchParams = useSearchParams();
  const ROLE = searchParams.get("role") || "Software Engineer";
  const EXPERIENCE = searchParams.get("experience") || "2";
  const DIFFICULTY = "medium";

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const transcriptRef = useRef("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Keep a ref of latest transcript
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, evaluation]);

  // Interview timer
  useEffect(() => {
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // Speak text through browser TTS
  const speak = (text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    // Pick a natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) => v.name.includes("Google") || v.name.includes("Samantha") || v.lang === "en-US");
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => { setIsSpeaking(false); onEnd?.(); };
    utterance.onerror = () => { setIsSpeaking(false); onEnd?.(); };
    window.speechSynthesis.speak(utterance);
  };

  // Fetch a new AI question
  const fetchQuestion = async () => {
    setIsLoadingQuestion(true);
    setEvaluation(null);
    SpeechRecognition.stopListening();
    resetTranscript();

    try {
      const res = await fetch("/api/interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: ROLE, experience: EXPERIENCE, difficulty: DIFFICULTY }),
      });
      const data = await res.json();
      const q: string = data.question || "Tell me about yourself.";
      const h: string[] = data.hints || [];

      setCurrentQuestion(q);
      setHints(h);
      setQuestionCount((c) => c + 1);
      setMessages((prev) => [...prev, { role: "ai", text: q }]);

      // Speak the question out loud
      speak(`Question ${questionCount + 1}. ${q}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // Load first question and start interview on mount
  useEffect(() => {
    const startInterview = async () => {
      try {
        const res = await fetch("/api/interview/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: ROLE, difficulty: DIFFICULTY }),
        });
        const data = await res.json();
        if (data.interviewId) setInterviewId(data.interviewId);
      } catch (e) {
        console.error("Failed to start interview persistence:", e);
      }
    };

    startInterview();
    fetchQuestion();
    return () => {
      SpeechRecognition.stopListening();
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleRecording = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  // Submit answer to AI for evaluation
  const submitAnswer = async () => {
    const answer = transcriptRef.current.trim();
    if (!answer) return;

    SpeechRecognition.stopListening();
    setIsEvaluating(true);
    setMessages((prev) => [...prev, { role: "user", text: answer }]);
    resetTranscript();

    try {
      const res = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentQuestion, answer, role: ROLE, interviewId }),
      });
      const data: Evaluation = await res.json();
      setEvaluation(data);

      // Dynamic response based on score
      let opening = "";
      if (data.score >= 8.5) {
        opening = "Excellent answer! That was really impressive.";
      } else if (data.score >= 7) {
        opening = "Good answer! You covered the key points.";
      } else if (data.score >= 5) {
        opening = "That was a decent attempt, but there is room for improvement.";
      } else if (data.score >= 3) {
        opening = "That answer needs significant improvement. Let me give you some guidance.";
      } else {
        opening = "I'm afraid that answer was quite weak. Don't worry, let's work through what a better answer looks like.";
      }

      speak(
        `${opening} I give you a score of ${data.score} out of 10. 
         ${data.strengths.length > 0 ? "What you did well: " + data.strengths[0] + "." : ""}
         ${data.weaknesses.length > 0 ? "Area to improve: " + data.weaknesses[0] + "." : ""}
         Click next question when you are ready to continue.`
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 5) return "text-yellow-600";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="p-4 border-b border-green-100 flex justify-between items-center bg-white z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-500 hover:text-green-600 transition-colors font-medium">
            ← Exit
          </Link>
          <h1 className="text-xl font-bold text-slate-800">{ROLE} Interview</h1>
          <span className="text-xs bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full">
            Q{questionCount}
          </span>
        </div>
        <div className="text-green-700 font-bold font-mono bg-green-50 px-4 py-2 rounded-full border border-green-200">
          {formatTime(timer)}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Center - Avatar + Controls */}
        <div className="flex-1 flex flex-col p-6 gap-4 overflow-y-auto bg-slate-50/50">
          {/* AI Avatar */}
          <div className="bg-white border border-green-100 rounded-3xl p-8 flex flex-col items-center justify-center shadow-[0_10px_40px_rgba(34,197,94,0.08)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-green-50/50 to-transparent pointer-events-none" />

            <div className="w-28 h-28 bg-green-50 rounded-full border-4 border-green-200 flex items-center justify-center relative shadow-lg mb-4 z-10">
              <span className="text-5xl">{isLoadingQuestion ? "⏳" : "🤖"}</span>
              {(isSpeaking || isLoadingQuestion) && (
                <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-40" />
              )}
            </div>

            {isLoadingQuestion ? (
              <p className="text-slate-500 font-medium z-10 animate-pulse">Generating next question...</p>
            ) : (
              <p className="text-lg text-center max-w-2xl text-slate-700 font-medium z-10 leading-relaxed">
                "{currentQuestion}"
              </p>
            )}

            <button
              onClick={() => speak(currentQuestion)}
              disabled={isSpeaking || isLoadingQuestion}
              className="z-10 mt-4 px-5 py-2 bg-green-100 hover:bg-green-200 disabled:opacity-50 text-green-700 rounded-full font-bold flex items-center gap-2 transition-colors border border-green-200 text-sm"
            >
              🔊 {isSpeaking ? "Speaking..." : "Repeat Question"}
            </button>
          </div>

          {/* Mic Controls + Submit */}
          <div className="bg-white border border-green-100 rounded-3xl p-6 flex flex-col items-center gap-4 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">
              {listening ? "🔴 Listening — speak your answer..." : "Click the mic and speak your answer"}
            </p>

            <div className="flex items-center gap-6">
              <button
                onClick={toggleRecording}
                disabled={isLoadingQuestion || isEvaluating}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl border-4 disabled:opacity-40 ${
                  listening
                    ? "bg-red-500 hover:bg-red-600 border-red-200 animate-pulse text-white"
                    : "bg-white hover:bg-green-50 border-green-200 text-slate-700"
                }`}
              >
                <span className="text-2xl">{listening ? "⏹" : "🎙️"}</span>
              </button>

              <button
                onClick={submitAnswer}
                disabled={!transcript || isEvaluating || isLoadingQuestion}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-2xl font-bold transition-all shadow-[0_8px_20px_rgba(34,197,94,0.25)] flex items-center gap-2"
              >
                {isEvaluating ? (
                  <><span className="animate-spin">⏳</span> Evaluating...</>
                ) : (
                  <>✅ Submit Answer</>
                )}
              </button>

              <button
                onClick={fetchQuestion}
                disabled={isLoadingQuestion || isEvaluating}
                className="px-6 py-3 bg-white hover:bg-green-50 disabled:opacity-40 text-green-700 border border-green-200 rounded-2xl font-bold transition-all shadow-sm text-sm"
              >
                ⏭ Next Question
              </button>
            </div>

            {/* Live transcript display */}
            {transcript && (
              <div className="w-full bg-green-50 border border-green-100 rounded-2xl p-4 text-slate-700 text-sm leading-relaxed">
                <span className="text-green-600 font-bold text-xs uppercase tracking-wider block mb-1">Your Answer (Live)</span>
                {transcript}
                {listening && <span className="inline-block w-2 h-4 ml-1 bg-green-500 animate-pulse rounded-full" />}
              </div>
            )}
          </div>

          {/* Evaluation Panel */}
          {evaluation && (
            <div className="bg-white border border-green-200 rounded-3xl p-6 shadow-[0_10px_30px_rgba(34,197,94,0.1)] space-y-4 animate-in fade-in duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">🤖 AI Evaluation</h3>
                  <p className={`text-sm font-bold mt-1 ${scoreColor(evaluation.score)}`}>
                    {evaluation.score >= 8.5 ? "🏆 Excellent" :
                     evaluation.score >= 7   ? "✅ Good" :
                     evaluation.score >= 5   ? "⚠️ Needs Work" :
                     evaluation.score >= 3   ? "❌ Poor" : "💀 Very Weak"}
                  </p>
                </div>
                <span className={`text-4xl font-black ${scoreColor(evaluation.score)}`}>
                  {evaluation.score}<span className="text-base text-slate-400 font-bold">/10</span>
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">✅ Strengths</p>
                <ul className="space-y-1">
                  {evaluation.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-slate-700 flex gap-2"><span className="text-green-500">•</span>{s}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2">⚠ Areas to Improve</p>
                <ul className="space-y-1">
                  {evaluation.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-slate-700 flex gap-2"><span className="text-orange-400">•</span>{w}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">💡 Ideal Answer</p>
                <p className="text-sm text-green-800 leading-relaxed">{evaluation.improvedAnswer}</p>
              </div>

              <button
                onClick={fetchQuestion}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold transition-all shadow-[0_8px_20px_rgba(34,197,94,0.2)]"
              >
                Next Question →
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar - Chat + Hints */}
        <div className="w-[360px] border-l border-green-100 bg-white flex flex-col z-10 shadow-[-5px_0_20px_rgba(0,0,0,0.02)]">
          <div className="p-5 border-b border-green-100">
            <h2 className="font-bold text-slate-800">Conversation</h2>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-2xl p-4 shadow-sm ${
                  msg.role === "ai"
                    ? "bg-slate-50 border border-slate-100 text-slate-700"
                    : "bg-green-50 border border-green-100 text-slate-800 ml-4"
                }`}
              >
                <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${msg.role === "ai" ? "text-green-600" : "text-slate-500 text-right"}`}>
                  {msg.role === "ai" ? "🤖 AI Interviewer" : "You"}
                </span>
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            ))}
            {isEvaluating && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-500 animate-pulse text-sm">
                🤖 Evaluating your answer...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Hints */}
          {hints.length > 0 && (
            <div className="p-4 border-t border-green-100 bg-green-50/30">
              <h3 className="text-xs text-green-600 uppercase tracking-wider mb-3 font-bold">💡 Key Topics to Cover</h3>
              <div className="space-y-2">
                {hints.map((hint, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-green-800 bg-white p-3 rounded-xl border border-green-100 font-medium">
                    <span className="text-green-500">→</span> {hint}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading interview room...</p>
        </div>
      </div>
    }>
      <InterviewRoom />
    </Suspense>
  );
}
