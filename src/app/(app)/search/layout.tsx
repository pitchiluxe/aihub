import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Search",
  description:
    "Search across AI news, research papers, models, tutorials, and companies. The dedicated search engine for the AI ecosystem.",
  keywords: [
    "AI search engine", "search AI news", "find AI models", "AI research search",
    "AI content search",
  ],
  openGraph: {
    title: "AI Search | AIHub",
    description: "The dedicated search engine for AI news, models, research, and tutorials.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
