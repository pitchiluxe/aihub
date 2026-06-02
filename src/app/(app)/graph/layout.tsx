import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "AI Knowledge Graph",
  description: "Visually explore the AI ecosystem with an interactive knowledge graph. Discover relationships between AI models, companies, tools, research, and frameworks.",
  path: "/graph",
  keywords: ["AI knowledge graph","AI ecosystem map","AI visualization","AI companies map","D3 knowledge graph"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}