# CODEX BUILD SPEC
# Hưng & Mei.100: Echoes of Two

> **Mục đích của tài liệu:** cung cấp đặc tả đủ chi tiết để Codex có thể tạo một vertical slice game 3D co-op online, chạy được trên GitHub Pages, với backend realtime miễn phí ở quy mô thử nghiệm.
>
> **Nguyên tắc:** ưu tiên một bản chạy được, đẹp, có gameplay hoàn chỉnh trong 15 đến 25 phút. Không mở rộng thành game AAA, thế giới mở hoặc MMO trong giai đoạn đầu.

---

## 0. Chỉ thị bắt buộc cho Codex

Codex phải làm việc theo thứ tự sau, không bỏ bước:

1. Đọc toàn bộ tài liệu này trước khi viết code.
2. Tạo dự án mới độc lập, không sửa repository `Mei100_Angi`.
3. Dùng TypeScript strict mode.
4. Tạo game bằng Babylon.js, React và Vite.
5. Tạo multiplayer 2 người bằng Supabase Realtime Broadcast và Presence.
6. Không đặt secret hoặc service-role key trong frontend.
7. Chỉ dùng Supabase anon/publishable key ở client.
8. Mọi asset phải có giấy phép dùng lại rõ ràng hoặc là asset placeholder tự tạo.
9. Không được chặn tiến độ vì thiếu model đẹp. Trước tiên dùng primitive/procedural placeholder, sau đó thay bằng GLB.
10. Mỗi milestone phải chạy được bằng `npm run dev`, `npm run build`, `npm run preview`.
11. Không tạo file giả, hàm TODO rỗng hoặc nút giao diện không hoạt động.
12. Viết test cho state machine, room protocol, puzzle, damage, revive và boss phases.
13. Sau mỗi milestone, cập nhật `IMPLEMENTATION_STATUS.md`.
14. Giữ tổng output deploy mục tiêu dưới 250 MB và initial download dưới 20 MB.
15. Nếu có bất đồng giữa hiệu ứng đẹp và độ ổn định multiplayer, ưu tiên độ ổn định.
16. Khi lỗi build, sửa nguyên nhân, không vô hiệu hóa TypeScript/ESLint để lách lỗi.
17. Hoàn thành Milestone 0 đến Milestone 3 trước; chỉ làm Milestone 4 trở đi khi toàn bộ acceptance test trước đó đạt.

### Prompt khởi động dành cho Codex

```text
Bạn là lead game engineer và technical artist. Hãy đọc toàn bộ GAME_SPEC.md. Tạo repository chạy được cho vertical slice “Hưng & Mei.100: Echoes of Two”. Bắt đầu bằng Milestone 0, sau đó tiến tuần tự. Không hỏi lại các quyết định đã được khóa trong tài liệu. Nếu thiếu asset, dùng placeholder đẹp bằng Babylon primitives và material procedural. Sau mỗi milestone hãy chạy typecheck, unit tests, production build, ghi kết quả vào IMPLEMENTATION_STATUS.md và commit theo Conventional Commits. Tuyệt đối không đưa Supabase service_role key vào client. Chỉ kết thúc khi acceptance criteria của milestone hiện tại đều pass.
```

---

## 1. Tầm nhìn sản phẩm

### 1.1 Tên game

**Hưng & Mei.100: Echoes of Two**

Tên ngắn trong code: `echoes-of-two`.

### 1.2 Thể loại

- 3D cinematic co-op adventure.
- Hai người chơi online.
- Góc nhìn third-person, camera vai sau.
- Puzzle phối hợp, platforming nhẹ, chiến đấu vừa phải, boss fight ba phase.
- Một vertical slice hoàn chỉnh, chơi khoảng 15 đến 25 phút.

### 1.3 Trụ cột thiết kế

1. **Hai góc nhìn, một lời giải:** mỗi người nhận được thông tin hoặc năng lực khác nhau.
2. **Phối hợp thật sự:** không thể hoàn thành puzzle nếu một người chỉ đứng yên.
3. **Nhịp thay đổi liên tục:** khám phá, puzzle, traversal, combat, cinematic, boss.
4. **Đẹp nhưng nhẹ:** hình ảnh stylized cinematic, không photorealistic.
5. **Vào game nhanh:** tạo phòng, gửi mã sáu ký tự, người thứ hai nhập mã và bắt đầu.
6. **Không paywall:** bản vertical slice không thu phí và không có giao dịch.

### 1.4 Phạm vi khóa cứng của bản đầu

Có:

- Landing page.
- Settings đồ họa và âm thanh.
- Tạo phòng, nhập mã phòng, copy link mời.
- Chọn vai Hưng hoặc Mei.100, host ưu tiên Hưng, guest ưu tiên Mei.100.
- Hai người cùng di chuyển, chạy, nhảy, tương tác.
- Thấy nhau realtime với nội suy.
- Chat văn bản và quick ping.
- Một bản đồ Thành phố Trên Mây.
- Một puzzle cầu năng lượng.
- Một puzzle hai công tắc.
- Thu thập ba Echo Shard.
- Combat cơ bản.
- Một mini-boss ba phase.
- Downed/revive.
- Checkpoint và reconnect.
- Ending cinematic ngắn.
- Deploy GitHub Pages.

Không có trong bản đầu:

