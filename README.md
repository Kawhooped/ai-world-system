# AI World System

A tiny Railway-ready app:

- `/` = AI World Builder page
- `POST /api/chat` = sends prompt to OpenAI
- validates the returned world config
- returns clean JSON only

## Local run

```bash
npm install
OPENAI_API_KEY=your_key_here npm start
```

Open:

```text
http://localhost:3000
```

## Railway deploy

1. Upload this folder to GitHub as `ai-world-system`
2. In Railway, create an Empty Service from the repo
3. Add variable:

```text
OPENAI_API_KEY=your_key_here
```

4. Deploy

## Next phase

Add Postgres and these routes:

```text
GET /api/worlds
POST /api/worlds
GET /api/worlds/:id
PATCH /api/worlds/:id
```

Then worlds persist.
