import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "1M Ideas — 100 World-Changing AI Business Ideas",
  description:
    "Discover 100 AI-powered business ideas worth $1M+. Fresh ideas generated daily by AI across healthcare, legal, education, finance, automation, and 20+ industries. Download production-ready starter kits.",
  path: "/million-ideas",
  keywords: [
    "AI business ideas", "million dollar AI ideas", "AI tool ideas", "AI startup ideas",
    "AI for small business", "AI automation ideas", "AI healthcare tools", "AI legal tools",
    "AI education tools", "AI finance tools", "production ready AI templates",
    "AI SaaS ideas", "world changing AI tools", "Erick Omari",
  ],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
