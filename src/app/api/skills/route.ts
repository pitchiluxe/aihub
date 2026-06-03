import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── GitHub repo shape we care about ───────────────────────────
interface GHRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  topics: string[];
  language: string | null;
  updated_at: string;
  owner: { login: string; avatar_url: string };
}

export interface LiveSkill {
  id: string;
  name: string;
  description: string;
  stars: number;
  url: string;
  language: string | null;
  topics: string[];
  owner: string;
  avatarUrl: string;
  updatedAt: string;
  category: string;
}

// Infer a rough category from repo topics/name
function inferCategory(repo: GHRepo): string {
  const text = [repo.name, ...repo.topics].join(" ").toLowerCase();
  if (/front|react|next|vue|svelte|tailwind|ui|css/.test(text)) return "development";
  if (/backend|api|server|express|fastapi|django|rails/.test(text)) return "development";
  if (/agent|rag|llm|prompt|embedding|langchain|openai|claude/.test(text)) return "ai-engineering";
  if (/security|pentest|vuln|owasp|crypt/.test(text)) return "security";
  if (/devops|docker|k8s|kubernetes|ci|cd|deploy|cloud/.test(text)) return "devops";
  if (/data|ml|machine|learn|model|dataset|analytic/.test(text)) return "data";
  if (/test|jest|pytest|cypress|unit/.test(text)) return "testing";
  if (/mobile|ios|android|flutter|react-native/.test(text)) return "mobile";
  return "development";
}

async function searchGitHub(q: string, ghHeaders: Record<string, string>): Promise<GHRepo[]> {
  try {
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=15`,
      { headers: ghHeaders, next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch { return []; }
}

export async function GET() {
  const ghHeaders: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "AIHub/2.0",
  };
  if (process.env.GITHUB_TOKEN) ghHeaders.Authorization = `token ${process.env.GITHUB_TOKEN}`;

  // Pull multiple relevant queries in parallel
  const [claudeSkill, claudeCode, aiAgents, promptEng, langchain] = await Promise.allSettled([
    searchGitHub("topic:claude-skill stars:>1", ghHeaders),
    searchGitHub("topic:claude-code stars:>5", ghHeaders),
    searchGitHub("topic:ai-agent topic:claude stars:>10", ghHeaders),
    searchGitHub("prompt-engineering skill stars:>50", ghHeaders),
    searchGitHub("topic:langchain topic:agent stars:>20", ghHeaders),
  ]);

  const seen = new Set<number>();
  const raw: GHRepo[] = [];

  for (const result of [claudeSkill, claudeCode, aiAgents, promptEng, langchain]) {
    if (result.status === "fulfilled") {
      for (const r of result.value) {
        if (!seen.has(r.id)) { seen.add(r.id); raw.push(r); }
      }
    }
  }

  // Sort by stars descending
  raw.sort((a, b) => b.stargazers_count - a.stargazers_count);

  const skills: LiveSkill[] = raw.map((r) => ({
    id: `gh-${r.id}`,
    name: r.name,
    description: r.description ?? "AI skill from the GitHub community.",
    stars: r.stargazers_count,
    url: r.html_url,
    language: r.language,
    topics: r.topics ?? [],
    owner: r.owner.login,
    avatarUrl: r.owner.avatar_url,
    updatedAt: r.updated_at,
    category: inferCategory(r),
  }));

  return NextResponse.json({ skills, total: skills.length });
}