- Open world.
- Voice chat.
- Matchmaking công khai.
- Tài khoản người chơi.
- PvP xếp hạng.
- Dedicated authoritative server.
- Mobile touch controls hoàn chỉnh.
- Procedural world lớn.
- Crafting hoặc economy.
- Microtransaction.

---

## 2. Kịch bản và trải nghiệm

### 2.1 Bối cảnh

Astra là thành phố lơ lửng được vận hành bởi các Mạch Cộng Hưởng. Một biến cố gọi là **The Silence** đã làm các mạch mất đồng bộ, khiến từng quận thành phố trôi tách khỏi nhau. Ký ức của cư dân kết tinh thành Echo Shard, còn những ký ức bị méo tạo ra sinh vật Void.

Hưng và Mei.100 tỉnh dậy ở hai tháp đối diện. Cả hai mang hai nửa của **Liên Kết 100**. Hưng tác động lên vật chất và lực; Mei.100 tác động lên năng lượng và nhịp thời gian. Mỗi năng lực riêng lẻ không đủ để khởi động lại thành phố.

### 2.2 Bản chất mối liên kết

- Khoảng cách dưới 15 m: hồi chậm năng lượng Link.
- Khoảng cách từ 15 đến 35 m: không hồi.
- Khoảng cách trên 35 m: màn hình xuất hiện distortion nhẹ, không gây damage.
- Khi một người downed, người còn lại có 20 giây để revive.
- Revive cần giữ tương tác 3 giây trong bán kính 2 m.
- Nếu hết thời gian, cả hai quay về checkpoint gần nhất.

### 2.3 Nhịp level vertical slice

#### Beat 1: Thức tỉnh, 0 đến 2 phút

- Hai người ở hai tháp riêng.
- Camera giới thiệu thành phố, cầu vỡ và lõi năng lượng ở xa.
- Tutorial movement không dùng popup dài.
- Mục tiêu: đi đến ban công và nhìn thấy người còn lại.

#### Beat 2: Gọi nhau qua khoảng không, 2 đến 5 phút

- Mei.100 nhìn thấy rune vô hình trên tường Hưng.
- Mei.100 ping ba rune theo đúng thứ tự.
- Hưng chạm rune để kích hoạt bánh răng.
- Nền tảng đầu tiên di chuyển.

#### Beat 3: Cây cầu ánh sáng, 5 đến 8 phút

- Hưng giữ một trụ vật chất ở vị trí ổn định.
- Mei.100 dẫn năng lượng qua ba node.
- Cầu chỉ tồn tại khi cả hai duy trì hành động.
- Sau khi một người sang được, người đó mở khóa giữ cầu tự động.
- Hai người lần đầu gặp nhau ở quảng trường trung tâm.

#### Beat 4: Echo Shard Hunt, 8 đến 12 phút

Ba shard, mỗi shard dạy một cơ chế:

1. Shard A: platforming và jump pad.
2. Shard B: Hưng phá tường, Mei.100 hack khóa.
3. Shard C: hai công tắc phải được giữ đồng thời trong 2 giây.

#### Beat 5: Void Ambush, 12 đến 15 phút

- Ba đợt enemy nhỏ.
- Hưng dùng melee pulse và guard.
- Mei.100 dùng energy bolt và slow field.
- Có combo: enemy đang bị slow nhận thêm 50% stagger từ melee pulse.

#### Beat 6: Mini-boss The Fractured Warden, 15 đến 22 phút

- Phase 1: phá giáp bằng combo.
- Phase 2: boss chia arena bằng laser; hai người phải kích hoạt hai mirror node.
- Phase 3: boss tạo bản sao; Mei.100 nhìn thấy bản thật, Hưng có đòn phá lõi.

#### Beat 7: Ending, 22 đến 25 phút

- Ba shard mở Resonance Gate.
- Hai người đặt tay lên hai lõi.
- Thành phố sáng lại nhưng ở xa xuất hiện một vùng tối lớn hơn.
- Dòng kết: “Một cánh cửa đã mở. Astra vẫn còn gọi tên hai người.”

---

## 3. Nhân vật và điều khiển

### 3.1 Hưng

Vai trò: Vanguard / Matter.

Thông số:

- Max HP: 120.
- Max Link Energy: 100.
- Walk speed: 4.2 m/s.
- Sprint speed: 6.5 m/s.
- Jump velocity: 6.0 m/s.
- Dodge cooldown: 1.2 s.

Kỹ năng:

- `Primary`: Matter Strike, damage 18, range 2.2 m, cooldown 0.45 s.
- `Secondary`: Guard, giảm 70% damage phía trước, tiêu hao 15 energy/s.
- `Skill`: Pulse Break, damage 12, stagger 45, bán kính 4 m, cooldown 8 s.
- `Interact`: đẩy, kéo, giữ trụ, revive.

### 3.2 Mei.100

Vai trò: Weaver / Energy.

Thông số:

- Max HP: 90.
- Max Link Energy: 120.
- Walk speed: 4.4 m/s.
- Sprint speed: 6.7 m/s.
- Jump velocity: 6.0 m/s.
- Dodge cooldown: 1.0 s.

Kỹ năng:

- `Primary`: Energy Bolt, damage 12, range 30 m, cooldown 0.3 s.
- `Secondary`: Aim/Focus.
- `Skill`: Slow Field, radius 5 m, duration 4 s, cooldown 10 s.
- `Interact`: hack node, tạo cầu, reveal rune, revive.

### 3.3 Phím mặc định

