# QA AUDIT FINAL — Oceanbound

Ngày audit: 11/09/2026  
Vai trò: QA Director / UI-UX review độc lập  
Phạm vi: toàn bộ yêu cầu trong lịch sử task, `GAME_SPEC.md`, các tài liệu Oceanbound, source hiện tại, unit tests, Playwright/online/soak scripts và ảnh trong `artifacts/`. Audit này không sửa source code.

## Kết luận điều hành

**Release gate hiện tại: NO-GO.**

Không được publish working tree hiện tại như một bản release mới vì `npm run typecheck` thất bại. Ngay cả sau khi sửa compile, bản hiện tại chỉ đủ tư cách giới thiệu là **browser technical vertical slice**, chưa đủ tiêu chuẩn “Unreal/AAA”, chưa đủ độ tin cậy để gọi là bản thương mại hoặc bản investor-ready.

Điểm tích cực: landing page có bố cục tốt; vòng lặp bè–nhặt–craft–xây đã có nền; 35 unit tests qua; protocol regression qua; catalogue/crafting/farming có dữ liệu thật; phòng WebRTC, save theo room, Hòn Trống Mái, thời tiết và boss đều có implementation. Tuy nhiên, trải nghiệm đang bị chặn bởi lỗi build, mâu thuẫn tiến trình ngay ở bè khởi đầu, camera/bè chưa cùng hệ quy chiếu, đường tắt vào boss, HUD quá dày và khoảng cách hình ảnh rất lớn so với lời hứa “giống Unreal Engine”.

### Phán quyết theo mục tiêu

| Mục tiêu | Kết luận |
| --- | --- |
| Publish working tree hiện tại | **NO-GO — P0 typecheck** |
| Demo kỹ thuật nội bộ sau khi sửa P0 | **CONDITIONAL GO** nếu build/verify/E2E được chạy lại trên dist mới |
| Public vertical slice ghi đúng phạm vi | **CONDITIONAL GO** sau khi xử lý các P1 về bè, camera, progression và HUD |
| Pitch như game gần Unreal/AAA | **NO-GO** |
| Pitch như sản phẩm co-op đã ổn định trên mọi mạng | **NO-GO** — chưa có TURN production và chưa test hai máy/mạng vật lý |

## Chuẩn trạng thái

- **PASS:** có implementation, có bằng chứng test phù hợp và không thấy mâu thuẫn nghiêm trọng trong phạm vi được tuyên bố.
- **PARTIAL:** có nền tảng chơi được nhưng thiếu chiều sâu, độ hoàn thiện, bằng chứng hoặc một phần acceptance criteria.
- **ROADMAP:** chưa có hoặc chỉ tồn tại dưới dạng dữ liệu/ý tưởng; không được quảng bá như tính năng hoàn thành.
- **P0:** chặn build/deploy hoặc gây mất dữ liệu nghiêm trọng.
- **P1:** chặn trải nghiệm cốt lõi, release gate hoặc lời hứa thẩm mỹ chính.
- **P2:** lỗi/chênh lệch quan trọng nhưng có đường vòng hoặc nằm ngoài demo ngắn.
- **P3:** polish, tài liệu hoặc độ nhất quán thấp.

## Lỗi P0–P3

### P0-01 — TypeScript không biên dịch; CI Pages sẽ dừng trước bước build

- File: `src/game/world/oceanbound.ts:41`, `src/game/world/oceanbound.ts:44`.
- Kết quả thực chạy ngày audit:

```text
npm run typecheck
src/game/world/oceanbound.ts(41,179): error TS2339:
Property 'bezierCurveTo' does not exist on type 'ICanvasRenderingContext'.
src/game/world/oceanbound.ts(44,46): error TS2339:
Property 'textAlign' does not exist on type 'ICanvasRenderingContext'.
Exit code: 1
```

- Tác động: `.github/workflows/deploy-pages.yml` chạy typecheck trước build; commit hiện tại không thể qua pipeline publish.
- Tái hiện: từ repository chạy `npm run typecheck`.
- Điều kiện đóng lỗi: sửa typing/context mà không tắt strict checking; chạy lại typecheck, unit, build, verify-dist và E2E trên cùng commit.

