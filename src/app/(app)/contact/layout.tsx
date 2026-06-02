import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Contact Erick Omari — AIHub Builder",
  description:
    "Get in touch with Erick Omari, builder of AIHub — The Homepage of Artificial Intelligence. For partnerships, feature requests, feedback, or collaboration opportunities.",
  path: "/contact",
  keywords: ["contact Erick Omari", "AIHub contact", "AI platform feedback", "AI collaboration", "AIHub builder"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
