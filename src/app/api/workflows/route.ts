import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── Types ─────────────────────────────────────────────────────
export interface LiveWorkflow {
  id: string;
  name: string;
  description: string;
  category: string;
  views?: number;
  stars?: number;
  author: string;
  url: string;
  tools: string[];
  source: "n8n" | "github" | "make";
  imageUrl?: string;
  createdAt?: string;
}

// ── n8n.io public templates API ───────────────────────────────
async function fetchN8nTemplates(): Promise<LiveWorkflow[]> {
  try {
    const res = await fetch(
      "https://api.n8n.io/templates/search?rows=30&skip=0&sort=featured",
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return [];
    const data = await res.json();

    return (data.workflows ?? []).map((w: {
      id: number;
      name: string;
      description?: string;
      categories?: { id: number; name: string }[];
      totalViews?: number;
      user?: { username?: string };
      nodes?: { type: string }[];
      image?: { id: string; url: string }[];
      createdAt?: string;
    }) => ({
      id: `n8n-${w.id}`,
      name: w.name ?? "Untitled",
      description: w.description ?? "n8n automation workflow",
      category: w.categories?.[0]?.name ?? "Automation",
      views: w.totalViews ?? 0,
      author: w.user?.username ?? "n8n community",
      url: `https://n8n.io/workflows/${w.id}`,
      tools: (w.nodes ?? [])
        .map((n: { type: string }) => {
          const parts = n.type.split(".");
          return parts[parts.length - 1] ?? n.type;
        })
        .filter((t: string, i: number, arr: string[]) => arr.indexOf(t) === i)
        .slice(0, 6),
      source: "n8n" as const,
      imageUrl: w.image?.[0]?.url,
      createdAt: w.createdAt,
    }));
  } catch { return []; }
}

// ── GitHub automation/workflow repos ──────────────────────────
async function fetchGitHubWorkflows(): Promise<LiveWorkflow[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "AIHub/2.0",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;

  const queries = [
    "topic:n8n+topic:ai+stars:>10",
    "topic:automation+topic:ai+topic:workflow+stars:>20",
    "ai+workflow+automation+stars:>50+language:json",
  ];

  const seen = new Set<number>();
  const workflows: LiveWorkflow[] = [];

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&per_page=12`,
        { headers, next: { revalidate: 3600 } }
      );
      if (!res.ok) continue;
      const data = await res.json();

      for (const r of data.items ?? []) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        workflows.push({
          id: `gh-${r.id}`,
          name: r.name,
          description: r.description ?? "AI automation workflow from GitHub",
          category: inferWorkflowCategory(r.topics ?? []),
          stars: r.stargazers_count,
          author: r.owner?.login ?? "unknown",
          url: r.html_url,
          tools: (r.topics ?? []).slice(0, 5),
          source: "github",
          createdAt: r.updated_at,
        });
      }
    } catch { /* skip failed query */ }
  }

  return workflows;
}

// ── Make.com (Integromat) template feed via GitHub mirror ─────
async function fetchMakeTemplates(): Promise<LiveWorkflow[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "AIHub/2.0",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;

  try {
    const res = await fetch(
      "https://api.github.com/search/repositories?q=topic:make-com+topic:ai+stars:>5&sort=stars&per_page=10",
      { headers, next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();

    return (data.items ?? []).map((r: {
      id: number; name: string; description: string | null;
      stargazers_count: number; topics: string[];
      owner: { login: string }; html_url: string; updated_at: string;
    }) => ({
      id: `make-${r.id}`,
      name: r.name,
      description: r.description ?? "Make.com automation template",
      category: "Make Automation",
      stars: r.stargazers_count,
      author: r.owner?.login ?? "unknown",
      url: r.html_url,
      tools: (r.topics ?? []).filter((t: string) => !["make-com", "automation"].includes(t)).slice(0, 5),
      source: "make" as const,
      createdAt: r.updated_at,
    }));
  } catch { return []; }
}

function inferWorkflowCategory(topics: string[]): string {
  const t = topics.join(" ").toLowerCase();
  if (/email|gmail|outlook|mail/.test(t)) return "Email & Communication";
  if (/slack|discord|teams|chat/.test(t)) return "Messaging";
  if (/notion|airtable|sheet|docs/.test(t)) return "Productivity";
  if (/github|gitlab|ci|cd|deploy/.test(t)) return "DevOps";
  if (/ecommerce|shopify|payment|stripe/.test(t)) return "E-commerce";
  if (/social|twitter|instagram|linkedin/.test(t)) return "Social Media";
  if (/data|etl|database|postgres|mongo/.test(t)) return "Data Pipeline";
  return "AI Automation";
}

export async function GET() {
  const [n8n, github, make] = await Promise.allSettled([
    fetchN8nTemplates(),
    fetchGitHubWorkflows(),
    fetchMakeTemplates(),
  ]);

  const workflows: LiveWorkflow[] = [
    ...(n8n.status === "fulfilled" ? n8n.value : []),
    ...(github.status === "fulfilled" ? github.value : []),
    ...(make.status === "fulfilled" ? make.value : []),
  ];

  // n8n by views, github by stars
  workflows.sort((a, b) => {
    const scoreA = (a.views ?? 0) + (a.stars ?? 0) * 10;
    const scoreB = (b.views ?? 0) + (b.stars ?? 0) * 10;
    return scoreB - scoreA;
  });

  return NextResponse.json({ workflows, total: workflows.length });
}
