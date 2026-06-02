import type { Metadata } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://aihub-eight-xi.vercel.app";

export const metadata: Metadata = {
  title: "1M Ideas — 100 World-Changing AI Business Ideas",
  description:
    "Discover 100 AI-powered business ideas worth $1M+. Fresh ideas generated daily across healthcare, legal, education, finance, automation, and 15+ industries. Download production-ready starter kits.",
  keywords: [
    "AI business ideas", "million dollar AI ideas", "AI tool ideas", "AI startup ideas",
    "AI for small business", "AI automation ideas", "AI healthcare tools",
    "AI legal tools", "AI education tools", "AI finance tools",
    "production ready AI templates", "AI SaaS ideas", "Erick Omari",
  ],
  openGraph: {
    title: "1M Ideas — 100 World-Changing AI Business Ideas | AIHub",
    description: "Fresh AI-generated business ideas daily. 100 ideas across 20+ industries with starter kit downloads.",
    url: `${BASE}/million-ideas`,
    type: "website",
    images: [{ url: `${BASE}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "1M Ideas — 100 World-Changing AI Business Ideas",
    description: "Fresh AI-generated business ideas daily. Download production-ready starter kits.",
    images: [`${BASE}/og-image.png`],
  },
  alternates: { canonical: `${BASE}/million-ideas` },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
