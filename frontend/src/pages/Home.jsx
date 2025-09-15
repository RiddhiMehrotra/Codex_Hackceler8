import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FeatureCard from "../components/FeatureCard";
import FeedbackForm from "../components/FeedbackForm";
import Footer from "../components/Footer";
import {
  Sun, Wind, Battery, Brain, Droplets, Recycle, Sparkles,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const ICONS = { sun: Sun, wind: Wind, battery: Battery, brain: Brain, droplets: Droplets, recycle: Recycle, sparkles: Sparkles };
const IconFrom = (key) => {
  const C = ICONS[(key || "").toLowerCase()] || Sparkles;
  return <C className="text-emerald-600" />;
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Home() {
  const loc = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);

  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // mounted ref to avoid setState on unmounted
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // toast after login
  useEffect(() => {
    if (loc.state?.justLoggedIn) {
      setShowWelcome(true);
      const t = setTimeout(() => setShowWelcome(false), 2800);
      return () => clearTimeout(t);
    }
  }, [loc.state]);

  const load = useMemo(() => {
    let controller;
    return async function loadOnce() {
      try {
        if (controller) controller.abort();
        controller = new AbortController();
        const res = await fetch(`${API_BASE}/api/solutions`, { signal: controller.signal });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();
        if (!mounted.current) return;
        setFeatures(Array.isArray(data) ? data : []);
        setError("");
      } catch (e) {
        if (!mounted.current) return;
        if (e.name !== "AbortError") setError(e.message || "Failed to load");
      } finally {
        if (mounted.current) setLoading(false);
      }
    };
  }, []);

  // poll while tab visible
  useEffect(() => {
    let interval;
    const start = () => {
      load();
      interval = setInterval(load, 10000);
    };
    const stop = () => interval && clearInterval(interval);

    start();
    const vis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", vis);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", vis);
    };
  }, [load]);

  return (
    <div>
      {/* Welcome toast */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow"
          >
            Logged in successfully ✨
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="pt-24">
        <div className="bg-gradient-to-br from-green-500 via-blue-500 to-blue-700 text-white">
          <div className="max-w-7xl mx-auto px-6 py-20">
            <motion.h1
              className="text-4xl md:text-6xl font-extrabold leading-tight"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Climate Action Through <span className="text-white/90">Smart Technology</span>
            </motion.h1>
            <motion.p
              className="mt-6 text-lg md:text-xl text-white/90 max-w-3xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              Real-time sensing, analytics, and insights that make sustainability visible and actionable.
            </motion.p>
            <motion.div
              className="mt-10 flex flex-wrap items-center gap-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Link
                to="/dashboard"
                className="bg-white text-black px-5 py-3 rounded-full font-semibold hover:bg-white/90 transition"
              >
                Open Dashboard
              </Link>
              <Link
                to="/signup"
                className="border border-white/70 text-white px-5 py-3 rounded-full font-semibold hover:bg-white/10 transition"
              >
                Create account
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Dynamic features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center">Innovative Climate Solutions</h2>
        <p className="text-gray-600 text-center mt-2">Cutting-edge tech that delivers sustainable impact.</p>

        {loading && (
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-gray-200/60 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center text-red-600 mt-6">
            {error} — check backend at <code className="px-1 py-0.5 bg-gray-100 rounded">VITE_API_URL</code> or server logs.
          </div>
        )}

        {!loading && !error && (
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {features.map((f) => (
              <FeatureCard
                key={f.id}
                icon={IconFrom(f.icon)}
                title={f.title}
                desc={f.desc}
                pill={f.pill}
                color={f.color}
              />
            ))}
            {features.length === 0 && (
              <div className="col-span-full text-center text-gray-500">
                No solutions yet — add via <code>POST {API_BASE}/api/solutions</code>.
              </div>
            )}
          </div>
        )}
      </section>

      {/* Feedback + footer */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
  <FeedbackForm />
</section>

      <Footer />
    </div>
  );
}
