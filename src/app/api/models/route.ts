import { NextRequest, NextResponse } from "next/server";
import { fetchOpenRouterModels } from "@/lib/openrouter";
import { fetchOllamaModels } from "@/lib/ollama";
import { AIModel } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

// ── HuggingFace Hub: newest text-generation models ────────────
interface HFModel {
  id: string;
  author?: string;
  createdAt?: string;
  lastModified?: string;
  downloads?: number;
  likes?: number;
  pipeline_tag?: string;
  private?: boolean;
  gated?: boolean | string;
}

async function fetchHuggingFaceModels(): Promise<HFModel[]> {
  try {
    // Pull two lists: most downloaded (proven popular) + most recently created (cutting edge)
    const [popular, newest] = await Promise.all([
      fetch(
        "https://huggingface.co/api/models?sort=downloads&direction=-1&limit=80&filter=text-generation&full=false",
        { next: { revalidate: 3600 } }
      ).then((r) => (r.ok ? r.json() : [])),
      fetch(
        "https://huggingface.co/api/models?sort=createdAt&direction=-1&limit=80&filter=text-generation&full=false",
        { next: { revalidate: 3600 } }
      ).then((r) => (r.ok ? r.json() : [])),
    ]);
    const seen = new Set<string>();
    const combined: HFModel[] = [];
    for (const m of [...newest, ...popular]) {
      if (!m?.id || seen.has(m.id) || m.private || m.gated) continue;
      seen.add(m.id);
      combined.push(m);
    }
    return combined;
  } catch {
    return [];
  }
}

// ── Helpers ───────────────────────────────────────────────────
function buildCapabilities(m: { id: string; architecture?: { modality?: string } }): string[] {
  const caps: string[] = ["text-generation"];
  const modality = m.architecture?.modality ?? "";
  if (modality.includes("image") || /vision|vl\b/.test(m.id)) caps.push("vision");
  if (modality.includes("audio")) caps.push("audio");
  if (/\bcod(e|er|ing)\b/.test(m.id)) caps.push("code");
  if (/instruct|chat/.test(m.id)) caps.push("instruction-following");
  if (/reason|r1\b|think/.test(m.id)) caps.push("reasoning");
  return caps;
}

function buildTags(m: { id: string; pricing?: { prompt?: string } }): string[] {
  const tags: string[] = [];
  const price = parseFloat(m.pricing?.prompt ?? "0");
  if (price === 0 || m.id.includes(":free")) tags.push("free");
  if (isOpenSource(m.id)) tags.push("open-source");
  if (/vision|vl\b/.test(m.id)) tags.push("multimodal");
  if (/\bcod(e|er|ing)\b/.test(m.id)) tags.push("coding");
  if (/reason|r1\b/.test(m.id)) tags.push("reasoning");
  return tags;
}

const OPEN_SOURCE_PROVIDERS = [
  "meta-llama", "mistralai", "deepseek", "qwen", "google/gemma",
  "microsoft/phi", "01-ai", "huggingface", "tiiuae", "nvidia", "nousresearch",
  "liquid", "moonshotai", "z-ai", "cognitivecomputations", "poolside",
];

function isOpenSource(id: string): boolean {
  const lower = id.toLowerCase();
  return OPEN_SOURCE_PROVIDERS.some((p) => lower.includes(p.split("/")[0]));
}

function extractProvider(id: string): string {
  return id.split("/")[0] ?? "unknown";
}

