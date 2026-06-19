# Renad Eid Product Design Roadmaps

Complete bilingual (Arabic/English) roadmaps for product designers covering:
- **Roadmap**: Workflow from brief to handoff, UI/UX principles, e-commerce vs SaaS models
- **AI Guide**: AI tools, practical workflows, product architectures, mastery paths
- **UI/UX**: Foundations, design thinking, research, systems, accessibility, career roadmap

## 🤖 Roadmap Copilot (AI Chatbot)

An intelligent AI mentor integrated directly into the site. Features:

### Modes
- **اسأل (Ask)**: Search roadmap content with section-aware suggestions
- **مصادر (Sources)**: Curated external resources (NNGroup, Material Design, Apple HIG, etc.)
- **كوتش (Coach)**: Personalized mentorship and career advice
- **مشروع (Project)**: Step-by-step project guidance
- **كويز (Quiz)**: Interactive case studies and knowledge testing

### Architecture
- **Frontend**: Floating chat drawer with local retrieval fallback
- **Backend**: Vercel serverless function with RAG over knowledge base
- **Data**: JSON-based knowledge graph extracted from page content
- **LLM**: OpenRouter (Claude 3.5 Sonnet) or OpenAI (GPT-4o-mini) fallback

---

## 🚀 Quick Start

### Local Development (Static Preview)

```bash
# Option 1: Python HTTP server
python -m http.server 8000

# Option 2: Node.js http-server
npx http-server -p 8000

# Option 3: PHP built-in server
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

**Note**: Local preview uses **client-side retrieval only** (no AI backend). The chatbot will work but answers are generated from local JSON matching, not LLM reasoning.

---

## 📦 Deployment

### GitHub Pages (Static Hosting)

1. Push to GitHub
2. Go to **Settings** → **Pages**
3. Select branch: `main`, folder: `/ (root)`
4. Save and wait for deployment

**Mode**: Static-only (local retrieval fallback, no AI backend)

**URL**: `https://<username>.github.io/<repo-name>/`

---

### Vercel (Recommended - Full AI Backend)

#### Prerequisites
- Vercel account: [vercel.com](https://vercel.com)
- API key from [OpenRouter](https://openrouter.ai) or [OpenAI](https://platform.openai.com)

#### Deploy Steps

1. **Install Vercel CLI** (optional but recommended):
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

   Or use the Vercel dashboard:
   - Import Git repository
   - Auto-detects settings
   - Click Deploy

3. **Configure Environment Variables**:

   Go to **Project Settings** → **Environment Variables** and add:

   | Variable | Value | Required |
   |----------|-------|----------|
   | `OPENROUTER_API_KEY` | Your OpenRouter API key | Primary |
   | `OPENAI_API_KEY` | Your OpenAI API key | Fallback (optional) |

   **Priority**: OpenRouter is tried first. If unavailable, falls back to OpenAI. If neither is set, backend returns retrieval-only responses.

4. **Redeploy** to apply environment variables:
   ```bash
   vercel --prod
   ```

#### API Key Setup

**OpenRouter** (Recommended):
1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Add credits ($5+ recommended)
3. Generate API key
4. Model: `anthropic/claude-3.5-sonnet` (configured in `api/chat.js`)

**OpenAI** (Fallback):
1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Add payment method
3. Generate API key
4. Model: `gpt-4o-mini` (configured in `api/chat.js`)

---

## 🧪 Testing

### Local Chat Testing

With local server running:

1. Open site in browser
2. Click floating AI button (bottom-right)
3. Try queries:
   - "ما الفرق بين UX و UI؟"
   - "أفضل أدوات الـ AI للتصميم"
   - "كيف أبدأ في تعلم التصميم؟"

**Expected**: Answers generated from local knowledge.json retrieval (no LLM reasoning in static mode)

### Backend Testing (Vercel only)

After deploying to Vercel with API keys:

```bash
curl -X POST https://your-site.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"ما هي مبادئ الـ UX؟","mode":"ask"}'
```

**Expected Response**:
```json
{
  "answer": "**مبادئ الـ UX الأساسية**\n\n...",
  "citations": [...],
  "mode": "ask",
  "backend": "openrouter"
}
```

---

## 📁 Project Structure

```
renad-eid-product-design-roadmaps/
├── index.html              # Main SPA with 3 pages + integrated chatbot
├── data/
│   ├── knowledge.json      # Extracted roadmap content (sections, tags, keywords)
│   └── sources.json        # Curated external sources (NNGroup, Material, etc.)
├── api/
│   └── chat.js             # Vercel serverless function (RAG + LLM)
├── README.md               # This file
└── .gitignore              # Git exclusions
```

---

## 🔧 Configuration

### Customizing AI Behavior

Edit `api/chat.js`:

- **Models**: Change `OPENROUTER_MODEL` or `OPENAI_MODEL` constants
- **System Prompts**: Modify `getSystemPrompt()` function for tone/instructions
- **Retrieval Logic**: Adjust `calculateRelevance()` scoring or `retrieveContext()` limits
- **Temperature**: Change in `callLLM()` (default: 0.7)

### Adding Content

Edit `data/knowledge.json`:
- Add new sections with `id`, `page`, `anchor`, `title_ar`, `title_en`, `content`, `tags`, `keywords`

Edit `data/sources.json`:
- Add new sources with `id`, `name`, `category`, `url`, `description`, `topics`

---

## 🛡️ Security Notes

- **Never expose API keys client-side**: Keys are only used in Vercel serverless function
- **CORS enabled**: Backend allows all origins (adjust in production if needed)
- **Rate limiting**: Consider adding rate limits for production (Vercel Edge Config or Upstash)
- **Input validation**: Backend validates query length and type

---

## 🐛 Troubleshooting

### Chat button doesn't appear
- Check browser console for JavaScript errors
- Verify `data/knowledge.json` and `data/sources.json` are accessible
- Try hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

### Backend returns errors
- Verify environment variables are set in Vercel dashboard
- Check API key has credits (OpenRouter) or payment method (OpenAI)
- Review Vercel function logs: `vercel logs`

### Answers are generic/not relevant
- Check `data/knowledge.json` has proper keywords and tags
- Adjust retrieval scoring in `api/chat.js` → `calculateRelevance()`
- Verify system prompt matches your use case

### GitHub Pages: Chat works but answers are basic
- **Expected behavior**: GitHub Pages runs static-only mode (no LLM backend)
- For AI-powered answers, deploy to Vercel with API keys

---

## 🎨 Design System

Matches existing site theme:
- **Colors**: Dark navy (`--ink`, `--navy`) + lime/green accent (`--lime`, `--green`)
- **Fonts**: Space Grotesk (display), Tajawal/Inter (body), JetBrains Mono (mono)
- **Glass morphism**: Backdrop blur, semi-transparent panels
- **Animations**: Smooth cubic-bezier easing, reduced motion support
- **RTL support**: Arabic-first with English subtitles

---

## 📝 License

Internal educational resource. Not for redistribution.

---

## 🙏 Credits

- **Content**: Renad Eid Product Design Roadmaps
- **AI Models**: Anthropic Claude 3.5 Sonnet, OpenAI GPT-4o-mini
- **Routing**: OpenRouter unified LLM API
- **Hosting**: Vercel serverless platform
- **Sources**: NNGroup, Material Design, Apple HIG, Baymard Institute, Anthropic/OpenAI docs

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review Vercel logs: `vercel logs`
3. Test backend endpoint directly with curl
4. Verify environment variables in Vercel dashboard

---

**Built with ❤️ for designers learning product design, UX, and AI workflows**