### P1-01 — Bè “khởi đầu nhỏ” đã có cột buồm và buồm trước khi người chơi chế tạo

- File: `src/game/world/oceanbound.ts:57-78` dựng mast/sail vô điều kiện; trong khi `src/game/oceanbound/session.ts:126-130` yêu cầu chế tạo/đặt buồm để hoàn thành chương bè.
- Tác động UX: phá cảm giác tiến bộ “từ bè trống tới bè phát triển”, làm mục tiêu “chế tạo Buồm định hướng” trở nên khó hiểu vì buồm đã hiện hữu.
- Tái hiện: tạo save mới, bắt đầu hành trình; quan sát mast/buồm ngay trên bè trong khi objective vẫn ghi Buồm `0/1`.
- Yêu cầu sửa: starter raft chỉ có 2×2/sàn tối thiểu, dây buộc và móc; mast/sail/máy phải xuất hiện từ state công trình sau khi craft/place.

### P1-02 — Bè bob/roll riêng nhưng player, collision deck và camera không đi theo bè

- File: `src/game/world/oceanbound.ts:235-236` dịch/chao `raft` theo sóng; `src/game/world/terrain.ts:9-12` trả deck collision cố định `-1.45`; `src/game/GameCanvas.tsx:155` đặt camera theo `terrainHeight` cố định.
- Tác động: khi sóng mạnh, sàn hình ảnh có thể xuyên chân, hụt khỏi chân hoặc chao dưới người đứng yên. Đây là lỗi nền tảng đối với fantasy “lênh đênh trên bè”.
- Tái hiện: ở vị trí bè, chờ `Bão nhiệt đới`/`Giông sét`, đứng yên và quan sát đường tiếp xúc chân–ván hoặc mép ván qua camera thứ ba.
- Yêu cầu sửa: dùng cùng raft transform/buoyancy frame cho deck collision, actor grounding, camera target và vật thể gắn bè; thêm regression test cho sai lệch chân–deck qua toàn biên độ sóng.

### P1-03 — Có thể bỏ qua toàn bộ tiến trình và vào Warden ngay từ bè

- File: `src/game/GameCanvas.tsx:105`; phím `K` gọi `state.travelToArena()` mà không kiểm tra campaign phase, island objective, chìa khóa hoặc vị trí cổng.
- Bằng chứng: `tests/e2e/smoke.spec.ts:32-38` chủ động dùng chính đường tắt này từ luồng mở đầu.
- Tác động: phá pacing ba đảo và khiến smoke test “boss pass” không chứng minh campaign pass.
- Tái hiện: tạo save mới → Ready → nhấn `K` → vào arena và đánh Warden mà chưa mở rộng bè/chưa tới đảo.
- Yêu cầu sửa: test shortcut chỉ được bật bằng test flag không có trong production; runtime phải yêu cầu đúng phase/POI/objective.

### P1-04 — Công trình được đếm toàn cục, có thể dùng công trình ở bè/đảo cũ để hoàn thành đảo mới

- File: `src/game/oceanbound/session.ts:133-139` đếm theo `type` trên toàn bộ `state.buildings`; record hiện không có `islandId`; `src/game/oceanbound/session.ts:360-367` dùng kết quả đó để cấp tiến trình/chìa khóa.
- Tác động: mục tiêu “xây trên mỗi đảo” không được bảo toàn; save nhiều công trình có thể tự thỏa điều kiện đảo tiếp theo.
- Tái hiện: xây trước các loại công trình cần cho đảo sau tại khu vực khác, sau đó travel tới đảo và kiểm tra objective progress.
- Yêu cầu sửa: gắn building với island/raft ownership; campaign chỉ đếm object ở đúng island/claim và trong vùng hợp lệ.

### P1-05 — HUD che quá nhiều vùng chơi ở độ phân giải test chuẩn

