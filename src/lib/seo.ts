import type { Metadata } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://aihub-eight-xi.vercel.app";
const OG_IMAGE = `${BASE}/og-image.png`;

export function pageMeta(opts: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  const url = `${BASE}${opts.path}`;
  const fullTitle = `${opts.title} | AIHub`;
  return {
    title: opts.title,
    description: opts.description,
    keywords: opts.keywords,
    openGraph: {
      title: fullTitle,
      description: opts.description,
      url,
      type: "website",
      siteName: "AIHub — The Homepage of AI",
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: opts.description,
      images: [OG_IMAGE],
      creator: "@eomari",
      site: "@eomari",
    },
    alternates: { canonical: url },
  };
}
