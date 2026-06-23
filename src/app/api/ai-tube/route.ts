import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// ── AI YouTuber channel-specific queries ─────────────────────────────────────
// Each entry targets a specific creator or topic cluster for diversity
const AI_QUERIES = [
  'Nate Herk AI agents automation',
  'Matt Wolfe AI news tools weekly',
  'Two Minute Papers AI research explained',
  'AI Jason agents workflows tutorial',
  'Andrej Karpathy neural network deep learning',
  'Sam Witteveen LLM tutorial langchain',
  'David Shapiro AI automation future',
  'Yannic Kilcher machine learning paper explained',
  'Skill Leap AI tutorial productivity',
  'AI Explained GPT Claude Gemini',
  'Cole Medin AI agent build tutorial',
  'The AI Advantage ChatGPT tutorial',
  'Matthew Berman AI news latest',
  'Riley Brown AI coding assistant',
  'Fireship AI coding programming 2024',
  'OpenAI Claude Anthropic Gemini latest model',
  'LangGraph CrewAI multi agent AI tutorial',
  'prompt engineering ChatGPT tutorial 2024',
  'local AI Ollama LLM run tutorial',
  'AI automation n8n make zapier workflow',
];

type AIVideoCategory =
  | 'Tutorials'
  | 'Model Reviews'
  | 'Agents & Automation'
  | 'News & Updates'
  | 'Research'
  | 'Coding'
  | 'Tools'
  | 'Prompting';

function categorize(title: string, desc: string): AIVideoCategory {
  const text = (title + ' ' + desc).toLowerCase();
  if (/agent|multi.agent|crewai|langgraph|autogen|automation|workflow|n8n|make\.com|zapier/.test(text)) return 'Agents & Automation';
  if (/paper|research|arxiv|survey|benchmark|study|analysis|explained|understanding/.test(text)) return 'Research';
  if (/code|coding|programming|developer|build|python|javascript|typescript|cursor|github/.test(text)) return 'Coding';
  if (/prompt|prompting|system prompt|jailbreak|chain.of.thought/.test(text)) return 'Prompting';
  if (/news|weekly|update|announce|launch|release|gpt.5|claude|gemini|llama|mistral|openai|anthropic/.test(text)) return 'News & Updates';
  if (/review|compare|versus|vs\.|benchmark|test|which|best model|top model/.test(text)) return 'Model Reviews';
  if (/tool|app|platform|software|plugin|extension|product|ollama|local llm/.test(text)) return 'Tools';
  return 'Tutorials';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapItem(item: any) {
  const vid = item.id?.videoId ?? item.id;
  return {
    id: vid,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    description: (item.snippet.description ?? '').slice(0, 220) || 'No description available.',
    thumbnail:
      item.snippet.thumbnails?.high?.url ??
      item.snippet.thumbnails?.medium?.url ??
      `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
    category: categorize(item.snippet.title, item.snippet.description ?? ''),
    publishedAt: item.snippet.publishedAt ?? '',
  };
}

function getPublishedAfter(weeksBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - weeksBack * 7);
  return d.toISOString();
}

export async function GET(req: NextRequest) {
  const { allowed } = rateLimit(getClientIp(req), 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'YOUTUBE_API_KEY is not configured.',
        setup: true,
        hint: 'Add YOUTUBE_API_KEY to your .env.local and Vercel project environment variables.',
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const append = searchParams.get('append') === 'true';
  // For "load more" we pick different random queries and return 10-15 videos
  const targetCount = append ? 15 : 21;
  const maxPerQuery = append ? 8 : 8;
  const queryCount = append ? 2 : 3;

  // Pick random non-overlapping queries
  const shuffled = [...AI_QUERIES].sort(() => Math.random() - 0.5);
  const selectedQueries = shuffled.slice(0, queryCount);

  const publishedAfter = getPublishedAfter(2); // last 2 weeks

  const fetchQuery = async (query: string) => {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: String(maxPerQuery),
      key: apiKey,
      videoEmbeddable: 'true',
      relevanceLanguage: 'en',
      publishedAfter,
      safeSearch: 'moderate',
    });

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`,
      { cache: 'no-store' },
    );
    const data = await res.json();

    if (!res.ok) {
      const errMsg = data.error?.message ?? `YouTube API error (${res.status})`;
      const isKeyError = res.status === 400 || res.status === 403;
      return { error: errMsg, setup: isKeyError, items: [] };
    }

    return { items: data.items ?? [], error: null, setup: false };
  };

  try {
    const results = await Promise.all(selectedQueries.map(fetchQuery));

    // Propagate key errors
    for (const r of results) {
      if (r.setup) {
        return NextResponse.json({ error: r.error, setup: true }, { status: 403 });
      }
    }

    // Merge, deduplicate by video id
    const seen = new Set<string>();
    const videos = results
      .flatMap((r) => r.items)
      .map(mapItem)
      .filter((v) => {
        if (!v.id || seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
      })
      .slice(0, targetCount + 10); // return a bit extra so front-end can show exactly what's needed

    return NextResponse.json({
      videos,
      queries: selectedQueries,
      publishedAfter,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to reach YouTube API' },
      { status: 500 },
    );
  }
}
