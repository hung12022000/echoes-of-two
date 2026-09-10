# Implementation status

## Milestone 0 — Bootstrap

- [x] Vite + React + TypeScript strict scaffold
- [x] Babylon canvas entry and landing menu
- [x] Vitest and Playwright configuration
- [x] GitHub Pages workflow and dist verification
- [x] `npm install` completed and lockfile committed to workspace
- [x] `npm run typecheck` pass
- [x] `npm run test:run` pass (9 tests)
- [x] `npm run build` pass
- [x] `npm run verify:dist` pass
- [x] `npm ci` pass
- [x] Playwright smoke pass (1 test)

## Milestones 1–7

- [~] M1 Single-player foundation (procedural scene/menu preview; controller/input still pending)
- [~] M2 Multiplayer room (Supabase client abstraction; join/presence protocol still pending)
- [x] M3 Co-op puzzles (pure rules and version-ready state; scene interaction wiring pending)
- [x] M4 Combat (intent/result and damage rules; scene encounter wiring pending)
- [x] M5 Boss (three-phase state rules; boss scene wiring pending)
- [ ] M6 Art/audio/polish
- [ ] M7 Release

## Current plan

Build one playable scene with shared state abstractions and procedural art, then gate each milestone on typecheck, tests and production build.

## Verification log

2026-09-10: `npm ci` pass; `npm run typecheck` pass; `npm run test:run` pass (9/9); `npm run build` pass; `npm run verify:dist` pass; `npm run test:e2e` pass (1/1). The full two-browser Supabase flow, network reconnect, wired puzzles/combat/boss encounter and release deployment are not yet acceptance-complete.
