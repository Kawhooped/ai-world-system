import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

function validateWorld(w) {
  const bad = msg => ({ ok: false, error: msg });

  if (!w || typeof w !== "object" || Array.isArray(w)) return bad("world must be object");
  if (!w.name || typeof w.name !== "string") return bad("missing world.name");
  if (!Array.isArray(w.entities)) return bad("world.entities must be array");
  if (!Array.isArray(w.rules)) return bad("world.rules must be array");
  if (!w.ui || typeof w.ui !== "object" || Array.isArray(w.ui)) return bad("missing world.ui");

  for (const e of w.entities) {
    if (!e || typeof e !== "object") return bad("entity must be object");
    if (!e.id || !e.type || !e.name) return bad("entity missing id/type/name");
    if (!e.state || typeof e.state !== "object" || Array.isArray(e.state)) return bad(`entity ${e.id} missing state`);
    if (!Array.isArray(e.actions)) return bad(`entity ${e.id} actions must be array`);
  }

  for (const r of w.rules) {
    if (!r || typeof r !== "object") return bad("rule must be object");
    if (!r.id || !r.trigger || !r.effect) return bad("rule missing id/trigger/effect");
  }

  return { ok: true };
}

function extractResponseText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const text =
    data?.output?.[0]?.content?.find?.(c => c.type === "output_text" || c.text)?.text ??
    data?.output?.[0]?.content?.[0]?.text;
  return text;
}

app.post("/api/chat", async (req, res) => {
  const { prompt } = req.body || {};

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "missing prompt" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "missing OPENAI_API_KEY environment variable" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        text: { format: { type: "json_object" } },
        input: `Generate a clean JSON world config.

Rules:
- Return JSON only.
- No markdown.
- No explanation.
- Keep it small but vivid.
- Required top-level fields: name, description, theme, entities, rules, resources, ui.
- entities: array of {id, type, name, state, traits, actions}
- each entity.state should include energy, pressure, position {x,y}
- rules: array of {id, trigger, effect}
- resources: array of {id, name, effect}
- ui: {panels, primaryAction}

User request: ${prompt}`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "OpenAI request failed",
        details: data
      });
    }

    const text = extractResponseText(data);
    if (!text) {
      return res.status(500).json({ error: "No text returned by AI", raw: data });
    }

    let world;
    try {
      world = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: "AI returned invalid JSON", text });
    }

    const check = validateWorld(world);
    if (!check.ok) {
      return res.status(400).json({
        error: "Invalid world config",
        details: check.error,
        world
      });
    }

    res.json(world);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "ai-world-system" });
});

app.listen(PORT, () => {
  console.log(`AI World System running on port ${PORT}`);
});
