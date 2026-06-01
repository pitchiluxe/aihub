# Models Tab Enhancement - Installation & Usage Guide

## 🎯 Overview

The **Models Hub** now provides a comprehensive, interactive experience for discovering and installing **all free AI models**. When users click on any model, they get detailed:

✅ **Installation Instructions** — Step-by-step setup guides  
✅ **Usage Examples** — Copy-paste ready commands  
✅ **Local Setup** — Run models locally with Ollama  
✅ **API Setup** — Use models via OpenRouter API  
✅ **Performance Specs** — Context windows, pricing, capabilities

---

## 📊 What's Available

### Free Models Include:

**Open Source Models** (Run locally with Ollama):
- Meta Llama 2, 3.1 (70B, 13B, 7B)
- Mistral 7B
- DeepSeek (33B, 7B)
- Qwen (72B, 32B, 14B)
- Google Gemma
- Microsoft Phi

**Cloud Models** (Use via OpenRouter):
- OpenAI (selected free tiers)
- Anthropic Claude (limited free)
- Meta Llama variations
- Mistral AI
- DeepSeek
- Many more

**Total**: 50+ free models to choose from

---

## 🚀 How It Works

### User Journey:

1. **Navigate** to `/models` tab
2. **Browse** models by provider/capabilities
3. **Click** on any model card
4. **View** installation instructions
5. **Copy** commands to your terminal
6. **Run** the model locally or via API

---

## 🔌 Installation Types

### Option 1: Local Installation (Ollama)

**Perfect for:** Privacy-conscious developers, offline work, no costs

```bash
# 1. Install Ollama
# Download from https://ollama.ai

# 2. Pull the model
ollama pull llama2

# 3. Run locally
ollama run llama2

# 4. API endpoint available at
curl http://localhost:11434/api/generate
```

**Advantages:**
- ✅ 100% free
- ✅ Full privacy (no data sent anywhere)
- ✅ Works offline
- ✅ No API keys needed

**Requirements:**
- 8GB+ VRAM (for 7B models)
- 16GB+ VRAM (for 13B models)
- 48GB+ VRAM (for 70B models)

---

### Option 2: Cloud API (OpenRouter)

**Perfect for:** Quick testing, powerful models, scaling

```bash
# 1. Get API key
# Sign up at https://openrouter.ai
# Copy your API key

# 2. Set environment variable
export OPENROUTER_API_KEY="sk-your-key-here"

# 3. Make API request
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -d '{"model": "meta-llama/llama-2-70b", ...}'
```

**Advantages:**
- ✅ Instant access to powerful models
- ✅ No local setup required
- ✅ Scales automatically
- ✅ Works from anywhere

**Pricing:**
- Usually free tier available
- Pay-as-you-go pricing
- Typically $0.0001 - $0.001 per 1K tokens

---

## 📝 Model Detail Modal

When you click on a model, you see:

### 1. **Specifications**
- Context window size
- Provider name
- Capabilities (vision, code, etc.)
- Free/Open source badges

### 2. **About**
- Model description
- Use cases
- Performance notes

### 3. **Installation Steps**
- Step-by-step instructions
- Copy-button for each command
- Links to documentation

### 4. **Copy All Commands**
- Export all installation commands
- Ready to paste in terminal

### 5. **Resources**
- Links to official docs
- GitHub repositories
- API documentation

---

## 💻 Code Examples

### Using Ollama in Python

```python
import requests
import json

def chat_with_ollama(prompt, model="llama2"):
    url = "http://localhost:11434/api/generate"
    
    response = requests.post(url, json={
        "model": model,
        "prompt": prompt,
        "stream": False
    })
    
    return response.json()["response"]

# Usage
answer = chat_with_ollama("What is Python?")
print(answer)
```

### Using OpenRouter in JavaScript

