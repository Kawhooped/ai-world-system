import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "4mb" }));
app.use(express.static("public"));

const OPENAI_URL = "https://api.openai.com/v1/responses";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function extractText(data) {
  return (
    data.output_text ||
    data?.output?.[0]?.content?.find?.((c) => c.type === "output_text" || c.text)?.text ||
    data?.output?.[0]?.content?.[0]?.text ||
    ""
  );
}

async function callOpenAI(input) {
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, input }),
  });
  const data = await response.json();
  if (!response.ok) {
    const err = new Error("OpenAI request failed");
    err.status = response.status;
    err.details = data;
    throw err;
  }
  return extractText(data) || "No reply returned.";
}

// ── Chat endpoint (unchanged behavior) ───────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { messages = [], context = "" } = req.body || {};

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "missing OPENAI_API_KEY environment variable" });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array required" });
  }

  try {
    const input = [
      {
        role: "system",
        content: `You are the Builder AI inside the user's main creation/control room.

Purpose:
- Help the user design websites, pages, world systems, AI tools, routes, configs, and next actions.
- Do NOT assume every request is to generate a world.
- Prefer clear steps, small implementation chunks, and structured plans.
- When asked for code, give deployable code.
- When asked to design a page/system, produce clean architecture.
- Keep answers compact and practical.

Project context:
${context || "No project context provided."}`,
      },
      ...messages.slice(-20),
    ];
    const reply = await callOpenAI(input);
    res.json({ reply });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, details: err.details });
  }
});

// ── Workflow endpoint (multi-step pipeline) ─────────────────────────
// Body: { input: string, steps: [{ name, prompt }, ...] }
// Each step receives:
//   - the original user input
//   - the previous step's output (if any)
//   - its own prompt as the instruction
app.post("/api/workflow/run", async (req, res) => {
  const { input: userInput = "", steps = [] } = req.body || {};

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "missing OPENAI_API_KEY environment variable" });
  }
  if (!Array.isArray(steps) || steps.length === 0) {
    return res.status(400).json({ error: "steps array required" });
  }
  if (typeof userInput !== "string") {
    return res.status(400).json({ error: "input must be a string" });
  }

  const trace = [];
  let previous = "";

  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i] || {};
      const stepName = step.name || `Step ${i + 1}`;
      const stepPrompt = (step.prompt || "").trim();

      if (!stepPrompt) {
        trace.push({ name: stepName, prompt: stepPrompt, output: "(skipped — empty prompt)" });
        continue;
      }

      const systemMsg = `You are executing step ${i + 1} of a ${steps.length}-step workflow named "${stepName}".

Instructions for this step:
${stepPrompt}

Rules:
- Focus ONLY on this step's instruction.
- Output the result of THIS step only — no preamble, no meta-commentary.
- Be concise but complete.
- If previous output is provided, use it as your primary input.`;

      const userMsg =
        i === 0
          ? `Original input:\n${userInput}`
          : `Original input:\n${userInput}\n\n---\nPrevious step output:\n${previous}`;

      const stepInput = [
        { role: "system", content: systemMsg },
        { role: "user", content: userMsg },
      ];

      const output = await callOpenAI(stepInput);
      trace.push({ name: stepName, prompt: stepPrompt, output });
      previous = output;
    }

    res.json({
      ok: true,
      input: userInput,
      steps: trace,
      final: previous,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message,
      details: err.details,
      partial: trace,
    });
  }
});

app.get("/health", (req, res) =>
  res.json({ ok: true, service: "ai-workflow-studio", version: "0.3.0" })
);

app.listen(PORT, () => console.log(`AI Workflow Studio running on port ${PORT}`));
