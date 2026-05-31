import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Research",
  description:
    "Explore AI research papers with plain-English summaries, visual breakdowns, and citation graphs. Stay current with breakthroughs from arXiv, NeurIPS, ICLR, and top AI labs.",
  keywords: [
    "AI research", "machine learning papers", "arXiv AI", "NeurIPS", "ICLR",
    "deep learning research", "AI breakthroughs", "LLM papers",
  ],
  openGraph: {
    title: "AI Research | AIHub",
    description: "AI research papers explained simply — summaries, visuals, and citation graphs.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
