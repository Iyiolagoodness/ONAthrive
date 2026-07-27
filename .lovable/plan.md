
# LogiLink AI — Iteration 1 Plan

The full blueprint (customer + driver + fleet + admin + AI + payments + escrow + tracking) is a multi-month build. To make real progress, iteration 1 is scoped to **the marketing homepage + Supabase wiring only**. Later iterations add auth, dashboards, shipments, bids, etc.

## 1. Connect your existing Supabase

- Add `VITE_SUPABASE_URL = https://udneyhtigimwiumqkbbn.supabase.co` and `VITE_SUPABASE_PUBLISHABLE_KEY = <your anon key>` as project env vars (anon key is a JWT publishable key — safe in the client).
- Create `src/integrations/supabase/client.ts` exporting a typed `supabase` client from `@supabase/supabase-js`.
- Add a `src/integrations/supabase/types.ts` placeholder for generated types (regenerated later when we know your schema).
- **No Lovable Cloud.** No server-side service role, no admin client, no auth middleware yet — those come when we add features that need them.
- Verify with a trivial `supabase.from(...).select()` call in a hidden dev-only debug spot, then remove.

I'll need to know what tables/schema already exist in your Supabase to wire real data. For iteration 1 the homepage is static, so this is just plumbing.

## 2. Homepage build (light + dark theme)

Single route `src/routes/index.tsx` replacing the placeholder. Sections from Volume 2:

1. Hero — headline, subheadline, dual CTA (Ship a Package / Become a Transporter), quick shipment search (pickup state / destination state / package type), live stats strip.
2. Trusted-by logo row (placeholders).
3. How It Works — 5 illustrated steps.
4. Live Marketplace Feed — sample cards (Lagos→Kano, Abuja→Port Harcourt, etc.).
5. Why Choose Us — 8 feature cards.
6. Testimonials — 3 cards.
7. Coverage teaser — Nigeria map graphic + state counts (static).
8. Pricing overview — commission / escrow / premium / business.
9. FAQ accordion.
10. CTA banner.
11. Footer — company / support / social / newsletter.

Global chrome:
- Sticky nav (logo, Home, Marketplace, Find Transporters, How It Works, Business, Pricing, About, Support, Login, Register).
- Theme toggle (light ↔ dark), persisted to `localStorage`.
- Responsive down to mobile.

## 3. Design tokens

Per Volume 2 brief:
- Primary blue `#0B5FFF`, success `#14B86A`, accent orange `#FF8A00`.
- Neutrals: white, `#111827`, `#F5F7FA`.
- Fonts: Poppins (headings), Inter (body), Space Grotesk (numbers) — loaded via `<link>` in `__root.tsx`.
- Tokens defined in `src/styles.css` under `@theme inline` + `:root` / `.dark` in oklch; shadcn tokens (`--primary`, `--background`, etc.) mapped to the palette so no component hardcodes colors.

## 4. Route-level SEO

- `index.tsx` gets its own `head()` with LogiLink-specific title, description, og:title/description, og:type=website, twitter:card.
- `__root.tsx` metadata cleaned up (remove "Lovable App" placeholder).

## 5. Brand name

Using **LogiLink** as the working brand until you decide otherwise.

## Technical notes

- Stack: TanStack Start v1 + React 19 + Tailwind v4 (already set up). No router changes.
- No new tables, no migrations, no server functions in this iteration.
- `@supabase/supabase-js` installed via `bun add`.

## Out of scope for iteration 1 (future iterations)

- Registration/login (customer + transporter), OTP, KYC uploads.
- Customer dashboard, create shipment, bids page, tracking timeline.
- Driver dashboard, jobs, wallet, withdrawals.
- Marketplace feed (real data), chat, notifications.
- Escrow/payments, wallet, referrals, loyalty.
- Admin panel, analytics, AI matching/pricing/fraud.
- Mobile app, public API, warehouse/fleet, cross-border.

## Open questions

I still need answers to build iteration 2 well; not blockers for iteration 1:
- Confirm brand name (LogiLink vs CargoConnect / MoveNaija / SwiftHaul / other).
- Which existing tables live in your Supabase? Share names + roughly which columns, or invite me to inspect via a service-role key later when we start writing server functions.
- Do you want me to explore 2–3 rendered homepage design directions first, or build straight from the Volume 2 spec?
