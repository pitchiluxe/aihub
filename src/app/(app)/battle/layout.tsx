import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "AI Model Battle",
  description: "Head-to-head AI model comparisons. Send the same prompt to multiple models simultaneously and compare responses, speed, and quality side by side.",
  path: "/battle",
  keywords: ["AI model battle","LLM comparison","GPT vs Claude","compare AI models","AI benchmark"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}