import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Login(){
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();

  // Show animated banner if we just arrived from signup
  useEffect(() => {
    if (loc.state?.justSignedUp) {
      setShowBanner(true);
      // prefill email for convenience
      if (loc.state.email) setEmail(loc.state.email);
      const t = setTimeout(() => setShowBanner(false), 4000);
      return () => clearTimeout(t);
    }
  }, [loc.state]);

  async function handleLogin(e){
    e.preventDefault();
    setLoading(true); setMsg("");
    try{
      const res = await fetch("http://localhost:4000/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok){
        localStorage.setItem("token", data.token);
        // Go to Home after successful login
        navigate("/", { replace: true, state: { justLoggedIn: true } });
      } else {
        setMsg(data.error || "Login failed");
      }
    }catch(err){
      setMsg(err.message);
    }finally{
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="mb-6 rounded-xl p-5 text-center text-white bg-gradient-to-r from-emerald-500 to-sky-600 shadow-lg"
          >
            <div className="text-2xl md:text-3xl font-extrabold tracking-tight">
              🎉 Account created successfully!
            </div>
            <div className="text-white/90 mt-1">
              Please sign in to continue.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.h1
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-extrabold mb-6"
      >
        Welcome back
      </motion.h1>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          className="w-full border rounded px-3 py-2"
          type="email" placeholder="Email"
          value={email} onChange={(e)=>setEmail(e.target.value)} required
        />
        <input
          className="w-full border rounded px-3 py-2"
          type="password" placeholder="Password"
          value={password} onChange={(e)=>setPassword(e.target.value)} required
        />
        <button
          disabled={loading}
          className="bg-black text-white px-5 py-2 rounded font-semibold hover:bg-black/90 disabled:opacity-60"
          type="submit"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {msg && <div className="mt-4 text-sm text-red-600">{msg}</div>}
    </div>
  );
}

