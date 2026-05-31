# Sit

Basic visitor counter site.

This site uses a client-only visit counter (localStorage) to avoid serverless runtime issues.

## Deploy on Vercel

1. Push this repo to GitHub.
2. In Vercel, create a new project from this repo.
3. Deploy.

No extra environment variables or storage setup needed.

Routes:

- `/` main site
- `/cds` diagnostics console page
- `/api/*` static fallback response (prevents serverless invocation errors)

## Run

```bash
npm start
```

Open http://localhost:3000 in your browser. Each page load increments the visit count.