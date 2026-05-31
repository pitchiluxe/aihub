import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PostType = "prompt" | "project" | "workflow" | "insight" | "question";

export interface CommunityPost {
  id: string;
  type: PostType;
  title: string;
  content: string;
  code?: string;
  codeLanguage?: string;
  tags: string[];
  author: string;
  avatar: string;
  createdAt: string;
  likes: number;
  likedByMe: boolean;
  views: number;
  pinned?: boolean;
}

export interface CommunityComment {
  id: string;
  postId: string;
  content: string;
  author: string;
  avatar: string;
  createdAt: string;
  likes: number;
}

interface CommunityStore {
  posts: CommunityPost[];
  comments: CommunityComment[];
  username: string;
  setUsername: (name: string) => void;
  addPost: (post: Omit<CommunityPost, "id" | "createdAt" | "likes" | "likedByMe" | "views" | "author" | "avatar">) => void;
  deletePost: (id: string) => void;
  toggleLike: (id: string) => void;
  incrementView: (id: string) => void;
  addComment: (comment: Omit<CommunityComment, "id" | "createdAt" | "likes" | "author" | "avatar">) => void;
}

const SEED_POSTS: CommunityPost[] = [
  {
    id: "seed-1",
    type: "prompt",
    title: "Universal AI Agent System Prompt",
    content: "After weeks of testing, I found the best system prompt structure for building reliable AI agents. The key is separating role, capabilities, constraints, and output format clearly.",
    code: `You are [AgentName], an expert [role] at [company/context].

## Your Capabilities
- [capability 1]
- [capability 2]

## Rules
- Only discuss [domain] topics
- Always [key behavior]
- Never [anti-behavior]

## Output Format
Respond in clear, structured markdown.
Use headers, bullets, and code blocks where appropriate.`,
    codeLanguage: "markdown",
    tags: ["prompt", "agents", "system-prompt"],
    author: "promptmaster",
    avatar: "PM",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    likes: 47,
    likedByMe: false,
    views: 312,
    pinned: true,
  },
  {
    id: "seed-2",
    type: "project",
    title: "Built a RAG chatbot with OpenRouter + Ollama fallback in 50 lines",
    content: "Here's my minimal RAG implementation that automatically falls back from OpenRouter to local Ollama if the API is down. Production-ready pattern.",
    code: `import axios from 'axios';

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const OLLAMA_URL = 'http://localhost:11434';

async function chat(messages, model = 'deepseek/deepseek-v3-base:free') {
  try {
    // Try OpenRouter first
    const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model, messages, max_tokens: 1024
    }, { headers: { Authorization: \`Bearer \${OPENROUTER_KEY}\` }, timeout: 10000 });
    return res.data.choices[0].message.content;
  } catch {
    // Fallback to Ollama
    const res = await axios.post(\`\${OLLAMA_URL}/api/chat\`, {
      model: 'llama3.2', messages, stream: false
    });
    return res.data.message.content;
  }
}`,
    codeLanguage: "javascript",
    tags: ["RAG", "OpenRouter", "Ollama", "javascript"],
    author: "devbuilder",
    avatar: "DB",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    likes: 89,
    likedByMe: false,
    views: 541,
  },
  {
    id: "seed-3",
    type: "workflow",
    title: "My AI Content Pipeline — from news to newsletter in 10 min",
    content: "I built an automated workflow that reads AI news RSS feeds every morning, summarizes the top 5 stories with Claude, and drafts a newsletter. Total setup time: 2 hours. Here's the blueprint.",
    code: `# AI Newsletter Automation Workflow

## Step 1: Trigger (7 AM daily)
Cron: 0 7 * * *

## Step 2: Fetch AI News
GET /api/news?limit=20&category=all
→ Filter: publishedAt > 24h ago

## Step 3: AI Ranking (Claude)
Prompt: "Score these articles 1-10 for importance.
Return top 5 as JSON array."

## Step 4: Summarize Each Article
For each article:
  Prompt: "Write a 2-sentence newsletter blurb."

## Step 5: Draft Newsletter
Prompt: "Combine these 5 summaries into a
professional AI newsletter with intro and CTA."

## Step 6: Output
→ Save draft to Notion database
→ Send preview to Slack #ai-newsletter`,
    codeLanguage: "markdown",
    tags: ["workflow", "automation", "newsletter", "Claude"],
    author: "workflowpro",
    avatar: "WP",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    likes: 34,
    likedByMe: false,
    views: 198,
  },
  {
    id: "seed-4",
    type: "insight",
    title: "DeepSeek V3 beats GPT-4o on coding benchmarks — and it's free",
    content: "I've been running DeepSeek V3 through my standard coding benchmark suite for 3 days. Results: it outperforms GPT-4o on 7 out of 10 code generation tasks, generates cleaner Python, and is completely free via OpenRouter. The model for AI coding in 2025 is here and it's not from OpenAI.",
    tags: ["DeepSeek", "GPT-4o", "benchmarks", "coding"],
    author: "mlresearcher",
    avatar: "MR",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    likes: 156,
    likedByMe: false,
    views: 892,
  },
  {
    id: "seed-5",
    type: "question",
    title: "Best free model for long-document summarization in 2025?",
    content: "I need to summarize 50-100 page PDFs regularly. Running costs through OpenAI are getting expensive. What's everyone using for long-context summarization with free models? Tried Gemma but quality isn't great. Any recommendations?",
    tags: ["models", "summarization", "free", "long-context"],
    author: "docprocessor",
    avatar: "DP",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    likes: 23,
    likedByMe: false,
    views: 167,
  },
];

export const useCommunityStore = create<CommunityStore>()(
  persist(
    (set, get) => ({
      posts: SEED_POSTS,
      comments: [],
      username: "You",

      setUsername: (name) => set({ username: name }),

      addPost: (post) => {
        const { username } = get();
        const newPost: CommunityPost = {
          ...post,
          id: `post-${Date.now()}`,
          author: username,
          avatar: username.slice(0, 2).toUpperCase(),
          createdAt: new Date().toISOString(),
          likes: 0,
          likedByMe: false,
          views: 0,
        };
        set((s) => ({ posts: [newPost, ...s.posts] }));
      },

      deletePost: (id) =>
        set((s) => ({ posts: s.posts.filter((p) => p.id !== id) })),

      toggleLike: (id) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === id
              ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) }
              : p
          ),
        })),

      incrementView: (id) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === id ? { ...p, views: p.views + 1 } : p
          ),
        })),

      addComment: (comment) => {
        const { username } = get();
        const newComment: CommunityComment = {
          ...comment,
          id: `comment-${Date.now()}`,
          author: username,
          avatar: username.slice(0, 2).toUpperCase(),
          createdAt: new Date().toISOString(),
          likes: 0,
        };
        set((s) => ({ comments: [...s.comments, newComment] }));
      },
    }),
    {
      name: "aihub-community",
      partialize: (s) => ({
        posts: s.posts,
        comments: s.comments,
        username: s.username,
      }),
    }
  )
);
