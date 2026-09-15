# How bookings are recorded — My Home Removals

Production source of truth for a **held slot**:

1. Stripe Checkout Session (deposit amount in cents, metadata, `payment_status=paid`)
2. Webhook `checkout.session.completed` with a **verified signature**
3. EmailJS customer confirmation + business job sheet after a **verified paid** Checkout session (webhook, plus `/api/notify-paid-booking` if the customer lands on `/success`). Failures are logged and written to Stripe session metadata (`mail_client`, `mail_biz`, `mail_note`) — the success page does not claim an email was sent unless it was.

`/success?session_id=` is **not** proof of payment by itself. The page calls `/api/verify-checkout-session`, which retrieves the session from Stripe.

## Demo diary (`/#staff-jobs`)

**DEMO ONLY — not production ops.** Jobs on that screen live in this browser (`localStorage` key `mhr_demo_jobs`). Another phone will not see them. Clearing site data deletes them. There is no login; do not treat this as a staff system.

Demo-mode checkout (missing Stripe keys) stores an unpaid/demo row here so you can try the UI. That is not a paid booking.
