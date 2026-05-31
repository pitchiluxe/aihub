import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Trends",
  description:
    "Track trending AI topics, companies, models, tools, and frameworks in real time. Heat maps, charts, and trend graphs for the AI industry.",
  keywords: [
    "AI trends", "trending AI", "AI industry trends", "AI heat map",
    "AI topic trends", "AI technology trends",
  ],
  openGraph: {
    title: "AI Trends | AIHub",
    description: "Real-time trending AI topics, companies, models, and frameworks with heat maps and charts.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
