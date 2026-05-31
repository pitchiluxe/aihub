import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Models",
  description:
    "Explore, compare, and benchmark AI models. Browse GPT-4o, Claude 3.5, Gemini 2.0, Llama 3, Mistral, and hundreds more. Filter by context window, pricing, and performance.",
  keywords: [
    "AI models", "LLM comparison", "GPT-4", "Claude", "Gemini", "Llama",
    "Mistral", "model benchmarks", "AI leaderboard", "context window",
  ],
  openGraph: {
    title: "AI Models | AIHub",
    description: "Explore and compare hundreds of AI models — benchmarks, pricing, context windows, and more.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
