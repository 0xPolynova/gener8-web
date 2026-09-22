# gener8

Token-gated AI video studio on Solana.

**Hold GENER8 → Create AI content → Publish → Discover**

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Solana wallet adapter + SPL token balance checks
- Supabase-ready schema (in-memory store until credentials are set)
- Pluggable video generation providers (mock by default)

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo mode is on by default (`DEMO_MODE=true`). After connecting a wallet and signing in, the server reports a mock GENER8 balance so generation can be exercised without a live mint or paid video API.

## Environment

See `.env.example` for:

- Supabase
- Solana RPC + GENER8 SPL mint
- Token-gating thresholds
- AI video provider keys
- Storage / CDN

Never put secrets in `NEXT_PUBLIC_*` variables.

## Token gating

Holding GENER8 is an **access requirement**, not a burn. The backend verifies SPL balance before creating a job. Tiers live in `src/lib/config/gating.ts` and env — not in UI components.

## Provider swap

1. Implement `VideoGenerationProvider` in `src/lib/generation/live.ts`
2. Select it from `src/lib/generation/index.ts` via `VIDEO_PROVIDER`
3. Keep vendor keys server-side

## Database

Run `supabase/schema.sql` in the Supabase SQL editor when you connect a project. Until then, `src/lib/data/store.ts` serves seeded content.