- Bằng chứng: `artifacts/arena.png`, `artifacts/walk.png`, `artifacts/online-host.png`, `artifacts/combat.png` tại 960×640.
- File: `src/app/App.tsx:63-69`, `src/ui/oceanbound/OceanHud.tsx:39-57`, `src/styles/cinematic.css:1`, `src/styles/oceanbound.css:1-9`.
- Quan sát: subtitle, interaction prompt, resource prompt, toolbar, bottom controls và movement pad chồng lớp tại vùng giữa/dưới; objective + minimap chiếm dày bên phải; party cards chiếm dày bên trái. Khi combat, đối tác gần camera và hook tiếp tục che action read.
- Tác động: giảm khả năng đọc telegraph, ngắm/thu gom và cảm nhận phong cảnh; vi phạm yêu cầu “UI rõ, ít che màn hình”.
- Tái hiện: viewport 960×640, đứng gần resource hoặc đồng đội, mở combat; chụp frame có đầy đủ prompt.
- Yêu cầu sửa: HUD theo context, chỉ giữ một prompt ưu tiên; ẩn bottom help sau tutorial; compact party/objective; tách touch pad khỏi desktop; kiểm tra safe area 390×844, 960×640, 1280×720 và 1440×900.

### P1-06 — Chất lượng hình ảnh/nhân vật chưa đạt chuẩn thẩm mỹ người dùng yêu cầu

- Bằng chứng: `artifacts/portrait.png`, `artifacts/combat.png`, `artifacts/arena.png`, `artifacts/walk.png`.
- Đánh giá thẳng:
  - Environment vẫn đọc như prototype low-poly: karst, tán cây, boss, chim và nhiều prop dùng primitive/silhouette đơn giản; ánh sáng phẳng, thiếu contact shadow/AO, phản xạ và phân lớp khí quyển thuyết phục.
  - Mặt nước có các vệt sáng lặp mạnh; chưa có tương tác sóng–thân bè, wake, foam/contact line và phản chiếu vật thể đủ thật.
  - Hòn Trống Mái nhận diện được về ý tưởng nhưng hình khối thô và tỷ lệ/địa chất chưa đủ cho hero landmark.
  - Nhân vật là Rocketbox stand-in; silhouette trang phục trong ảnh gameplay không phải áo phông + quần short tham chiếu. Texture san hô/chữ không thay thế được garment sculpt/cloth rig.
  - `src/game/player/viewmodel.ts` là tay thủ tục 33 low-poly meshes, không phải skinned hand rig, không có finger IK/contact, equip set hay animation Blender/mocap đầy đủ.
  - Warden và VFX đọc rõ chức năng nhưng chưa đạt boss spectacle cấp game thương mại.
- Tác động: không được dùng cụm “giống Unreal Engine nhất”, “photoreal”, “AAA” hoặc “nhà đầu tư nhìn là đầu tư” trong release communication.
- Điều kiện đóng: art bible + target frames; custom character/garment/hand rigs; PBR calibrated materials; authored lighting; water/raft interaction; bespoke boss/island art; capture mới trên GPU thật và art review đạt ngưỡng đã định.

### P1-07 — Bằng chứng hình ảnh và dist không khớp source đồ họa mới nhất

- `dist/index.html` có thời gian 13:46; nhóm screenshot chính được tạo khoảng 13:48–13:49; `src/game/world/oceanbound.ts` và `src/game/player/viewmodel.ts` được sửa sau đó khoảng 13:56–13:57.
- Tác động: screenshot hiện tại không chứng nhận sail/viewmodel/world hiện tại. Playwright config dùng `reuseExistingServer` ngoài CI, nên có thể chạy trên preview dist cũ và cho kết quả xanh giả đối với source mới.
- Yêu cầu sửa: clean build hoặc output folder mới; khởi động preview từ đúng dist/commit; ghi SHA + timestamp + browser + viewport vào report; không reuse server không xác định trong release QA.

### P2 — Khoảng trống chất lượng/chứng nhận quan trọng

