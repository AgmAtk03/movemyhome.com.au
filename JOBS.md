# How staff see bookings — My Home Removals

There is **no server** in this app today. A booking lives in:

1. **The business inbox** (primary, production) — EmailJS business template
2. **The customer’s inbox** (confirmation copy)
3. **This browser only** — `/#staff-jobs` demo diary (`localStorage` key `mhr_demo_jobs`)

Do not treat the demo board as the company of record. Another phone will not see it. Clearing site data deletes it.

## New / upcoming / future (demo board)

| List | Rule |
| --- | --- |
| **New** | Booked in the last 24 hours and still workflow **new** (not confirmed yet) |
| **Upcoming** | Active job whose move date is today through the next 7 days |
| **Future** | Active job more than 7 days out |
| **Done** / **Cancelled** | After you tap those actions |

Mark **confirmed → in progress → done** (or **cancel**). That status is saved in this browser. Copy the **job sheet** or **WhatsApp to crew** (WhatsApp opens with the sheet so you can pick a crew chat).

Production habit if EmailJS is on: still watch `CONFIG.COMPANY_EMAIL` first, then mirror the job on this device if you like a visual list.

## Intended server model (later)

When you add an API, store at least:

| Field | Why |
| --- | --- |
| `id`, `createdAt`, `workflowStatus` | `new` / `confirmed` / `in_progress` / `done` / `cancelled` |
| `customerName`, `email`, `phone` | Contact |
| `pickup[]`, `dropoff[]` | Addresses, access, loading dock |
| `moveDate`, `moveTime` | Diary + “upcoming vs future” |
| `serviceType`, `vehicle`, `crewSize`, `inventory` | Crew planning |
| `quoteTotal`, `quoteLines`, `currency=AUD` | Money |
| `notes`, `distanceKm`, `isInterstate` | Ops |
| `emailClientSent`, `emailBusinessSent` | Support |
| `stripePaymentLinkId` / `client_reference_id` | Match deposits |

A simple next step: a password-protected `/staff` page that reads from a hosted database (e.g. Supabase) or from inbound EmailJS webhooks. Until then, **the inbox is the source of truth**; `/#staff-jobs` is a labelled in-browser aid.
