import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "AI Radar",
  description: "Monitor the AI industry radar — emerging technologies, tools to watch, rising companies, and early signals in the AI space before they go mainstream.",
  path: "/radar",
  keywords: ["AI radar","emerging AI tools","AI industry monitoring","AI technology watch","early stage AI"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}