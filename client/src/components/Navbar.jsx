import React, { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Terminal, Trophy, User as UserIcon, LogOut, Play } from "lucide-react";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `flex items-center gap-1.5 px-3 py-1.5 font-medium text-sm transition-all duration-200 ${
      isActive(path)
        ? "text-amber-500"
        : "text-zinc-400 hover:text-zinc-150"
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-800/40 bg-[#1a1a1a]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-[0_2px_10px_rgba(245,158,11,0.2)]">
            <Terminal className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-zinc-100 text-lg font-bold tracking-tight">
            CodeDuel<span className="text-amber-500 font-black">Arena</span>
          </span>
        </Link>

        {/* Navigation Links */}
        {user ? (
          <div className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className={navLinkClass("/dashboard")}>
              <UserIcon className="h-4 w-4" />
              Dashboard
            </Link>
            <Link to="/matchmaking" className={navLinkClass("/matchmaking")}>
              <Play className="h-4 w-4" />
              Battle Lobby
            </Link>
            <Link to="/leaderboard" className={navLinkClass("/leaderboard")}>
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Link>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-6">
            <Link to="/leaderboard" className={navLinkClass("/leaderboard")}>
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Link>
          </div>
        )}

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              {/* ELO Display */}
              <div className="flex items-center gap-1.5 rounded-full bg-[#262626] border border-zinc-800/80 px-3 py-1 text-xs font-semibold text-zinc-200">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                <span>{user.elo} <span className="text-[10px] text-zinc-500 font-normal">ELO</span></span>
              </div>

              {/* Username Badge */}
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-zinc-300">{user.username}</span>
                <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider">
                  {user.winStreak > 0 ? `🔥 Streak ${user.winStreak}` : "Rookie"}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center justify-center h-8 w-8 rounded-lg border border-zinc-800 hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 bg-zinc-900/40 hover:bg-rose-500/5 transition-all duration-200"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-full shadow-[0_2px_10px_rgba(245,158,11,0.15)] transition-all duration-200"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

