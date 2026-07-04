# Pricing page + Stripe checkout

## Files
- `app/pricing/page.tsx` — pricing UI, two plans (Starter $197/mo, Growth $297/mo)
- `app/api/create-checkout/route.ts` — POST endpoint that creates the Stripe Checkout Session
- `lib/stripe.ts` — Stripe server client
- `lib/auth.ts` — stub for getting the logged-in user; **wire this to your real auth**

## Setup
1. `npm install stripe`
2. In the Stripe Dashboard, create two recurring Prices ($197/mo and $297/mo) and copy their
   Price IDs (`price_...`).
3. Copy `.env.local.example` to `.env.local` and fill in:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_STARTER`
   - `STRIPE_PRICE_GROWTH`
4. In `lib/auth.ts`, replace the stub with your real session lookup (NextAuth `auth()`,
   Clerk `currentUser()`, Supabase `auth.getUser()`, etc). It just needs to return
   `{ id, email }` for the signed-in user.

## Flow
1. User clicks "Start 14-day trial" on a plan card in `/pricing`.
2. Client POSTs `{ plan: "starter" | "growth" }` to `/api/create-checkout`.
3. The route looks up the right Stripe Price ID from env, creates a subscription-mode
   Checkout Session with `trial_period_days: 14`, and stamps `userId` + `plan` into both
   the session metadata and the subscription metadata (so it's available on the
   subscription object too, not just the checkout session).
4. The route returns `{ url }`; the client redirects the browser there.
5. On success, Stripe redirects to `/dashboard?success=true`.
6. On cancel, Stripe redirects to `/pricing?cancelled=true`.

## Recommended next step
Add a webhook route (`app/api/webhooks/stripe/route.ts`) listening for
`checkout.session.completed` / `customer.subscription.*` to persist the subscription
status against the user in your database — the checkout redirect alone shouldn't be
trusted as proof of payment since it happens client-side.
