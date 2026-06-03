import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface CommunityAgent {
  id: string;
  name: string;
  description: string;
  author: string;
  likes: number;
  url: string;
  sdk: string;
  tags: string[];
  createdAt?: string;
}

async function fetchHFSpaces(): Promise<CommunityAgent[]> {
  const [chatbots, assistants, coding] = await Promise.allSettled([
    fetch(
      "https://huggingface.co/api/spaces?sort=likes&direction=-1&limit=30&filter=chatbot",
      { next: { revalidate: 1800 } }
    ).then((r) => (r.ok ? r.json() : [])),
    fetch(
      "https://huggingface.co/api/spaces?sort=likes&direction=-1&limit=30&search=AI+assistant",
      { next: { revalidate: 1800 } }
    ).then((r) => (r.ok ? r.json() : [])),
    fetch(
      "https://huggingface.co/api/spaces?sort=likes&direction=-1&limit=20&search=code+assistant",
      { next: { revalidate: 1800 } }
    ).then((r) => (r.ok ? r.json() : [])),
  ]);

  const seen = new Set<string>();
  const spaces: CommunityAgent[] = [];

  for (const result of [chatbots, assistants, coding]) {
    if (result.status !== "fulfilled") continue;
    for (const s of result.value) {
      if (!s?.id || seen.has(s.id)) continue;
      // Filter: only include publicly running spaces
      if (s.private || s.gated) continue;
      seen.add(s.id);

      const namePart = String(s.id).split("/").pop() ?? s.id;
      spaces.push({
        id: s.id,
        name: namePart
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase()),
        description:
          s.cardData?.short_description ??
          s.cardData?.description ??
          `Interactive AI space by ${s.author ?? "the community"} on HuggingFace`,
        author: s.author ?? "community",
        likes: s.likes ?? 0,
        url: `https://huggingface.co/spaces/${s.id}`,
        sdk: s.sdk ?? "gradio",
        tags: (s.tags ?? []).slice(0, 5),
        createdAt: s.createdAt,
      });
    }
  }

  // Sort by likes
  spaces.sort((a, b) => b.likes - a.likes);
  return spaces.slice(0, 40);
}

export async function GET() {
  const spaces = await fetchHFSpaces().catch(() => []);
  return NextResponse.json({ spaces, total: spaces.length });
}