- WASD: di chuyển.
- Shift: chạy.
- Space: nhảy.
- E: tương tác/revive.
- Chuột trái: primary.
- Chuột phải: secondary.
- Q: skill.
- F: ping.
- Enter: chat.
- Esc: pause/settings.

Phải hỗ trợ remap keyboard trong localStorage ở milestone sau vertical slice; bản đầu chỉ cần default bindings và hiển thị đúng hướng dẫn.

---

## 4. Gameplay systems

### 4.1 Character controller

Yêu cầu:

- Third-person capsule controller.
- Ground detection.
- Coyote time 120 ms.
- Jump buffer 150 ms.
- Slope limit 48 độ.
- Step offset 0.35 m.
- Camera-relative movement.
- Rotation smoothing 12 rad/s.
- Không đồng bộ animation state bằng từng frame; gửi action events và movement state.

### 4.2 Camera

- Spring arm 4.8 m.
- FOV 65, sprint FOV 70, blend 250 ms.
- Collision raycast tránh xuyên tường.
- Camera shake nhẹ khi hit và boss slam.
- Cinematic camera chỉ chạy khi cả hai client xác nhận scene transition.
- Settings có camera sensitivity, invert Y, giảm camera shake.

### 4.3 Combat

- Client local prediction cho cảm giác phản hồi.
- Host là authority mềm cho enemy, boss, damage và puzzle state.
- Guest gửi intent `ATTACK_REQUEST`; host kiểm tra cooldown/range gần đúng rồi broadcast result.
- Không cần anti-cheat cấp production, nhưng không tin trực tiếp damage do guest gửi.
- Friendly fire mặc định tắt.
- Hit feedback: flash material 80 ms, hit stop local 45 ms, sound, particle.

### 4.4 Health, downed, revive

State:

```text
ALIVE -> DOWNED -> REVIVING -> ALIVE
ALIVE -> DOWNED -> DEAD -> CHECKPOINT_RESPAWN
```

- HP về 0 chuyển DOWNED.
- Downed duration 20 s.
- Downed player vẫn crawl 1.2 m/s.
- Revive hold 3 s, hủy nếu người revive nhận heavy hit hoặc rời bán kính.
- Sau revive: 40% HP và 2 s invulnerability.
- Cả hai downed hoặc một người hết timer: reset checkpoint.

### 4.5 Interaction system

Mọi interactable implement interface logic tương đương:

```ts
interface Interactable {
  id: string;
  promptKey: string;
  canInteract(actor: PlayerState, world: WorldState): boolean;
  begin(actorId: string): void;
  cancel(actorId: string): void;
  complete(actorId: string): void;
}
```

Interaction phải có:

- Stable network ID.
- Range check.
- Role check.
- Progress check khi hold.
- Idempotency để event gửi lặp không mở cửa hai lần.

### 4.6 Inventory

Bản đầu chỉ có shared quest inventory:

- `echoShardA`.
- `echoShardB`.
- `echoShardC`.

Các shard do host giữ canonical state. UI cả hai cập nhật sau event `ITEM_COLLECTED`.

---

## 5. Puzzle design chi tiết

### 5.1 Rune Relay

Mục tiêu: khởi động bánh răng tháp Hưng.

- Có ba rune với ID `rune_a`, `rune_b`, `rune_c`.
- Mei.100 nhìn thấy highlight và thứ tự `B -> A -> C`.
- Hưng chỉ thấy vật thể tối, nhưng có thể interact.
- Sai thứ tự reset chuỗi sau 600 ms và phát âm thanh thất bại.
- Đúng thứ tự chuyển puzzle state sang `SOLVED`.
- State phải replicated và late join/reconnect nhận đúng state.

### 5.2 Light Bridge

- Một matter anchor, ba energy nodes.
- Hưng giữ anchor bằng E trong tối thiểu 1.5 s.
- Khi anchor active, Mei.100 có thể nối node theo thứ tự.
- Bridge material tăng emission theo tiến độ 0, 0.33, 0.66, 1.
- Nếu Hưng buông trước khi hoàn thành, node mất năng lượng theo thứ tự ngược trong 1 s.
- Khi một người qua cổng bên kia và interact khóa phụ, bridge permanent.

### 5.3 Dual Switch Door

- Hai switch cách nhau 18 m.
- Cả hai phải được giữ liên tục 2 s.
- UI vòng tròn tiến độ trên switch.
- Network tolerance 250 ms để tránh fail do latency.
- Khi solved, door animation 1.8 s và state permanent.

### 5.4 Boss Mirror Nodes

- Hai node ở hai nửa arena.
- Chỉ active trong Phase 2.
- Hai người bắn trúng trong cửa sổ 1.2 s.
- Nếu thành công, shield boss down 6 s.
- Nếu thất bại, node cooldown 3 s.

---

## 6. Enemy và boss

### 6.1 Void Drone

- HP 35.
- Damage 8.
- Attack cooldown 1.4 s.
- Bay ở cao 1.8 đến 3.5 m.
- Ưu tiên target gần nhất.
- Telegraph 500 ms trước khi bắn.

### 6.2 Void Brute

- HP 90.
- Damage 18.
- Attack cooldown 2.2 s.
- Telegraph ground cone 800 ms.
- Có stagger threshold 60.

### 6.3 Boss: The Fractured Warden

Thông số:

