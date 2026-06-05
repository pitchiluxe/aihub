import { NextRequest, NextResponse } from "next/server";
import { fetchOpenRouterModels } from "@/lib/openrouter";
import { fetchOllamaModels } from "@/lib/ollama";
import { AIModel } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

// ── HuggingFace Hub ───────────────────────────────────────────
interface HFModel {
  id: string;
  author?: string;
  createdAt?: string;
  lastModified?: string;
  downloads?: number;
  likes?: number;
  pipeline_tag?: string;
  tags?: string[];
  private?: boolean;
  gated?: boolean | string;
  config?: { model_type?: string; max_position_embeddings?: number };
  safetensors?: { total?: number };
}

const HF_BASE = "https://huggingface.co/api/models";
const HF_OPTS = { next: { revalidate: 3600 } };

async function hfFetch(url: string): Promise<HFModel[]> {
  try {
    const r = await fetch(url, HF_OPTS);
    return r.ok ? r.json() : [];
  } catch { return []; }
}

async function fetchHuggingFaceModels(): Promise<HFModel[]> {
  const [trending, newest, popular] = await Promise.all([
    hfFetch(`${HF_BASE}?sort=trending&direction=-1&limit=60&filter=text-generation&full=true`),
    hfFetch(`${HF_BASE}?sort=createdAt&direction=-1&limit=60&filter=text-generation&full=true`),
    hfFetch(`${HF_BASE}?sort=downloads&direction=-1&limit=60&filter=text-generation&full=true`),
  ]);

  const seen = new Set<string>();
  const combined: HFModel[] = [];
  // trending first so they surface at the top
  for (const m of [...trending, ...newest, ...popular]) {
    if (!m?.id || seen.has(m.id) || m.private || m.gated) continue;
    seen.add(m.id);
    combined.push(m);
  }
  return combined;
}

// Estimate context window from HF tags / config
function hfContextWindow(m: HFModel): number {
  const max = m.config?.max_position_embeddings;
  if (max && max > 512) return max;
  const tags = (m.tags ?? []).join(" ").toLowerCase();
  if (tags.includes("1m") || tags.includes("1000k")) return 1_000_000;
  if (tags.includes("256k")) return 262_144;
  if (tags.includes("128k")) return 131_072;
  if (tags.includes("64k"))  return  65_536;
  if (tags.includes("32k"))  return  32_768;
  if (tags.includes("16k"))  return  16_384;
  if (tags.includes("8k"))   return   8_192;
  return 4_096;
}

// Build a real description from HF tags
function hfDescription(m: HFModel): string {
  const tags = m.tags ?? [];
  const parts: string[] = [];
  if (m.author) parts.push(`By ${m.author}.`);

  const task = m.pipeline_tag?.replace(/-/g, " ") ?? "text generation";
  parts.push(`Open-source ${task} model.`);

  const notable = tags.filter(t =>
    ["instruct","chat","rlhf","dpo","reasoning","vision","multimodal",
     "code","math","multilingual","gguf","quantized"].includes(t.toLowerCase())
  ).slice(0, 4);
  if (notable.length) parts.push(`Capabilities: ${notable.join(", ")}.`);

  if (m.downloads && m.downloads > 10_000)
    parts.push(`${(m.downloads / 1_000).toFixed(0)}K downloads on HuggingFace.`);

  return parts.join(" ");
}

// Extra capabilities from HF tags
function hfCapabilities(m: HFModel): string[] {
  const base = ["text-generation"];
  const tags = (m.tags ?? []).map(t => t.toLowerCase());
  if (tags.some(t => /vision|multimodal|vl/.test(t))) base.push("vision");
  if (tags.some(t => /code|coding|coder/.test(t))) base.push("code");
  if (tags.some(t => /instruct|chat|rlhf|dpo/.test(t))) base.push("instruction-following");
  if (tags.some(t => /reason|math|logic/.test(t))) base.push("reasoning");
  if (tags.some(t => /multilingual/.test(t))) base.push("multilingual");
  return base;
}

function hfTags(m: HFModel): string[] {
  const base = ["free", "open-source", "huggingface"];
  const tags = (m.tags ?? []).map(t => t.toLowerCase());
  if (tags.some(t => /vision|multimodal/.test(t))) base.push("multimodal");
  if (tags.some(t => /code/.test(t))) base.push("coding");
  if (tags.some(t => /reason|math/.test(t))) base.push("reasoning");
  if (tags.some(t => /instruct|chat/.test(t))) base.push("chat");
  return base;
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
        name: m.id.split("/").pop()?.replace(/-/g, " ") ?? m.id,
        provider: m.author ?? m.id.split("/")[0] ?? "huggingface",
        description: hfDescription(m),
        contextWindow: hfContextWindow(m),
        pricing: { prompt: 0, completion: 0, unit: "per_token" },
        capabilities: hfCapabilities(m),
        releaseDate,
        createdAt: createdAt ? Math.floor(createdAt / 1000) : undefined,
        isFree: true,
        isNew,
        isOpenSource: true,
        hfId: m.id,
        hfDownloads: m.downloads,
        hfLikes: m.likes,
        tags: hfTags(m),
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
