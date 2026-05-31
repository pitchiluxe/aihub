import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + "…";
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function parseContextWindow(value: string | number): number {
  if (typeof value === "number") return value;
  const n = parseInt(value.replace(/[^0-9]/g, ""), 10);
  if (value.includes("k") || value.includes("K")) return n * 1000;
  if (value.includes("M")) return n * 1_000_000;
  return n;
}

export function getColorForCategory(category: string): string {
  const map: Record<string, string> = {
    openai: "#10a37f",
    anthropic: "#d97706",
    google: "#4285f4",
    meta: "#0866ff",
    microsoft: "#00a4ef",
    xai: "#000000",
    mistral: "#ff7000",
    deepseek: "#1e3a8a",
    "open source": "#22c55e",
    research: "#8b5cf6",
    robotics: "#ef4444",
    startups: "#f59e0b",
    agents: "#6366f1",
    "prompt engineering": "#ec4899",
  };
  return map[category.toLowerCase()] ?? "#6366f1";
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
