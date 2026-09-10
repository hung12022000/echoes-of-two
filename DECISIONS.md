# Decisions

- Procedural Babylon meshes are used for the first slice so the game has no unclear third-party asset licenses.
- Supabase is an optional transport; missing environment variables must never crash single-player.
- Shared gameplay rules are pure TypeScript modules so they can be tested without WebGL.
