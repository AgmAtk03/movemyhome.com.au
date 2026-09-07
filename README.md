# Aama Removals — Instant Quote Wizard

Mobile-first quote and booking app for **Aama Removals** (Sydney home, room, and item moves).

The landing page and quote wizard load **without** a `GEMINI_API_KEY`. If an AI-assisted quote is added later, it should degrade gracefully when the key is missing.

## Run locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`
3. Optional: set `GEMINI_API_KEY` in `.env.local` only if you are using AI quote features.

## Build

`npm run build` writes a static site to `dist/`.
