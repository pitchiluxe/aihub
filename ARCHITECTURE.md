# AIHub Architecture - ChatBot & Generator Integration

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          AIHub Application                              │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Root Layout (layout.tsx)                    │   │
│  │                                                                 │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │             All Pages/Routes                           │   │   │
│  │  │  - Dashboard, News, Models, Research, etc.            │   │   │
│  │  │  - Generator (NEW)                                    │   │   │
│  │  │  - + All nested pages                                 │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                 │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │           ChatBot Component (NEW)                      │   │   │
│  │  │  Visible on EVERY page                                │   │   │
│  │  │  - Floating button (bottom-right)                     │   │   │
│  │  │  - AI-focused chat interface                          │   │   │
│  │  │  - Connected to /api/chat                            │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    Navigation Sidebar Update                            │
│                                                                         │
│  Dashboard    🟠 Dashboard                                              │
│  News         🟠 News                                                   │
│  Models       🟠 Models                                                 │
│  Research     🟠 Research                                               │
│  Tutorials    🟠 Tutorials  [NEW]                                       │
│  Agents       🟠 Agents     [AI] ⭐                                      │
│  AIHub Google 🟠 Search                                                 │
│  Brain        🟠 Graph      [HOT] ⭐                                     │
│  Trends       🟠 Trends                                                 │
│  Skills       🟠 Skills                                                 │
│  Workflows    🟠 Workflows                                              │
│  Community    🟠 Community                                              │
│  ✨ Generator 🟠 Generator  [NEW] ⭐ ← NEW FEATURE                      │
│  AIHub LM     🟠 AIHub LM   [AI] ⭐                                      │
│  Playground   🟠 Playground [NEW]                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                     API Endpoints & Data Flow                           │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ ChatBot (Every Page)                                           │   │
│  │                                                                │   │
│  │  User Input → /api/chat → OpenRouter API → Response          │   │
│  │                                                                │   │
│  │  System Prompt: AI expertise                                 │   │
│  │  Model: deepseek/deepseek-chat-v3-0324:free                 │   │
│  │  Max Tokens: 500                                             │   │
│  │  Temperature: 0.7                                            │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ Generator Page (/generator)                                    │   │
│  │                                                                │   │
│  │  Skill/Agent Prompt → /api/generate → LLM Generation         │   │
│  │                             ↓                                  │   │
│  │                      Generated Code                           │   │
│  │                             ↓                                  │   │
│  │     ┌─────────────────────┬──────────────────────┐            │   │
│  │     ↓                     ↓                      ↓             │   │
│  │  Download            Share                  Preview           │   │
│  │  /api/download      /api/archive          (Live)             │   │
│  │     ↓                     ↓                                    │   │
│  │   .md file          Archive ID + URL                         │   │
│  │                      (shareable)                              │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    Component Relationships                              │
│                                                                         │
│         Sidebar.tsx (Navigation)                                        │
│              ↓                                                           │
│    ┌─────────┴──────────┐                                              │
│    ↓                    ↓                                              │
│  Pages            Generator Page                                       │
│    ↓                    ↓                                              │
│  ChatBot.tsx      generator/page.tsx                                   │
│    ↓               (with Tabs, Input, Preview)                         │
│ /api/chat              ↓                                              │
│  Route           ┌──────┼──────┐                                      │
│                  ↓      ↓      ↓                                      │
│              Generate Download Archive                                 │
│              API       API      API                                    │
│              Routes    Routes   Routes                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    User Interaction Flow                                │
│                                                                         │
│ CHATBOT FLOW:                                                          │
│ ────────────────────────────────────────────────────────────            │
│ Any Page → Click ✨ Icon → Enter Question → Get AI Response            │
│ → Follow Up Questions Possible → Close When Done                       │
│                                                                         │
│ GENERATOR FLOW:                                                        │
│ ────────────────────────────────────────────────────────────            │
│ Sidebar → Click Generator                                              │
│ ↓                                                                       │
│ Choose: Skill Tab OR Agent Tab                                         │
│ ↓                                                                       │
│ Enter Prompt (e.g., "Sentiment analyzer for AI news")                 │
│ ↓                                                                       │
│ Click "Generate"                                                       │
│ ↓ (3-10 seconds)                                                       │
│ View Preview (Code + Metadata)                                         │
│ ↓                                                                       │
│ ┌──────────────┬──────────────┐                                        │
│ ↓              ↓              ↓                                        │
│ Download      Share         Copy                                       │
│ (→ .md)      (→ Share URL)  (→ Clipboard)                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    File Structure (NEW FILES)                           │
│                                                                         │
│ src/                                                                    │
│ ├── components/                                                        │
│ │   ├── ChatBot.tsx ..................... NEW Floating Chat Widget     │
│ │   ├── layout/                                                       │
│ │   │   └── Sidebar.tsx ................ UPDATED (Generator link)     │
│ │   └── ui/                                                           │
│ │       └── textarea.tsx ............... NEW Textarea Component       │
│ │                                                                      │
│ ├── app/                                                               │
│ │   ├── layout.tsx ..................... UPDATED (ChatBot import)     │
│ │   ├── api/                                                          │
│ │   │   ├── generate/route.ts ......... NEW Gen Endpoint             │
│ │   │   ├── download/route.ts ......... NEW Download Endpoint        │
│ │   │   └── archive/route.ts .......... NEW Archive Endpoint         │
│ │   │                                                                  │
│ │   └── (app)/                                                        │
│ │       └── generator/ ................. NEW Generator Feature        │
│ │           ├── page.tsx ............... Generator UI                │
│ │           └── layout.tsx ............. Wrapper Layout               │
│ │                                                                      │
│ └── (other existing files unchanged)                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    Responsive Design (Generator)                        │
│                                                                         │
│ Mobile (< 640px):                                                      │
│ ┌─────────────────┐                                                    │
│ │                 │                                                    │
│ │ Input Panel     │ (Full width)                                       │
│ │                 │                                                    │
│ ├─────────────────┤                                                    │
│ │                 │                                                    │
│ │ Preview Panel   │ (Stacked below)                                    │
│ │                 │                                                    │
│ └─────────────────┘                                                    │
│                                                                         │
│ Tablet (640px - 1024px):                                               │
│ ┌──────────────┬─────────────┐                                         │
│ │              │             │                                        │
│ │ Input        │  Preview    │ (2 columns)                            │
│ │              │             │                                        │
│ └──────────────┴─────────────┘                                         │
│                                                                         │
│ Desktop (> 1024px):                                                    │
│ ┌───────────┬─────────────────────┐                                    │
│ │           │                     │                                   │
│ │ Input     │  Preview & Actions  │ (3 columns in grid)               │
│ │           │                     │                                   │
│ └───────────┴─────────────────────┘                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    Data Flow: Skill Generation                          │
│                                                                         │
│ User Input:                                                            │
│ "Create a skill that analyzes sentiment in AI news articles"           │
│                                                                         │
│ ↓                                                                       │
│                                                                         │
│ /api/generate POST {                                                   │
│   type: "skill",                                                       │
│   prompt: "..."                                                        │
│ }                                                                       │
│                                                                         │
│ ↓                                                                       │
│                                                                         │
│ OpenRouter API → GPT-4 Turbo                                           │
│                                                                         │
│ System Prompt:                                                         │
│ "Generate SKILL.md with use cases, examples, best practices..."        │
│                                                                         │
│ ↓ (3-10 seconds)                                                       │
│                                                                         │
│ Response: {                                                            │
│   name: "AI Sentiment Analyzer",                                       │
│   description: "Analyzes sentiment in AI news articles...",           │
│   code: "# AI Sentiment Analyzer\n\n## Overview\n...",               │
│   type: "skill"                                                        │
│ }                                                                       │
│                                                                         │
│ ↓                                                                       │
│                                                                         │
│ UI Updates:                                                            │
│ - Preview shows generated SKILL.md                                     │
│ - Added to Recent Items                                                │
│ - Download button enabled                                              │
│ - Share button enabled                                                 │
│                                                                         │
│ ↓                                                                       │
│                                                                         │
│ User Action - Download:                                                │
│ /api/download POST { item: {...} }                                    │
│ ↓                                                                       │
│ Response: File stream (.md)                                            │
│ ↓                                                                       │
│ Browser downloads: skill-ai-sentiment-analyzer.md                      │
│                                                                         │
│ User Action - Share:                                                   │
│ /api/archive POST { item: {...} }                                     │
│ ↓                                                                       │
│ Response: {                                                            │
│   id: "1717224000-abc123xyz",                                          │
│   shareUrl: "/gallery/1717224000-abc123xyz"                            │
│ }                                                                       │
│ ↓                                                                       │
│ Link copied: https://aihub.vercel.app/gallery/1717224000-abc123xyz    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Integration Points