- Max HP 900.
- Phase 1: 900 đến 600 HP.
- Phase 2: 600 đến 300 HP.
- Phase 3: 300 đến 0 HP.

#### Phase 1

- Shield reduction 80%.
- Energy Bolt tích `exposed` stack, tối đa 5.
- Pulse Break khi có 5 stack phá shield 5 s.
- Boss attacks: sweep, slam, orb.

#### Phase 2

- Boss bất tử khi mirror nodes chưa đồng bộ.
- Arena laser quay 18 độ/s.
- Hai mirror hit trong 1.2 s làm boss exposed 6 s.
- Sau hai lần exposed thành công, sang Phase 3.

#### Phase 3

- Tạo ba clone, chỉ Mei.100 thấy outline bản thật.
- Mei.100 ping bản thật; ping có hiệu lực 3 s.
- Hưng Pulse Break đúng target gây 120 core damage.
- Sai target tạo shockwave nhỏ.
- Khi HP 0, dừng AI, disable collision damage và chạy ending.

Boss authority chỉ chạy trên host. Host broadcast snapshot boss 10 Hz và critical event ngay lập tức.

---

## 7. Multiplayer architecture

### 7.1 Mô hình

- Tối đa 2 người/phòng.
- Host tạo room và là soft authority.
- Guest tham gia bằng room code.
- Supabase Presence dùng cho join/leave/heartbeat.
- Supabase Broadcast dùng cho message gameplay.
- Database chỉ cần nếu muốn lưu room metadata/checkpoint; vertical slice ưu tiên ephemeral room.

### 7.2 Room code

- Sáu ký tự uppercase, bỏ các ký tự dễ nhầm: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`.
- Ví dụ: `M7HK2Q`.
- URL mời: `?room=M7HK2Q`.
- Channel: `room:M7HK2Q`.
- Không cho người thứ ba vào; hiển thị `ROOM_FULL`.

### 7.3 Vai trò

- Người đầu tiên: host, mặc định Hưng.
- Người thứ hai: guest, mặc định Mei.100.
- Cho phép swap roles khi cả hai ở lobby và đều ready.
- Sau khi game start không swap.

### 7.4 Tần suất sync

- Local render/physics: 60 FPS nếu đủ hiệu năng.
- Player transform send: 12 Hz.
- Remote interpolation buffer: 100 ms.
- Critical actions: gửi ngay.
- Boss snapshot: 10 Hz từ host.
- Ping/chat: gửi ngay.
- Không lưu transform vào Postgres.

### 7.5 Transform packet

```ts
interface PlayerTransformPacket {
  t: "PLAYER_TRANSFORM";
  seq: number;
  sentAt: number;
  playerId: string;
  position: [number, number, number];
  rotationY: number;
  velocity: [number, number, number];
  locomotion: "idle" | "walk" | "run" | "jump" | "fall" | "downed";
}
```

Quy tắc:

- Bỏ packet có `seq` nhỏ hơn hoặc bằng packet cuối.
- Clamp velocity tối đa 12 m/s trước khi render remote.
- Nếu packet gap trên 500 ms, extrapolate tối đa 200 ms rồi freeze.
- Sau 2 s không packet, hiển thị reconnect indicator.

### 7.6 Critical events

```ts
type GameEvent =
  | { t: "HELLO"; protocol: 1; playerId: string; role: PlayerRole }
  | { t: "READY"; playerId: string; ready: boolean }
  | { t: "START_GAME"; seed: number; checkpointId: string }
  | { t: "ATTACK_REQUEST"; actionId: string; kind: string; origin: Vec3; direction: Vec3; sentAt: number }
  | { t: "ATTACK_RESULT"; actionId: string; accepted: boolean; hits: HitResult[] }
  | { t: "PLAYER_DAMAGED"; targetId: string; amount: number; sourceId: string }
  | { t: "PLAYER_DOWNED"; playerId: string; deadline: number }
  | { t: "REVIVE_STARTED"; reviverId: string; targetId: string }
  | { t: "REVIVE_CANCELLED"; targetId: string }
  | { t: "PLAYER_REVIVED"; playerId: string; hp: number }
  | { t: "INTERACT"; objectId: string; phase: "begin" | "cancel" | "complete" }
  | { t: "PUZZLE_STATE"; puzzleId: string; version: number; state: unknown }
  | { t: "ITEM_COLLECTED"; itemId: string; collectorId: string }
  | { t: "BOSS_STATE"; version: number; snapshot: BossSnapshot }
  | { t: "CHECKPOINT"; checkpointId: string; worldVersion: number }
  | { t: "CHAT"; id: string; playerId: string; text: string; sentAt: number }
  | { t: "PING"; id: string; playerId: string; position: Vec3; kind: PingKind }
  | { t: "STATE_REQUEST"; requesterId: string }
  | { t: "STATE_SNAPSHOT"; targetId: string; snapshot: GameSnapshot };
