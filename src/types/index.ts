// ─── News ─────────────────────────────────────────────────────
export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  category: NewsCategory;
  publishedAt: string;
  imageUrl?: string;
  tags: string[];
  readTime?: number;
  isBreaking?: boolean;
}

export type NewsCategory =
  | "openai"
  | "anthropic"
  | "google"
  | "meta"
  | "microsoft"
  | "xai"
  | "mistral"
  | "deepseek"
  | "open-source"
  | "research"
  | "robotics"
  | "startups"
  | "agents"
  | "prompt-engineering"
  | "all";

// ─── AI Models ───────────────────────────────────────────────
export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  contextWindow: number;
  pricing: {
    prompt: number;
    completion: number;
    unit: "per_token" | "per_1k_tokens" | "per_1M_tokens";
  };
  capabilities: string[];
  benchmarks?: ModelBenchmark[];
  releaseDate?: string;
  license?: string;
  isFree: boolean;
  isOpenSource: boolean;
  openRouterSlug?: string;
  ollamaSlug?: string;
  imageUrl?: string;
  tags: string[];
}

export interface ModelBenchmark {
  name: string;
  score: number;
  maxScore: number;
  rank?: number;
}

// ─── Research ────────────────────────────────────────────────
export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  url: string;
  arxivId?: string;
  publishedAt: string;
  categories: string[];
  citations?: number;
  tldr?: string;
  keyContributions?: string[];
  codeUrl?: string;
  imageUrl?: string;
  source?: string;   // "arXiv" | "Semantic Scholar" | "HuggingFace Daily"
  isHot?: boolean;   // HF daily papers are hand-curated hot picks
}

// ─── Tutorials ───────────────────────────────────────────────
export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: TutorialCategory;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  duration: number;
  url?: string;
  tags: string[];
  author?: string;
  steps?: TutorialStep[];
  prerequisites?: string[];
}

export type TutorialCategory =
  | "prompt-engineering"
  | "agent-development"
  | "rag"
  | "mcp"
  | "langgraph"
  | "crewai"
  | "autogen"
  | "ollama"
  | "openrouter"
  | "fine-tuning"
  | "app-development";

export interface TutorialStep {
  title: string;
  content: string;
  code?: string;
  language?: string;
}

// ─── Agents ──────────────────────────────────────────────────
export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string;
  systemPrompt: string;
  capabilities: string[];
  model: string;
  color: string;
  icon: string;
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  agentId?: string;
}

export interface AgentConversation {
  id: string;
  agentId: string;
  messages: AgentMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Knowledge Graph ─────────────────────────────────────────
export interface GraphNode {
  id: string;
  label: string;
  type: "model" | "company" | "research" | "framework" | "concept" | "tool" | "news";
  description?: string;
  url?: string;
  size?: number;
  color?: string;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  label?: string;
  strength?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ─── Trends ──────────────────────────────────────────────────
export interface TrendItem {
  id: string;
  name: string;
  category: string;
  score: number;
  change: number;
  changePercent: number;
  mentions: number;
  description?: string;
  imageUrl?: string;
}

export interface TrendChart {
  date: string;
  value: number;
}

// ─── Chat / OpenRouter ───────────────────────────────────────
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  top_provider?: {
    max_completion_tokens?: number;
  };
  architecture?: {
    modality?: string;
    tokenizer?: string;
  };
  per_request_limits?: Record<string, string>;
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model?: string;
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

// ─── Search ──────────────────────────────────────────────────
export interface SearchResult {
  id: string;
  type: "news" | "model" | "research" | "tutorial" | "tool";
  title: string;
  description: string;
  url?: string;
  source?: string;
  publishedAt?: string;
  relevanceScore?: number;
}

// ─── Workflow ────────────────────────────────────────────────
export interface Workflow {
  id: string;
  title: string;
  description: string;
  category: string;
  steps: WorkflowStep[];
  difficulty: "simple" | "intermediate" | "complex";
  tools: string[];
  estimatedTime?: string;
  tags: string[];
}

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  type: "ai" | "trigger" | "action" | "condition" | "output";
  config?: Record<string, unknown>;
}

// ─── Battle Arena ────────────────────────────────────────────
export interface BattleResult {
  modelId: string;
  modelName: string;
  response: string;
  tokensUsed?: number;
  latencyMs?: number;
  rating?: number;
}

// ─── RepoHub ─────────────────────────────────────────────────
export interface AIRepository {
  id: string;
  name: string;
  owner: string;
  description: string;
  url: string;
  platform: "github" | "gitlab" | "gitea";
  stars: number;
  forks: number;
  language?: string;
  license?: string;
  tags: string[];
  topics: string[];
  updatedAt: string;
  imageUrl?: string;
  isNew?: boolean;
  featured?: boolean;
  category: "agent" | "framework" | "tool" | "model" | "dataset" | "tutorial" | "automation" | "other";
}