### 1. **Global ChatBot Availability**
- Imported in root `layout.tsx`
- Renders after content, before Toaster
- Uses existing `/api/chat` infrastructure
- No authentication required
- Available on every single page

### 2. **Generator Tab Navigation**
- Added to Sidebar navigation
- Highlighted with "NEW" badge
- Positioned between Community and AIHub LM
- Icon: Sparkles (Lucide)
- Full URL: `/generator`

### 3. **API Integration**
- Uses OpenRouter with free model fallback
- Supports Ollama for local models
- Error handling & retry logic
- Timeout: 60 seconds for generation
- Max tokens: 2000 for generation responses

### 4. **Data Persistence** (Current)
- In-memory archive (resets on server restart)
- Ready to upgrade to Supabase
- Basic sharing via unique ID
- No user authentication yet

## Performance Optimizations

```
ChatBot:
- Non-blocking component (async)
- Minimal initial load (<50ms)
- Message history pruning available
- Lazy animation rendering

Generator:
- Code splitting by route
- Lazy preview rendering
- Optimistic UI updates
- Error boundaries

API Routes:
- Timeout handling (60s max)
- Response streaming support
- Built-in retry logic
- Error logging
```

## Scalability Path

```
Current (MVP):
├── In-memory archive
├── Free OpenRouter models
└── Single-server deployment

Next (v2):
├── Supabase integration
├── Rate limiting
├── User profiles (optional)
└── Multi-region deployment

Future (v3):
├── Distributed caching
├── Custom model training
├── Enterprise features
└── Monetization
```

