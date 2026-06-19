/**
 * Vercel Serverless Function: Roadmap Copilot AI Backend
 *
 * Handles retrieval-augmented generation (RAG) over knowledge base and external sources.
 * Supports OpenRouter (primary) and OpenAI (fallback) with Claude/GPT models.
 *
 * Environment Variables Required:
 * - OPENROUTER_API_KEY (primary) or OPENAI_API_KEY (fallback)
 */

import { promises as fs } from 'fs';
import path from 'path';

// ─────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';
const OPENAI_API = 'https://api.openai.com/v1/chat/completions';

const OPENROUTER_MODEL = 'anthropic/claude-3.5-sonnet';
const OPENAI_MODEL = 'gpt-4o-mini';

// Determine which service to use
const USE_OPENROUTER = !!OPENROUTER_API_KEY;
const USE_OPENAI = !USE_OPENROUTER && !!OPENAI_API_KEY;

if (!USE_OPENROUTER && !USE_OPENAI) {
  console.warn('⚠️  No API keys configured. Backend will return empty responses.');
}

// ─────────────────────────────────────────────────────────────────────────
// LOAD KNOWLEDGE BASE
// ─────────────────────────────────────────────────────────────────────────
let knowledgeDB = null;
let sourcesDB = null;

async function loadKnowledge() {
  if (knowledgeDB) return knowledgeDB;
  try {
    const filePath = path.join(process.cwd(), 'data', 'knowledge.json');
    const content = await fs.readFile(filePath, 'utf-8');
    knowledgeDB = JSON.parse(content);
    return knowledgeDB;
  } catch (err) {
    console.error('Failed to load knowledge.json:', err);
    return null;
  }
}

async function loadSources() {
  if (sourcesDB) return sourcesDB;
  try {
    const filePath = path.join(process.cwd(), 'data', 'sources.json');
    const content = await fs.readFile(filePath, 'utf-8');
    sourcesDB = JSON.parse(content);
    return sourcesDB;
  } catch (err) {
    console.error('Failed to load sources.json:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// RETRIEVAL ENGINE
// ─────────────────────────────────────────────────────────────────────────
function simpleTokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s]/gi, ' ')
    .split(/\s+/)
    // Keep short product terms like UI, UX, IA, AI; drop one-letter noise only.
    .filter(t => t.length > 1);
}

function calculateRelevance(query, section) {
  const queryTokens = simpleTokenize(query);
  const sectionText = [
    section.title_ar || '',
    section.title_en || '',
    section.content || '',
    (section.keywords || []).join(' '),
    (section.tags || []).join(' '),
    section.description || '',
    (section.topics || []).join(' ')
  ].join(' ');
  const sectionTokens = simpleTokenize(sectionText);

  let score = 0;
  queryTokens.forEach(qt => {
    sectionTokens.forEach(st => {
      if (st.includes(qt) || qt.includes(st)) score += 1;
    });
  });

  // Boost exact phrase matches
  const lowerSection = sectionText.toLowerCase();
  const lowerQuery = query.toLowerCase();
  if (lowerSection.includes(lowerQuery)) score += 10;

  return score;
}

async function retrieveContext(query, mode = 'ask', context = {}) {
  const kb = await loadKnowledge();
  const src = await loadSources();

  let results = [];

  // Search knowledge base
  if (kb && kb.sections) {
    let sections = kb.sections;

    // Filter by page context if provided
    if (context.page && context.page !== 'roadmap') {
      sections = sections.filter(s => s.page === context.page);
    }

    const scored = sections.map(s => ({
      ...s,
      score: calculateRelevance(query, s),
      type: 'section'
    }));

    results.push(...scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 5));
  }

  // For sources mode, also retrieve external sources
  if (mode === 'sources' && src && src.sources) {
    const scoredSrc = src.sources.map(s => ({
      ...s,
      score: calculateRelevance(query, {
        title_en: s.name,
        description: s.description,
        keywords: s.topics || [],
        tags: [s.category]
      }),
      type: 'source'
    }));

    results.push(...scoredSrc.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 3));
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 6);
}

