import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "AI Companies",
  description: "Track leading AI companies — OpenAI, Anthropic, Google DeepMind, Meta AI, xAI, Mistral, Cohere, and hundreds more. Company profiles, funding, products, and news.",
  path: "/companies",
  keywords: ["AI companies","OpenAI","Anthropic","Google DeepMind","Meta AI","xAI Grok","AI startup tracker"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}