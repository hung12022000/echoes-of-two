# Release checklist — coastal vertical slice

## Local verification completed on 2026-09-11

- [x] npm ci
- [x] npm run typecheck
- [x] npm run test:run — 47 tests
- [x] npm run build
- [x] npm run verify:dist (GLB integrity/rig/animations, required textures, credits, asset budgets and Pages base)
- [x] npm run test:e2e (offline gameplay, mobile menu, failed asset/retry)
- [x] Real WebRTC two-context QA: create/join/ready/start/chat/craft/movement/ROOM_FULL/boss synchronization
- [x] Simulated heartbeat disconnect/reconnect; host retained and guest restored the ongoing boss state
- [x] Inspect landing, Hòn Trống Mái, bare starter raft, first-person hook/hammer, map, third-person and combat screenshots at 1440×900
- [x] Shark raid logic: warning, spear repel, timed bite loss, raft-module/item destruction and save/network normalization covered by unit tests
- [x] Natural shark visual QA: warning approach and bite screenshots captured without a production shortcut; no page/console errors
- [x] Water exclusion: actor cannot walk off the starter raft or living raft foundations; island traversal is limited to terrain above sea level
- [x] Final-build soak: 3602 seconds, 341 movement/state samples, no crash, page error, non-finite state or out-of-bounds escape

## Publishing gates

Final status is reported by the [GitHub Actions run](https://github.com/hung12022000/echoes-of-two/actions) for the published commit; this local checklist is not a claim of deployment success.

- [x] GitHub Actions production build and Pages deployment successful — [run 34496691018](https://github.com/hung12022000/echoes-of-two/actions/runs/34496691018), feature commit 6b92f70
- [x] Live Pages URL serves and renders the new scene; live two-context room/chat/movement/boss/guest-rejoin QA passed

## Not certified in this slice

- [ ] Two physical computers on separate networks / strict NAT and TURN
- [ ] 60 FPS Medium / 30 FPS Low on representative consumer hardware
- [ ] Host-loss migration to a new authoritative player
- [ ] Full original puzzles, regular enemies, original boss patterns and M0–M7 acceptance
