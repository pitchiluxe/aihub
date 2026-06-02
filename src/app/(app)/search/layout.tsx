import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "AIHub Search",
  description: "Search across AI news, research papers, models, tutorials, and companies. The dedicated AI-only search engine for the artificial intelligence ecosystem.",
  path: "/search",
  keywords: ["AI search engine","search AI news","search AI models","artificial intelligence search"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}