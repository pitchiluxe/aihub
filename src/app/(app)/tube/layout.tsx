import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "AI Tube",
  description: "Watch the best AI YouTube videos from top creators — Nate Herk, Matt Wolfe, Two Minute Papers, Andrej Karpathy, and more. Fresh AI tutorials, model reviews, and research explained.",
  path: "/tube",
  keywords: ["AI YouTube","AI videos","AI tutorials","AI creators","Matt Wolfe","Two Minute Papers","AI news videos","LLM tutorials"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
