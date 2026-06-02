import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "AI Models",
  description: "Explore, compare, and benchmark AI models. Browse GPT-4o, Claude 3.5, Gemini, Llama 3, Mistral, and hundreds more. Filter by context window, pricing, and performance.",
  path: "/models",
  keywords: ["AI models","LLM comparison","GPT-4o","Claude","Gemini","Llama","language model benchmarks","AI model directory"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}