import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

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
${context || "No project context provided."}`
      },
      ...messages.slice(-20)
    ];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: "OpenAI request failed", details: data });
    }

    const reply =
      data.output_text ||
      data?.output?.[0]?.content?.find?.(c => c.type === "output_text" || c.text)?.text ||
      data?.output?.[0]?.content?.[0]?.text ||
      "No reply returned.";

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (req, res) => res.json({ ok: true, service: "ai-builder-chat-v02" }));

app.listen(PORT, () => console.log(`AI Builder Chat running on port ${PORT}`));
