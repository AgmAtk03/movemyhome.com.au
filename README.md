# Aama Removals — Instant Quote Wizard

Mobile-first quote and booking app for **Aama Removals** (Sydney home, room, and item moves).

The landing page and quote wizard load **without** a `GEMINI_API_KEY` or Google Maps key. If Maps is missing, the route step shows **Maps not configured** instead of failing silently.

## Run locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set keys you have.
3. Run the app:
   `npm run dev`

## Google Maps (route step)

The quote route step uses **Places Autocomplete** and **DirectionsService**.

1. In Google Cloud, enable:
   - Maps JavaScript API
   - Places API
   - Directions API
2. Create an API key and **restrict it to HTTP referrers** (your Netlify/Vercel domains plus `http://localhost:3000/*`).
3. Set this env var locally in `.env.local` and in **Netlify / Vercel project settings**:

   `VITE_GOOGLE_MAPS_API_KEY`

4. Rebuild / redeploy so Vite can bake the public key into the client bundle.

Do not commit a real API key. `.env` and `.env.local` are gitignored.

## Optional AI

`GEMINI_API_KEY` is optional and only needed if AI quote features are added later.

## Build

`npm run build` writes a static site to `dist/`.
