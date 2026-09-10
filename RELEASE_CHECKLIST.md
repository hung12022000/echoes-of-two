# Release checklist

- [ ] Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` secrets.
- [ ] Run `npm ci`, typecheck, tests, build and `verify:dist`.
- [ ] Set GitHub Pages source to Actions and verify the `/echoes-of-two/` URL.
- [ ] Validate two-browser room, puzzles, boss, reconnect and low-quality mode.
- [x] Local menu → lobby → Babylon demo smoke test.
- [x] Deterministic rules and checkpoint serialization unit tests.
