# How staff see bookings — My Home Removals

There is **no server** in this app today. A booking lives in:

1. **The business inbox** (primary, production)
2. **The customer’s inbox** (confirmation copy)
3. **This browser only** (demo board)

Do not treat the demo board as a diary.

## New bookings (now)

When a customer taps **Book this move** and EmailJS is configured:

1. A **business** email goes to `CONFIG.COMPANY_EMAIL` (`bookings@movemyhome.com.au` unless you change it).
2. A **client** email goes to the address they entered.

The business email includes `job_details`: customer contact, route, schedule, inventory summary, quote total, and notes.

**Staff workflow:** watch that mailbox (or a filtered Gmail/Outlook label such as `New bookings`). Reply from the same thread — Reply-To is the customer.

If EmailJS is not configured, the app is in demo mode: no email is sent. Ask the customer to WhatsApp or call.

## Upcoming jobs

Sort the inbox (or a calendar you copy into) by **move date** in the email body.

Suggested daily habit:

- Morning: unread “NEW BOOKING REQUEST” mail → call to confirm → star/label **Confirmed**.
- Confirmed jobs with a date from today through the next 7 days are **upcoming**.
- After the job, archive or label **Done**.

## Future jobs

Moves more than a week out stay in the same inbox. Optional: when you confirm, create a calendar event from the email (date, time, addresses, phone).

## Demo staff board (this browser only)

Open `/#staff-jobs` on the device that submitted the quote. Jobs are stored in `localStorage` key `mhr_demo_jobs` and labelled **Demo only**.

Filters:

- **New** — saved in the last 24 hours
- **Upcoming** — everyone else with a nearer date
- **Future** — move date more than 7 days away

Clearing site data deletes the demo list. Another phone will not see it.

## Later: a real jobs dashboard

When you add an API, store at least:

| Field | Why |
| --- | --- |
| `id`, `createdAt`, `status` | `new` / `confirmed` / `done` / `cancelled` |
| `customerName`, `email`, `phone` | Contact |
| `pickup[]`, `dropoff[]` | Addresses, access, loading dock |
| `moveDate`, `moveTime` | Diary |
| `serviceType`, `vehicle`, `crewSize`, `inventory` | Crew planning |
| `quoteTotal`, `quoteLines`, `currency=AUD` | Money |
| `notes`, `distanceKm`, `isInterstate` | Ops |
| `emailClientSent`, `emailBusinessSent` | Support |

A simple next step: a password-protected `/staff` page that reads from a hosted database (e.g. Supabase) or from inbound EmailJS webhooks. Until then, **the inbox is the source of truth**.
