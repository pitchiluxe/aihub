import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Skills",
  description:
    "Master AI skills across development, prompt engineering, automation, workflow design, and AI research. Curated skill paths for AI professionals.",
  keywords: [
    "AI skills", "AI learning paths", "prompt engineering skills",
    "AI development skills", "AI automation", "AI workflow design",
  ],
  openGraph: {
    title: "AI Skills | AIHub",
    description: "Curated AI skill paths for development, prompting, automation, and AI research.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
