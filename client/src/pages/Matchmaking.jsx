import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Swords, 
  User, 
  Terminal, 
  Gamepad2, 
  Clock, 
  X, 
  Zap, 
  Users,
  Compass,
  Copy,
  Check,
  Plus
} from "lucide-react";

function Matchmaking() {
  const { user } = useContext(AuthContext);
  const { socket, connected } = useContext(SocketContext);
  const navigate = useNavigate();

  const [inQueue, setInQueue] = useState(false);
  const [queueTime, setQueueTime] = useState(0);
  const [mode, setMode] = useState("ranked");
  const [language, setLanguage] = useState("c");
  
  const [matchFound, setMatchFound] = useState(false);
  const [matchDetails, setMatchDetails] = useState(null);
  const [countdown, setCountdown] = useState(5);

  const [lobbyTab, setLobbyTab] = useState("public"); // "public" | "friend"
  const [customRoomCode, setCustomRoomCode] = useState(null);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [copied, setCopied] = useState(false);

  // Queue elapsed timer
  useEffect(() => {
    let interval = null;
    if (inQueue) {
      interval = setInterval(() => {
        setQueueTime(prev => prev + 1);
      }, 1000);
    } else {
      setQueueTime(0);
    }
    return () => clearInterval(interval);
  }, [inQueue]);

  // Match transition countdown timer
  useEffect(() => {
    let interval = null;
    if (matchFound && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (matchFound && countdown === 0) {
      // Redirect to Battle Room
      navigate(`/battle?roomId=${matchDetails.roomId}`);
    }
    return () => clearInterval(interval);
  }, [matchFound, countdown, matchDetails, navigate]);

  // Socket event hookups
  useEffect(() => {
    if (!socket) return;

    socket.on("queueJoined", () => {
      setInQueue(true);
    });

    socket.on("queueLeft", () => {
      setInQueue(false);
    });

    socket.on("matchFound", (data) => {
      setInQueue(false);
      setCustomRoomCode(null); // Clear custom code since duel is active
      setMatchFound(true);
      setMatchDetails(data);
      setCountdown(5);
    });

    socket.on("queueError", (err) => {
      alert(err.message || "Queue Error");
      setInQueue(false);
    });

    socket.on("customRoomCreated", (data) => {
      setCustomRoomCode(data.roomCode);
    });

    return () => {
      socket.off("queueJoined");
      socket.off("queueLeft");
      socket.off("matchFound");
      socket.off("queueError");
      socket.off("customRoomCreated");
    };
  }, [socket]);

  const handleQueueToggle = () => {
    if (!socket || !connected) {
      alert("Socket server connection not established. Reconnecting...");
      return;
    }

    if (inQueue) {
      socket.emit("leaveQueue");
    } else {
      socket.emit("joinQueue", {
        token: localStorage.getItem("token"),
        mode,
        language
      });
    }
  };

  const handleCreateCustomRoom = () => {
    if (!socket || !connected) {
      alert("Socket server connection not established. Reconnecting...");
      return;
    }
    socket.emit("createCustomRoom", {
      token: localStorage.getItem("token")
    });
  };

  const handleJoinCustomRoom = (e) => {
    e.preventDefault();
    if (!socket || !connected) {
      alert("Socket server connection not established. Reconnecting...");
      return;
    }
    if (!joinCodeInput.trim()) {
      alert("Please enter a room code.");
      return;
    }
    socket.emit("joinCustomRoom", {
      token: localStorage.getItem("token"),
      roomCode: joinCodeInput.trim().toUpperCase()
    });
  };

  const handleCancelCustomRoom = () => {
    if (socket && customRoomCode) {
      socket.emit("leaveRoom", { roomId: `room_custom_${customRoomCode}` });
      setCustomRoomCode(null);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(customRoomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#070a13] text-zinc-100 flex flex-col relative overflow-hidden">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        
        {!inQueue && !matchFound && !customRoomCode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex justify-center items-center gap-3">
                <Compass className="h-8 w-8 text-indigo-400" />
                BATTLE LOBBY
              </h1>
              <p className="text-zinc-400 text-sm mt-2 max-w-md mx-auto">
                Configure your combat parameters and enter the search matching queue.
              </p>
            </div>

            {/* Tab Selectors */}
            <div className="flex justify-center">
              <div className="bg-[#0b0f19] border border-zinc-800/80 p-1 rounded-xl flex gap-1">
                <button
                  onClick={() => setLobbyTab("public")}
                  className={`px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                    lobbyTab === "public"
                      ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 font-extrabold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Public Arena
                </button>
                <button
                  onClick={() => setLobbyTab("friend")}
                  className={`px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                    lobbyTab === "friend"
                      ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 font-extrabold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Friend Duel
                </button>
              </div>
            </div>

            {lobbyTab === "public" ? (
              <>
                {/* Selector settings */}
                <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  
                  {/* Match Mode */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      Game Mode Selection
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {/* Ranked Card */}
                      <button
                        onClick={() => setMode("ranked")}
                        className={`flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-300 ${
                          mode === "ranked"
                            ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-100 ring-1 ring-indigo-500/20"
                            : "bg-[#0b0f19] border-zinc-800/80 hover:border-zinc-700/60 text-zinc-400"
                        }`}
                      >
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400 mt-0.5">
                          <Swords className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold flex items-center gap-2">
                            Ranked Duel
                            <span className="text-[9px] bg-amber-500/15 text-amber-500 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/25">ELO MMR</span>
                          </div>
                          <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                            Compete in matched ratings. Win to gain ELO, lose to drop. Fast matching of skill levels.
                          </p>
                        </div>
                      </button>

                      {/* Casual Card */}
                      <button
                        onClick={() => setMode("casual")}
                        className={`flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-300 ${
                          mode === "casual"
                            ? "bg-purple-500/10 border-purple-500/40 text-purple-100 ring-1 ring-purple-500/20"
                            : "bg-[#0b0f19] border-zinc-800/80 hover:border-zinc-700/60 text-zinc-400"
                        }`}
                      >
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400 mt-0.5">
                          <Gamepad2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold flex items-center gap-2">
                            Casual Practice
                            <span className="text-[9px] bg-zinc-800 text-zinc-400 font-extrabold px-1.5 py-0.5 rounded border border-zinc-700">Sandbox</span>
                          </div>
                          <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                            Practice solving challenges against any competitor. No ELO updates. Good for warmups.
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Coding Language Preference */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      Language Preference
                    </label>
                    <div className="bg-[#0b0f19] border border-zinc-800/80 rounded-2xl p-5 space-y-4">
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Select your preferred starting programming language. You can also change this inside the battle room editor.
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "c", name: "C (GCC)" },
                          { id: "python", name: "Python 3" },
                          { id: "cpp", name: "C++ (GCC)" },
                          { id: "java", name: "Java (JDK)" }
                        ].map((lang) => (
                          <button
                            key={lang.id}
                            onClick={() => setLanguage(lang.id)}
                            className={`py-3 px-4 text-xs font-bold rounded-xl border transition-all duration-200 cursor-pointer ${
                              language === lang.id
                                ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400 font-black"
                                : "bg-[#111625] border-zinc-900 text-zinc-400 hover:border-zinc-800 hover:text-zinc-300"
                            }`}
                          >
                            {lang.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Action Queue Button */}
                <div className="text-center pt-4">
                  <button
                    onClick={handleQueueToggle}
                    className="inline-flex items-center gap-2.5 px-10 py-4.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm uppercase tracking-wider shadow-[0_10px_30px_rgba(99,102,241,0.25)] hover:shadow-[0_10px_35px_rgba(99,102,241,0.35)] transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer border border-indigo-400/20"
                  >
                    Find Competitive Match
                    <Swords className="h-4.5 w-4.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {/* Host Card */}
                <div className="bg-[#0b0f19] border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between text-left space-y-5">
                  <div className="space-y-4">
                    <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-200">Host Private Duel</h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        Generate a room code and invite your friend for a direct, casual battle.
                      </p>
                    </div>
                    
                    {/* Integrated Language Preference */}
                    <div className="space-y-2 pt-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        Starting Language
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: "c", name: "C (GCC)" },
                          { id: "python", name: "Python 3" },
                          { id: "cpp", name: "C++ (GCC)" },
                          { id: "java", name: "Java (JDK)" }
                        ].map((lang) => (
                          <button
                            key={lang.id}
                            type="button"
                            onClick={() => setLanguage(lang.id)}
                            className={`py-2 px-3 text-[11px] font-bold rounded-lg border transition-all duration-200 cursor-pointer ${
                              language === lang.id
                                ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400 font-extrabold"
                                : "bg-[#111625] border-zinc-900 text-zinc-500 hover:border-zinc-800 hover:text-zinc-400"
                            }`}
                          >
                            {lang.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCreateCustomRoom}
                    className="w-full py-2.5 px-4 text-xs font-bold rounded-xl border border-indigo-500/45 hover:border-indigo-500 text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all duration-200 cursor-pointer text-center"
                  >
                    Create Friend Lobby
                  </button>
                </div>

                {/* Join Card */}
                <div className="bg-[#0b0f19] border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between text-left space-y-5">
                  <div className="space-y-4">
                    <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400">
                      <Swords className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-200">Join Friend's Lobby</h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        Enter the 6-character room code shared by your friend to join the fight.
                      </p>
                    </div>

                    <div className="space-y-2 pt-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        Invite Code
                      </label>
                      <input
                        type="text"
                        placeholder="ENTER CODE (E.G. A3F9K2)"
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg bg-[#111625] border border-zinc-900 text-xs font-semibold text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:border-indigo-500/60 uppercase tracking-widest text-center"
                      />
                    </div>
                  </div>

                  <form onSubmit={handleJoinCustomRoom}>
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 text-xs font-bold rounded-xl border border-purple-500/45 hover:border-purple-500 text-purple-400 hover:text-purple-300 bg-purple-500/5 hover:bg-purple-500/10 transition-all duration-200 cursor-pointer text-center"
                    >
                      Join Arena
                    </button>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Custom Room Waiting Screen */}
        {!inQueue && !matchFound && customRoomCode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full mx-auto bg-[#0b0f19] border border-zinc-800/80 rounded-3xl p-8 text-center space-y-6 shadow-[0_15px_40px_rgba(0,0,0,0.3)] relative overflow-hidden"
          >
            {/* Spinning Radar */}
            <div className="relative h-28 w-28 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-indigo-500/10 animate-ping"></div>
              <div className="absolute h-20 w-20 rounded-full border border-indigo-500/20 animate-pulse bg-indigo-500/5"></div>
              <div className="absolute h-14 w-14 rounded-full border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Users className="h-6 w-6 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tight">Private Lobby Created</h2>
              <p className="text-zinc-500 text-xs">
                Share this room code with your friend.
              </p>
            </div>

            {/* Room Code Display Box */}
            <div className="bg-[#111625] rounded-2xl p-4 border border-zinc-900/60 max-w-xs mx-auto flex items-center justify-between">
              <span className="text-2xl font-black tracking-widest text-indigo-400 font-mono ml-4 select-all">
                {customRoomCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="h-10 w-10 shrink-0 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-all duration-200 cursor-pointer"
                title="Copy Room Code"
              >
                {copied ? <Check className="h-4.5 w-4.5 text-emerald-400" /> : <Copy className="h-4.5 w-4.5" />}
              </button>
            </div>

            <p className="text-zinc-400 text-xs font-semibold animate-pulse">
              Waiting for friend to connect...
            </p>

            <button
              onClick={handleCancelCustomRoom}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 bg-zinc-900/40 hover:bg-rose-500/5 transition-all duration-200 text-xs font-semibold cursor-pointer"
            >
              <X className="h-4 w-4" />
              Cancel Lobby
            </button>
          </motion.div>
        )}

        {/* Searching Queue Screen */}
        {inQueue && !matchFound && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full mx-auto bg-[#0b0f19] border border-zinc-800/80 rounded-3xl p-8 text-center space-y-6 shadow-[0_15px_40px_rgba(0,0,0,0.3)] relative overflow-hidden"
          >
            {/* Spinning Radar */}
            <div className="relative h-28 w-28 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-indigo-500/10 animate-ping"></div>
              <div className="absolute h-20 w-20 rounded-full border border-indigo-500/20 animate-pulse bg-indigo-500/5"></div>
              <div className="absolute h-14 w-14 rounded-full border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Swords className="h-6 w-6 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tight">Searching for Competitor</h2>
              <p className="text-zinc-500 text-xs flex items-center justify-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Matching similar ELO ratings ({user.elo} MMR)
              </p>
            </div>

            {/* Stats list */}
            <div className="bg-[#111625] rounded-2xl p-4 flex items-center justify-between text-left border border-zinc-900/60 max-w-xs mx-auto">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-400" />
                <span className="text-xs text-zinc-400 font-semibold">Time Elapsed:</span>
              </div>
              <span className="text-sm font-black text-indigo-400 tabular-nums">
                {formatTime(queueTime)}
              </span>
            </div>

            <button
              onClick={handleQueueToggle}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 bg-zinc-900/40 hover:bg-rose-500/5 transition-all duration-200 text-xs font-semibold cursor-pointer"
            >
              <X className="h-4 w-4" />
              Cancel Search
            </button>
          </motion.div>
        )}

        {/* Match Found Overlay */}
        <AnimatePresence>
          {matchFound && matchDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 bg-[#060810]/95 backdrop-blur flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="max-w-2xl w-full bg-[#0b0f19] border border-zinc-800 rounded-3xl p-8 text-center space-y-8 shadow-[0_30px_70px_rgba(99,102,241,0.25)]"
              >
                {/* Header */}
                <div className="space-y-1">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/25 mb-2">
                    <Zap className="h-5 w-5 fill-amber-500 animate-bounce" />
                  </div>
                  <h1 className="text-3xl font-black uppercase tracking-widest bg-gradient-to-r from-amber-400 to-indigo-400 bg-clip-text text-transparent">
                    Match Found!
                  </h1>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
                    {mode} mode • Starting battle room
                  </p>
                </div>

                {/* VS Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-6">
                  {/* Coder 1 (User) */}
                  <div className="md:col-span-2 bg-[#111625] border border-zinc-800/80 rounded-2xl p-5 text-center space-y-3">
                    <div className="h-14 w-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center text-lg font-bold">
                      {user.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-100">{user.username}</h3>
                      <p className="text-xs text-indigo-400 font-bold tracking-wide mt-0.5">{user.elo} MMR</p>
                    </div>
                  </div>

                  {/* VS Middle */}
                  <div className="md:col-span-1 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black italic bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">VS</span>
                  </div>

                  {/* Coder 2 (Opponent) */}
                  <div className="md:col-span-2 bg-[#111625] border border-zinc-800/80 rounded-2xl p-5 text-center space-y-3">
                    <div className="h-14 w-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center text-lg font-bold">
                      {matchDetails.opponent.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-100">{matchDetails.opponent.username}</h3>
                      <p className="text-xs text-rose-400 font-bold tracking-wide mt-0.5">{matchDetails.opponent.elo} MMR</p>
                    </div>
                  </div>
                </div>

                {/* Countdown progress */}
                <div className="space-y-3 max-w-xs mx-auto">
                  <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                    Teleporting to arena in <span className="text-indigo-400 font-extrabold">{countdown}s</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-indigo-500"
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: 5, ease: "linear" }}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}

export default Matchmaking;