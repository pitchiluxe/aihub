import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community",
  description:
    "Join the AIHub community. Discuss AI breakthroughs, share the best prompts and workflows, review models and tools, and read weekly AI recaps.",
  keywords: [
    "AI community", "AI discussion", "AI forum", "share AI prompts",
    "AI workflow sharing", "AI model reviews", "weekly AI recap",
  ],
  openGraph: {
    title: "Community | AIHub",
    description: "Discuss AI, share prompts and workflows, review models, and join the AI community.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
