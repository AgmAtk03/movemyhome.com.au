# My Home Removals — quote + 10% deposit

Mobile-first quote and booking app for **My Home Removals** (Sydney and NSW home, room, and item moves). Australian English throughout.

Live app repo: [AgmAtk03/movemyhome.com.au](https://github.com/AgmAtk03/movemyhome.com.au). Pointer-only repo: [AgmAtk03/aama-removals](https://github.com/AgmAtk03/aama-removals) — **do not put app code there**.

The running total is an **estimate**. **Pay 10% deposit** creates a Stripe Checkout Session for that job’s deposit only. The remaining **90% is due on the day**. `/success` is not proof of payment — Stripe (verified webhook + session retrieve) is.

## Production hosting (Netlify UI + Vercel API)

| Piece | Host | URL |
| --- | --- | --- |
| Customer UI (Vite SPA) | Netlify | Canonical: `https://movemyhome.com.au` (`www` 301s here) |
| Serverless `/api/*` | Vercel | `https://aama-removals.vercel.app` |

`netlify.toml` proxies `/api/*` to `https://aama-removals.vercel.app/api/:splat` **before** the SPA catch-all. The browser must keep posting to **relative** `/api/create-checkout-session` (same origin) so that rewrite applies. Do not hardcode the Vercel host in frontend fetch URLs.

On the Vercel project set:

```
PUBLIC_SITE_URL=https://movemyhome.com.au
```

That origin is used for Stripe Checkout `success_url` / `cancel_url` (`/success?session_id={CHECKOUT_SESSION_ID}` and `/cancel`). If this is left blank, redirects can land on the Vercel hostname instead of the public site.

**Stripe webhook:** point Checkout at the Vercel function directly:

`https://aama-removals.vercel.app/api/stripe-webhook`

Do not send webhooks through the Netlify proxy. Stripe signs the raw body; an extra reverse-proxy hop can change bytes or headers and fail signature verification. Keep one endpoint (this Vercel URL) in the Stripe Dashboard.

Vercel compiles `/api/*.ts` to ESM `.js` on Node.js 24. Relative imports in that graph must use explicit **`.js` extensions** (TypeScript resolves `./env.js` to `./env.ts`). Extensionless paths such as `./_lib/env` become `Cannot find module '/var/task/api/_lib/env'` at runtime.

`@vercel/node` stays in `package.json` **dependencies** (not `devDependencies`) so production installs still have the Node helper types.

## Run locally

**Prerequisites:** Node.js 18+ (20/22 recommended)

1. `npm install`
2. Copy `.env.example` to `.env.local`. Leave secrets blank to try the UI in **demo mode**.
3. `npm run dev` — UI on [http://localhost:3000](http://localhost:3000). Vite also serves `GET /api/diesel-price` so the fuel line can use a live 7-Eleven price. Stripe Checkout still needs `npx vercel dev`.
4. `npm run build` — `tsc` + Vite production build.
5. `npx vercel dev` — UI **and** `/api/*` serverless functions (needed for real Stripe Checkout and webhooks). Set `PUBLIC_SITE_URL=http://localhost:3000` for test-mode redirects.

Never commit `.env.local`. Placeholders such as `YOUR_PUBLIC_KEY` and `YOUR_PHONE_NUMBER` are intentional.

## Google Maps (live distance)

Set `VITE_GOOGLE_MAPS_API_KEY` on **Netlify** (build-time; Vite bakes `VITE_*` into the SPA). Do not commit the key.

Enable **Maps JavaScript API**, **Places API**, and **Directions API**. Restrict the key to HTTP referrers:

- `http://localhost:3000/*`
- `https://movemyhome.com.au/*`
- `https://www.movemyhome.com.au/*`
- `https://*.netlify.app/*`

Pickup and drop-off fields use Places autocomplete (Australia). Driving distance comes from Directions. If the key is missing, customers can still type addresses and fuel/distance is confirmed later.

## Call and WhatsApp

Public booking mobile is **0410 721 370** (from `VITE_COMPANY_PHONE` / `VITE_WHATSAPP_NUMBER`):

- Call: `tel:+61410721370`
- WhatsApp: `https://wa.me/61410721370`

Links sit in the sticky site header, the landing hero and footer, the quote-wizard header, booking help (“Prefer a chat?”), privacy, cancel, and payment result screens. They are real `<a>` links with `min-h-11` tap targets and aria-labels.

## Fuel (7-Eleven diesel)

On the **booking / final summary** (not the homepage):

- Maps driving distance under **12 km** → fuel **$0**.
- **12 km or more** → litres = `distanceKm / 10` (10 km per litre) × live 7-Eleven diesel AUD/L.
- That fuel line is added to the quote total; the 10% deposit follows `quoteCalc` as usual.

**Price source:** `GET /api/diesel-price` (Vercel, cached 30 minutes). 7-Eleven Australia does not publish a public unauthenticated diesel API (the My 7-Eleven app endpoints need device attestation). This route reads the public [11-Seven](https://projectzerothree.info/api.html) JSON feed (`https://projectzerothree.info/api.php?format=json`) — live **7-Eleven pump prices** — and uses the **NSW Diesel** row (cents/L ÷ 100). Optional override on Vercel: `SEVEN_ELEVEN_DIESEL_AUD_PER_L` (e.g. `1.95`) to pin a board price. If the feed is down and no override is set, the UI shows **Fuel TBC** and **does not invent a dollar amount**.

## Architecture

```
Contact submit
  → POST /api/create-checkout-session
  → server fetches 7-Eleven diesel (cached) and recalculates quote from shared/quoteCalc.ts (ignores browser totals)
  → deposit = round(quoteTotal * 0.10, 2)
  → balance = quoteTotal - deposit
  → Stripe Checkout Session for Math.round(deposit * 100) cents (AUD)
  → redirect to Stripe-hosted Checkout (no card form on this site)
  → success_url /success?session_id={CHECKOUT_SESSION_ID}
  → cancel_url /cancel
  → webhook POST /api/stripe-webhook  (checkout.session.completed, signature verified)
  → EmailJS customer confirmation + business job sheet
  → /success also POST /api/notify-paid-booking (recoverable if the webhook was missed)
```

Shared rate table: `shared/rates.ts` (same numbers as the historic wizard). Calculator: `shared/quoteCalc.ts`. Do not invent new rates.

**Secrets:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `EMAILJS_PRIVATE_KEY` are server-only. They must never appear in `VITE_*` / `REACT_APP_*` variables or the frontend bundle. The browser does not need a publishable key; Checkout is hosted by Stripe.

## Environment variables

Set these in `.env.local` and in the Vercel project. Do not commit values.

| Name | Where | Required for live deposits |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Server | Yes (`sk_test_…` then `sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | Server | Yes (`whsec_…`) |
| `STRIPE_PUBLISHABLE_KEY` | Server optional | No. `pk_` only. Unused unless you later add Stripe.js. |
| `PUBLIC_SITE_URL` | Server (Vercel) | Yes in production. Canonical: `https://movemyhome.com.au` (no trailing slash). Success URL: `{PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`. Cancel URL: `{PUBLIC_SITE_URL}/cancel`. |
| `VITE_PUBLIC_SITE_URL` | Same origin, optional | Fallback if `PUBLIC_SITE_URL` is empty. |
| `VITE_EMAILJS_SERVICE_ID` | Netlify build + Vercel | Same EmailJS service as below. **Also set unprefixed `EMAILJS_*` on Vercel.** |
| `VITE_EMAILJS_CLIENT_TEMPLATE_ID` | Netlify build + Vercel | Customer confirmation |
| `VITE_EMAILJS_BUSINESS_TEMPLATE_ID` | Netlify build + Vercel | Business job sheet |
| `VITE_EMAILJS_PUBLIC_KEY` | Netlify build + Vercel | EmailJS public key |
| `EMAILJS_SERVICE_ID` | **Vercel (API)** | Same value as `VITE_EMAILJS_SERVICE_ID`. Webhooks do not see Netlify env. |
| `EMAILJS_CLIENT_TEMPLATE_ID` | **Vercel (API)** | Customer confirmation template |
| `EMAILJS_BUSINESS_TEMPLATE_ID` | **Vercel (API)** | Business job-sheet template |
| `EMAILJS_PUBLIC_KEY` | **Vercel (API)** | EmailJS public key |
| `EMAILJS_PRIVATE_KEY` | **Vercel server-only** | Required for reliable webhook sends. Never prefix with `VITE_`. |
| `VITE_WHATSAPP_NUMBER` | Client (Netlify build) | `61410721370` — WhatsApp `https://wa.me/61410721370` |
| `VITE_GOOGLE_MAPS_API_KEY` | Client (Netlify build) | Places + Directions; HTTP-referrer restricted. Never commit the key. |
| `SEVEN_ELEVEN_DIESEL_AUD_PER_L` | Server optional | Pin diesel AUD/L (e.g. `1.95`). If unset, `GET /api/diesel-price` uses the 11-Seven NSW 7-Eleven feed. |
| `VITE_LEGAL_TRADING_NAME` | Client | e.g. your registered trading name |
| `VITE_COMPANY_EMAIL` | Client + webhook | Bookings inbox (`removalsmyhome@gmail.com`) |
| `VITE_COMPANY_PHONE` | Client (Netlify build) | Display as `0410 721 370`. Call link `tel:+61410721370`. |
| `VITE_COMPANY_WEBSITE` | Client | Public site |
| `VITE_ABN` | Client | ABN placeholder until you fill it |

Vercel also exposes `VERCEL_URL` / `VERCEL_PROJECT_PRODUCTION_URL`; the API uses those if `PUBLIC_SITE_URL` is unset.

Rebuild the frontend after changing any `VITE_*` variable.

## Stripe Checkout (dynamic 10% — not a Payment Link)

A static Payment Link cannot charge a different 10% per job. This app creates a **Checkout Session** per booking.

1. Create a Stripe account. Start in **test mode**.
2. Developers → API keys → copy `sk_test_…` into `STRIPE_SECRET_KEY`. Do not put `sk_`, `rk_`, or `whsec_` in any `VITE_` variable.
3. Developers → Webhooks → Add endpoint  
   Production: `https://aama-removals.vercel.app/api/stripe-webhook`  
   Events: `checkout.session.completed` (and optionally `checkout.session.async_payment_succeeded`).  
   Copy the signing secret to `STRIPE_WEBHOOK_SECRET`. Do not register the Netlify `/api/stripe-webhook` proxy as the webhook URL.
4. Currency is **AUD**. The Session line item is the **deposit only**.
5. Success and cancel URLs are set in code from `PUBLIC_SITE_URL` (see table above).

### Local webhook forwarding

```bash
npx vercel dev
# in another terminal
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

Use the `whsec_…` that `stripe listen` prints as `STRIPE_WEBHOOK_SECRET` for local tests.

### Test cards (Stripe test mode)

| Card | Result |
| --- | --- |
| `4242 4242 4242 4242` | Success |
| `4000 0025 0000 3155` | Requires 3-D Secure |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 0002` | Generic decline |

Use any future expiry, any 3-digit CVC, and any Australian postcode. See [Stripe test cards](https://docs.stripe.com/testing).

## EmailJS (paid path only)

Emails go out after a **verified paid** Checkout session:

1. **Primary:** `POST /api/stripe-webhook` (`checkout.session.completed` / `checkout.session.async_payment_succeeded`).
2. **Recoverable:** `/success` calls `POST /api/notify-paid-booking` so a missed webhook still sends. Idempotent via Stripe metadata (`mail_client` / `mail_biz`).
3. **Last resort:** if the API host is missing EmailJS env, the success page can retry with the public keys baked into the Netlify SPA (no private key in the browser).

Demo mode skips email. The success screen tells the customer to **check the email they entered**; it does not claim an email was sent unless the send succeeded. Failures are `console.error`’d and stored on the Stripe session as `mail_note` (visible in the Stripe Dashboard).

The UI is on **Netlify**. `/api/*` runs on **Vercel**. `VITE_*` values set only on Netlify are **invisible** to the webhook. Set the unprefixed `EMAILJS_*` names (and `VITE_COMPANY_EMAIL`) on the Vercel project for Production.

Create two templates in the existing EmailJS service (do not create a new account):

| Template | Recipient | Suggested To |
| --- | --- | --- |
| Client confirmation | Customer | `{{to_email}}` |
| Business job sheet | Office | `{{to_email}}` (app sends `VITE_COMPANY_EMAIL` / `removalsmyhome@gmail.com`) |

Useful variables: `{{company_name}}` `{{customer_name}}` `{{user_email}}` `{{user_phone}}` `{{move_date}}` `{{move_time}}` `{{service_type}}` `{{vehicle}}` `{{total_quote}}` `{{deposit_amount}}` `{{balance_amount}}` `{{inventory}}` `{{pickup}}` `{{dropoff}}` `{{route}}` `{{job_details}}` `{{message}}` `{{email_kind}}` (`client` or `business`) `{{stripe_session_id}}`.

EmailJS allows **one request per second**. The API waits between the business and customer sends and retries `429` / `5xx`.

In EmailJS **Account → Security**, enable API access for non-browser apps and prefer **Use Private Key**. Put that private key in `EMAILJS_PRIVATE_KEY` on Vercel (not `VITE_EMAILJS_PRIVATE_KEY`).

## Demo mode

If `STRIPE_SECRET_KEY` is missing, or you run `npm run dev` without `vercel dev`, checkout returns **Demo mode — no charge / no email**. The UI must not look like a real booking. `/success` without a paid Stripe session is **not** a booking.

`/#staff-jobs` is a **local demo diary** (this browser’s `localStorage` only). It is **not** a production operations board and is not authenticated. Do not use it for real jobs. Paid work is confirmed by Stripe + email.

## Owner checklist

1. Confirm `VITE_COMPANY_PHONE=0410 721 370` and `VITE_WHATSAPP_NUMBER=61410721370` on Netlify (also in `.env.example`). Fill `VITE_LEGAL_TRADING_NAME`, `VITE_COMPANY_EMAIL`, `VITE_COMPANY_WEBSITE`, `VITE_ABN`. Do not invent licences.
2. Create a Maps key, restrict referrers, set `VITE_GOOGLE_MAPS_API_KEY`.
3. Stripe test keys + webhook (`https://aama-removals.vercel.app/api/stripe-webhook`) + `PUBLIC_SITE_URL=https://movemyhome.com.au`. Charge a test deposit with `4242…`. Confirm webhook emails.
4. Switch to `sk_live_` / live webhook secret only when ready. Deploy on **HTTPS**.
5. Restrict EmailJS keys. Set `EMAILJS_PRIVATE_KEY` **and** `EMAILJS_SERVICE_ID` / template IDs / public key on **Vercel** (not only Netlify `VITE_*`). Confirm a test deposit emails both the booker and `removalsmyhome@gmail.com`.
6. Confirm Vercel env vars are set for Production and Preview. Confirm Deployment Protection is off if the public API must be reachable from Netlify.
7. Delete any unused Google Maps keys that were previously hardcoded.

## Security

- `.gitignore` ignores `.env*`. Only `.env.example` is committed.
- Vite `envPrefix` is `VITE_` so Stripe secrets are not baked into JS.
- No public unauthenticated production job board.
- No `console.log` of full customer records.
- Assume HTTPS in production.

## Out of scope

Customer accounts, admin CMS, charging 100% up front, PayPal-only, crypto.
