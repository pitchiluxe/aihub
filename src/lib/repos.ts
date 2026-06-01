import { AIRepository } from "@/types";
import { createHash } from "crypto";

// ──────────────────────────────────────────────────────────────
// Curated AI repositories to seed the database
// ──────────────────────────────────────────────────────────────
const SEED_REPOS = [
  {
    name: "andrej-karpathy-skills",
    owner: "multica-ai",
    description: "AI and coding skills inspired by Andrej Karpathy's work",
    url: "https://github.com/multica-ai/andrej-karpathy-skills",
    platform: "github" as const,
    category: "tutorial" as const,
  },
  {
    name: "Obsidian-CLI-skill",
    owner: "pablo-mano",
    description: "CLI skill for managing Obsidian vaults with AI",
    url: "https://github.com/pablo-mano/Obsidian-CLI-skill",
    platform: "github" as const,
    category: "tool" as const,
  },
  {
    name: "open-design",
    owner: "nexu-io",
    description: "Open design patterns for AI applications",
    url: "https://github.com/nexu-io/open-design",
    platform: "github" as const,
    category: "framework" as const,
  },
  {
    name: "ruflo",
    owner: "ruvnet",
    description: "AI workflow automation framework",
    url: "https://github.com/ruvnet/ruflo",
    platform: "github" as const,
    category: "automation" as const,
  },
  {
    name: "ECC",
    owner: "affaan-m",
    description: "Elliptic Curve Cryptography implementations",
    url: "https://github.com/affaan-m/ECC",
    platform: "github" as const,
    category: "tool" as const,
  },
  {
    name: "superpowers",
    owner: "obra",
    description: "AI-powered development superpowers",
    url: "https://github.com/obra/superpowers",
    platform: "github" as const,
    category: "agent" as const,
  },
  {
    name: "technobiz-trader-agent",
    owner: "pitchiluxe",
    description: "AI trading agent for TechBiz markets",
    url: "https://github.com/pitchiluxe/technobiz-trader-agent",
    platform: "github" as const,
    category: "agent" as const,
  },
];

// Popular AI-related repositories that users often search for
const POPULAR_SEARCH_QUERIES = [
  "LangChain",
  "LangGraph",
  "CrewAI",
  "AutoGen",
  "Ollama",
  "llama.cpp",
  "vLLM",
  "OpenWebUI",
  "Dify",
  "Flowise",
  "n8n",
  "Haystack",
  "RAG",
  "Vector",
  "Embedding",
  "Agent",
  "MCP",
  "Model Context Protocol",
];

