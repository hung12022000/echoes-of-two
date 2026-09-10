# Decisions

- Preserve GAME_SPEC.md verbatim; document deviations rather than silently claiming acceptance.
- Latest user requests prioritize a bright Vietnamese coast, identifiable Hòn Trống Mái, human avatars and actual two-person play.
- Keep Vite + React + strict TypeScript + Babylon.js and the existing GitHub Pages URL.
- Use MIT Rocketbox rigs/motion converted with Blender and CC0 natural textures. Do not claim these are scanned custom likenesses.
- PeerJS/WebRTC is the implemented room transport because no Supabase project was configured. Original Supabase abstractions remain but are not the running room path. No backend credentials or paid service are added.
- Host owns health, damage, movement and boss state. Guest sends validated inputs. 12 Hz snapshots and bounded effects/chat keep payloads small.
- GitHub Pages is static hosting; it does not itself provide a game server. PeerJS Cloud supplies public signaling. A dedicated TURN/server is future work requiring configuration.
- CI rebuilds GLBs from pinned licensed sources using Blender 4.5.9 and caches results; raw FBX and Blender downloads stay out of Git.
- Antigravity was optional, not available through the current toolset, and was not used.
