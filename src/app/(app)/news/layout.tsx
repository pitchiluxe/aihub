import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "AI News",
  description: "Breaking AI news from OpenAI, Anthropic, Google, Meta, xAI, Mistral, and more. Real-time AI industry updates, research announcements, and open-source releases.",
  path: "/news",
  keywords: ["AI news","artificial intelligence news","OpenAI news","Anthropic news","Google AI news","LLM news"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}