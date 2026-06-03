import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext, API_URL } from "../context/AuthContext";
import axios from "axios";
import Navbar from "../components/Navbar";
import { Terminal, Swords, Cpu, TrendingUp, Users, Code, Activity, Trophy, ChevronRight, X, HelpCircle, FileText, Shield } from "lucide-react";

function Home() {
  const { user } = useContext(AuthContext);
  const [activeModal, setActiveModal] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 1420,
    totalMatches: 8400,
    averageElo: 1000,
    activeBattles: 12
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/matches/stats`);
        setStats(prev => ({
          ...prev,
          ...res.data
        }));
      } catch (err) {
        console.warn("Could not fetch server stats, using default values");
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-zinc-100 flex flex-col font-sans">
      <Navbar />

      {/* Hero Section (Dark Slate Background, overflow-visible to prevent 3D clipping) */}
      <section 
        className="relative bg-[#1a1a1a] px-6 flex flex-col justify-center overflow-visible"
        style={{ 
          paddingTop: "9.5rem", 
          paddingBottom: "11rem", 
          clipPath: "polygon(0 0, 100% 0, 100% 88%, 0 100%)" 
        }}
      >
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 overflow-visible">
          
          {/* Hero Left: Mock 3D Tablet Dashboard */}
          <div 
            className="lg:col-span-5 order-2 lg:order-1 flex justify-center overflow-visible"
            style={{ paddingTop: "2.5rem", paddingBottom: "2.5rem" }}
          >
            <div className="relative w-full max-w-[340px]" style={{ perspective: "1200px" }}>
              <motion.div 
                initial={{ opacity: 0, y: 30, rotateY: -10, rotateX: 5 }}
                animate={{ opacity: 1, y: 0, rotateY: -14, rotateX: 10, rotateZ: -1 }}
                transition={{ duration: 0.8 }}
                className="bg-white border border-zinc-200 shadow-[0_25px_60px_rgba(0,0,0,0.3)] rounded-2xl p-4 flex flex-col gap-3 text-left"
                style={{ 
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden"
                }}
              >
                {/* Window header */}
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-400 bg-zinc-50 border border-zinc-100 rounded-full px-2.5 py-0.5">
                    battle_room_#2891.cpp
                  </span>
                </div>
                
                {/* Matchmaking status / players */}
                <div className="flex items-center justify-between bg-zinc-50 border border-zinc-100 rounded-xl p-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6.5 h-6.5 rounded-full bg-amber-100 flex items-center justify-center font-black text-amber-600 text-[10px]">
                      A
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-zinc-800">Ashborn</div>
                      <div className="text-[7.5px] text-zinc-400 font-bold uppercase">1540 ELO</div>
                    </div>
                  </div>
                  <div className="text-[8px] font-extrabold text-zinc-400 px-1.5 py-0.5 bg-zinc-200/60 rounded-md">
                    VS
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <div className="text-[9px] font-bold text-zinc-800">Opponent</div>
                      <div className="text-[7.5px] text-zinc-400 font-bold uppercase">1520 ELO</div>
                    </div>
                    <div className="w-6.5 h-6.5 rounded-full bg-zinc-100 flex items-center justify-center font-black text-zinc-500 text-[10px]">
                      O
                    </div>
                  </div>
                </div>

                {/* Monaco Editor Code Mock */}
                <div className="bg-[#1e1e1e] rounded-xl p-3 font-mono text-[9px] leading-relaxed shadow-inner overflow-hidden border border-zinc-800">
                  <div className="text-zinc-500">// Task: Find element in sorted array</div>
                  <div className="text-[#569cd6]"><span className="text-[#4fc1ff]">int</span> <span className="text-[#dcdcaa]">binarySearch</span>(<span className="text-[#4fc1ff]">int</span> arr[], <span className="text-[#4fc1ff]">int</span> target) &#123;</div>
                  <div className="pl-3 text-zinc-400"><span className="text-[#569cd6]">int</span> left = <span className="text-[#b5cea8]">0</span>, right = n - <span className="text-[#b5cea8]">1</span>;</div>
                  <div className="pl-3 text-[#569cd6]">while <span className="text-zinc-300">(left &lt;= right) &#123;</span></div>
                  <div className="pl-6 text-zinc-400"><span className="text-[#569cd6]">int</span> mid = left + (right - left) / <span className="text-[#b5cea8]">2</span>;</div>
                  <div className="pl-6 text-zinc-400"><span className="text-[#569cd6]">if</span> (arr[mid] == target) <span className="text-[#569cd6]">return</span> mid;</div>
                  <div className="pl-3 text-zinc-300">&#125;</div>
                  <div className="pl-3 text-[#569cd6]">return <span className="text-[#b5cea8]">-1</span>;</div>
                  <div className="text-zinc-400">&#125;</div>
                </div>

                {/* Verification result */}
                <div className="border border-zinc-100 bg-zinc-50 rounded-xl p-2.5 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[8px] font-bold text-zinc-400 uppercase tracking-wider">
                    <span>Judge0 Sandbox</span>
                    <span className="text-emerald-600 font-bold">● System Online</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[8.5px] font-bold">
                      ✔ Case 1 Passed
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[8.5px] font-bold">
                      ✔ Case 2 Passed
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Hero Right: Copy & CTA */}
          <div className="lg:col-span-7 order-1 lg:order-2 text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl md:text-[54px] font-bold tracking-tight text-white leading-tight font-sans"
            >
              A New Way to Code Duel
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 text-zinc-400 text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal"
            >
              Code Duel Arena is the ultimate platform to enhance your algorithmic speed. 
              Match instantly against developers worldwide, execute solutions in real-time sandboxes, 
              and scale the rankings.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-wrap justify-center lg:justify-start items-center gap-4"
            >
              {user ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-full shadow-lg shadow-amber-950/20 transition-all duration-200 text-sm"
                >
                  Go to Dashboard
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-full shadow-lg shadow-amber-950/20 transition-all duration-200 text-sm"
                >
                  Create Account
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Body Section (Clean White Background) */}
      <section className="bg-white text-zinc-800 py-24 px-6 md:px-12 -mt-12 md:-mt-20 flex-grow flex flex-col justify-center overflow-visible">
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-28">
          
          {/* Row 1: Start Exploring split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left copy */}
            <div className="lg:col-span-7 text-center lg:text-left px-2">
              <div className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-amber-50 border border-amber-100 text-amber-500 mb-6">
                <Swords className="h-5 w-5" />
              </div>
              <h2 className="text-3xl font-semibold text-zinc-900 tracking-tight">
                Start Exploring
              </h2>
              <p className="mt-4 text-zinc-500 text-sm max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Explore is a well-organized matchmaker that helps you get the most out of Code Duel Arena by providing structure to guide your progress. Face algorithmic challenges, optimize solutions, and build your win streak.
              </p>
              <div className="mt-6">
                <Link 
                  to={user ? "/matchmaking" : "/login"} 
                  className="text-amber-600 hover:text-amber-700 text-sm font-semibold inline-flex items-center gap-1 group transition-colors"
                >
                  Get Started
                  <ChevronRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Right overlapping cards widgets (with increased horizontal offset to prevent text overlap) */}
            <div className="lg:col-span-5 flex justify-center py-4 overflow-visible">
              <div className="relative w-full h-[240px] max-w-sm hidden lg:block overflow-visible">
                {/* Yellow Stacked Card */}
                <div className="stacked-card stacked-card-1 bg-amber-50/95 border border-amber-100 shadow-md rounded-2xl p-4 text-left">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 mb-2 font-bold text-xs">
                    ★
                  </div>
                  <h4 className="text-xs font-bold text-zinc-800">Dynamic Programming</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-normal">Solve knapsacks and coin changes against real developers.</p>
                </div>
                
                {/* Green Stacked Card */}
                <div className="stacked-card stacked-card-2 bg-emerald-50/95 border border-emerald-100 shadow-lg rounded-2xl p-4 text-left">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2 font-bold text-xs">
                    ✔
                  </div>
                  <h4 className="text-xs font-bold text-zinc-800">Data Structures</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-normal">Master stacks, trees, queues, and linked list speed duels.</p>
                </div>

                {/* Blue Stacked Card */}
                <div className="stacked-card stacked-card-3 bg-sky-50/95 border border-sky-100 shadow-xl rounded-2xl p-4 text-left">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600 mb-2 font-bold text-xs">
                    ▶
                  </div>
                  <h4 className="text-xs font-bold text-zinc-800">1v1 Ladder Matches</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-normal">Compete and scale up your competitive MMR from Silver to Master.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Features Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 border-t border-zinc-100 pt-16">
            
            {/* Column 1: Questions & Stats */}
            <div className="text-left px-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center text-[9px] font-black border-2 border-white shadow">
                    CDA
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center border-2 border-white shadow">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-yellow-500 text-white flex items-center justify-center border-2 border-white shadow">
                    <Trophy className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 tracking-tight">
                Questions, Community & Contests
              </h3>
              <p className="mt-3 text-zinc-500 text-sm leading-relaxed">
                Test your capacity against algorithmic sprints. Code Duel Arena hosts a massive community of developers racing to optimize structures. Participate in battles to challenge yourself and build streaks.
              </p>
              
              <div className="mt-8 grid grid-cols-2 gap-6 border-t border-zinc-100 pt-6">
                <div>
                  <div className="text-2xl font-black text-zinc-800">{stats.totalUsers.toLocaleString()}+</div>
                  <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Registered Coders</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-zinc-800">{stats.totalMatches.toLocaleString()}+</div>
                  <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Battles Completed</div>
                </div>
              </div>
            </div>

            {/* Column 2: Sandbox & Elo */}
            <div className="text-left px-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center border-2 border-white shadow">
                    <Code className="h-3.5 w-3.5" />
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center border-2 border-white shadow">
                    <Cpu className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 tracking-tight">
                Compilation Sandbox & Rating
              </h3>
              <p className="mt-3 text-zinc-500 text-sm leading-relaxed">
                Our Judge0 backend sandboxes secure isolated code executions matching multiple parameters. Your competitive ELO adjusts instantly based on test execution speed and relative ranking.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-6 border-t border-zinc-100 pt-6">
                <div>
                  <div className="text-2xl font-black text-zinc-800">{stats.averageElo}</div>
                  <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Average Elo MMR</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-zinc-800">{stats.activeBattles}</div>
                  <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Active Battle Rooms</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Minimal Clean Footer */}
      <footer className="bg-zinc-50 border-t border-zinc-150 py-10 text-center text-xs text-zinc-400 font-medium">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <span>&copy; {new Date().getFullYear()} Code Duel Arena. All rights reserved.</span>
          <div className="flex gap-4">
            <span onClick={() => setActiveModal("help")} className="hover:text-zinc-600 cursor-pointer transition-colors">Help Center</span>
            <span>|</span>
            <span onClick={() => setActiveModal("terms")} className="hover:text-zinc-600 cursor-pointer transition-colors">Terms of Service</span>
            <span>|</span>
            <span onClick={() => setActiveModal("privacy")} className="hover:text-zinc-600 cursor-pointer transition-colors">Privacy Policy</span>
          </div>
        </div>
      </footer>

      {/* Modal Overlay */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveModal(null)}
            className="fixed inset-0 z-50 bg-[#060810]/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-lg w-full bg-[#0b0f19] border border-zinc-800/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Title Section */}
              <div className="flex items-center gap-3 mb-5 border-b border-zinc-800/60 pb-3">
                {activeModal === "help" && (
                  <>
                    <HelpCircle className="h-5 w-5 text-indigo-400" />
                    <h2 className="text-lg font-black text-zinc-100">Help Center</h2>
                  </>
                )}
                {activeModal === "terms" && (
                  <>
                    <FileText className="h-5 w-5 text-indigo-400" />
                    <h2 className="text-lg font-black text-zinc-100">Terms of Service</h2>
                  </>
                )}
                {activeModal === "privacy" && (
                  <>
                    <Shield className="h-5 w-5 text-indigo-400" />
                    <h2 className="text-lg font-black text-zinc-100">Privacy Policy</h2>
                  </>
                )}
              </div>

              {/* Content Section */}
              <div className="text-xs text-zinc-400 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {activeModal === "help" && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-zinc-200 uppercase tracking-wide mb-1 text-[10px]">How Matchmaking works</h4>
                      <p className="leading-relaxed">
                        Code Duel Arena pairs you with players of similar ELO rating in real-time. When queueing for a ranked match, the system looks for contestants within a 300 ELO range.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-200 uppercase tracking-wide mb-1 text-[10px]">Ranked vs Casual Mode</h4>
                      <p className="leading-relaxed">
                        Ranked battles affect your ELO MMR score, helping you climb the leaderboards. Casual matches let you practice risk-free.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-200 uppercase tracking-wide mb-1 text-[10px]">Friend Duels</h4>
                      <p className="leading-relaxed">
                        Select the Friend Duel tab in the lobby. You can either Host a room to get a 6-character invitation code, or enter a friend's code to join their room instantly.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-200 uppercase tracking-wide mb-1 text-[10px]">Code Execution & Submissions</h4>
                      <p className="leading-relaxed">
                        Write your code inside the Monaco editor, select your starting language preference, and use "Run Tests" to evaluate your solution. Submit once you pass all test cases!
                      </p>
                    </div>
                  </div>
                )}

                {activeModal === "terms" && (
                  <div className="space-y-4">
                    <p className="leading-relaxed">
                      Welcome to Code Duel Arena. By accessing or using our platform, you agree to comply with these terms.
                    </p>
                    <div>
                      <h4 className="font-bold text-zinc-200 uppercase tracking-wide mb-1 text-[10px]">1. Fair Play Commitment</h4>
                      <p className="leading-relaxed">
                        We encourage authentic learning and competition. The use of external AI helpers, automated bots, or code copypasta during matchmaking sessions is strictly prohibited.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-200 uppercase tracking-wide mb-1 text-[10px]">2. Sandbox Safety & Abuse</h4>
                      <p className="leading-relaxed">
                        Your code executes in sandboxed compiler environments. Any deliberate attempts to bypass sandbox rules, perform system calls, or run denial-of-service scripts will result in permanent account bans.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-200 uppercase tracking-wide mb-1 text-[10px]">3. Rating Integrity</h4>
                      <p className="leading-relaxed">
                        Collusion, rank-boosting, win-trading, or deliberately forfeiting matches to manipulate ratings is not permitted.
                      </p>
                    </div>
                  </div>
                )}

                {activeModal === "privacy" && (
                  <div className="space-y-4">
                    <p className="leading-relaxed">
                      Your privacy is highly important to us. This policy details how we handle user accounts and match logs.
                    </p>
                    <div>
                      <h4 className="font-bold text-zinc-200 uppercase tracking-wide mb-1 text-[10px]">1. Information We Collect</h4>
                      <p className="leading-relaxed">
                        We collect your username, email (for account protection), ELO rating score history, matchmaking statistics, and code solution submissions for verification.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-200 uppercase tracking-wide mb-1 text-[10px]">2. Cookies and Storage</h4>
                      <p className="leading-relaxed">
                        We store authentication JSON Web Tokens (JWT) inside your browser's local storage to keep you logged in. We do not track you across external sites.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-200 uppercase tracking-wide mb-1 text-[10px]">3. Zero Data Sale</h4>
                      <p className="leading-relaxed">
                        Code Duel Arena is completely ad-free. We will never sell, trade, or share your account info or submitted code with third-party advertisers.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Close Footer */}
              <div className="mt-6 pt-4 border-t border-zinc-800/60 flex justify-end">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-colors cursor-pointer"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Home;