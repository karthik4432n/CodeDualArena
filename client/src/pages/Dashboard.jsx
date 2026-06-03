import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext, API_URL } from "../context/AuthContext";
import axios from "axios";
import Navbar from "../components/Navbar";
import { 
  Swords, 
  Flame, 
  Trophy, 
  Activity, 
  ChevronRight, 
  History,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle
} from "lucide-react";

function Dashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch match history and refresh user profile stats
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch matches
        const matchesRes = await axios.get(`${API_URL}/matches/history`);
        setMatches(matchesRes.data);

        // Fetch fresh profile details
        const profileRes = await axios.get(`${API_URL}/auth/me`);
        setUser(profileRes.data);
      } catch (err) {
        console.error("Dashboard fetch error", err);
        setError("Could not load match history. Try reloading page.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [setUser]);

  if (!user) return null;

  const winRate = user.wins + user.losses > 0
    ? Math.round((user.wins / (user.wins + user.losses)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#070a13] text-zinc-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-8">
        
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0a0f1d] border border-zinc-800/80 rounded-2xl p-6.5">
          <div className="flex items-center gap-4.5">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-black text-white shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight">{user.username}</h1>
                <span className="text-xs bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 px-2 py-0.5 rounded-full">
                  Ranked Challenger
                </span>
              </div>
              <p className="text-zinc-400 text-xs mt-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Joined {new Date(user.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          
          <Link
            to="/matchmaking"
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-[0_4px_20px_rgba(99,102,241,0.25)] transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
          >
            Find Battle Match
            <Swords className="h-4 w-4" />
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* ELO Card */}
          <div className="bg-[#0a0f1d] border border-zinc-800/85 rounded-2xl p-5.5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Current ELO</div>
              <div className="text-2xl font-black text-zinc-100 mt-0.5">{user.elo}</div>
            </div>
          </div>

          {/* Win Rate Card */}
          <div className="bg-[#0a0f1d] border border-zinc-800/85 rounded-2xl p-5.5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Activity className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Win Rate</div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-zinc-100">{winRate}%</span>
                <span className="text-xs text-zinc-500 font-medium">({user.wins}W - {user.losses}L)</span>
              </div>
            </div>
          </div>

          {/* Win Streak Card */}
          <div className="bg-[#0a0f1d] border border-zinc-800/85 rounded-2xl p-5.5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Active Streak</div>
              <div className="text-2xl font-black text-zinc-100 mt-0.5">{user.winStreak} <span className="text-xs text-zinc-500 font-normal">wins</span></div>
            </div>
          </div>

          {/* Problems Solved */}
          <div className="bg-[#0a0f1d] border border-zinc-800/85 rounded-2xl p-5.5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Swords className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Total Solved</div>
              <div className="text-2xl font-black text-zinc-100 mt-0.5">{(user.solvedProblems || []).length} <span className="text-xs text-zinc-500 font-normal">tasks</span></div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid split: Left (Recent Matches) and Right (Solved Problems list) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Matches */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-400" />
              RECENT BATTLE HISTORY
            </h2>

            {loading ? (
              <div className="h-60 border border-zinc-800/80 rounded-2xl bg-[#0a0f1d]/50 flex flex-col items-center justify-center gap-3">
                <div className="h-8 w-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <span className="text-zinc-500 text-xs">Fetching logs...</span>
              </div>
            ) : error ? (
              <div className="h-60 border border-zinc-800/80 rounded-2xl bg-[#0a0f1d]/50 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="h-8 w-8 text-rose-500 mb-2" />
                <span className="text-rose-400 text-sm font-semibold">{error}</span>
              </div>
            ) : matches.length === 0 ? (
              <div className="h-60 border border-zinc-800/80 rounded-2xl bg-[#0a0f1d]/50 flex flex-col items-center justify-center text-center p-6">
                <Swords className="h-10 w-10 text-zinc-700 mb-3" />
                <span className="text-zinc-400 font-semibold text-sm">No matches found</span>
                <span className="text-zinc-600 text-xs mt-1">Jump into matchmaking queue to test your skills!</span>
              </div>
            ) : (
              <div className="overflow-hidden border border-zinc-800/85 bg-[#0a0f1d]/60 rounded-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                        <th className="px-5 py-3.5">Opponent</th>
                        <th className="px-5 py-3.5 text-center">Problem</th>
                        <th className="px-5 py-3.5 text-center">Outcome</th>
                        <th className="px-5 py-3.5 text-center">Score Shift</th>
                        <th className="px-5 py-3.5 text-center">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/60 text-sm">
                      {matches.map((match) => {
                        const isPlayer1 = match.player1._id === user.id || match.player1.id === user.id;
                        const opponent = isPlayer1 ? match.player2 : match.player1;
                        const ratingChange = isPlayer1 ? match.player1Score : match.player2Score;
                        const didWin = match.winner === user.id || (match.winner && match.winner._id === user.id);
                        const isDraw = match.winner === null;

                        return (
                          <tr key={match._id} className="hover:bg-zinc-800/10">
                            <td className="px-5 py-4 font-bold text-zinc-300">{opponent.username}</td>
                            <td className="px-5 py-4 text-center">
                              <span className="font-semibold text-zinc-300">{match.problem.title}</span>
                              <span className={`block text-[10px] uppercase font-bold mt-0.5 ${
                                match.problem.difficulty === "Easy" ? "text-emerald-400" :
                                match.problem.difficulty === "Medium" ? "text-amber-400" : "text-rose-400"
                              }`}>
                                {match.problem.difficulty}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-center">
                              {isDraw ? (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700/40">Draw</span>
                              ) : didWin ? (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">Victory</span>
                              ) : (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/25">Defeat</span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-center font-black">
                              {isDraw ? (
                                <span className="text-zinc-500">0</span>
                              ) : ratingChange >= 0 ? (
                                <span className="text-emerald-400 flex items-center justify-center gap-0.5">
                                  <TrendingUp className="h-3.5 w-3.5" />
                                  +{ratingChange}
                                </span>
                              ) : (
                                <span className="text-rose-400 flex items-center justify-center gap-0.5">
                                  <TrendingDown className="h-3.5 w-3.5" />
                                  {ratingChange}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-center text-xs text-zinc-500">
                              {new Date(match.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Solved Problems Panel */}
          <div className="space-y-4">
            <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              SOLVED CHALLENGES
            </h2>

            <div className="border border-zinc-800/80 bg-[#0a0f1d]/60 rounded-2xl p-5.5 space-y-4">
              {user.solvedProblems && user.solvedProblems.length > 0 ? (
                <div className="divide-y divide-zinc-800/60 max-h-96 overflow-y-auto pr-2 space-y-3.5">
                  {user.solvedProblems.map((prob) => (
                    <div key={prob._id} className="flex items-center justify-between pt-3.5 first:pt-0">
                      <div>
                        <span className="font-bold text-sm text-zinc-300">{prob.title}</span>
                      </div>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                        prob.difficulty === "Easy" ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" :
                        prob.difficulty === "Medium" ? "text-amber-400 border-amber-500/20 bg-amber-500/5" :
                        "text-rose-400 border-rose-500/20 bg-rose-500/5"
                      }`}>
                        {prob.difficulty}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-xs text-zinc-500">No solved problems listed yet.</p>
                  <p className="text-[11px] text-zinc-600 mt-1">Win ranked duels to catalog challenges.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default Dashboard;