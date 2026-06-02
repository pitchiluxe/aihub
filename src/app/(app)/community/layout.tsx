import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "AI Community",
  description: "Join the AIHub community. Discuss AI breakthroughs, share the best prompts and workflows, review models and tools, and read weekly AI recaps.",
  path: "/community",
  keywords: ["AI community","AI discussions","AI prompts community","AI model reviews","weekly AI recap"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}