# Renad Eid Product Design Roadmaps

Bilingual (Arabic/English) roadmaps for product designers, built as a single-page site with an integrated AI mentor ("Roadmap Copilot").

## Contents

The site (`index.html`) has three pages:

- **Roadmap:** workflow from brief to handoff, UI/UX principles, e-commerce vs SaaS models.
- **AI Guide:** AI tools, practical workflows, product architectures, mastery paths.
- **UI/UX:** foundations, design thinking, research, systems, accessibility, career roadmap.

The design is Arabic-first with right-to-left layout and English subtitles.

## Roadmap Copilot

A floating chat drawer on every page, with five modes:

| Mode | Purpose |
| --- | --- |
| Ask (اسأل) | Search roadmap content with section-aware suggestions |
| Sources (مصادر) | Curated external resources (for example NNGroup, Material Design, Apple HIG) |
| Coach (كوتش) | Mentorship and career advice |
| Project (مشروع) | Step-by-step project guidance |
| Quiz (كويز) | Case studies and knowledge testing |

How it works:

- **Frontend:** the chat drawer in `index.html` posts to `/api/chat` and falls back to local retrieval over `data/knowledge.json` and `data/sources.json` when the backend is not available (for example in a static preview).
- **Backend:** `api/chat.js` is a Vercel serverless function. It scores and retrieves sections from the knowledge base, then calls an LLM: OpenRouter first (`anthropic/claude-3.5-sonnet`), then OpenAI (`gpt-4o-mini`) as a fallback. If neither key is set, it returns retrieval-only responses.
- **Data:** `data/knowledge.json` (sections with `id`, `page`, `anchor`, Arabic and English titles, `content`, `tags`, `keywords`) and `data/sources.json` (sources with `id`, `name`, `category`, `url`, `description`, `topics`).

## Getting started

Prerequisites: Node.js 18 or later (`engines` in `package.json`).

```bash
npm run serve    # static preview with http-server on port 8000
npm run check    # syntax-check api/chat.js and the inline scripts, and validate both JSON files
```

Any static server also works (for example `python -m http.server 8000`), then open `http://localhost:8000`. A static preview uses the local retrieval fallback only, with no LLM.

## Deployment

Deploy to Vercel to enable the AI backend (the `api/` folder is served as a serverless function). Set these environment variables in the project settings and redeploy:

- `OPENROUTER_API_KEY`: primary provider.
- `OPENAI_API_KEY`: optional fallback.

Without them the backend returns retrieval-only answers. On static hosting such as GitHub Pages only the local retrieval fallback runs.

Test the backend after deploying:

```bash
curl -X POST https://<your-deployment>/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"ما هي مبادئ الـ UX؟","mode":"ask"}'
```

The response contains `answer`, `citations`, `mode`, and `backend`.

## Customizing

In `api/chat.js`: change `OPENROUTER_MODEL` or `OPENAI_MODEL`, edit `getSystemPrompt()`, adjust `calculateRelevance()` and `retrieveContext()`, or change the temperature in `callLLM()` (0.7).

## Security notes

- API keys are read only in the serverless function (`process.env`), never in the browser.
- The backend sets `Access-Control-Allow-Origin: *`; restrict it for production use.
- There is no rate limiting in the code.

## Project structure

```
index.html              Single-page site with the chatbot
data/knowledge.json     Roadmap content for retrieval
data/sources.json       Curated external sources
api/chat.js             Vercel serverless function (retrieval + LLM)
scripts/check-static.mjs  Static checks used by npm run check
package.json
```

## Design

Dark navy with lime/green accents; Space Grotesk, Tajawal/Inter, and JetBrains Mono fonts; glass-style panels; reduced-motion support.

## Credits

Content: Renad Eid Product Design Roadmaps. AI models: Anthropic Claude 3.5 Sonnet and OpenAI GPT-4o-mini through OpenRouter and OpenAI. Sources: NNGroup, Material Design, Apple HIG, Baymard Institute, Anthropic and OpenAI docs.
