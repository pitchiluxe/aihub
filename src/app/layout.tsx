import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AIHub — The Homepage of Artificial Intelligence",
    template: "%s | AIHub",
  },
  description:
    "AIHub is the ultimate AI intelligence platform — discover models, track news, explore research, build agents, and master AI workflows in one beautiful interface.",
  keywords: [
    "AI", "artificial intelligence", "LLM", "language models", "AI news",
    "AI research", "GPT", "Claude", "Gemini", "AI agents", "prompt engineering",
    "OpenRouter", "Ollama", "machine learning",
  ],
  authors: [{ name: "AIHub" }],
  creator: "AIHub",
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
  robots: { index: true, follow: true },
  themeColor: "#6366f1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AIHub",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://aihub-eight-xi.vercel.app",
    description:
      "The ultimate AI intelligence platform — discover models, track news, explore research, build agents, and master AI workflows.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://aihub-eight-xi.vercel.app"}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
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