1. **Co-op mạng thật:** WebRTC protocol regression qua, nhưng chưa chứng nhận hai máy trên hai mạng/NAT khó; không có TURN production mặc định; host migration/dedicated authority là ROADMAP.
2. **Ba đảo chỉ là campaign state trên một world:** có bốn tọa độ/objective và một Warden dùng lại; chưa có ba biome/level kit, quái thường, boss riêng, puzzle phối hợp riêng và transition cinematic đủ sâu.
3. **Animation người:** sáu clip/nhân vật + pose thủ tục; chưa có foot IK, hand IK, facial rig, paired-contact animation, locomotion trên raft chao hoặc bộ animation công cụ.
4. **Item art:** catalogue có 75 item nhưng chỉ nhóm chủ đạo có world model chi tiết; UI còn phụ thuộc emoji; chưa có inventory icon/render chuẩn hóa cho mọi item.
5. **Building:** có snap 0,5 m/collision cơ bản nhưng chưa có rotate/remove/repair, support/stability, socket preview, per-island ownership hoặc kiến trúc phức tạp hoàn chỉnh.
6. **Save:** persistence là localStorage theo trình duyệt/phòng; không phải database/cloud save, không có backup/corruption recovery được chứng minh.
7. **Accessibility:** chưa thấy text scale 125/150%, invert Y, sensitivity UI, camera-shake slider, key remap, focus trap/restore cho dialog và kiểm thử keyboard-only/screen reader hoàn chỉnh.
8. **Mobile gameplay:** E2E chỉ kiểm tra menu không tràn ngang ở 390×844; không kiểm tra in-game HUD, camera touch, attack/interact/craft hoặc safe area.
9. **Performance:** adaptive resolution có code, nhưng chưa có profile GPU máy thật, P95 frame time, cold-load timing hay chứng nhận 60 FPS Medium/30 FPS Low. Ảnh SwiftShader từng hiển thị 5–7 FPS và không thể dùng làm benchmark phần cứng.
10. **Soak:** có `scripts/soak-qa.mjs` mặc định 3600 giây nhưng không có report một giờ được lưu trong repository; không thể đánh dấu pass lâu dài.
11. **Collision:** test chỉ bao phủ building solids cơ bản; cây, ruins/decor và camera collision vẫn chưa đầy đủ.
12. **Audio:** WebAudio phản hồi được nhiều event nhưng chưa có score/layer nhạc thích ứng, spatial mix/ducking và listening pass chuyên nghiệp.

### P3 — Polish/tài liệu

- `RELEASE_CHECKLIST.md` vẫn ghi 21 tests trong khi suite hiện có 35; checklist deployment trỏ run/commit cũ, không chứng minh working tree hiện tại.
- `docs/REQUIREMENTS_QA_MATRIX_VI.md` dùng PASS quá rộng cho “ba đảo”, “cả hai chết”, “biển/thời tiết” và “bè mở rộng”; nhiều mục chỉ pass logic/data, chưa pass production UX/art.
- Landing artwork đẹp và tạo kỳ vọng photoreal cao hơn gameplay. Cần nhãn rõ “key art / concept art”, không để người xem hiểu là ảnh in-engine.
- Crafting panel dễ đọc nhưng 32 recipe nằm trong một lưới dài, chưa có filter/category/search/pinned recipe; về lâu dài sẽ quá tải.
- Minimap là biểu diễn 2D đơn giản, chưa thể hiện rõ partner, hướng nhìn, threat/resource động hoặc fog-of-war như yêu cầu.

## Ma trận yêu cầu tổng hợp

