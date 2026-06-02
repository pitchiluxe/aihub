import type { Metadata } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://aihub-eight-xi.vercel.app";

export const metadata: Metadata = {
  title: "Contact Erick Omari — AIHub Builder",
  description:
    "Get in touch with Erick Omari, builder of AIHub. For partnerships, feature requests, feedback, or collaboration opportunities.",
  keywords: ["contact Erick Omari", "AIHub contact", "AI platform feedback", "AI collaboration"],
  openGraph: {
    title: "Contact Erick Omari — AIHub Builder",
    description: "Reach out for partnerships, feedback, or collaboration on AIHub — The Homepage of AI.",
    url: `${BASE}/contact`,
    type: "website",
  },
  alternates: { canonical: `${BASE}/contact` },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
