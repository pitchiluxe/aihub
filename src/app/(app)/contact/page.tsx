"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import {
  Mail, Send, CheckCircle2, AlertCircle, User, MessageSquare,
  Code2, AtSign, Briefcase, Globe, Clock, MapPin,
} from "lucide-react";

const SUBJECTS = [
  "General Inquiry",
  "Partnership / Collaboration",
  "Feature Request",
  "Bug Report",
  "Business Opportunity",
  "Feedback",
  "Other",
];

const SOCIALS = [
  { icon: Code2,     label: "GitHub",   href: "https://github.com/pitchiluxe?tab=repositories", color: "#e2e8f0" },
  { icon: AtSign,    label: "X",        href: "https://x.com/eomari",                           color: "#e2e8f0" },
  { icon: Briefcase, label: "LinkedIn", href: "https://www.linkedin.com/in/erickomari",          color: "#0a66c2" },
  { icon: Globe,     label: "AIHub",    href: "/dashboard",                                      color: "#6366f1" },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: SUBJECTS[0], message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setStatus("success");
      setForm({ name: "", email: "", subject: SUBJECTS[0], message: "" });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to send. Please try again.");
    }
  }

  const isLoading = status === "loading";

  return (
    <div className="flex flex-col min-h-screen bg-[#070b12]">
      <TopBar title="Contact Me" description="Get in touch with Erick Omari" />

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-10 max-w-6xl mx-auto w-full">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold px-4 py-2 rounded-full mb-5">
            <Mail className="w-3.5 h-3.5" />
            Direct line to the builder
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Let&apos;s <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Connect</span>
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
            Have an idea, a question, or want to build something together? I&apos;d love to hear from you.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-8">

          {/* Left: info panel */}
          <motion.div
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-2 flex flex-col gap-5"
          >
            {/* Card */}
            <div className="bg-[#0d1421] border border-white/8 rounded-2xl p-6">
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/20 bg-[#1a2540]">
                  <img
                    src="/Erick.png"
                    alt="Erick Omari"
                    className="w-full h-full object-cover object-[center_10%]"
                  />
                </div>
                <div>
                  <p className="text-white font-bold text-base leading-none">Erick Omari</p>
                  <p className="text-indigo-400/80 text-xs font-medium mt-1">Builder · AIHub</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-0.5">Email</p>
                    <a href="mailto:erickomari243@gmail.com" className="text-slate-300 hover:text-white transition-colors break-all">
                      erickomari243@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-0.5">Response Time</p>
                    <p className="text-slate-300">Usually within 24 hours</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-0.5">Project</p>
                    <p className="text-slate-300">AIHub — The Homepage of AI</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Topics */}
            <div className="bg-[#0d1421] border border-white/8 rounded-2xl p-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">What I love to discuss</p>
              <div className="flex flex-wrap gap-2">
                {["AI Tools", "Partnerships", "Feedback", "Product Ideas", "Collaborations", "Features", "Bugs", "Business"].map((t) => (
                  <span key={t} className="text-xs bg-white/4 border border-white/8 text-slate-400 px-3 py-1 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Socials */}
            <div className="bg-[#0d1421] border border-white/8 rounded-2xl p-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Find me online</p>
              <div className="grid grid-cols-2 gap-2">
                {SOCIALS.map(({ icon: Icon, label, href, color }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 bg-white/3 hover:bg-white/7 border border-white/5 rounded-xl px-3 py-2.5 transition-colors group"
                  >
                    <Icon className="w-4 h-4 flex-shrink-0 transition-colors" style={{ color }} />
                    <span className="text-xs font-medium text-slate-400 group-hover:text-white transition-colors">{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: form */}
          <motion.div
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
            className="md:col-span-3"
          >
            <div className="bg-[#0d1421] border border-white/8 rounded-2xl p-7">
              <h2 className="text-lg font-bold text-white mb-6">Send a Message</h2>

              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center py-16 text-center gap-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-xl mb-2">Message Sent!</p>
                      <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
                        Thanks for reaching out. Erick will get back to you within 24 hours. Check your inbox for a confirmation.
                      </p>
                    </div>
                    <button
                      onClick={() => setStatus("idle")}
                      className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-2"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >
                    {/* Name + Email */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-2">
                          <User className="w-3 h-3 inline mr-1" />Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          required
                          placeholder="Your name"
                          className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/6 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-2">
                          <Mail className="w-3 h-3 inline mr-1" />Email <span className="text-red-400">*</span>
                        </label>
                        <input
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          placeholder="your@email.com"
                          className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/6 transition-all"
                        />
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-2">Subject</label>
                      <select
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/60 focus:bg-white/6 transition-all appearance-none cursor-pointer"
                      >
                        {SUBJECTS.map((s) => (
                          <option key={s} value={s} className="bg-[#0d1421] text-white">{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-2">
                        <MessageSquare className="w-3 h-3 inline mr-1" />Message <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        required
                        rows={7}
                        placeholder="Tell me what's on your mind..."
                        className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/6 transition-all resize-none leading-relaxed"
                      />
                      <p className="text-right text-xs text-slate-600 mt-1">{form.message.length} chars</p>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                      {status === "error" && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl px-4 py-3"
                        >
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {errorMsg}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLoading || !form.name.trim() || !form.email.trim() || !form.message.trim()}
                      className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/20 text-sm"
                    >
                      {isLoading ? (
                        <>
                          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </button>

                    <p className="text-center text-xs text-slate-600">
                      You&apos;ll receive an auto-reply confirmation at the email you provide.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
