# SC Incentive Policy Simulator

FieldAssist Solution Consulting incentive policy simulator — Next.js (App Router),
React, TypeScript, Tailwind CSS. No backend, database or authentication.
Policy configuration is stored centrally in Upstash Redis, so a configuration
saved by one user is served to every browser and device on the same deployment.

## Getting started

    npm install
    npm run dev      # http://localhost:3000

## Production build

    npm run build
    npm start

## Configuration store (Upstash Redis)

Create an Upstash Redis database, then set both variables locally in `.env.local`
and in the Vercel project (Settings → Environment Variables):

    UPSTASH_REDIS_REST_URL=
    UPSTASH_REDIS_REST_TOKEN=

`.env.example` lists the same names. Credentials are read server-side only and
are never sent to the browser — the client reaches the store solely through
`/api/config`.

The complete configuration is held under one key:

    sc:incentive:policy:active

If no value is saved yet, or the store is unreachable, the app falls back to the
defaults in `lib/config.ts`.

## Deploy to Vercel

**Dashboard** — Add New → Project → import this repository. Vercel detects
Next.js automatically. Add the two Upstash variables above under Settings →
Environment Variables (or attach an Upstash integration, which injects them),
then deploy.

**CLI**

    npx vercel --prod

## Structure

    app/            layout, page, global stylesheet, api/config route
    components/     App shell, Calculator, Policy, Simulator, Admin, shared UI
    lib/            calculation engine, configuration, redis client, formatting
    types/          shared TypeScript types

`lib/calc.ts` holds the calculation engine. The Calculator and the Scenario
Simulator both call it, so identical inputs always produce identical outputs.
`lib/config.ts` holds `DEF`, the immutable default configuration used whenever
nothing is saved centrally; the shipped values are draft assumptions, not
approved policy. `lib/redis.ts` and `app/api/config/route.ts` provide the shared
store: `GET /api/config` reads it, `PUT /api/config` validates and writes it.

Editing Formula Admin changes local state only. Pressing **Save** writes the
configuration to Redis; **Reset Defaults** loads `DEF` into the editor and is
likewise not persisted until Save is pressed.
