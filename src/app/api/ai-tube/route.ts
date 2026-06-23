import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// ── AI-specific search queries grouped into sets ──────────────────────────────
// Grouped so each "load more" call uses a DIFFERENT set, ensuring fresh results.
// Every query explicitly contains AI keywords to minimize off-topic results.
const AI_QUERY_GROUPS: string[][] = [
  // Group 0 — initial load: top creators
  [
    'Matt Wolfe AI news tools 2025',
    'Andrej Karpathy neural network LLM tutorial',
    'AI Jason LangChain agents workflow tutorial',
  ],
  // Group 1 — load more batch 1
  [
    'Two Minute Papers AI research explained 2025',
    'Yannic Kilcher machine learning paper review',
    'Cole Medin AI agent build n8n automation',
    'Sam Witteveen LLM OpenAI tutorial 2025',
    'Nate Herk AI automation agents workflow',
  ],
  // Group 2 — load more batch 2
  [
    'Matthew Berman AI model review GPT Claude Gemini',
    'Fireship AI coding tutorial cursor copilot',
    'AI Explained large language model GPT-4',
    'Skill Leap AI ChatGPT productivity tutorial',
    'David Shapiro AI future automation agents',
  ],
  // Group 3 — load more batch 3
  [
    'LangGraph CrewAI multi agent AI build tutorial',
    'prompt engineering advanced ChatGPT Claude tutorial',
    'Ollama local LLM run open source AI tutorial',
    'OpenAI Claude Anthropic Gemini model release 2025',
    'n8n make zapier AI workflow automation tutorial',
  ],
  // Group 4 — load more batch 4
  [
    'RAG retrieval augmented generation tutorial 2025',
    'AI coding assistant Cursor GitHub Copilot review',
    'Hugging Face transformer fine tuning LLM tutorial',
    'AI agent framework AutoGen LangGraph build 2025',
    'DeepSeek Mistral Llama open source model review',
  ],
  // Group 5 — load more batch 5
  [
    'stable diffusion midjourney AI image generation 2025',
    'vector database embeddings AI RAG Pinecone tutorial',
    'Claude Anthropic AI tutorial prompt engineering',
    'Gemini Google AI model API coding tutorial',
    'AI startup product build launch 2025 tutorial',
  ],
];

// ── Hard AI relevance filter ──────────────────────────────────────────────────
// Every returned video MUST contain at least one of these keywords.
// Prevents off-topic results from slipping through YouTube's search ranking.
const AI_KEYWORDS = [
  'ai', 'artificial intelligence', 'machine learning', 'deep learning',
  'llm', 'large language model', 'gpt', 'chatgpt', 'claude', 'gemini',
  'llama', 'mistral', 'deepseek', 'openai', 'anthropic', 'google ai',
  'neural', 'transformer', 'diffusion', 'stable diffusion', 'midjourney',
  'agents', 'ai agent', 'langchain', 'langgraph', 'crewai', 'autogen',
  'ollama', 'hugging face', 'cursor ai', 'copilot', 'rag', 'embedding',
  'fine-tun', 'prompt engineering', 'n8n ai', 'automation ai',
  'model review', 'ai tutorial', 'ai coding', 'ai workflow',
];

function isAIRelevant(title: string, desc: string): boolean {
  const text = (title + ' ' + desc).toLowerCase();
  return AI_KEYWORDS.some((kw) => text.includes(kw));
}

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
  // page tracks which query group to use — client passes this so each click is fresh
  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10));

  // Initial load: group 0 (3 queries, last 2 weeks)
  // Load more: rotate through groups 1-5 (5 queries each, up to 12 weeks back)
  const groupIndex = append ? ((page % (AI_QUERY_GROUPS.length - 1)) + 1) : 0;
  const selectedQueries = AI_QUERY_GROUPS[groupIndex] ?? AI_QUERY_GROUPS[1];
  const weeksBack = append ? Math.min(2 + page * 2, 12) : 2; // grow window each page
  const targetCount = append ? 18 : 21;
  const maxPerQuery = 8;

  const publishedAfter = getPublishedAfter(weeksBack);

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

    // Merge, deduplicate by video id, then hard-filter for AI relevance
    const seen = new Set<string>();
    const videos = results
      .flatMap((r) => r.items)
      .map(mapItem)
      .filter((v) => {
        if (!v.id || seen.has(v.id)) return false;
        // Hard AI relevance gate — reject any video not mentioning AI topics
        if (!isAIRelevant(v.title, v.description)) return false;
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
