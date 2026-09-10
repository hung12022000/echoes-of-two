# Hưng & Mei.100: Echoes of Two

Stylized 3D co-op vertical slice built with React, Vite, TypeScript strict and Babylon.js.

## Run locally

```bash
npm ci
npm run dev
```

The game remains playable in single-player when Supabase variables are empty. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` plus the client anon/publishable key to enable the production realtime transport. Never put a service-role key in the frontend.

Production checks: `npm run typecheck`, `npm run test:run`, `npm run build`, `npm run verify:dist`.

## Supabase and Pages

Create a free Supabase project, enable Realtime, then add the two `VITE_` values as local variables and GitHub repository secrets. In GitHub, set Pages → Source to GitHub Actions. The expected URL is `https://hung12022000.github.io/echoes-of-two/`.

All visual/audio assets in this slice are generated from Babylon primitives and Web Audio; see `ASSET_ATTRIBUTION.md` and `ASSET_REPLACEMENT_PLAN.md`.