```

### 7.7 Host migration

Bản đầu không cần fully seamless host migration. Yêu cầu tối thiểu:

- Nếu guest mất kết nối: host giữ phòng 60 s.
- Nếu guest reconnect cùng session ID: gửi full snapshot.
- Nếu host mất kết nối: guest hiển thị chờ 20 s.
- Nếu host không trở lại: trở về lobby với thông báo rõ ràng.
- Không để game treo vĩnh viễn.

### 7.8 Reconciliation

- Local player không nhận transform từ network của chính mình.
- Remote player dùng interpolation.
- Puzzle/boss/item state dùng version integer tăng dần.
- Bỏ state version cũ.
- Critical event có UUID `actionId` và cache 100 ID gần nhất để chống xử lý lặp.

### 7.9 Chat safety cơ bản

- Tối đa 160 ký tự.
- Trim whitespace.
- Escape/render text, tuyệt đối không `dangerouslySetInnerHTML`.
- Rate limit client: 1 message/500 ms, burst 4.
- Giữ tối đa 50 message trong memory.
- Không lưu database ở vertical slice.

---

## 8. Art direction

### 8.1 Phong cách

- Stylized sci-fantasy.
- Hình khối rõ, silhouette mạnh.
- Đá trắng, kim loại vàng cũ, năng lượng cyan và magenta.
- Không sao chép thiết kế hoặc asset của A Way Out.
- Không cố photorealistic.

### 8.2 Color language

- Hưng: amber/orange, matter, khối vuông, đường nét nặng.
- Mei.100: cyan/magenta, energy, hình tròn, đường nét thanh.
- Cooperative object: gradient amber-cyan.
- Enemy: violet/black, emissive red-violet.
- Solved puzzle: chuyển từ desaturated sang warm gold.

### 8.3 Environment

- Thành phố lơ lửng, tháp đá, đường ray năng lượng, mây thể tích giả.
- Dùng modular kit.
- Background skyline dùng low-poly impostor hoặc mesh đơn giản.
- Không render toàn bộ thành phố với collision.

### 8.4 Lighting

- Một directional light chính.
- Baked lightmap cho static environment nếu asset cho phép.
- IBL/environment map nén.
- Shadow chỉ cho player, boss và vài object quan trọng.
- Cascaded shadow hoặc shadow map ở quality High; quality Low giảm resolution/tắt soft shadow.
- Bloom nhẹ, tone mapping, vignette rất nhẹ.
- Không lạm dụng chromatic aberration.

### 8.5 Character asset

MVP có thể dùng capsule/robot stylized nhưng phải có:

- Idle.
- Walk.
- Run.
- Jump start.
- Fall.
- Land.
- Primary attack.
- Skill.
- Hit.
- Downed/crawl.
- Revive.

Model GLB mục tiêu:

- 15k đến 35k triangles mỗi nhân vật.
- Một texture atlas 2048 hoặc tối đa hai texture 1024.
- Meshopt/Draco khi pipeline ổn định.

### 8.6 VFX

- Trail cho sword/pulse.
- Energy bolt projectile.
- Slow field vòng tròn shader.
- Bridge dissolve/reveal.
- Rune glow.
- Hit spark.
- Boss shield crack.
- Không dùng particle count vượt 500 visible cùng lúc ở preset Medium.

---

## 9. Audio

- Web Audio qua Babylon Sound hoặc audio manager riêng.
- Music layers: exploration, combat, boss.
- Crossfade 1.5 s.
- SFX spatialized cho combat và interact.
- UI SFX non-spatial.
- Master/Music/SFX sliders lưu localStorage.
- Browser autoplay: chỉ start AudioContext sau click `Play`.
- Không dùng nhạc hoặc âm thanh không rõ license.

Danh sách tối thiểu:

- 3 music loops.
- 2 ambience loops.
- Footstep stone, metal.
- Jump/land.
- 2 attack Hưng.
- 2 attack Mei.100.
- Hit flesh/armor/energy.
- Puzzle success/fail.
- Door.
- Shard pickup.
- Boss phase transition.
- UI click/hover/message.

---

## 10. UI/UX

### 10.1 Screens

1. Boot/loading.
2. Main menu.
3. Create/Join room.
4. Lobby.
5. Game HUD.
6. Pause/settings.
7. Connection lost/reconnect.
8. Victory/credits.

### 10.2 Lobby

Hiển thị:

- Room code.
- Copy invite link.
- Hai slot player.
- Role Hưng/Mei.100.
- Ready state.
- Ping estimate.
- Start chỉ enable khi đủ 2 người và cả hai ready.

### 10.3 HUD

- Góc trái: HP và skill cooldown của local player.
- Góc phải: HP và connection status của partner.
- Trên giữa: objective ngắn.
- Dưới giữa: interaction prompt.
- Dưới trái: chat compact.
- Ping marker trong world.
- Boss health bar khi encounter active.

### 10.4 Accessibility

- Subtitles mặc định bật.
- Text scale 100/125/150%.
- Color-blind-friendly icons, không chỉ dựa vào màu.
- Toggle reduced motion.
- Camera shake 0 đến 100%.
- Hold/toggle cho aim và sprint.
- UI hoạt động bằng keyboard.

---

## 11. Technology decisions

### 11.1 Stack khóa

- Node.js 22 LTS-compatible.
- npm, không dùng pnpm để tránh xung đột build policy đã gặp.
- Vite.
- React.
- TypeScript strict.
- Babylon.js core modular imports.
- `@babylonjs/havok` cho physics nếu browser support; fallback đơn giản nếu init thất bại.
- Supabase JS.
- Zustand hoặc store nhỏ tự viết; ưu tiên Zustand cho UI/session state.
- Vitest.
- React Testing Library cho UI.
- Playwright cho smoke test hai browser contexts.

### 11.2 Vì sao Babylon.js

- Engine web 3D có scene graph, PBR, animation, particle, GUI, asset loading.
- Havok WebAssembly tích hợp sẵn nhưng cần kiểm tra WASM SIMD.
- Dùng package npm, không phụ thuộc CDN thử nghiệm cho production.

### 11.3 GitHub Pages constraints

- Static frontend duy nhất.
- Không chạy Node server tại GitHub Pages.
- Backend realtime là Supabase.
- `vite.config.ts` phải dùng base theo repository hoặc biến môi trường.
- Mọi asset path dùng `import.meta.env.BASE_URL` hoặc Vite import, không hardcode `/asset.glb`.

---

## 12. Repository structure

```text
echoes-of-two/
├─ .github/
│  └─ workflows/
│     └─ deploy-pages.yml
├─ public/
│  ├─ audio/
│  ├─ models/
│  ├─ textures/
│  ├─ env/
│  └─ favicon.svg
├─ src/
│  ├─ app/
│  │  ├─ App.tsx
│  │  ├─ routes.ts
│  │  └─ providers.tsx
│  ├─ game/
│  │  ├─ GameCanvas.tsx
│  │  ├─ bootstrap/
│  │  │  ├─ createEngine.ts
│  │  │  ├─ createScene.ts
│  │  │  └─ loadAssets.ts
│  │  ├─ camera/
│  │  ├─ input/
│  │  ├─ player/
│  │  ├─ combat/
│  │  ├─ interaction/
│  │  ├─ puzzles/
│  │  ├─ enemies/
│  │  ├─ boss/
│  │  ├─ world/
│  │  ├─ checkpoints/
│  │  ├─ audio/
│  │  └─ vfx/
│  ├─ multiplayer/
│  │  ├─ supabaseClient.ts
│  │  ├─ roomService.ts
│  │  ├─ protocol.ts
│  │  ├─ schema.ts
│  │  ├─ transformSync.ts
│  │  ├─ interpolation.ts
│  │  ├─ hostAuthority.ts
│  │  └─ reconnect.ts
│  ├─ ui/
│  │  ├─ screens/
│  │  ├─ hud/
│  │  ├─ lobby/
│  │  ├─ chat/
│  │  └─ settings/
│  ├─ state/
│  ├─ config/
│  ├─ utils/
│  ├─ styles/
│  ├─ main.tsx
│  └─ vite-env.d.ts
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
├─ .env.example
├─ .gitignore
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ vitest.config.ts
├─ playwright.config.ts
├─ README.md
├─ GAME_SPEC.md
└─ IMPLEMENTATION_STATUS.md
```

---

## 13. Environment configuration

`.env.example`:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_REPOSITORY_NAME=echoes-of-two
VITE_ENABLE_MULTIPLAYER=true
VITE_DEBUG_GAME=false
```

