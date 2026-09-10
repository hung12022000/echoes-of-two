# Implementation status — 2026-09-11

This is a playable coastal co-op vertical slice, not acceptance-complete M0–M7. The original specification remains unchanged in GAME_SPEC.md. Earlier checkmarks for puzzle/combat/boss rules did not mean those milestones were fully implemented.

## Implemented in this revision

- Oceanbound playable loop layered onto the existing coastal game without replacing Hưng or Mei.100.
- Data-driven catalog with 24 item definitions and 17 recipes across survival, tools, building and storm defense.
- Gatherable world resources with respawn, hook collection bonus and chain crafting from raw resources to materials, devices and structures.
- Survival simulation for health, hunger, thirst and stamina; consumable water/coconut/fish; safe recovery instead of abrupt permanent death.
- Animated vertex-displaced ocean, bobbing starter raft, floating salvage, visible reef shark and a forecasted clear/wind/storm/eye cycle.
- Grid-quantized placement and rendered 3D pieces for foundations, walls, doors, roofs, storage, purifier, grill, claim beacon, storm anchor and lightning rod.
- Persistent island development, autosave, map markers with notes/types, selectable waypoint and a reusable save schema.
- Host-authoritative synchronization for survival crafting/build/marker commands and world snapshots.
- WebRTC now uses multiple STUN endpoints, four automatic connection attempts, optional production TURN configuration and direct/relay diagnostics.

- Bright responsive landing page with an AI-created Vietnamese coast illustration.
- Explorable coastal island (approximately 134 × 124 m movement bounds), forest, textured sand/rock, animated sea and original procedural Hòn Trống Mái.
- Two licensed human GLBs: skin textures, rigs, six motion clips each; original spectacles inspired by the supplied drawing.
- Camera-relative walk/run/jump/dodge, animation blending, additive combat poses, damage/cooldowns, guard, revival, restart and offline AI.
- Warden encounter: energy marks, armor exposure, three HP phases, telegraphed ground slam, victory/defeat and pooled VFX.
- Actual two-person PeerJS/WebRTC room, invitation link, ready gate, host-authoritative simulation, transform/combat snapshots, chat, third-player rejection and reconnect control.
- Graphics presets, reduced environmental motion, sound mute, error/retry UI, lazy-loaded 3D engine.
- Reproducible Blender/texture asset pipeline with pinned source commit and texture checksums.

## Original milestone audit

- M0: scaffold, strict TypeScript, build and deployment pipeline implemented.
- M1: playable controller and one coastal map implemented; full level flow, coyote time, foot IK and obstacle navigation remain.
- M2: WebRTC transport implemented as a practical alternative. Original Supabase Broadcast/Presence acceptance, production TURN, host migration and persistence remain.
- M3: original multi-stage co-op puzzles are NOT implemented in the rendered game. Existing pure puzzle rules are not a playable puzzle level.
- M4: playable basic combat implemented; regular enemies and original full combat/weapon system remain.
- M5: playable simplified three-phase Warden implemented; original mirror/clone boss mechanics remain.
- M6: major visual/audio improvement implemented; custom photoreal likenesses, authored paired contact animations, advanced lighting and professional sound remain.
- M7: release gates and Pages workflow implemented for this slice; full specification acceptance and performance qualification remain.

## Verification evidence

The unit suite exercises movement, jump edges, bounds, cooldowns/range, marks/exposure, two-player consent for E, revival, slam avoidance, all boss phases through actual attacks, snapshot validation and prior serialization/rules.

Browser automation exercises actual GLB loading and rendering, survival crafting/building/map marker flow, offline movement/jump/link/boss/restart, invalid room input/mobile layout and missing-asset recovery. Separate online QA uses two isolated Chromium contexts and the real public signaling service to check room joining, ready/start, chat, host-authoritative crafting, synchronized movement/boss state and restoration after closing/reopening the guest tab. The optional third-client rejection stress check is available with `QA_THIRD=1`. Run WebGL suites sequentially: parallel software-rendered browsers can overwhelm the test computer and trigger connection timeouts.

Local release budgets: 24.89 MiB total dist, 19.02 MiB required scene artwork/models/textures, approximately 844 KiB all JavaScript combined gzip. Two GLBs each below 12 MiB; six animation groups verified per character.

Hardware rendering quality and 60 FPS are not certified by headless software-rendered tests. See RELEASE_CHECKLIST.md for release gates and KNOWN_ISSUES.md for unfinished work.
