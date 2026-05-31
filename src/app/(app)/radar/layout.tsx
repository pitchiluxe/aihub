import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Radar",
  description:
    "Monitor the AI industry radar — emerging technologies, tools to watch, rising companies, and early signals in the AI space before they go mainstream.",
  keywords: [
    "AI radar", "emerging AI", "AI to watch", "AI early signals",
    "AI technology radar", "new AI tools", "AI industry monitor",
  ],
  openGraph: {
    title: "AI Radar | AIHub",
    description: "Early signals and emerging technologies in the AI industry — before they go mainstream.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
