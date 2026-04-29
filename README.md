# AI Builder Chat v0.2

This replaces the one-shot AI World Builder with a main AI control-room chat.

- `/` = chat UI
- `POST /api/chat` = sends conversation + project context to OpenAI
- No database yet
- No automatic world generation unless the user asks

Deploy on Railway with:

```text
OPENAI_API_KEY=your_key
```
