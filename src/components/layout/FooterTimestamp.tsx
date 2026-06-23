"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export function FooterTimestamp() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  const datePart = time.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="fixed bottom-3 right-4 z-40 flex items-center gap-2 bg-[#0d1421] border border-white/15 rounded-lg px-3 py-1.5 select-none pointer-events-none shadow-lg">
      <Clock className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
      <span className="text-[10px] font-mono text-slate-300 tracking-tight">
        {datePart}
      </span>
      <span className="text-[10px] font-mono text-slate-500">·</span>
      <span className="text-[10px] font-mono text-indigo-400 tabular-nums font-semibold">
        {timePart}
      </span>
    </div>
  );
}
