import { NextRequest, NextResponse } from "next/server";
import { fetchOpenRouterModels, getFreeModels } from "@/lib/openrouter";
import { fetchOllamaModels } from "@/lib/ollama";
import { AIModel } from "@/types";

export const revalidate = 0; // Always fetch fresh models - important for staying up-to-date

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source") ?? "all";
  const freeOnly = searchParams.get("free") === "true";

  try {
    const [openRouterModels, ollamaModels] = await Promise.allSettled([
      freeOnly ? getFreeModels() : fetchOpenRouterModels(),
      source !== "openrouter" ? fetchOllamaModels() : Promise.resolve([]),
    ]);

    const models: AIModel[] = [];

    if (openRouterModels.status === "fulfilled" && source !== "ollama") {
      for (const m of openRouterModels.value) {
        const promptPrice = parseFloat(m.pricing?.prompt ?? "0");
        models.push({
          id: m.id,
          name: m.name ?? m.id.split("/").pop() ?? m.id,
          provider: m.id.split("/")[0] ?? "unknown",
          description: m.description ?? "No description available.",
          contextWindow: m.context_length ?? 4096,
          pricing: {
            prompt: promptPrice,
            completion: parseFloat(m.pricing?.completion ?? "0"),
            unit: "per_token",
          },
          capabilities: buildCapabilities(m),
          releaseDate: undefined,
          license: undefined,
          isFree: promptPrice === 0 || m.id.includes(":free"),
          isOpenSource: isOpenSourceModel(m.id),
          openRouterSlug: m.id,
          imageUrl: undefined,
          tags: buildTags(m),
        });
      }
    }

    if (ollamaModels.status === "fulfilled" && source !== "openrouter") {
      for (const m of ollamaModels.value) {
        const name = m.name.split(":")[0];
        models.push({
          id: `ollama/${m.name}`,
          name: m.name,
          provider: "ollama",
          description: `Local model running via Ollama. Family: ${m.details.family ?? "unknown"}`,
          contextWindow: 4096,
          pricing: { prompt: 0, completion: 0, unit: "per_token" },
          capabilities: ["text-generation"],
          isFree: true,
          isOpenSource: true,
          ollamaSlug: m.name,
          tags: ["local", "free", m.details.family ?? ""].filter(Boolean),
        });
      }
    }

    return NextResponse.json({
      models,
      total: models.length,
      providers: [...new Set(models.map((m) => m.provider))],
    });
  } catch (err) {
    console.error("Models API error:", err);
    return NextResponse.json({ models: [], total: 0, error: "Failed to fetch models" }, { status: 500 });
  }
}

function buildCapabilities(m: { id: string; architecture?: { modality?: string } }): string[] {
  const caps: string[] = ["text-generation"];
  const modality = m.architecture?.modality ?? "";
  if (modality.includes("image") || m.id.includes("vision") || m.id.includes("vl"))
    caps.push("vision");
  if (modality.includes("audio")) caps.push("audio");
  if (m.id.includes("code") || m.id.includes("coder")) caps.push("code");
  if (m.id.includes("instruct") || m.id.includes("chat")) caps.push("instruction-following");
  return caps;
}

function buildTags(m: { id: string; pricing?: { prompt?: string } }): string[] {
  const tags: string[] = [];
  const price = parseFloat(m.pricing?.prompt ?? "0");
  if (price === 0 || m.id.includes(":free")) tags.push("free");
  if (isOpenSourceModel(m.id)) tags.push("open-source");
  if (m.id.includes("vision") || m.id.includes("vl")) tags.push("multimodal");
  if (m.id.includes("code") || m.id.includes("coder")) tags.push("coding");
  return tags;
}

function isOpenSourceModel(id: string): boolean {
  const openSourceProviders = ["meta-llama", "mistralai", "deepseek", "qwen", "google/gemma", "microsoft/phi", "01-ai", "huggingface"];
  return openSourceProviders.some((p) => id.toLowerCase().includes(p.split("/")[0]));
}
