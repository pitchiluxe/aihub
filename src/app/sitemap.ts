import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://aihub-eight-xi.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/dashboard`,      lastModified: now, changeFrequency: "hourly",  priority: 1.0 },
    { url: `${BASE}/news`,           lastModified: now, changeFrequency: "hourly",  priority: 0.95 },
    { url: `${BASE}/million-ideas`,  lastModified: now, changeFrequency: "daily",   priority: 0.95 },
    { url: `${BASE}/models`,         lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/agents`,         lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/research`,       lastModified: now, changeFrequency: "daily",   priority: 0.85 },
    { url: `${BASE}/tutorials`,      lastModified: now, changeFrequency: "weekly",  priority: 0.85 },
    { url: `${BASE}/trends`,         lastModified: now, changeFrequency: "hourly",  priority: 0.85 },
    { url: `${BASE}/graph`,          lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/search`,         lastModified: now, changeFrequency: "always",  priority: 0.8 },
    { url: `${BASE}/skills`,         lastModified: now, changeFrequency: "weekly",  priority: 0.75 },
    { url: `${BASE}/workflows`,      lastModified: now, changeFrequency: "weekly",  priority: 0.75 },
    { url: `${BASE}/community`,      lastModified: now, changeFrequency: "daily",   priority: 0.75 },
    { url: `${BASE}/repos`,          lastModified: now, changeFrequency: "daily",   priority: 0.75 },
    { url: `${BASE}/companies`,      lastModified: now, changeFrequency: "daily",   priority: 0.75 },
    { url: `${BASE}/radar`,          lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/battle`,         lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/playground`,     lastModified: now, changeFrequency: "monthly", priority: 0.65 },
    { url: `${BASE}/generator`,      lastModified: now, changeFrequency: "weekly",  priority: 0.65 },
    { url: `${BASE}/aihumlm`,        lastModified: now, changeFrequency: "daily",   priority: 0.65 },
    { url: `${BASE}/archive`,        lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${BASE}/contact`,        lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
