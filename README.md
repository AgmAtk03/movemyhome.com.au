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

## Owner setup (required for real bookings)

Until these are set, the wizard still works. Booking submit runs in **demo mode**: no emails are sent, and a copy is stored only in that browser (`#staff-jobs`).

### 1. EmailJS — two confirmation emails

Create an [EmailJS](https://www.emailjs.com/) account and an email service (Gmail or similar) that can send from a mailbox you control.

Create **two templates** in the same EmailJS service:

| Template | Who receives it | Suggested “To email” |
| --- | --- | --- |
| Client confirmation | The customer | `{{to_email}}` (the address they typed) |
| Business / job sheet | The office | hard-code `bookings@movemyhome.com.au` **or** `{{to_email}}` (the app sends `CONFIG.COMPANY_EMAIL`) |

Use these template variables (all are sanitised plain text):

```
{{company_name}} {{company_email}} {{company_phone}}
{{customer_name}} {{user_email}} {{user_phone}} {{reply_to}} {{to_email}}
{{move_date}} {{service_type}} {{vehicle}} {{crew_size}} {{move_type}}
{{total_quote}} {{quote_lines}} {{inventory}} {{route}}
{{distance}} {{travel_time}} {{special_instructions}} {{included}}
{{job_details}}
{{email_kind}}          → "client" or "business"
```

Recommended template idea:

- **Client:** short “we’ve received your request” with quote total, date, and “we’ll call to confirm”.
- **Business:** paste `{{job_details}}` — full route, schedule, inventory, quote, and contact. Set **Reply-To** to `{{reply_to}}`.

Then in `.env.local` (and in Vercel/Netlify env):

```
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_CLIENT_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_BUSINESS_TEMPLATE_ID=template_yyyyyyy
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxx
```

Rebuild after changing Vite env vars. EmailJS public keys are designed for the browser; still restrict the key in the EmailJS dashboard.

Alternative: one template with a BCC to the office. Two templates are clearer because the customer should not receive the internal job sheet.

### 2. WhatsApp Business

Set `VITE_WHATSAPP_NUMBER` to digits only with country code, for example `61412345678` (no `+`, no spaces). The app builds a `wa.me` link with a prefilled, sanitised booking summary.

### 3. Stripe (placeholder only)

Do **not** put secret keys in this repo.

1. In Stripe, create a **Payment Link** priced in **AUD** (deposit or “pay the quote”).
2. Set `VITE_STRIPE_PAYMENT_LINK=https://buy.stripe.com/...`
3. Optionally store `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...` for a later Checkout embed — unused until you add Stripe.js.

Until a Payment Link is set, the UI explains that card payment is not live and that a link will be sent after confirmation.

### 4. Google Maps (route autocomplete)

Enable Maps JavaScript API, Places API, and Directions API. Restrict the key to HTTP referrers (`http://localhost:3000/*` and your production domain). Set `VITE_GOOGLE_MAPS_API_KEY`. Without it, customers can still type addresses; distance is confirmed by the team.

### 5. Company details

Edit `constants.ts` for phone, email, and website if they change. `CONFIG.COMPANY_EMAIL` is the business inbox used for the staff confirmation.

## How staff see jobs

See [JOBS.md](./JOBS.md). Today: **email inbox first**, optional demo board at `/#staff-jobs`.

## Quote vs booking

| Action | What it does |
| --- | --- |
| **Get my quote** | Opens the wizard. The footer total is a live quote. |
| **Continue** | Next step. Validation messages appear if something is missing. |
| **Book this move** | Sends client + business emails (when EmailJS is configured). No card charge. |

## Security

- No live API secrets belong in git. Use `.env.local` and host env.
- User text in emails, `mailto`, and WhatsApp is sanitised (control characters and `<>` stripped, length-capped, URL-encoded for `wa.me`).
- The previous hardcoded Google Maps key was removed from `index.html`.