Quy tắc:

- `.env` phải nằm trong `.gitignore`.
- Không có `SUPABASE_SERVICE_ROLE_KEY` ở frontend hoặc GitHub Pages.
- GitHub Actions lấy `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` từ repository secrets.
- Validate env lúc boot và hiển thị lỗi thân thiện nếu thiếu.

---

## 14. Supabase setup

### 14.1 Thiết lập tối thiểu

- Tạo một project Supabase Free.
- Lấy Project URL và anon/publishable key.
- Realtime Broadcast và Presence trên private/public channel theo capability hiện có.
- Vertical slice không bắt buộc Auth; dùng anonymous session ID lưu trong localStorage.

### 14.2 Session ID

- Tạo UUID lần đầu.
- Lưu `echoes.sessionId` trong localStorage.
- Display name mặc định `Player-XXXX`, người chơi có thể đổi trong lobby.
- Không thu thập email hoặc dữ liệu nhạy cảm.

### 14.3 Nếu dùng database cho room metadata

Schema đề xuất:

```sql
create table public.game_rooms (
  code text primary key,
  host_session_id uuid not null,
  status text not null check (status in ('lobby','playing','closed')),
  checkpoint_id text not null default 'tower_start',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null
);
```

Chỉ triển khai bảng nếu cần reconnect sau refresh. Nếu dùng, phải có RLS và policy giới hạn thao tác theo room code/session logic. Không dùng bảng để ghi transform liên tục.

---

## 15. Performance budget

### 15.1 Targets

Desktop trung bình:

- 60 FPS ở 1080p preset Medium.
- P95 frame time dưới 20 ms.
- Initial interactive dưới 8 s trên mạng 20 Mbps sau cache lạnh.

Laptop yếu:

- 30 FPS preset Low.
- Dynamic resolution 0.65 đến 1.0.

### 15.2 Asset budgets

- Initial JS gzip: mục tiêu dưới 2.5 MB; Babylon chunk lazy-loaded.
- Initial required assets: dưới 20 MB.
- Toàn bộ vertical slice: dưới 250 MB.
- Mỗi GLB environment chunk: dưới 25 MB.
- Mỗi character GLB: dưới 12 MB.
- Audio dùng OGG/MP3 phù hợp, loop dưới 6 MB.
- Texture ưu tiên KTX2/Basis nếu pipeline ổn định.

### 15.3 Optimization checklist

- Lazy load game engine sau menu.
- Lazy load boss assets trước arena.
- Frustum culling.
- Freeze active meshes/material khi phù hợp.
- Thin instances cho props lặp.
- LOD cho skyline và props.
- Không tạo object/array mới trong render loop không cần thiết.
- Pool projectile và particles.
- Network message dùng object nhỏ, không gửi full world state thường xuyên.
- Quality presets Low/Medium/High.

