import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "AI Research",
  description: "Explore AI research papers with plain-English summaries, visual breakdowns, and citation graphs. Stay current with breakthroughs from arXiv, NeurIPS, ICLR, and top AI labs.",
  path: "/research",
  keywords: ["AI research papers","arXiv AI","NeurIPS","ICLR","machine learning research","AI breakthroughs"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}