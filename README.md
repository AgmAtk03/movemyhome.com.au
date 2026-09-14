# My Home Removals — quote & booking wizard

Mobile-first quote and booking app for **My Home Removals** (Sydney home, room, and item moves). Australian English throughout.

This is the live app repo ([movemyhome.com.au](https://github.com/AgmAtk03/movemyhome.com.au)). A pointer-only repo exists at [AgmAtk03/aama-removals](https://github.com/AgmAtk03/aama-removals) — **do not move this app there**.

The running total is a **live quote**. **Book this move** sends the request to the team. Customers are **not charged** in this form.

## Run locally

**Prerequisites:** Node.js 18+

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the keys you have (all are optional to *load* the app).
3. `npm run dev` — opens on [http://localhost:3000](http://localhost:3000)
4. `npm run build` — TypeScript check + static site in `dist/`

Never commit `.env.local`. Placeholders such as `YOUR_PUBLIC_KEY` and `YOUR_WHATSAPP_NUMBER` are intentional.

## Quote vs booking vs pay

| Action | What it does |
| --- | --- |
| **Get my quote** | Opens the wizard. The footer total is a live quote. |
| **Continue** | Next step. Validation messages appear if something is missing. |
| **Book this move** | Sends client + business emails (when EmailJS is configured). No card charge. |
| **WhatsApp us with this job** | Only shown when `VITE_WHATSAPP_NUMBER` is set. Prefills a sanitised summary. |
| **Pay a deposit** | Only shown when `VITE_STRIPE_PAYMENT_LINK` is a real `https://buy.stripe.com/...` (or other `*.stripe.com`) link. |

After a successful book, the success screen always says **we’ll confirm by email**, then optional WhatsApp / deposit.

## Staff jobs board (`/#staff-jobs`)

Browser-local diary until a backend exists. Open `/#staff-jobs` or **Staff jobs (this device only)** on the landing.

- **New** — booked in the last 24 hours and not yet confirmed
- **Upcoming** — move date from today through the next 7 days (active jobs)
- **Future** — beyond 7 days
- **Done** / **Cancelled** — after you mark them

Each card has customer, phone/email, pickup → drop-off, time window, vehicle/crew, quote, items, notes. You can mark **confirmed / in progress / done / cancelled**, **copy a job sheet**, or **WhatsApp to crew** (opens WhatsApp with the sheet — pick the crew chat; it does not message the customer number).

Jobs are stored in `localStorage` (`mhr_demo_jobs`). Clearing site data deletes them. See [JOBS.md](./JOBS.md).

## Owner setup (required for real bookings)

Until these are set, the wizard still works. Booking submit runs in **demo mode**: no emails are sent, and a copy is stored only in that browser (`#staff-jobs`). Customer UI **does not** show broken WhatsApp or Stripe buttons — those appear only when configured.

### 1. EmailJS — two confirmation emails

Create an [EmailJS](https://www.emailjs.com/) account and an email service (Gmail or similar) that can send from a mailbox you control.

Create **two templates** in the same EmailJS service:

| Template | Who receives it | Suggested “To email” |
| --- | --- | --- |
| Client confirmation | The customer | `{{to_email}}` (the address they typed) |
| Business / job sheet | The office | hard-code `bookings@movemyhome.com.au` **or** `{{to_email}}` (the app sends `CONFIG.COMPANY_EMAIL`) |

Use these template variables (tags and control characters stripped; use `{{job_details_html}}` / `{{customer_name_html}}` if you need already HTML-escaped values):

```
{{company_name}} {{company_email}} {{company_phone}}
{{customer_name}} {{user_email}} {{user_phone}} {{reply_to}} {{to_email}}
{{move_date}} {{service_type}} {{vehicle}} {{crew_size}} {{move_type}}
{{total_quote}} {{quote_lines}} {{inventory}} {{route}}
{{distance}} {{travel_time}} {{special_instructions}} {{included}}
{{job_details}}
{{email_kind}}          → "client" or "business"
```

Then in `.env.local` (and in Vercel/Netlify env):

```
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_CLIENT_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_BUSINESS_TEMPLATE_ID=template_yyyyyyy
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxx
```

Rebuild after changing Vite env vars. Restrict the EmailJS public key in the dashboard.

### 2. WhatsApp Business

Set `VITE_WHATSAPP_NUMBER` to digits only with country code, for example `61412345678` (no `+`, no spaces). The app builds a `wa.me` link with a prefilled, sanitised booking summary. If this is unset, the WhatsApp button is hidden (a call link remains).

### 3. Stripe Payment Link (AUD deposit)

Do **not** put secret keys in this repo. Publishable keys and Payment Link URLs are public-by-design but still belong in env, not git.

1. In Stripe, create a **Payment Link** priced in **AUD** (a fixed deposit, or “customer chooses amount”).
2. Set `VITE_STRIPE_PAYMENT_LINK=https://buy.stripe.com/...`
3. Optionally store `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...` for a later Checkout embed — unused until you add Stripe.js.

The app appends, when the link host is Stripe:

- `prefilled_email` — the customer’s sanitised email
- `client_reference_id` — `mhr-{date}-{name}` so you can match the payment to the job

**Amount cannot be changed via query string** on a standard Payment Link. Set the deposit in the Stripe Dashboard. After we confirm a job you can still email a custom Payment Link if the quote differs.

Until a Payment Link is set, customers see a short “deposit link coming soon” line — not a dead button.

### 4. Google Maps (route autocomplete)

Enable Maps JavaScript API, Places API, and Directions API. Restrict the key to HTTP referrers (`http://localhost:3000/*` and your production domain). Set `VITE_GOOGLE_MAPS_API_KEY`. Without it, customers can still type addresses; distance is confirmed by the team.

### 5. Company details

Edit `constants.ts` for phone, email, and website if they change. `CONFIG.COMPANY_EMAIL` is the business inbox used for the staff confirmation.

## Security

- No live API secrets belong in git. Maps, EmailJS, WhatsApp, and Stripe are read only from `VITE_*` env (see `.env.example`).
- User text in emails, `mailto`, `tel`, and WhatsApp is sanitised (control characters and `<>` stripped, length-capped, URL-encoded). Stripe and WhatsApp hrefs must be `https` on allowed hosts.
- `index.html` sets `referrer` = `strict-origin-when-cross-origin`, `robots` = `index,follow`, and a **Content-Security-Policy** meta tag that still allows Maps, EmailJS, Tailwind CDN, Phosphor (unpkg), and Vite HMR (`unsafe-eval` / `ws:` for local dev).
- Prefer the same CSP as a **host header** in production (Vercel already sends Referrer-Policy, nosniff, SAMEORIGIN). Tighten `script-src` (drop CDN Tailwind / `unsafe-eval`) if you later self-host CSS and stop using the Tailwind CDN.
- The previous hardcoded Google Maps key was removed from `index.html`.
