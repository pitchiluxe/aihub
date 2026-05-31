import type { MetadataRoute } from "next";

// Use server-side env var (no NEXT_PUBLIC_ prefix) so it's never inlined as localhost
const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://aihub-eight-xi.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/dashboard`,   lastModified: now, changeFrequency: "hourly",  priority: 1.0 },
    { url: `${baseUrl}/news`,        lastModified: now, changeFrequency: "hourly",  priority: 0.9 },
    { url: `${baseUrl}/models`,      lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${baseUrl}/research`,    lastModified: now, changeFrequency: "daily",   priority: 0.85 },
    { url: `${baseUrl}/tutorials`,   lastModified: now, changeFrequency: "weekly",  priority: 0.85 },
    { url: `${baseUrl}/agents`,      lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/graph`,       lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/search`,      lastModified: now, changeFrequency: "always",  priority: 0.8 },
    { url: `${baseUrl}/trends`,      lastModified: now, changeFrequency: "hourly",  priority: 0.8 },
    { url: `${baseUrl}/skills`,      lastModified: now, changeFrequency: "weekly",  priority: 0.75 },
    { url: `${baseUrl}/workflows`,   lastModified: now, changeFrequency: "weekly",  priority: 0.75 },
    { url: `${baseUrl}/community`,   lastModified: now, changeFrequency: "daily",   priority: 0.75 },
    { url: `${baseUrl}/companies`,   lastModified: now, changeFrequency: "daily",   priority: 0.75 },
    { url: `${baseUrl}/radar`,       lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${baseUrl}/battle`,      lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${baseUrl}/playground`,  lastModified: now, changeFrequency: "monthly", priority: 0.65 },
  ];

  return staticRoutes;
}
