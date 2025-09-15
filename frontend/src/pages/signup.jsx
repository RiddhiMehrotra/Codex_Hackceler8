import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Signup(){
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSignup(e){
    e.preventDefault();
    setLoading(true); setMsg("");
    try{
      const res = await fetch("http://localhost:4000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        // Go to Sign in and show a big success banner there
        navigate("/login", { state: { justSignedUp: true, email } });
      } else {
        setMsg(data.error || "Signup failed");
      }
    }catch(err){
      setMsg(err.message);
    }finally{
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <motion.h1
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-extrabold mb-6"
      >
        Create Account
      </motion.h1>

      <form onSubmit={handleSignup} className="space-y-4">
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
          className="bg-blue-600 text-white px-5 py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-60"
          type="submit"
        >
          {loading ? "Creating…" : "Sign up"}
        </button>
      </form>

      {msg && <div className="mt-4 text-sm text-red-600">{msg}</div>}
    </div>
  );
}
