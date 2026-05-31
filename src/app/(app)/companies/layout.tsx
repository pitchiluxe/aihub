import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Companies",
  description:
    "Track leading AI companies — OpenAI, Anthropic, Google DeepMind, Meta AI, xAI, Mistral, Cohere, and hundreds more. Company profiles, funding, products, and news.",
  keywords: [
    "AI companies", "OpenAI", "Anthropic", "Google DeepMind", "Meta AI",
    "xAI", "Mistral AI", "AI startups", "AI funding", "AI industry",
  ],
  openGraph: {
    title: "AI Companies | AIHub",
    description: "Track AI companies — profiles, funding, products, and latest news.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
