import { createHash } from "crypto";
import { NewsArticle, NewsCategory } from "@/types";

const RSS_SOURCES: Array<{ url: string; source: string; category: NewsCategory }> = [
  // ── AI Labs ───────────────────────────────────────────────────────────
  { url: "https://openai.com/news/rss.xml",                      source: "OpenAI",          category: "openai" },
  { url: "https://www.anthropic.com/news/rss",                   source: "Anthropic",       category: "anthropic" },
  { url: "https://blog.google/technology/ai/rss/",               source: "Google AI",       category: "google" },
  { url: "https://ai.meta.com/blog/rss/",                        source: "Meta AI",         category: "meta" },
  { url: "https://huggingface.co/blog/feed.xml",                 source: "Hugging Face",    category: "open-source" },
  { url: "https://mistral.ai/news/rss/",                         source: "Mistral AI",      category: "mistral" },
  // ── Tech News ─────────────────────────────────────────────────────────
  { url: "https://techcrunch.com/category/artificial-intelligence/feed/", source: "TechCrunch AI",   category: "startups" },
  { url: "https://venturebeat.com/category/ai/feed/",            source: "VentureBeat AI",  category: "all" },
  { url: "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml", source: "The Verge AI", category: "all" },
  { url: "https://www.wired.com/feed/category/artificial-intelligence/latest/rss", source: "Wired AI", category: "all" },
  { url: "https://thenextweb.com/neural/feed/",                  source: "TNW Neural",      category: "all" },
  { url: "https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss", source: "IEEE Spectrum AI", category: "research" },
  // ── Research ──────────────────────────────────────────────────────────
  { url: "https://arxiv.org/rss/cs.AI",                          source: "arXiv CS.AI",     category: "research" },
  { url: "https://arxiv.org/rss/cs.LG",                          source: "arXiv CS.LG",     category: "research" },
  { url: "https://arxiv.org/rss/cs.CL",                          source: "arXiv CS.CL",     category: "research" },
  // ── Agents / Open Source ──────────────────────────────────────────────
  { url: "https://www.marktechpost.com/feed/",                   source: "MarkTechPost",    category: "research" },
  { url: "https://towardsdatascience.com/feed",                  source: "Towards Data Science", category: "research" },
  // ── YouTube AI Channels (RSS) ─────────────────────────────────────────
  { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCVHFbw7woebKtYLP-Z-y71Q", source: "Two Minute Papers 🎬", category: "research" },
  { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCWX9aNlVrFCVsHskPcwgrog", source: "AI Explained 🎬",     category: "all" },
  { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCnUYZLuoy1rq1aVMwx4aTzw", source: "Yannic Kilcher 🎬",   category: "research" },
  { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC0RhatS1pyxInC00YKjjBqQ", source: "Fireship AI 🎬",      category: "all" },
  { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCbmNph6atAoGfqLoCL_duAg", source: "Andrej Karpathy 🎬",  category: "research" },
  { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCi4jPCQqbS8_Yx70fRgcl4A", source: "Matt Wolfe AI 🎬",    category: "all" },
  { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCyr9PMFN2bwzVl2ChBqwMSA", source: "AI Jason 🎬",         category: "agents" },
];

export async function fetchNewsFromRSS(): Promise<NewsArticle[]> {
  const Parser = (await import("rss-parser")).default;
  const parser = new Parser({
    timeout: 8000,
    headers: { "User-Agent": "AIHub/1.0 RSS Reader" },
    customFields: {
      item: [["media:group", "mediaGroup"], ["media:thumbnail", "mediaThumbnail"]],
    },
  });

  const articles: NewsArticle[] = [];
  const seen = new Set<string>();

  await Promise.allSettled(
    RSS_SOURCES.map(async ({ url, source, category }) => {
      try {
        const feed = await parser.parseURL(url);
        const isYouTube = url.includes("youtube.com/feeds");

        for (const item of feed.items.slice(0, isYouTube ? 5 : 8)) {
          if (!item.title || !item.link) continue;
          if (seen.has(item.link)) continue;
          seen.add(item.link);

          const rawText = item.contentSnippet ?? item.summary ?? item.content ?? "";
          const text = rawText.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

          const imageUrl = extractImage(item as unknown as Record<string, unknown>, isYouTube);

          articles.push({
            id: createHash("sha1").update(item.link).digest("hex").slice(0, 20),
            title: (item.title ?? "").replace(/<[^>]+>/g, "").trim(),
            summary: text.slice(0, 300) || (isYouTube ? "Watch on YouTube" : "No summary available."),
            url: item.link,
            source,
            category,
            publishedAt: item.pubDate ?? item.isoDate ?? new Date().toISOString(),
            imageUrl,
            tags: extractTags(item.title + " " + text, isYouTube),
            readTime: isYouTube ? undefined : Math.max(1, Math.ceil(text.split(" ").length / 200)),
            isBreaking: false,
          });
        }
      } catch {
        // Skip failed feeds silently
      }
    })
  );

  return articles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

function extractImage(item: Record<string, unknown>, isYouTube: boolean): string | undefined {
  // YouTube thumbnail from media group
  if (isYouTube) {
    const mediaGroup = item.mediaGroup as Record<string, unknown> | undefined;
    if (mediaGroup) {
      const thumbs = mediaGroup["media:thumbnail"] as Array<Record<string, unknown>> | undefined;
      if (thumbs?.[0]?.["$"]) {
        const attrs = thumbs[0]["$"] as Record<string, string>;
        return attrs.url;
      }
    }
    // Fallback: extract video ID from link and build thumbnail URL
    const link = String(item.link ?? "");
    const vid = link.match(/[?&]v=([^&]+)/)?.[1];
    if (vid) return `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
  }

  const enclosure = item.enclosure as { url?: string; type?: string } | undefined;
  if (enclosure?.url && enclosure.type?.startsWith("image")) return enclosure.url;

  const content = String(item.content ?? item["content:encoded"] ?? "");
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1];
}

function extractTags(text: string, isYouTube = false): string[] {
  const keywords = [
    "GPT", "Claude", "Gemini", "Llama", "Mistral", "DeepSeek",
    "RAG", "MCP", "agent", "fine-tuning", "transformer", "multimodal",
    "reasoning", "benchmark", "RLHF", "inference", "embedding",
    "open source", "safety", "alignment", "vision", "audio",
  ];
  const tags = keywords.filter(k => text.toLowerCase().includes(k.toLowerCase())).slice(0, 4);
  if (isYouTube) tags.unshift("📺 Video");
  return tags;
}
