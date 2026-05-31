import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Model Battle",
  description:
    "Head-to-head AI model comparisons. Send the same prompt to multiple models simultaneously and compare responses, speed, and quality side by side.",
  keywords: [
    "AI model comparison", "model battle", "LLM comparison", "compare AI models",
    "GPT vs Claude", "AI benchmark", "side by side AI",
  ],
  openGraph: {
    title: "Model Battle | AIHub",
    description: "Compare AI models head-to-head — same prompt, multiple models, instant results.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