// ──────────────────────────────────────────────────────────────
// GitHub API interaction
// ──────────────────────────────────────────────────────────────
async function fetchGitHubRepo(owner: string, repo: string): Promise<any> {
  const token = process.env.GITHUB_TOKEN || "";
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "AIHub/1.0",
  };

  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers, cache: "no-store" }
    );

    if (!response.ok) {
      console.warn(`Failed to fetch ${owner}/${repo}:`, response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${owner}/${repo}:`, error);
    return null;
  }
}

async function searchGitHubRepos(query: string, limit: number = 30): Promise<any[]> {
  const token = process.env.GITHUB_TOKEN || "";
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "AIHub/1.0",
  };

  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  try {
    // Search for AI-related repos
    const searchQuery = `${query} language:python language:typescript language:javascript created:>2023-01-01 stars:>10`;
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(
        searchQuery
      )}&sort=stars&order=desc&per_page=${limit}`,
      { headers, cache: "no-store" }
    );

    if (!response.ok) {
      console.warn(`GitHub search failed:`, response.status);
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error searching GitHub:", error);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────
// Repository processing and categorization
// ──────────────────────────────────────────────────────────────
function categorizeRepo(repo: any): AIRepository["category"] {
  const name = repo.name?.toLowerCase() || "";
  const desc = repo.description?.toLowerCase() || "";
  const topics = repo.topics?.map((t: string) => t.toLowerCase()) || [];
  const fullText = `${name} ${desc} ${topics.join(" ")}`.toLowerCase();

  if (
    fullText.includes("agent") ||
    fullText.includes("agentic") ||
    fullText.includes("crew") ||
    fullText.includes("autogen")
  ) {
    return "agent";
  }
  if (
    fullText.includes("framework") ||
    fullText.includes("langchain") ||
    fullText.includes("haystack") ||
    fullText.includes("llama")
  ) {
    return "framework";
  }
  if (
    fullText.includes("model") ||
    fullText.includes("llm") ||
    fullText.includes("transformer")
  ) {
    return "model";
  }
  if (
    fullText.includes("dataset") ||
    fullText.includes("benchmark") ||
    fullText.includes("eval")
  ) {
    return "dataset";
  }
  if (
    fullText.includes("tutorial") ||
    fullText.includes("course") ||
    fullText.includes("learning")
  ) {
    return "tutorial";
  }
  if (
    fullText.includes("automation") ||
    fullText.includes("workflow") ||
    fullText.includes("n8n") ||
    fullText.includes("zapier")
  ) {
    return "automation";
  }
  if (
    fullText.includes("tool") ||
    fullText.includes("cli") ||
    fullText.includes("utility")
  ) {
    return "tool";
  }
  return "other";
}

export async function convertGitHubRepoToAIRepository(
  gitHubRepo: any,
  featured = false,
  isNew = false
): Promise<AIRepository> {
  const id = createHash("sha1")
    .update(gitHubRepo.html_url)
    .digest("hex")
    .slice(0, 20);

  return {
    id,
    name: gitHubRepo.name,
    owner: gitHubRepo.owner?.login || gitHubRepo.owner || "",
    description: gitHubRepo.description || "",
    url: gitHubRepo.html_url,
    platform: "github",
    stars: gitHubRepo.stargazers_count || 0,
    forks: gitHubRepo.forks_count || 0,
    language: gitHubRepo.language || undefined,
    license: gitHubRepo.license?.spdx_id || gitHubRepo.license?.name || undefined,
    tags: (gitHubRepo.topics || []).slice(0, 5),
    topics: gitHubRepo.topics || [],
    updatedAt: gitHubRepo.updated_at || new Date().toISOString(),
    imageUrl: gitHubRepo.owner?.avatar_url || undefined,
    isNew,
    featured,
    category: categorizeRepo(gitHubRepo),
  };
}

export async function fetchAndEnrichSeededRepos(): Promise<AIRepository[]> {
  const repos: AIRepository[] = [];
  const now = new Date();

  for (const seedRepo of SEED_REPOS) {
    const gitHubData = await fetchGitHubRepo(seedRepo.owner, seedRepo.name);

    if (gitHubData) {
      const enriched = await convertGitHubRepoToAIRepository(
        gitHubData,
        true, // Featured
        false
      );
      // Override category if specified in seed
      if (seedRepo.category) {
        enriched.category = seedRepo.category;
      }
      repos.push(enriched);
    } else {
      // Fallback if GitHub API fails
      repos.push({
        id: createHash("sha1")
          .update(seedRepo.url)
          .digest("hex")
          .slice(0, 20),
        name: seedRepo.name,
        owner: seedRepo.owner,
        description: seedRepo.description,
        url: seedRepo.url,
        platform: seedRepo.platform,
        stars: 0,
        forks: 0,
        tags: [],
        topics: [],
        updatedAt: now.toISOString(),
        featured: true,
        category: seedRepo.category,
      });
    }
  }

  return repos;
}

export async function fetchPopularAIRepos(): Promise<AIRepository[]> {
  const allRepos: AIRepository[] = [];
  const seen = new Set<string>();

  for (const query of POPULAR_SEARCH_QUERIES) {
    try {
      const results = await searchGitHubRepos(query, 15);

      for (const repo of results) {
        const url = repo.html_url;
        if (seen.has(url)) continue;
        seen.add(url);

        const aiRepo = await convertGitHubRepoToAIRepository(repo);
        allRepos.push(aiRepo);

        if (allRepos.length >= 100) break;
      }

      if (allRepos.length >= 100) break;

      // Rate limiting: 1 second between requests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error fetching repos for query "${query}":`, error);
    }
  }

  // Sort by stars descending
  return allRepos.sort((a, b) => b.stars - a.stars);
}

export async function getAllRepositories(): Promise<AIRepository[]> {
  try {
    // Fetch seeded repos
    const seededRepos = await fetchAndEnrichSeededRepos();

    // Fetch popular repos (with rate limiting)
    const popularRepos = await fetchPopularAIRepos();

    // Combine and deduplicate
    const allRepos = [...seededRepos];
    const urls = new Set(seededRepos.map((r) => r.url));

    for (const repo of popularRepos) {
      if (!urls.has(repo.url)) {
        allRepos.push(repo);
        urls.add(repo.url);
      }
    }

    // Sort by stars
    return allRepos.sort((a, b) => b.stars - a.stars);
  } catch (error) {
    console.error("Error fetching all repositories:", error);
    return [];
  }
}

export async function searchRepositories(
  query: string
): Promise<AIRepository[]> {
  if (!query.trim()) {
    return getAllRepositories();
  }

  const allRepos = await getAllRepositories();
  const normalizedQuery = query.toLowerCase();

  return allRepos.filter((repo) => {
    const searchText = `${repo.name} ${repo.owner} ${repo.description} ${repo.tags.join(
      " "
    )} ${repo.topics.join(" ")} ${repo.category}`.toLowerCase();
    return searchText.includes(normalizedQuery);
  });
}
