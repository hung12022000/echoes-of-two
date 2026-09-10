# Release checklist — coastal vertical slice

## Local verification completed on 2026-09-10

- [x] npm ci
- [x] npm run typecheck
- [x] npm run test:run — 21 tests
- [x] npm run build
- [x] npm run verify:dist (GLB integrity/rig/animations, required textures, credits, asset budgets and Pages base)
- [x] npm run test:e2e (offline gameplay, mobile menu, failed asset/retry)
- [x] Real WebRTC two-context QA: create/join/ready/start/chat/movement/ROOM_FULL/boss synchronization
- [x] Guest tab closed and reopened; host retained and guest restored the ongoing boss state
- [x] Inspect landing, coast/Hòn Trống Mái, portraits and combat screenshots

## Publishing gates

Final status is reported by the [GitHub Actions run](https://github.com/hung12022000/echoes-of-two/actions) for the published commit; this local checklist is not a claim of deployment success.

- [x] GitHub Actions production build and Pages deployment successful — [run 34496691018](https://github.com/hung12022000/echoes-of-two/actions/runs/34496691018), feature commit 6b92f70
- [x] Live Pages URL serves and renders the new scene; live two-context room/chat/movement/boss/guest-rejoin QA passed

## Not certified in this slice

- [ ] Two physical computers on separate networks / strict NAT and TURN
- [ ] 60 FPS Medium / 30 FPS Low on representative consumer hardware
- [ ] Long play sessions and host-loss recovery
- [ ] Full original puzzles, regular enemies, original boss patterns and M0–M7 acceptance
