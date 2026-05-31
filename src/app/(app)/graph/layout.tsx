import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Knowledge Graph",
  description:
    "Visually explore the AI ecosystem with an interactive knowledge graph. Discover relationships between AI models, companies, tools, research, and frameworks — powered by D3.js.",
  keywords: [
    "AI knowledge graph", "AI ecosystem map", "AI relationships", "interactive graph",
    "AI visualization", "AI ontology", "AI network",
  ],
  openGraph: {
    title: "Knowledge Graph | AIHub",
    description: "Interactive knowledge graph — explore relationships across the entire AI ecosystem.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
