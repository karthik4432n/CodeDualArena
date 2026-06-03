import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { Trophy, Medal, Flame, ShieldAlert, Award } from "lucide-react";

function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get(`${API_URL}/matches/leaderboard`);
        setPlayers(res.data);
      } catch (err) {
        console.error("Leaderboard fetch error", err);
        setError("Failed to load rankings. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankBadge = (idx) => {
    if (idx === 0) return <Medal className="h-6 w-6 text-yellow-500 filter drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />;
    if (idx === 1) return <Medal className="h-6 w-6 text-zinc-300 filter drop-shadow-[0_0_8px_rgba(212,212,216,0.5)]" />;
    if (idx === 2) return <Medal className="h-6 w-6 text-amber-700 filter drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]" />;
    return <span className="text-zinc-500 font-bold text-sm w-6 text-center">{idx + 1}</span>;
  };

  const getTier = (elo) => {
    if (elo >= 1500) return { name: "Grandmaster", color: "text-rose-400 border-rose-500/25 bg-rose-500/10" };
    if (elo >= 1300) return { name: "Master", color: "text-purple-400 border-purple-500/25 bg-purple-500/10" };
    if (elo >= 1150) return { name: "Diamond", color: "text-cyan-400 border-cyan-500/25 bg-cyan-500/10" };
    if (elo >= 1050) return { name: "Platinum", color: "text-teal-400 border-teal-500/25 bg-teal-500/10" };
    if (elo >= 950) return { name: "Gold", color: "text-amber-400 border-amber-500/25 bg-amber-500/10" };
    return { name: "Silver", color: "text-zinc-400 border-zinc-500/25 bg-zinc-500/10" };
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-zinc-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <Trophy className="h-8 w-8 text-amber-500 filter drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]" />
              GLOBAL LEADERBOARD
            </h1>
            <p className="text-zinc-400 text-sm mt-2">
              The highest ranking coders in the arena. Dominate matches to claim the top spot.
            </p>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-zinc-400 text-sm">Retrieving player standings...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 text-center max-w-md mx-auto my-12">
            <ShieldAlert className="h-8 w-8 text-rose-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-rose-400">{error}</p>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-20 border border-zinc-800/80 rounded-2xl bg-zinc-900/15">
            <Award className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 font-medium">No matches played yet. Be the first to rank up!</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800/85 bg-[#0b0f19]/45 backdrop-blur">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase font-bold tracking-wider">
                  <th className="px-6 py-4.5 w-16 text-center">Rank</th>
                  <th className="px-6 py-4.5">Coder</th>
                  <th className="px-6 py-4.5 w-40 text-center">Tier</th>
                  <th className="px-6 py-4.5 w-32 text-center">ELO Rating</th>
                  <th className="px-6 py-4.5 w-32 text-center">Record (W/L)</th>
                  <th className="px-6 py-4.5 w-32 text-center">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60">
                {players.map((player, idx) => {
                  const winRate = player.wins + player.losses > 0
                    ? Math.round((player.wins / (player.wins + player.losses)) * 100)
                    : 0;
                  const tier = getTier(player.elo);

                  return (
                    <tr 
                      key={player._id} 
                      className={`hover:bg-zinc-800/20 transition-colors ${
                        idx < 3 ? "bg-indigo-500/[0.02]" : ""
                      }`}
                    >
                      <td className="px-6 py-4 text-center align-middle">
                        <div className="flex justify-center">{getRankBadge(idx)}</div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-zinc-100 hover:text-indigo-400 transition-colors cursor-pointer">
                            {player.username}
                          </span>
                          {player.winStreak >= 3 && (
                            <span 
                              className="flex items-center gap-0.5 text-xs text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20"
                              title={`${player.winStreak} Win Streak`}
                            >
                              <Flame className="h-3 w-3 fill-amber-500" />
                              {player.winStreak}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center align-middle">
                        <span className={`inline-block px-2.5 py-1 text-[11px] font-bold uppercase rounded-md border ${tier.color}`}>
                          {tier.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center align-middle font-black text-indigo-400">
                        {player.elo}
                      </td>
                      <td className="px-6 py-4 text-center align-middle text-sm font-semibold text-zinc-300">
                        <span className="text-emerald-400">{player.wins}W</span>
                        <span className="text-zinc-600 mx-1.5">/</span>
                        <span className="text-rose-400">{player.losses}L</span>
                      </td>
                      <td className="px-6 py-4 text-center align-middle">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-sm font-bold text-zinc-200">{winRate}%</span>
                          <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full" 
                              style={{ width: `${winRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default Leaderboard;
