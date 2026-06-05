"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Zap, ArrowRight, Sparkles, Loader2, XCircle } from "lucide-react";

const LS_ACCESS_KEY = "aihub_million_ideas_access";

interface AccessRecord {
  granted: boolean;
  expiresAt: number;       // Unix ms — 30 days from payment
  grantedAt: number;
  subscriptionId: string | null;
  customerId: string | null;
}

function grantAccess(record: AccessRecord) {
  try { localStorage.setItem(LS_ACCESS_KEY, JSON.stringify(record)); } catch { /* ignore */ }
}

function SuccessContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(6);
  const [validating, setValidating] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    async function activate() {
      const sessionId = searchParams.get("session_id");

      if (!sessionId) {
        // No session_id — reject. Never grant free access without Stripe proof.
        setAccessError("No payment session found. Please complete checkout via Stripe to get access.");
        setValidating(false);
        return;
      }

      try {
        const res = await fetch(`/api/validate-stripe-session?session_id=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          grantAccess({
            granted:        true,
            expiresAt:      data.expiresAt,
            grantedAt:      Date.now(),
            subscriptionId: data.subscriptionId ?? null,
            customerId:     data.customerId ?? null,
          });
          if (data.email) setEmail(data.email);
        } else {
          // Stripe validation failed — do NOT grant access
          setAccessError("Payment could not be verified. Please contact support or try again.");
        }
      } catch {
        setAccessError("Network error verifying payment. Please try again.");
      }

      setValidating(false);
    }

    activate();
  }, [searchParams]);

  // Start countdown only after validation finishes
  useEffect(() => {
    if (validating) return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); router.replace("/million-ideas"); }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [validating, router]);

  return (
    <div className="min-h-screen bg-[#070b12] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="w-full max-w-md bg-[#0d1421] border border-white/10 rounded-3xl overflow-hidden shadow-2xl text-center"
      >
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

        <div className="p-10">
          {validating ? (
            <div className="py-8 flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
              <p className="text-slate-300 font-semibold">Activating your access…</p>
              <p className="text-xs text-slate-500">Verifying payment with Stripe</p>
            </div>
          ) : accessError ? (
            <div className="py-6 flex flex-col items-center gap-4">
              <XCircle className="w-14 h-14 text-red-400" />
              <h2 className="text-xl font-black text-white">Access Not Granted</h2>
              <p className="text-slate-400 text-sm leading-relaxed text-center">{accessError}</p>
              <a
                href="https://buy.stripe.com/3cIeVd8vG2AJ6eM3EQdMI04"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-2xl transition-all text-sm"
              >
                <Zap className="w-4 h-4" />
                Complete Payment — $19.99/month
              </a>
              <button
                onClick={() => router.replace("/million-ideas")}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Back to 1M Ideas
              </button>
            </div>
          ) : (
            <>
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </motion.div>

              <h1 className="text-3xl font-black text-white mb-2">Payment Confirmed!</h1>
              <p className="text-slate-400 text-sm leading-relaxed mb-2">
                Welcome to <span className="text-white font-semibold">1M Ideas</span>.
                {email && <> Confirmation sent to <span className="text-indigo-400">{email}</span>.</>}
              </p>
              <p className="text-xs text-slate-500 mb-8">
                Your subscription renews monthly. Access is automatically revoked if you cancel or payment fails.
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
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
