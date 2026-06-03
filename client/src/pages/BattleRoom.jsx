import React, { useState, useEffect, useContext, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";
import Editor from "@monaco-editor/react";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Send, 
  Clock, 
  Terminal as ConsoleIcon, 
  Users, 
  Code, 
  BookOpen,
  Award,
  Zap,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Activity,
  ArrowLeft
} from "lucide-react";

function BattleRoom() {
  const { user } = useContext(AuthContext);
  const { socket, connected } = useContext(SocketContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const roomId = searchParams.get("roomId");

  // Battle Data
  const [problem, setProblem] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(600);
  const [activeTab, setActiveTab] = useState("problem"); // 'problem', 'opponent', 'submissions'
  
  // Players Progress
  const [selfProgress, setSelfProgress] = useState({ passed: 0, total: 0, codeLength: 0, submissions: 0 });
  const [oppProgress, setOppProgress] = useState({ username: "Opponent", elo: 1000, passed: 0, total: 0, codeLength: 0, submissions: 0 });
  const [opponentTyping, setOpponentTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Coding State
  const [language, setLanguage] = useState("c");
  const [code, setCode] = useState("");
  
  // Console Output State
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileMessage, setCompileMessage] = useState("");
  const [runResult, setRunResult] = useState(null);
  const [submissionHistory, setSubmissionHistory] = useState([]);

  // End Game State
  const [matchEnded, setMatchEnded] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  
  // Rematch state
  const [selfWantsRematch, setSelfWantsRematch] = useState(false);
  const [oppWantsRematch, setOppWantsRematch] = useState(false);

  // Initialize Socket connection inside Room
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit("joinRoom", { roomId, token: localStorage.getItem("token") });

    socket.on("roomInfo", (data) => {
      setProblem(data.problem);
      setTimeRemaining(data.timeRemaining);
      
      const totalCases = data.problem.testCases ? data.problem.testCases.length : 0;
      
      setSelfProgress(prev => ({
        ...prev,
        ...data.self,
        total: totalCases
      }));

      setOppProgress(prev => ({
        ...prev,
        ...data.opponent,
        total: totalCases
      }));

      // Load initial code template
      if (data.problem.codeTemplates && data.problem.codeTemplates[language]) {
        setCode(data.problem.codeTemplates[language]);
      }
    });

    socket.on("timerUpdate", (data) => {
      setTimeRemaining(data.timeRemaining);
    });

    socket.on("opponentTyping", (data) => {
      setOppProgress(prev => ({ ...prev, codeLength: data.codeLength }));
      setOpponentTyping(true);

      // Reset typing indicator after delay
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setOpponentTyping(false);
      }, 1500);
    });

    socket.on("playerProgressUpdate", (data) => {
      if (data.userId !== user.id) {
        setOppProgress(prev => ({
          ...prev,
          passed: data.passed,
          total: data.total
        }));
      }
    });

    socket.on("compiling", (data) => {
      setIsCompiling(true);
      setCompileMessage(data.message);
    });

    socket.on("runResult", (data) => {
      setIsCompiling(false);
      if (data.success) {
        setRunResult({ type: "run", ...data });
        setConsoleOpen(true);
      } else {
        alert(data.message || "Failed to execute code");
      }
    });

    socket.on("submitResult", (data) => {
      setIsCompiling(false);
      if (data.success) {
        setRunResult({ type: "submit", ...data });
        setConsoleOpen(true);
        
        // Update local submission counts
        setSelfProgress(prev => ({ ...prev, submissions: prev.submissions + 1 }));

        // Log to submissions list tab
        setSubmissionHistory(prev => [
          {
            timestamp: new Date().toLocaleTimeString(),
            passed: data.passedCases,
            total: data.totalCases,
            solved: data.solvedAll,
            language
          },
          ...prev
        ]);
      } else {
        alert(data.message || "Failed to submit code");
      }
    });

    socket.on("matchOver", (data) => {
      setMatchEnded(true);
      setMatchResult(data);
    });

    socket.on("opponentRematchRequested", () => {
      setOppWantsRematch(true);
    });

    socket.on("rematchStarted", (data) => {
      // Re-route to new rematch room!
      navigate(`/battle?roomId=${data.newRoomId}`);
      window.location.reload(); // Hard reload to wipe compiler console and timers cleanly
    });

    socket.on("roomError", (err) => {
      alert(err.message || "Room error");
      navigate("/dashboard");
    });

    return () => {
      socket.off("roomInfo");
      socket.off("timerUpdate");
      socket.off("opponentTyping");
      socket.off("playerProgressUpdate");
      socket.off("compiling");
      socket.off("runResult");
      socket.off("submitResult");
      socket.off("matchOver");
      socket.off("opponentRematchRequested");
      socket.off("rematchStarted");
      socket.off("roomError");
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, roomId, language, user.id, navigate]);

  // Update starter code when language switches
  const handleLanguageChange = (e) => {
    const nextLang = e.target.value;
    setLanguage(nextLang);
    if (problem && problem.codeTemplates && problem.codeTemplates[nextLang]) {
      setCode(problem.codeTemplates[nextLang]);
    }
  };

  // Capture keystrokes and broadcast length to opponent
  const handleCodeChange = (val) => {
    setCode(val);
    setSelfProgress(prev => ({ ...prev, codeLength: val.length }));
    if (socket) {
      socket.emit("codeChange", { roomId, codeLength: val.length });
    }
  };

  const handleRun = () => {
    if (!socket) return;
    setRunResult(null);
    socket.emit("runCode", { roomId, code, language });
  };

  const handleSubmit = () => {
    if (!socket) return;
    setRunResult(null);
    socket.emit("submitCode", { roomId, code, language });
  };

  const handleForfeit = () => {
    if (window.confirm("Are you sure you want to forfeit this duel? This will count as a defeat and deduct ELO.")) {
      if (socket) {
        socket.emit("leaveRoom", { roomId });
      }
      navigate("/dashboard");
    }
  };

  const handleRequestRematch = () => {
    setSelfWantsRematch(true);
    if (socket) {
      socket.emit("requestRematch", { roomId });
    }
  };

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!user || !problem) {
    return (
      <div className="min-h-screen bg-[#070a13] flex flex-col items-center justify-center gap-4 text-zinc-300">
        <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-sm font-semibold">Joining battle arena...</p>
      </div>
    );
  }

  // Calculate percentage progress meters
  const selfPassedPct = selfProgress.total > 0 ? (selfProgress.passed / selfProgress.total) * 100 : 0;
  const oppPassedPct = oppProgress.total > 0 ? (oppProgress.passed / oppProgress.total) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#070a13] text-zinc-200 flex flex-col overflow-hidden select-none">
      <Navbar />

      {/* Top Match Stats Info Ribbon */}
      <div className="bg-[#0b0f19] border-b border-zinc-800/80 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Self Stats Card */}
        <div className="flex items-center gap-3 w-full sm:w-60">
          <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-xs font-black text-indigo-400">
            YOU
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-zinc-300 truncate">{user.username}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${selfPassedPct}%` }}></div>
              </div>
              <span className="text-[10px] font-black text-indigo-400 tabular-nums">
                {selfProgress.passed}/{selfProgress.total} <span className="text-zinc-600 font-normal">TC</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center Arena Duel Clock */}
        <div className="flex items-center gap-3.5 px-6 py-1.5 bg-zinc-950 border border-zinc-800 rounded-2xl">
          <Clock className={`h-4.5 w-4.5 ${timeRemaining < 60 ? "text-rose-500 animate-pulse" : "text-indigo-400"}`} />
          <span className={`text-base font-black tabular-nums tracking-wide ${timeRemaining < 60 ? "text-rose-500" : "text-zinc-100"}`}>
            {formatTime(timeRemaining)}
          </span>
          <button
            onClick={handleForfeit}
            className="text-[10px] font-bold text-rose-500 bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/20 px-2.5 py-1 rounded-md transition-colors"
          >
            Forfeit
          </button>
        </div>

        {/* Opponent Stats Card */}
        <div className="flex items-center gap-3 w-full sm:w-60 justify-end text-right">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-end gap-1.5">
              {opponentTyping && (
                <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-500 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.2 rounded-md font-bold animate-pulse">
                  <Activity className="h-2.5 w-2.5" />
                  TYPING
                </span>
              )}
              <span className="text-xs font-bold text-zinc-300 truncate">{oppProgress.username}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 justify-end">
              <span className="text-[10px] font-black text-rose-400 tabular-nums">
                {oppProgress.passed}/{oppProgress.total} <span className="text-zinc-600 font-normal">TC</span>
              </span>
              <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500" style={{ width: `${oppPassedPct}%` }}></div>
              </div>
            </div>
          </div>
          <div className="h-9 w-9 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-xs font-black text-rose-400">
            VS
          </div>
        </div>

      </div>

      {/* Main split dashboard panels */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        
        {/* Left Side: Tabs console (Problem, Opponent, History) */}
        <div className="flex flex-col border-r border-zinc-800/80 bg-[#090d16]/30 overflow-hidden">
          
          {/* Tab navigation headers */}
          <div className="flex items-center border-b border-zinc-800/60 bg-[#0b0f19]/80 px-4">
            {[
              { id: "problem", label: "Problem Specs", icon: <BookOpen className="h-3.5 w-3.5" /> },
              { id: "opponent", label: "Opponent Details", icon: <Users className="h-3.5 w-3.5" /> },
              { id: "submissions", label: "Submissions Log", icon: <Award className="h-3.5 w-3.5" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 py-3.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-400 font-black"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Body contents */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {activeTab === "problem" && (
              <div className="space-y-5">
                {/* Title and Difficulty */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-zinc-100">{problem.title}</h2>
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    problem.difficulty === "Easy" ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" :
                    problem.difficulty === "Medium" ? "text-amber-400 border-amber-500/20 bg-amber-500/5" :
                    "text-rose-400 border-rose-500/20 bg-rose-500/5"
                  }`}>
                    {problem.difficulty}
                  </span>
                </div>

                {/* Description */}
                <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line border-b border-zinc-800/50 pb-5">
                  {problem.description}
                </div>

                {/* Examples */}
                {problem.examples && problem.examples.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Examples</h3>
                    {problem.examples.map((ex, idx) => (
                      <div key={idx} className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4 space-y-2 text-xs">
                        <div className="font-bold text-zinc-300">Example {idx + 1}:</div>
                        <div className="font-mono text-zinc-400 bg-zinc-950/60 p-2.5 rounded border border-zinc-900/80">
                          <span className="text-indigo-400 font-bold">Input:</span> {ex.input} <br />
                          <span className="text-emerald-400 font-bold">Output:</span> {ex.output}
                        </div>
                        {ex.explanation && (
                          <div className="text-zinc-500 mt-2 italic">
                            <span className="font-bold not-italic">Explanation:</span> {ex.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                {problem.constraints && problem.constraints.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-zinc-800/50">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Constraints</h3>
                    <ul className="list-disc list-inside text-zinc-400 text-xs space-y-1.5 font-mono">
                      {problem.constraints.map((cons, idx) => (
                        <li key={idx}>{cons}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "opponent" && (
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-zinc-300">Live Opponent Tracking</h3>
                <div className="bg-zinc-900/35 border border-zinc-800/80 rounded-2xl p-5 space-y-4 text-xs">
                  <div className="flex justify-between border-b border-zinc-800/50 pb-3">
                    <span className="text-zinc-500 font-medium">Username:</span>
                    <span className="font-bold text-zinc-200">{oppProgress.username}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800/50 pb-3">
                    <span className="text-zinc-500 font-medium">MMR ELO Score:</span>
                    <span className="font-bold text-zinc-200">{oppProgress.elo}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800/50 pb-3">
                    <span className="text-zinc-500 font-medium">Test Cases Solved:</span>
                    <span className="font-black text-rose-400">{oppProgress.passed} / {oppProgress.total}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800/50 pb-3">
                    <span className="text-zinc-500 font-medium">Code Characters typed:</span>
                    <span className="font-mono text-zinc-300">{oppProgress.codeLength} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-medium">Total compilation trials:</span>
                    <span className="font-mono text-zinc-300">{oppProgress.submissions} submits</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "submissions" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-300">Your Solution Submissions</h3>
                {submissionHistory.length === 0 ? (
                  <div className="py-12 border border-zinc-800/70 rounded-2xl bg-zinc-900/10 text-center">
                    <Award className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
                    <p className="text-xs text-zinc-500">You haven't submitted any answers yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissionHistory.map((sub, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800/70 p-4 rounded-xl text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-300">Attempt {submissionHistory.length - idx}</span>
                            <span className="text-[10px] text-zinc-500 font-semibold">{sub.timestamp}</span>
                          </div>
                          <p className="text-[10px] text-zinc-500 uppercase font-semibold">Language: {sub.language}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold ${
                            sub.solved 
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/25"
                          }`}>
                            {sub.passed} / {sub.total} Passed
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Right Side: IDE Editor and compiler terminal console */}
        <div className="flex flex-col overflow-hidden bg-[#0d111d]">
          
          {/* Header language picker selector */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 bg-[#0a0f1d] px-5 py-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
              <Code className="h-4 w-4 text-indigo-400" />
              SOLVING ENGINE
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={language}
                onChange={handleLanguageChange}
                className="bg-zinc-900 border border-zinc-800 text-xs rounded-lg px-2.5 py-1.5 text-zinc-300 outline-none focus:border-indigo-500/50"
              >
                <option value="c">C (GCC)</option>
                <option value="python">Python 3</option>
                <option value="cpp">C++ (GCC)</option>
                <option value="java">Java (OpenJDK)</option>
              </select>
            </div>
          </div>

          {/* Monaco Code Editor */}
          <div className="flex-1 min-h-0 bg-[#070a13]">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              loading={
                <div className="flex items-center justify-center h-full text-xs text-zinc-500 font-bold">
                  Initializing code templates...
                </div>
              }
              options={{
                fontSize: 14,
                fontFamily: "Fira Code, JetBrains Mono, monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                cursorBlinking: "smooth",
                formatOnType: true,
                padding: { top: 16 },
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8
                }
              }}
            />
          </div>

          {/* Bottom Compiler outputs dashboard */}
          <div className="border-t border-zinc-800/85 bg-[#0a0f1d] flex flex-col">
            
            {/* Console Actions Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-900">
              <button
                onClick={() => setConsoleOpen(!consoleOpen)}
                className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <ConsoleIcon className="h-4 w-4 text-indigo-400" />
                Compiler Console Output
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRun}
                  disabled={isCompiling}
                  className="flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-xl text-zinc-300 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5 text-zinc-400 fill-zinc-400" />
                  Run Tests
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isCompiling}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-[0_4px_15px_rgba(99,102,241,0.2)] transition-all cursor-pointer border border-indigo-400/20 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  Submit Solution
                </button>
              </div>
            </div>

            {/* Console Details Output Area */}
            {consoleOpen && (
              <div className="h-44 overflow-y-auto bg-zinc-950 p-5 font-mono text-xs text-zinc-400 border-t border-zinc-900">
                {isCompiling ? (
                  <div className="flex items-center gap-3 text-indigo-400 font-bold">
                    <span className="h-4 w-4 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin"></span>
                    <span>{compileMessage}</span>
                  </div>
                ) : runResult ? (
                  <div className="space-y-4">
                    {/* Header outcome */}
                    <div className="flex items-center gap-2">
                      {runResult.passedCases === runResult.totalCases ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase text-[10px]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Accepted
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full uppercase text-[10px]">
                          <XCircle className="h-3.5 w-3.5" />
                          Failed
                        </span>
                      )}
                      <span className="font-bold text-zinc-300">
                        {runResult.passedCases} / {runResult.totalCases} Test Cases Passed
                      </span>
                    </div>

                    {/* Results list */}
                    <div className="space-y-3 divide-y divide-zinc-900 pt-2.5">
                      {runResult.results && runResult.results.slice(0, 3).map((res, idx) => (
                        <div key={idx} className="pt-3 first:pt-0 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-500">Case {idx + 1}</span>
                            <span className={res.passed ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                              {res.passed ? "Passed" : "Wrong Answer"}
                            </span>
                          </div>
                          <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-900 text-[11px] space-y-1">
                            <div><span className="text-zinc-600">Input:</span> {res.input}</div>
                            <div><span className="text-zinc-600">Expected:</span> {res.expected}</div>
                            <div><span className="text-zinc-600">Actual:</span> <span className={res.passed ? "text-zinc-300" : "text-rose-300 font-bold"}>{res.actual}</span></div>
                            {res.error && <div className="text-rose-400 font-bold"><span className="text-zinc-600">Error:</span> {res.error}</div>}
                          </div>
                        </div>
                      ))}
                      
                      {runResult.totalCases > 3 && (
                        <div className="text-[10px] text-zinc-500 pt-2.5">
                          Showing first 3 test cases. Remaining {runResult.totalCases - 3} cases hidden for competition integrity.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-zinc-600 italic">
                    Console ready. Write code, then click Run or Submit to see outputs.
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Post Game Scorecard Overlay Modal */}
      <AnimatePresence>
        {matchEnded && matchResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-[#060810]/95 backdrop-blur flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="max-w-xl w-full bg-[#0b0f19] border border-zinc-800 rounded-3xl p-8 text-center space-y-6 shadow-[0_30px_70px_rgba(99,102,241,0.25)] relative overflow-hidden"
            >
              {/* Confetti Glow background */}
              <div className={`absolute w-72 h-72 rounded-full blur-[100px] opacity-10 top-[-20%] left-[-20%] ${
                matchResult.winnerId === user.id ? "bg-emerald-500" : matchResult.winnerId === null ? "bg-zinc-500" : "bg-rose-500"
              }`} />

              {/* Title Outcome Banner */}
              <div className="space-y-1.5">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 mb-2">
                  <Award className={`h-6 w-6 ${
                    matchResult.winnerId === user.id ? "text-emerald-400" : matchResult.winnerId === null ? "text-zinc-400" : "text-rose-400"
                  }`} />
                </div>
                
                <h1 className={`text-3xl font-black uppercase tracking-widest ${
                  matchResult.winnerId === user.id ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/10" : 
                  matchResult.winnerId === null ? "text-zinc-400 bg-zinc-500/5 border-zinc-500/10" : "text-rose-400 bg-rose-500/5 border-rose-500/10"
                }`}>
                  {matchResult.winnerId === user.id ? "VICTORY!" : matchResult.winnerId === null ? "DRAW MATCH" : "DEFEAT"}
                </h1>
                
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                  {matchResult.isForfeit ? "Winner decided by forfeit" : "Duel session concluded"}
                </p>
              </div>

              {/* Competitors Stats Grid */}
              <div className="grid grid-cols-2 gap-4.5 bg-[#111625]/60 border border-zinc-900 rounded-2xl p-5 text-left">
                {/* Self Results */}
                <div className="space-y-2 border-r border-zinc-800/80 pr-4">
                  <div className="text-xs text-zinc-500 font-bold">YOUR OUTCOME</div>
                  <div className="font-extrabold text-sm text-zinc-200">{user.username}</div>
                  <div className="text-xs text-zinc-400 font-medium">Passed: <span className="font-bold text-zinc-100">{matchResult.results[user.id].passed} TC</span></div>
                  
                  {/* Elo Shift */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-xs text-zinc-500">ELO Rating:</span>
                    <span className={`text-xs font-black ${
                      matchResult.results[user.id].eloChange >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      {matchResult.results[user.id].newElo} 
                      ({matchResult.results[user.id].eloChange >= 0 ? "+" : ""}{matchResult.results[user.id].eloChange})
                    </span>
                  </div>
                </div>

                {/* Opponent Results */}
                <div className="space-y-2 pl-4">
                  <div className="text-xs text-zinc-500 font-bold">OPPONENT OUTCOME</div>
                  <div className="font-extrabold text-sm text-zinc-200">{oppProgress.username}</div>
                  <div className="text-xs text-zinc-400 font-medium">Passed: <span className="font-bold text-zinc-100">{matchResult.results[oppProgress.userId]?.passed || 0} TC</span></div>
                  
                  {/* Elo Shift */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-xs text-zinc-500">ELO Rating:</span>
                    <span className={`text-xs font-black ${
                      (matchResult.results[oppProgress.userId]?.eloChange || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      {matchResult.results[oppProgress.userId]?.newElo || 1000} 
                      ({(matchResult.results[oppProgress.userId]?.eloChange || 0) >= 0 ? "+" : ""}{matchResult.results[oppProgress.userId]?.eloChange || 0})
                    </span>
                  </div>
                </div>
              </div>

              {/* Rematch negotiation panel */}
              <div className="bg-[#111625] rounded-2xl p-5 border border-zinc-900 text-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-left space-y-1">
                  <div className="font-bold text-zinc-200">Want to settle the score?</div>
                  <p className="text-xs text-zinc-500">Request a rematch using a new random coding task.</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  {!selfWantsRematch ? (
                    <button
                      onClick={handleRequestRematch}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-colors cursor-pointer border border-indigo-400/20"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Request Rematch
                    </button>
                  ) : (
                    <span className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold text-xs">
                      <span className="h-3 w-3 border-2 border-zinc-700 border-t-zinc-500 rounded-full animate-spin"></span>
                      Awaiting Opponent...
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3.5 border border-zinc-800 hover:border-zinc-700 rounded-xl text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4 text-zinc-500" />
                  Return to Dashboard
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default BattleRoom;