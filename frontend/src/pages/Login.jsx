import React, { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:4000/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        setMsg("Login successful!");
      } else setMsg(data.error || "Login failed");
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-4">Welcome back</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input className="w-full border p-2 rounded" type="email" placeholder="Email"
               value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="w-full border p-2 rounded" type="password" placeholder="Password"
               value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button className="bg-black text-white px-4 py-2 rounded" type="submit">Login</button>
      </form>
      {msg && <p className="mt-4 text-sm">{msg}</p>}
    </div>
  );
}