// ─────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPTS
// ─────────────────────────────────────────────────────────────────────────
function getSystemPrompt(mode) {
  const base = `You are **Roadmap Copilot**, a bilingual (Arabic + English) AI mentor specializing in product design, UX/UI, and AI-assisted workflows.

**Tone & Style:**
- Premium mentor: knowledgeable, encouraging, practical
- Use both Arabic (primary) and English (secondary) in responses
- Keep answers concise but thorough (2-4 paragraphs)
- Use markdown formatting: **bold** for emphasis, bullet lists, links
- Always cite sources from the retrieved context

**Audience:**
- Junior/mid-level product designers
- Product teams and engineers working with designers
- People learning UX/UI and AI tools

**Core Knowledge:**
- Renad Eid's Product Design Roadmaps (Workflow, Principles, Models, Production, SOP)
- AI Guide (Claude, ChatGPT, Perplexity, tools, concepts, product shapes)
- UI/UX Guide (foundations, design thinking, research, IA, principles, systems, a11y)`;

  const modeInstructions = {
    ask: `
**Mode: Ask (اسأل)**
Answer questions about the roadmap content. Always reference specific sections and provide anchors for navigation.`,

    sources: `
**Mode: Sources (مصادر)**
Recommend external resources. Prioritize: NNGroup, Material Design, Apple HIG, Figma, Baymard, Anthropic/OpenAI docs. Include URLs and brief descriptions.`,

    coach: `
**Mode: Coach (كوتش)**
Provide personalized mentorship advice. Focus on career growth, portfolio building, skill development, and best practices. Be encouraging but realistic.`,

    project: `
**Mode: Project (مشروع)**
Help with specific projects. Ask clarifying questions if needed. Provide actionable step-by-step guidance following the roadmap methodology.`,

    quiz: `
**Mode: Quiz (كويز)**
Create interactive learning experiences. Present case studies, ask thought-provoking questions, or quiz the user on concepts. Make it engaging and educational.`
  };

  return base + '\n' + (modeInstructions[mode] || modeInstructions.ask);
}

// ─────────────────────────────────────────────────────────────────────────
// LLM CALL
// ─────────────────────────────────────────────────────────────────────────
async function callLLM(messages, mode) {
  let apiUrl, apiKey, model;

  if (USE_OPENROUTER) {
    apiUrl = OPENROUTER_API;
    apiKey = OPENROUTER_API_KEY;
    model = OPENROUTER_MODEL;
  } else if (USE_OPENAI) {
    apiUrl = OPENAI_API;
    apiKey = OPENAI_API_KEY;
    model = OPENAI_MODEL;
  } else {
    throw new Error('No API keys configured');
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...(USE_OPENROUTER && { 'HTTP-Referer': 'https://renad-eid-roadmaps.vercel.app' })
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: getSystemPrompt(mode) },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, mode = 'ask', context = {} } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Invalid query' });
    }

    // Retrieve relevant context
    const retrieved = await retrieveContext(query, mode, context);

    if (!USE_OPENROUTER && !USE_OPENAI) {
      // No API keys - return retrieval only
      return res.status(200).json({
        answer: null,
        citations: retrieved.map(r => ({
          title: r.title_ar || r.name || '',
          anchor: r.anchor || null,
          url: r.url || null,
          type: r.type
        })),
        mode,
        retrieved,
        backend: 'local-only'
      });
    }

    // Build context for LLM
    const contextStr = retrieved.map(r => {
      if (r.type === 'section') {
        return `[Section: ${r.title_ar} / ${r.title_en}]\nAnchor: ${r.anchor}\n${r.content}`;
      } else if (r.type === 'source') {
        return `[Source: ${r.name}]\nURL: ${r.url}\nCategory: ${r.category}\n${r.description}`;
      }
      return '';
    }).join('\n\n---\n\n');

    const userMessage = `${query}\n\n---\n**Retrieved Context:**\n${contextStr}`;

    // Call LLM
    const answer = await callLLM([{ role: 'user', content: userMessage }], mode);

    // Extract citations
    const citations = retrieved.map(r => ({
      title: r.title_ar || r.name || '',
      anchor: r.anchor || null,
      url: r.url || null,
      type: r.type,
      page: r.page || null
    }));

    return res.status(200).json({
      answer,
      citations,
      mode,
      retrieved,
      backend: USE_OPENROUTER ? 'openrouter' : 'openai'
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
