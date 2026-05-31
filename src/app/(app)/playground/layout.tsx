import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Playground",
  description:
    "Test and prototype with any AI model in the AIHub Playground. Adjust temperature, system prompts, and parameters. Compare outputs across models interactively.",
  keywords: [
    "AI playground", "LLM playground", "test AI models", "prompt testing",
    "AI prototyping", "AI parameter tuning", "OpenRouter playground",
  ],
  openGraph: {
    title: "Playground | AIHub",
    description: "Test any AI model with full parameter control — temperature, system prompts, and more.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
