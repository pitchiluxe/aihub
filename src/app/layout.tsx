import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ChatBot } from "@/components/ChatBot";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AIHub — The Homepage of Artificial Intelligence",
    template: "%s | AIHub",
  },
  description:
    "AIHub is the ultimate AI intelligence platform — discover AI models, track breaking AI news, explore research, build AI agents, and master AI workflows. The Bloomberg Terminal for AI.",
  keywords: [
    "AI hub", "artificial intelligence platform", "LLM models", "language models",
    "AI news", "AI research", "GPT-4", "Claude", "Gemini", "AI agents",
    "prompt engineering", "OpenRouter", "Ollama", "machine learning",
    "AI tools", "AI startups", "AI automation", "AI workflows",
    "million dollar AI ideas", "AI business ideas", "AI for small business",
    "Erick Omari", "AIHub",
  ],
  authors: [{ name: "Erick Omari", url: "https://www.linkedin.com/in/erickomari" }],
  creator: "Erick Omari",
  publisher: "AIHub",
  category: "Technology",
  classification: "AI / Machine Learning / Technology",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://aihub-eight-xi.vercel.app"),
  verification: {
    google: "R0NgtCMlIsTN_BF4zl7TsufOjHnSRYD_QNp0hMhvENw",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    other: [
      { rel: "mask-icon", url: "/favicon.svg", color: "#6366f1" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://aihub-eight-xi.vercel.app",
    title: "AIHub — The Homepage of Artificial Intelligence",
    description: "The Bloomberg Terminal for AI. Discover models, track news, explore research.",
    siteName: "AIHub",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AIHub — The Homepage of Artificial Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AIHub — The Homepage of Artificial Intelligence",
    description: "The Bloomberg Terminal for AI. Discover models, track news, explore research.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL ?? "https://aihub-eight-xi.vercel.app",
  },
  other: {
    "google-site-verification": "R0NgtCMlIsTN_BF4zl7TsufOjHnSRYD_QNp0hMhvENw",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aihub-eight-xi.vercel.app";
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "AIHub",
      url: appUrl,
      description: "The ultimate AI intelligence platform — discover models, track news, explore research, build agents, and master AI workflows.",
      author: { "@type": "Person", name: "Erick Omari", url: "https://www.linkedin.com/in/erickomari" },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${appUrl}/search?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "AIHub",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: appUrl,
      description: "The Bloomberg Terminal for AI — real-time AI news, model discovery, research tracking, agent building, and 100 world-changing AI business ideas.",
      author: { "@type": "Person", name: "Erick Omari" },
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "1200" },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "AIHub",
      url: appUrl,
      logo: `${appUrl}/favicon.svg`,
      founder: { "@type": "Person", name: "Erick Omari", sameAs: ["https://www.linkedin.com/in/erickomari", "https://x.com/eomari", "https://github.com/pitchiluxe"] },
      sameAs: ["https://www.linkedin.com/in/erickomari", "https://x.com/eomari"],
    },
  ];

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="canonical" href={appUrl} />
        <link rel="alternate" type="application/rss+xml" title="AIHub AI News Feed" href={`${appUrl}/feed.xml`} />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <ChatBot />
          <Analytics />
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: "text-sm font-medium",
              style: {
                background: "var(--card)",
                color: "var(--card-foreground)",
                border: "1px solid var(--border)",
                borderRadius: "0.75rem",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
