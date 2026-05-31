import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI News",
  description:
    "Breaking AI news from OpenAI, Anthropic, Google, Meta, xAI, Mistral, and more. Real-time AI industry updates, research announcements, and open-source releases.",
  keywords: [
    "AI news", "artificial intelligence news", "OpenAI news", "Anthropic news",
    "Google AI", "Meta AI", "LLM news", "AI announcements",
  ],
  openGraph: {
    title: "AI News | AIHub",
    description: "Breaking AI news from OpenAI, Anthropic, Google, Meta, xAI, and more.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
