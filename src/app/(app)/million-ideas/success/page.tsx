"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Zap, ArrowRight, Sparkles } from "lucide-react";

const LS_ACCESS_KEY = "aihub_million_ideas_access";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Grant permanent access
    try { localStorage.setItem(LS_ACCESS_KEY, "true"); } catch { /* ignore */ }

    // Auto-redirect countdown
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          router.replace("/million-ideas");
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#070b12] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="w-full max-w-md bg-[#0d1421] border border-white/10 rounded-3xl overflow-hidden shadow-2xl text-center"
      >
        {/* Top gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

        <div className="p-10">
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.15 }}
            className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </motion.div>

          {/* Headline */}
          <h1 className="text-3xl font-black text-white mb-2">
            Payment Confirmed!
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Welcome to <span className="text-white font-semibold">1M Ideas</span>. Your subscription is active and you now have full access to all 100+ AI business ideas, starter kits, and daily AI-generated ideas.
          </p>

          {/* What's unlocked */}
          <div className="bg-white/4 border border-white/8 rounded-2xl p-4 mb-8 text-left space-y-2.5">
            {[
              "100+ AI business ideas refreshed daily",
              "Production-ready starter kits (ZIP download)",
              "AI-generated fresh ideas every 24 hours",
              "AI Website Builder included",
              "Revenue & difficulty analysis per idea",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span className="text-sm text-slate-300">{item}</span>
              </div>
            ))}
          </div>

          {/* Auto-redirect */}
          <button
            onClick={() => router.replace("/million-ideas")}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-2xl transition-all hover:shadow-xl hover:shadow-indigo-500/25"
          >
            <Zap className="w-5 h-5" />
            Open 1M Ideas
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-xs text-slate-600 mt-4">
            Redirecting automatically in {countdown}s…
          </p>
        </div>
      </motion.div>
    </div>
  );
}