// ── Route handler ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source") ?? "all";
  const freeOnly = searchParams.get("free") === "true";
  const now = Date.now();

  const [openRouterResult, ollamaResult, hfResult] = await Promise.allSettled([
    source !== "ollama" && source !== "huggingface"
      ? (freeOnly ? import("@/lib/openrouter").then((m) => m.getFreeModels()) : fetchOpenRouterModels())
      : Promise.resolve([]),
    source !== "openrouter" && source !== "huggingface"
      ? fetchOllamaModels()
      : Promise.resolve([]),
    source !== "openrouter" && source !== "ollama"
      ? fetchHuggingFaceModels()
      : Promise.resolve([]),
  ]);

  const models: AIModel[] = [];
  const seenIds = new Set<string>();

  // ── OpenRouter models ────────────────────────────────────────
  if (openRouterResult.status === "fulfilled") {
    for (const m of openRouterResult.value) {
      if (seenIds.has(m.id)) continue;
      seenIds.add(m.id);

      const promptPrice = parseFloat(m.pricing?.prompt ?? "0");
      const createdAt = m.created ? m.created * 1000 : undefined; // → ms
      const isNew = createdAt ? now - createdAt < SIXTY_DAYS_MS : false;
      const releaseDate = createdAt ? new Date(createdAt).toISOString().slice(0, 10) : undefined;

      models.push({
        id: m.id,
        name: m.name ?? m.id.split("/").pop() ?? m.id,
        provider: extractProvider(m.id),
        description: m.description ?? "No description available.",
        contextWindow: m.context_length ?? 4096,
        maxOutput: m.top_provider?.max_completion_tokens,
        pricing: {
          prompt: promptPrice,
          completion: parseFloat(m.pricing?.completion ?? "0"),
          unit: "per_token",
        },
        capabilities: buildCapabilities(m),
        releaseDate,
        createdAt: m.created,
        isFree: promptPrice === 0 || m.id.includes(":free"),
        isNew,
        isOpenSource: isOpenSource(m.id),
        openRouterSlug: m.id,
        tags: buildTags(m),
        source: "openrouter",
      });
    }
  }

  // ── HuggingFace models (fill in gaps not on OpenRouter) ──────
  if (hfResult.status === "fulfilled") {
    for (const m of hfResult.value) {
      // Use a normalised ID to check for duplicates with OpenRouter models
      const normId = m.id.toLowerCase().replace(/\//g, "/");
      if (seenIds.has(normId)) continue;
      seenIds.add(normId);

      const createdAt = m.createdAt ? new Date(m.createdAt).getTime() : undefined;
      const isNew = createdAt ? now - createdAt < SIXTY_DAYS_MS : false;
      const releaseDate = m.createdAt ? m.createdAt.slice(0, 10) : undefined;

      models.push({
        id: `hf/${m.id}`,
        name: m.id.split("/").pop() ?? m.id,
        provider: m.author ?? m.id.split("/")[0] ?? "huggingface",
        description: `Open-source model on HuggingFace Hub.`,
        contextWindow: 4096,
        pricing: { prompt: 0, completion: 0, unit: "per_token" },
        capabilities: ["text-generation"],
        releaseDate,
        createdAt: createdAt ? Math.floor(createdAt / 1000) : undefined,
        isFree: true,
        isNew,
        isOpenSource: true,
        hfId: m.id,
        hfDownloads: m.downloads,
        hfLikes: m.likes,
        tags: ["free", "open-source", "huggingface"],
        source: "huggingface",
      });
    }
  }

  // ── Ollama models ────────────────────────────────────────────
  if (ollamaResult.status === "fulfilled") {
    for (const m of ollamaResult.value) {
      const id = `ollama/${m.name}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      models.push({
        id,
        name: m.name,
        provider: "ollama",
        description: `Local model via Ollama. Family: ${m.details.family ?? "unknown"}`,
        contextWindow: 4096,
        pricing: { prompt: 0, completion: 0, unit: "per_token" },
        capabilities: ["text-generation"],
        isFree: true,
        isOpenSource: true,
        ollamaSlug: m.name,
        tags: ["local", "free", m.details.family ?? ""].filter(Boolean),
        source: "ollama",
      });
    }
  }

  // Sort newest first (models with no date go to end)
  models.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  const recentModels = models.filter((m) => m.isNew);
  const providers = [...new Set(models.map((m) => m.provider))].sort();

  return NextResponse.json({
    models,
    total: models.length,
    recentModels,
    providers,
    fetchedAt: new Date().toISOString(),
  });
}