| Nhóm yêu cầu xuyên suốt | Trạng thái | Nhận định QA |
| --- | --- | --- |
| Mở đầu trên bè giữa biển | PARTIAL | Spawn đúng vị trí bè, nhưng bè đã có mast/sail và player không cùng buoyancy frame. |
| Móc góc nhìn thứ nhất, nhặt vật trôi | PARTIAL | Có input/model/VFX/SFX; hand rig và cast/contact chưa đạt yêu cầu chân thật. |
| Camera thứ nhất mặc định, V đổi góc, quay 360° chậm | PARTIAL | Code có camera/radius/sensitivity; chưa có automated/manual certification mới, collision-safe camera và sensitivity setting. |
| Hưng và Mei.100, đồ `Hưng&Mei`, tattoo Mei | PARTIAL | Texture/nhận diện có; likeness, T-shirt/short silhouette, cloth fit và tattoo close-up chưa được chứng nhận ở bản mới. |
| Biển/sóng/bè lênh đênh | PARTIAL | Shader + raft bob tồn tại; tương tác vật lý/foam/reflection và grounding theo bè chưa đạt. |
| Ngày đêm, mưa, bão, sét, tuyết | PARTIAL | State, VFX và âm thanh có; chưa art/performance QA từng state trên build mới. |
| 75 item, kho, liên kết công thức | PASS logic / PARTIAL art | Unit xác nhận catalogue/recipe liên kết; world art/icon coverage chưa đầy đủ. |
| Craft 5–10 giây, progress, lưu qua reload | PASS logic | Unit test có cả regression snapshot bỏ field `undefined`; online current-build chưa được chứng nhận lại. |
| 5 cây nhỏ + 10 cây lớn, 3×30 giây, cần nước | PASS logic / PARTIAL visual | Unit pass; model cây/hoa/quả vẫn generic procedural và chưa test đủ 15 cây bằng E2E. |
| Mở rộng bè, máy móc, nhà phức tạp | PARTIAL | Có selection/placement/collision; progression visual mâu thuẫn và thiếu rotate/remove/repair/support. |
| Ba đảo, ba chìa khóa, thử thách bè, ending Hạ Long | PARTIAL | Có state machine và text/plane ending; chưa có full campaign E2E, level/boss riêng, transition/cinematic hoàn chỉnh. |
| Quái vật đảo và boss/VFX | PARTIAL | Một Warden ba phase chơi được; chưa có enemy ecology, boss riêng từng đảo hoặc Leviathan. |
| Revive một người, wipe hai người mất 25% đồ | PASS logic / PARTIAL UX | Unit pass; animation/network/full E2E chưa đủ. |
| Minimap, marker, waypoint và persistence | PARTIAL | Marker UI/save có; minimap và discovery/fog-of-war còn đơn giản. |
| Hai người vào phòng, chat, sync, reconnect | PARTIAL | Script online bao phủ luồng chính và protocol regression pass; chưa có report current-build/two-device/TURN certification. |
| Chủ phòng chơi tiếp solo, save theo room | PASS local | Có test localStorage; không phải cloud persistence. |
| Âm thanh theo biển/thời tiết/craft/build/combat/chim | PARTIAL | Có synthesis theo context; chưa có mix/score/asset listening QA chuyên nghiệp. |
| UI/UX desktop | PARTIAL | Landing tốt; in-game HUD occlusion là P1. |
| UI/UX mobile/accessibility | ROADMAP/PARTIAL | Menu basic pass; gameplay touch và accessibility matrix chưa hoàn chỉnh. |
| Câu cá, lặn, oxygen/pressure, scanner, power grid | ROADMAP | Chưa phải tính năng hoàn chỉnh. |
| Phe phái, NPC, raid, tsunami, procedural world/POI sâu | ROADMAP | Tài liệu thiết kế có, gameplay chưa có. |
| Cloud database, account, host migration, dedicated server | ROADMAP | Không được quảng bá như hiện có. |
| Đồ họa gần Unreal/AAA, người thật | ROADMAP | Chưa đạt; hiện là stylized browser prototype. |

## Bằng chứng kiểm thử tại thời điểm audit