---

## 16. Error handling

Phải hỗ trợ:

- WebGL/WebGPU unavailable.
- Havok init failure.
- Asset load failure với retry.
- Supabase env missing.
- Room not found.
- Room full.
- Protocol mismatch.
- Partner disconnected.
- Host disconnected.
- Network timeout.
- Build asset base-path 404.

Mọi lỗi phải có:

- Mã lỗi nội bộ.
- Thông báo tiếng Việt và tiếng Anh.
- Hành động: Retry, Return to menu hoặc Copy diagnostics.
- Không chỉ `console.error` rồi màn hình trắng.

---

## 17. Testing strategy

### 17.1 Unit tests

Bắt buộc:

- Room code generator không có ký tự cấm.
- Packet schema validation.
- Sequence ordering.
- Interpolation.
- Duplicate action suppression.
- Player state machine.
- Revive timer.
- Rune puzzle sequence.
- Dual switch latency tolerance.
- Bridge state transitions.
- Damage calculation.
- Boss phase thresholds.
- Checkpoint snapshot serialization.

### 17.2 Integration tests

- Hai fake clients join cùng channel.
- Client thứ ba bị từ chối.
- Host send start, guest chuyển sang loading.
- Transform packet đến remote state.
- Guest attack request, host result.
- Puzzle state version cũ bị bỏ.
- Reconnect nhận full snapshot.

### 17.3 E2E Playwright

Dùng hai browser contexts:

1. Context A tạo room.
2. Context B mở invite URL.
3. Cả hai ready.
4. Host start.
5. Cả hai load scene.
6. Di chuyển A và kiểm tra B nhận position.
7. Gửi chat.
8. Activate dual switch test fixture.
9. Force boss defeat trong test mode.
10. Hiển thị victory.

### 17.4 Manual QA matrix

Browsers:

- Chrome latest.
- Edge latest.
- Firefox latest nếu Babylon/Havok path hỗ trợ.
- Safari hiện đại ở mức best-effort.

Network:

- 30 ms latency.
- 150 ms latency.
- 2% packet loss mô phỏng ở app layer test.
- Disconnect 5 s rồi reconnect.

---

## 18. GitHub Pages deployment

### 18.1 Vite config

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const repositoryName = process.env.VITE_REPOSITORY_NAME || "echoes-of-two";

  return {
    plugins: [react()],
    base: mode === "production" ? `/${repositoryName}/` : "/",
    build: {
      target: "es2022",
      sourcemap: true,
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks: {
            babylon: ["@babylonjs/core"],
            supabase: ["@supabase/supabase-js"]
          }
        }
      }
    }
  };
});
```

Codex phải kiểm tra việc dùng `process.env` trong config Node của Vite. Nếu TypeScript config không nhận Node types, thêm `@types/node` hoặc dùng `loadEnv` đúng chuẩn.

### 18.2 Asset URLs

Đúng:

```ts
const url = `${import.meta.env.BASE_URL}models/city.glb`;
```

Hoặc:

```ts
import cityUrl from "./assets/city.glb?url";
```

Sai:

```ts
const url = "/models/city.glb";
```

### 18.3 GitHub Actions

`.github/workflows/deploy-pages.yml`:

```yaml
name: Deploy game to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: github-pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install
        run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Test
        run: npm run test:run

      - name: Build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_REPOSITORY_NAME: echoes-of-two
        run: npm run build

      - name: Configure Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

### 18.4 CI acceptance

Workflow chỉ deploy nếu:

- `npm ci` pass.
- Typecheck pass.
- Unit tests pass.
- Production build pass.
- `dist/index.html` tồn tại.
- Critical assets tồn tại.

Tạo script `scripts/verify-dist.mjs` kiểm tra:

- `dist/index.html`.
- file JS entry.
- Havok wasm nếu bundle cần file ngoài.
- ít nhất một model/environment placeholder.
- không có URL asset bắt đầu sai bằng `href="/assets` hoặc `src="/assets` khi deploy dưới repository path.

---

## 19. Milestone plan

### Milestone 0: Bootstrap

Deliverables:

- Vite React TypeScript project.
- Babylon canvas với scene loading.
- Menu.
- Typecheck, Vitest, Playwright config.
- GitHub Pages workflow.
- README setup.

Acceptance:

- Dev server chạy.
- Production build chạy.
- Pages mở đúng base path.
- Không có console error.

### Milestone 1: Single-player foundation

Deliverables:

- Character controller.
- Camera.
- Placeholder Hưng và Mei.100.
- Interaction prompt.
- Checkpoint.
- Quality settings.

Acceptance:

- Người chơi đi, chạy, nhảy, camera không xuyên tường nghiêm trọng.
- 60 FPS trên máy dev với placeholder level.

### Milestone 2: Multiplayer room

Deliverables:

- Supabase client.
- Create/join room.
- Presence.
- Role slots.
- Transform sync/interpolation.
- Chat/ping.
- Reconnect basic.

Acceptance:

- Hai tab trình duyệt vào cùng room.
- Thấy nhau di chuyển ổn định.
- Chat hai chiều.
- Người thứ ba không vào được.

### Milestone 3: Co-op puzzles

Deliverables:

- Rune Relay.
- Light Bridge.
- Dual Switch.
- Shared shard inventory.

Acceptance:

