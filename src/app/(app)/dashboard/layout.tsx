import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Dashboard",
  description: "Your AI intelligence command center. Real-time AI news, trending models, top research, and the full AI ecosystem — all in one place.",
  path: "/dashboard",
  keywords: ["AI dashboard","AI intelligence","AI models overview","artificial intelligence hub","AI news dashboard"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}