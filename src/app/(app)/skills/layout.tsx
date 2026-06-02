import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "AI Skills",
  description: "Master AI skills across development, prompt engineering, automation, workflow design, and AI research. Curated skill paths for AI professionals at every level.",
  path: "/skills",
  keywords: ["AI skills","prompt engineering skills","AI development skills","machine learning skills"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}