| Kiểm thử | Kết quả | Giá trị bằng chứng |
| --- | --- | --- |
| `npm run typecheck` | **FAIL** | P0; chặn pipeline hiện tại. |
| `npm run test:run` | **PASS — 6 files, 35 tests** | Tốt cho domain logic; không chứng nhận art/UI/campaign thật. |
| Protocol-only từ `scripts/online-qa.mjs` | **PASS** | Xác nhận refresh/stale events/full-room/ICE budget/reconnect/signaling cleanup ở fake lifecycle. |
| Playwright E2E source | 5 scenarios | Bao phủ load GLB, movement, craft/build/marker, menu mobile, room save và asset retry; không full campaign, camera 360, weather, revive/wipe, in-game mobile hay fresh art. |
| Online QA script | Có luồng hai Chromium contexts | Bao phủ chat/craft/move/room-full/boss/rejoin; chưa có report current-build được lưu, chưa phải two-device certification. |
| Visual artifacts | Có desktop/portrait/online/combat | Hữu ích để phát hiện HUD/art issues nhưng cũ hơn hai source art files mới nhất. |
| Soak 3600s | Script có, **chưa có report pass** | Không chứng nhận one-hour stability. |
| Hardware performance | **Chưa chạy/chưa lưu profile** | Không được tuyên bố 60 FPS/AAA. |

## Đánh giá UI/UX và thẩm mỹ

### Điểm đạt

- Landing có hierarchy, typography, CTA và màu sắc nhất quán; thông điệp bè–đảo–Hạ Long rõ.
- Crafting/map dùng typography và panel system thống nhất; nguyên liệu thiếu/đủ nhìn được.
- Survival warning, objective và trạng thái phòng có ngôn ngữ Việt rõ.
- Có reduced motion, quality preset, mute, retry asset và thông báo ROOM_FULL/reconnect.

### Điểm chưa đạt

- Landing key art và gameplay tạo một “fidelity cliff” quá lớn: photoreal marketing đi vào low-poly scene.
- HUD không có hierarchy theo tình huống; nhiều lớp cùng cạnh tranh sự chú ý. Boss telegraph phải quan trọng hơn tutorial, prompt nhặt và toolbar.
- First-person viewmodel chiếm diện tích lớn nhưng chưa đủ chi tiết để trở thành hero asset; càng gần camera càng lộ primitive geometry.
- Art direction pha trộn photoreal menu, realistic Rocketbox stand-in, low-poly environment và sci-fi primitive boss; chưa có một visual language thống nhất.
- Bè/biển là core fantasy nhưng hiện chưa phải chất lượng hero: thiếu wetness, rope/plank microdetail, wake, spray theo va chạm, inertia và phản ứng cơ thể.

## Release gate bắt buộc trước lần publish tiếp theo

1. Đóng P0-01; typecheck xanh trên commit release.
2. Xóa mâu thuẫn starter sail và đồng bộ player/camera/collision với raft buoyancy.
3. Khóa shortcut `K` khỏi production và gắn building/progress theo đúng island.
4. Làm lại HUD context priority; duyệt ảnh ở 390×844, 960×640, 1280×720 và 1440×900.
5. Build dist mới từ cùng commit; không reuse preview cũ; lưu report SHA/timestamp.
6. Chạy: typecheck → 35+ unit → build → verify-dist → E2E → online two-context → soak 3600s.
7. Chạy full campaign từ save mới tới ending mà không dùng test shortcut; test revive/wipe, reload giữa craft/crop, disconnect/rejoin.
8. Art review trên GPU thật cho bình minh, ban ngày, đêm, mưa, bão, sét, tuyết, góc nhìn thứ nhất, thứ ba, close-up outfit/tattoo và boss.
9. Chỉ publish khi không còn P0; P1 phải được đóng hoặc release note ghi rõ và mục tiêu đổi thành “technical prototype”.

## Tiêu chí để tiến tới investor-ready

Đây là roadmap sản xuất, không phải checklist vài ngày:

- Custom Hưng/Mei likeness, garment T-shirt/short retopo + cloth weights, hand rigs, facial rigs và paired mocap.
- Hero-quality raft/water interaction và ba island biome kits riêng, mỗi đảo có encounter/puzzle/boss identity riêng.
- PBR/lighting/VFX target frames, color script theo thời tiết, LOD/culling/profile trên cấu hình mục tiêu.
- Production audio, music layers, accessibility đầy đủ, TURN/backend/save architecture và cross-network certification.
- Vertical slice 20–30 phút được playtest ngoài đội, có telemetry, crash-free/session-completion metrics và video capture không dùng shortcut.

