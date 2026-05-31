import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AIHub LLM",
  description:
    "Chat with the AIHub AI assistant — your conversational guide to the AI ecosystem. Ask about models, news, research, tutorials, and anything AI-related.",
  openGraph: {
    title: "AIHub LLM | AIHub",
    description: "Conversational AI assistant for the entire AI ecosystem — ask anything about AI.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