```javascript
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "meta-llama/llama-2-70b-chat",
    messages: [
      { role: "user", content: "Hello!" }
    ]
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

---

## 🎨 UI Features

### Grid View
- Model cards with key specs
- Provider color coding
- Context window display
- Quick badges (Free/Open/Vision)
- Click to open details

### Table View
- Sortable columns (Name, Provider, Context)
- Full model IDs
- Capabilities list
- Status indicators

### Filters
- **Free Only** toggle
- **Provider** filter buttons
- **Search** by name/ID
- **Sort** by context/name/provider

---

## 🔧 Technical Details

### API Endpoints

**Get all models:**
```
GET /api/models
```

**Get free only:**
```
GET /api/models?free=true
```

**Filter by source:**
```
GET /api/models?source=ollama
GET /api/models?source=openrouter
```

### Model Properties

```typescript
interface AIModel {
  id: string;                          // Unique ID
  name: string;                        // Display name
  provider: string;                    // Provider (ollama, openai, etc)
  description: string;                 // What the model does
  contextWindow: number;               // Context length
  pricing: { prompt: number; completion: number };
  capabilities: string[];              // vision, code, etc
  isFree: boolean;                     // No cost to run
  isOpenSource: boolean;               // Source available
  ollamaSlug?: string;                 // For Ollama models
  openRouterSlug?: string;             // For OpenRouter models
}
```

---

## 🎓 Getting Started

### Quick Start: Run Llama 2 Locally

```bash
# 1. Install Ollama from https://ollama.ai

# 2. Pull Llama 2
ollama pull llama2

# 3. Run it
ollama run llama2

# 4. Start chatting!
```

### Quick Start: Use OpenRouter

```bash
# 1. Sign up at https://openrouter.ai
# 2. Get your API key
# 3. Export it
export OPENROUTER_API_KEY="sk-..."

# 4. Make a request
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "meta-llama/llama-2-70b-chat", "messages": [{"role":"user","content":"Hello"}]}'
```

---

## 📈 Model Comparison

| Model | Type | Context | Ideal For | Cost |
|-------|------|---------|-----------|------|
| Llama 2 70B | Local | 4K | Complex tasks | Free |
| Llama 2 7B | Local | 4K | Fast responses | Free |
| Mistral 7B | Local | 32K | Code generation | Free |
| Phi 3 | Local | 4K | Edge devices | Free |
| Qwen 72B | Local | 32K | Multilingual | Free |
| Claude 3 | API | 200K | Premium quality | Pay-as-you-go |
| GPT-4 | API | 128K | State-of-art | Pay-as-you-go |

---

## 🚀 Advanced Usage

### Environment Variables

```bash
# Ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_NUM_GPU=1  # GPU layers
OLLAMA_MODELS=/path/to/models

# OpenRouter
OPENROUTER_API_KEY=sk-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

### Docker Setup

```bash
# Run Ollama in Docker
docker run -d -v ollama:/root/.ollama -p 11434:11434 ollama/ollama

# Pull and run a model
docker exec <container> ollama pull llama2
docker exec <container> ollama run llama2
```

### GPU Acceleration

**NVIDIA:**
```bash
ollama run llama2  # Automatically uses GPU if available
```

**AMD:**
```bash
HIP_VISIBLE_DEVICES=0 ollama run llama2
```

---

## 🐛 Troubleshooting

### Ollama Model Won't Download
```bash
# Check internet connection
# Check disk space (models can be 5-40GB)
# Increase timeout if on slow connection
ollama pull llama2 --timeout 3600
```

### Out of Memory Errors
```bash
# Use smaller model
ollama pull llama2:7b  # Instead of 70b

# Reduce GPU layers
OLLAMA_NUM_GPU=0 ollama run llama2  # CPU only
```

### API Connection Issues
```bash
# Verify Ollama is running
curl http://localhost:11434/api/tags

# Check OpenRouter API key
echo $OPENROUTER_API_KEY
```

---

## 📚 Resources

- **Ollama:** https://ollama.ai
- **OpenRouter:** https://openrouter.ai
- **Model Hub:** https://huggingface.co/models
- **Documentation:** Check links in modal

---

## 🎉 Result

Users can now:
- ✅ See 50+ free models in one place
- ✅ Get instant installation instructions
- ✅ Choose between local or cloud setup
- ✅ Copy-paste ready commands
- ✅ Start using models in seconds
- ✅ Compare model specs and costs

**The Models tab is now a complete AI model discovery and installation portal!**

---

**Status**: ✅ MVP Complete | Ready for production