**Kết luận cuối:** nền kỹ thuật đã có tiến bộ rõ, nhưng trạng thái hiện tại không đạt tiêu chuẩn phát hành mới và tuyệt đối chưa đạt Unreal/AAA. Hướng đúng là thu hẹp thành một chương bè–bão–đảo thật hoàn thiện, đóng P0/P1 và tạo bằng chứng build mới trước khi mở rộng thêm số lượng tính năng.

## Tái kiểm định sau remediation — 11/09/2026

Phần trên là biên bản phát hiện lỗi tại thời điểm audit và được giữ nguyên để truy vết. Sau vòng sửa, release gate được cập nhật thành **GO cho public browser technical vertical slice**, không phải chứng nhận game thương mại/Unreal/AAA.

| Phát hiện | Kết quả tái kiểm định |
| --- | --- |
| P0-01 TypeScript | ĐÃ ĐÓNG — strict typecheck và production build qua. |
| P1-01 starter sail | ĐÃ ĐÓNG — save mới bắt đầu bằng bè trống nhỏ; buồm chỉ hiện sau khi craft/place. |
| P1-02 buoyancy mismatch | ĐÃ ĐÓNG TRONG PHẠM VI SLICE — raft, actor, camera, công trình và cây dùng chung buoyancy frame; có unit regression. |
| P1-03 phím K | ĐÃ ĐÓNG — không còn gợi ý/đường tắt production; chỉ bật bằng session flag riêng của QA. |
| P1-04 progression toàn cục | ĐÃ ĐÓNG — building có zone bè/đảo và objective chỉ đếm đúng zone. |
| P1-05 HUD dày | ĐÃ GIẢM — tutorial tự ẩn, interaction theo ngữ cảnh, toolbar compact; đã duyệt lại ảnh 1440×900. Mobile gameplay đầy đủ vẫn là roadmap. |
| P1-06 khoảng cách Unreal/AAA | CHẤP NHẬN NHƯ GIỚI HẠN SẢN PHẨM — release ghi rõ đây là browser vertical slice; không tuyên bố photoreal/AAA. |
| P1-07 dist/screenshot cũ | ĐÃ ĐÓNG — build mới và ảnh mới gồm hook, hammer, bè khởi đầu, hải đồ, third-person và combat. |

Bằng chứng chạy lại trên cùng working tree:

- `npm run typecheck`: PASS.
- `npm run test:run`: PASS — 7 files, 47 tests.
- `npm run build`: PASS — 957 modules.
- `npm run verify:dist`: PASS — 172 files, 32.03 MiB, 2 animated human GLB.
- `npm run test:e2e`: PASS — 5/5 scenarios.
- Online two-context QA: PASS — direct WebRTC, chat, craft sync, movement sync, room-full, boss sync, heartbeat disconnect và battle restore sau reconnect.
- Visual QA: PASS cho tính đọc được và luồng chính tại 1440×900; fidelity vẫn thuộc stylized browser prototype.
- Natural shark visual QA: PASS — cảnh báo và pha cắn được kích hoạt từ save clock thực, ảnh cho thấy thân cá nằm ngoài nước và mõm tiếp cận mép bè; không có page/console error.
- Final-build soak: PASS — yêu cầu 3600 giây, thực chạy 3602 giây, 341 mẫu di chuyển/state, không crash, không page/console error, không số không hữu hạn và không thoát khỏi world bounds. `minimumFps=9` là số đo SwiftShader headless, không phải benchmark GPU máy người chơi.

Các giới hạn còn mở không chặn bản technical slice: TURN/two-network certification, cloud save/backend, host migration, ba level/boss bespoke, 77/77 model riêng, motion capture/IK/facial rig, GPU hardware benchmark và chất lượng hình ảnh Unreal/AAA.
