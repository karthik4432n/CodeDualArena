import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Terminal, Mail, Lock, ShieldAlert, ArrowRight } from "lucide-react";

function Login() {
  const { login, user, error: authError } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError(null);
    setLoading(true);
    
    const res = await login(email, password);
    setLoading(false);
    
    if (res.success) {
      navigate("/dashboard");
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0d16] flex items-center justify-center p-6 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute w-[450px] h-[450px] bg-amber-500/5 blur-3xl rounded-full top-[-10%] left-[-10%]" />
      <div className="absolute w-[500px] h-[500px] bg-orange-600/5 blur-3xl rounded-full bottom-[-10%] right-[-10%]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-[380px] bg-[#16161a] border border-zinc-800/80 rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
        style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
      >
        {/* Logo and title */}
        <Link
          to="/"
          className="hover:opacity-90 transition-opacity"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-[0_2px_12px_rgba(245,158,11,0.25)]">
            <Terminal className="h-6 w-6 text-white" />
          </div>
          <span className="text-zinc-100 text-lg font-bold tracking-tight">
            CodeDuel<span className="text-amber-500 font-black">Arena</span>
          </span>
        </Link>

        {/* Error notification */}
        {(error || authError) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2.5 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs font-semibold"
          >
            <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
            <span>{error || authError}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Email/Username input */}
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Username or E-mail"
            className="w-full h-12 bg-[#0e0e11] border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 text-sm text-zinc-200 outline-none transition-all duration-200 placeholder:text-zinc-500"
          />

          {/* Password input */}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full h-12 bg-[#0e0e11] border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 text-sm text-zinc-200 outline-none transition-all duration-200 placeholder:text-zinc-500"
          />

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 flex items-center justify-center gap-2 mt-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 border border-amber-400/20 shadow-[0_4px_25px_rgba(245,158,11,0.2)] disabled:opacity-50 transition-all duration-300 cursor-pointer"
          >
            {loading ? (
              <span className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Terms text */}
        <p className="text-zinc-500 text-xs text-center mt-1">
          By continuing, you agree to CodeDuelArena's{" "}
          <a href="#" className="text-zinc-400 hover:underline">Terms</a> &{" "}
          <a href="#" className="text-zinc-400 hover:underline">Privacy Policy</a>.
        </p>

        {/* Footer redirect */}
        <div className="text-center pt-5 border-t border-zinc-800/60">
          <p className="text-zinc-500 text-sm">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-amber-500 hover:text-amber-400 font-semibold transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;