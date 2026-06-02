import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "AI Trends",
  description: "Track trending AI topics, companies, models, tools, and frameworks in real time. Heat maps, trend charts, and graphs for the AI industry ecosystem.",
  path: "/trends",
  keywords: ["AI trends","trending AI models","AI industry trends","artificial intelligence trends 2025"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}