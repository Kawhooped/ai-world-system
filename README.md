# AI Workflow Studio

> Chain AI prompts into repeatable workflows. A builder's control room for designing AI-assisted systems.

A minimal, self-hosted tool for designing and running multi-step LLM pipelines. Built with Express + vanilla JS. No build step, no database, no lock-in.

**Live demo:** _Deploy on Railway in ~2 minutes (instructions below)._

---

## What it does

Two surfaces, one goal: ship AI-assisted work faster.

### 🔀 Workflow Builder _(the killer feature)_
Define a chain of prompts. Each step receives the previous step's output. Run the chain once, or save it as a reusable template. Pre-loaded templates include:

- **Blog Post Pipeline** — Research → Outline → Draft → Polish
- **Idea → Spec** — Clarify → Features → Tech stack → First task
- **Code Review** — Summary → Issues → Refactor
- **Cold Outreach** — Angle → Subjects → Body

### 💬 Builder Chat
Free-form conversational AI with persistent project context. Use it for ideation, design discussions, and one-off explorations. Conversations persist in `localStorage`.

---

## Why this exists

Most "AI workflow" tools are either too heavyweight (n8n, Zapier) or too rigid (single-prompt chat). This is the middle ground: define a chain, run it, save it, iterate. Built to be **forked and extended**, not subscribed to.

---

## Run it locally

```bash
git clone https://github.com/Kawhooped/ai-world-system.git
cd ai-world-system
npm install
OPENAI_API_KEY=sk-... npm start
# → http://localhost:3000
```

Optional env vars:

| Var | Default | Notes |
|---|---|---|
| `OPENAI_API_KEY` | _(required)_ | Your OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o-mini` | Any Responses-API-compatible model |
| `PORT` | `3000` | HTTP port |

---

## Deploy on Railway

1. Create a new Railway project from this GitHub repo
2. Add an environment variable: `OPENAI_API_KEY = sk-...`
3. Deploy. Railway auto-detects Node and runs `npm start`.

That's it. No Dockerfile, no config.

---

## Architecture

```
public/
  index.html        ← Landing page
  workflow.html     ← Workflow Builder (the main thing)
  chat.html         ← Builder Chat
  art.html / games.html / portfolio.html  ← extras
server.js           ← Express API
  POST /api/chat          ← conversational endpoint
  POST /api/workflow/run  ← multi-step pipeline endpoint
  GET  /health
```

### Workflow API

```bash
curl -X POST http://localhost:3000/api/workflow/run \
  -H "Content-Type: application/json" \
  -d '{
    "input": "the future of solo developers",
    "steps": [
      { "name": "Research", "prompt": "List 5 key angles..." },
      { "name": "Outline",  "prompt": "Turn that into an outline..." },
      { "name": "Draft",    "prompt": "Write a 600-word post..." }
    ]
  }'
```

Returns:

```json
{
  "ok": true,
  "input": "...",
  "steps": [
    { "name": "Research", "prompt": "...", "output": "..." },
    { "name": "Outline",  "prompt": "...", "output": "..." },
    { "name": "Draft",    "prompt": "...", "output": "..." }
  ],
  "final": "...the final step's output..."
}
```

Each step's prompt becomes the system instruction; the user message contains the original input plus the previous step's output. The model focuses on _just this step_ and returns _just this step's result_.

---

## Roadmap

- [ ] Persist workflows to a database (currently `localStorage` only)
- [ ] Streaming responses (currently waits for each step to complete)
- [ ] Branching workflows (current chain is linear)
- [ ] Workflow sharing via URL hash
- [ ] Step types beyond LLM calls (HTTP, code execution, conditional logic)
- [ ] Auth for multi-user deployments

---

## Built by

**Danny Aguiar** — AI Workflow Designer, Miami, FL.
Available for consulting and build projects.
[github.com/Kawhooped](https://github.com/Kawhooped) · kawhooped@gmail.com

---

## License

MIT
