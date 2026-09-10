# Known issues and scope

- This is a browser vertical slice, not Unreal Engine, not a full It Takes Two-scale game, and not all original milestones are complete.
- Hưng and Mei use licensed Rocketbox adult avatars. They are not scans or verified likenesses of the user/couple. The drawing inspired glasses and the menu mood only.
- Six imported motions per character are blended with procedural combat/jump poses. There is no foot IK, motion matching, facial acting, authored hand-holding/contact animation or complete weapon animation set. Some foot sliding/clipping is still possible.
- The landscape and Hòn Trống Mái are original procedural interpretations, not surveyed replicas. Water uses an animated shader, not full physical simulation or ray-traced reflections. Trees/rocks remain stylized at close range.
- The menu illustration is AI artwork, not a screenshot or a promise of in-game graphical fidelity.
- Full puzzles, enemy waves, story progression, saves/checkpoints, original mirror/clone boss and all M0–M7 acceptance criteria remain unfinished.
- WebRTC needs reachable PeerJS signaling and a compatible network. No private TURN server, room password, accounts, dedicated authoritative server or host migration is configured. Host tab must stay open. On disconnect, keep host open, reopen guest slot if needed and reconnect the guest with the same code.
- Browser contexts, boss synchronization and guest close/rejoin were tested on one computer. Two physical devices on separate networks, long-session reliability and restrictive NAT are not certified. Disconnect detection can take up to a minute during initial loading grace; later it uses a 20-second heartbeat timeout. Extreme GPU/main-thread stalls can still cause a timeout.
- Host simulates at its render cadence and sends 12 Hz snapshots. Slow host GPUs and latency can affect responsiveness; guest has visual smoothing but no predictive controller. Background-tab throttling can stall a session.
- Collision is terrain/bounds/warden only; trees and decorative ruins are not solid obstacles. No mobile touch controls yet; desktop keyboard/mouse recommended.
- Graphics presets primarily reduce resolution/shadow quality. FPS targets have not been certified on representative hardware. Headless SwiftShader is not a GPU performance benchmark.
- npm audit previously reported two moderate development-tool dependency advisories. No automatic breaking dependency upgrade was applied.
