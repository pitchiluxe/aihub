import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "AI Repos",
  description: "Discover the best AI repositories on GitHub. Browse trending open-source AI projects, models, tools, and frameworks updated in real time.",
  path: "/repos",
  keywords: ["AI repositories","open source AI","GitHub AI repos","trending AI projects","open source LLM"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}