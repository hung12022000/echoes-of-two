# Known issues

- Realtime multiplayer requires a configured Supabase project and two browser sessions.
- Babylon rendering quality varies by browser/GPU; fallback visuals are intentionally lightweight.
- The current UI launches a local demo room; production create/join/presence, chat, transform sync and reconnect wiring remain to be implemented.
- Puzzle, combat and boss modules are implemented and tested as deterministic rules, but are not yet wired into the rendered scene.
- Vite reports a large Babylon chunk (~1.3 MB gzip), above the preferred initial bundle target.
