import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Your AI intelligence command center. Real-time breaking AI news, trending models, top research, and the full AI ecosystem at a glance.",
  openGraph: {
    title: "Dashboard | AIHub",
    description: "Your AI intelligence command center. Real-time AI news, trending models, and research.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