- Không puzzle nào hoàn thành bởi một người.
- State không lệch giữa hai client.
- Reconnect giữ solved state.

### Milestone 4: Combat

Deliverables:

- Hai bộ skill.
- Enemy Drone/Brute.
- Host authority mềm.
- Damage/downed/revive.

Acceptance:

- Guest không tự gửi damage tùy ý.
- Revive hoạt động qua mạng.
- Enemy state nhất quán đủ chơi.

### Milestone 5: Boss

Deliverables:

- Warden ba phase.
- Mirror mechanic.
- Clone reveal.
- Victory.

Acceptance:

- Boss không kẹt phase.
- Death/reset checkpoint đúng.
- Hai vai đều bắt buộc ở mỗi phase.

### Milestone 6: Art/audio/polish

Deliverables:

- Asset replacement.
- Lighting/postprocess.
- VFX/SFX/music.
- Cinematic intro/outro.
- Accessibility.
- Performance pass.

Acceptance:

- Initial download và total size đạt budget.
- 30 FPS Low trên laptop yếu mục tiêu.
- Không asset thiếu license attribution.

### Milestone 7: Release

Deliverables:

- E2E pass.
- GitHub Pages live.
- Supabase secrets configured.
- `RELEASE_CHECKLIST.md`.
- Known issues.

---

## 20. Definition of Done

Vertical slice chỉ được coi là hoàn thành khi:

- Hai người ở hai máy khác nhau có thể join cùng room.
- Không cần cài client, chỉ mở link HTTPS.
- Hai người thấy chuyển động của nhau.
- Chat và ping hoạt động.
- Hoàn thành ba puzzle.
- Thu đủ ba shard.
- Chiến đấu và revive hoạt động.
- Boss có đủ ba phase và ending.
- Refresh/reconnect không phá room ngay lập tức.
- Build/deploy tự động trên main.
- Không secret nhạy cảm trong repository.
- Không 404 asset trên GitHub Pages.
- Không lỗi TypeScript.
- Unit/integration/E2E smoke tests pass.
- README có hướng dẫn setup từ đầu.
- Asset attribution đầy đủ.

---

## 21. Release checklist

```text
[ ] Repository public mới, không dùng Mei100_Angi
[ ] Settings > Pages > Source = GitHub Actions
[ ] Secrets VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY
[ ] Supabase project active
[ ] npm ci pass
[ ] npm run typecheck pass
[ ] npm run test:run pass
[ ] npm run build pass
[ ] npm run preview test pass
[ ] Hai browser context join room pass
[ ] Asset URLs không 404
[ ] Audio chỉ bắt đầu sau user gesture
[ ] Room full handling pass
[ ] Partner disconnect handling pass
[ ] Boss defeat pass
[ ] Low quality preset pass
[ ] Credits và asset licenses present
[ ] GitHub Pages URL test ở cửa sổ ẩn danh
```

---

## 22. Rủi ro và biện pháp

### Rủi ro: kỳ vọng đồ họa AAA

Biện pháp: khóa phong cách stylized cinematic, đầu tư ánh sáng, composition, VFX và animation thay vì texture 4K và polygon cực cao.

### Rủi ro: free realtime quota

Biện pháp: 2 người/phòng, transform 12 Hz, nội suy client, event critical gửi riêng, không gửi physics 60 Hz.

### Rủi ro: host gian lận hoặc disconnect

Biện pháp: đây là co-op private room, không competitive; host authority mềm đủ cho MVP. Có reconnect và timeout rõ ràng.

### Rủi ro: asset quá nặng

Biện pháp: lazy loading, GLB compression, KTX2, LOD, initial bundle budget và automated dist verification.

### Rủi ro: iOS/Havok support

Biện pháp: feature detect WASM SIMD; thông báo yêu cầu trình duyệt mới hoặc dùng controller/collision fallback không Havok cho demo.

### Rủi ro: Codex tạo quá nhiều code một lần

Biện pháp: bắt buộc milestone, acceptance tests, commit nhỏ, placeholder-first.

---

## 23. Tài liệu tham khảo chính thức

- Babylon.js: https://www.babylonjs.com/
- Babylon.js Havok: https://doc.babylonjs.com/features/featuresDeepDive/physics/havokPlugin
- Supabase Realtime limits: https://supabase.com/docs/guides/realtime/limits
- Supabase pricing/free plan: https://supabase.com/pricing
- GitHub Pages limits: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- Vite static/GitHub Pages deployment: https://vite.dev/guide/static-deploy

---

## 24. Yêu cầu output cuối cùng từ Codex

Codex phải bàn giao:

1. Toàn bộ source code.
2. `README.md` hướng dẫn chạy local và tạo Supabase.
3. `.env.example`.
4. GitHub Actions deploy.
5. Unit tests.
6. Integration tests.
7. Playwright multiplayer smoke test.
8. `IMPLEMENTATION_STATUS.md` với checklist thật.
9. `ASSET_ATTRIBUTION.md`.
10. `RELEASE_CHECKLIST.md`.
11. Không để TODO blocking.
12. Link GitHub Pages sau khi workflow pass nếu Codex có quyền thao tác repository.

**Ưu tiên triển khai:** một level hoàn chỉnh và vui quan trọng hơn năm level dang dở. Multiplayer ổn định quan trọng hơn hiệu ứng quá nặng. Gameplay co-op bắt buộc quan trọng hơn số lượng kỹ năng.
