import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "AI Skills Archive",
  description: "Discover, download, and share AI skills and agents created by the AIHub community. Browse the growing library of community-built AI components.",
  path: "/archive",
  keywords: ["AI skills archive","community AI agents","AI skill library","download AI skills","AI agent archive"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}