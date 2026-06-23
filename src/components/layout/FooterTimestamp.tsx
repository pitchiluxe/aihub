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
    <div className="fixed bottom-3 right-4 z-40 flex items-center gap-1.5 select-none pointer-events-none">
      <Clock className="w-2.5 h-2.5 text-slate-700" />
      <span className="text-[10px] font-mono text-slate-600 tracking-tight">
        {datePart}
      </span>
      <span className="text-[10px] font-mono text-slate-700">·</span>
      <span className="text-[10px] font-mono text-slate-500 tabular-nums">
        {timePart}
      </span>
    </div>
  );
}
