# Hưng & Mei.100: Oceanbound — Echoes of Two

[Chơi trên GitHub Pages](https://hung12022000.github.io/echoes-of-two/)

Bản chơi thử 3D survival-crafting trên biển: bờ biển lấy cảm hứng từ Việt Nam, Hòn Trống Mái, hai nhân vật có rig và hoạt ảnh, thu gom, chế tạo theo chuỗi, xây nhà trên đảo, hải đồ persistent, thời tiết, cá mập, phối hợp cộng hưởng và một trận boss ba giai đoạn. Đây là vertical slice, không phải game AAA hoàn chỉnh hay bản sao của một game thương mại.

## Vòng lặp Oceanbound hiện có

1. Đi quanh đảo và nhấn **F** gần vật trôi/tài nguyên.
2. Nhấn **C** để xử lý gỗ/sợi, chế tạo công cụ, thức ăn, máy và bộ phận nhà.
3. Nhấn **N** chọn công trình; nhấn **B** để đặt trước mặt hoặc dùng nút đặt trong sổ tay.
4. Nhấn **M** để mở hải đồ, tạo marker có loại/tên/ghi chú và chọn waypoint.
5. Theo dõi sinh lực, đói, khát, thể lực, ngày–đêm, dự báo và mức đe dọa.
6. Xây neo/cột thu lôi, máy lọc, bếp, kho, beacon và một căn nhà để phát triển đảo từ Hoang sơ thành Cứ điểm.

Save cục bộ tự động mỗi 15 giây và có nút **Lưu**. Trong phòng online, host nắm world state; crafting, xây dựng và marker do khách thực hiện được gửi lên host rồi đồng bộ lại.

## Chơi cùng nhau

1. Người thứ nhất chọn **Tạo phòng hai người**, gửi link mời hoặc mã 6 ký tự.
2. Người thứ hai mở link, chọn **Vào phòng**. Cả hai bấm **Tôi đã sẵn sàng**.
3. Chủ phòng bấm **Bắt đầu cùng nhau**. Hưng là chủ phòng, Mei.100 là khách.
4. Giữ tab chủ phòng mở. Chat trong game để trao đổi. Khi mất kết nối, trận đấu dừng; khách có thể kết nối lại.

WebRTC dùng PeerJS Cloud cho báo hiệu, nhiều STUN endpoint và cơ chế tự thử lại bốn lần. Không cần tài khoản hoặc Supabase. Mạng NAT nghiêm ngặt vẫn cần TURN; giao diện cho biết tuyến đang dùng là trực tiếp hay relay. Chỉ gửi mã cho người tin cậy; kết nối trực tiếp có thể trao đổi địa chỉ mạng.

Để bật TURN trong production, đặt ba GitHub Actions secrets hoặc biến môi trường tương ứng:

```text
VITE_TURN_URL=turns:turn.example.com:5349
VITE_TURN_USERNAME=...
VITE_TURN_CREDENTIAL=...
```

`VITE_TURN_URL` chấp nhận nhiều URL phân tách bằng dấu phẩy. Không commit credential thật vào repository.

**Bắt đầu hành trình** là chế độ luyện tập với AI, không phải phòng online.

## Điều khiển

WASD di chuyển · Shift chạy · Space nhảy · F thu gom · C chế tạo · I túi đồ · N xây dựng · B đặt · M hải đồ · X né · J/chuột trái đánh · Q kỹ năng · giữ E phối hợp/hồi sinh · chuột phải kéo xoay camera/đỡ · V xem nhân vật · Esc tạm dừng. Tab đổi vai chỉ trong luyện tập. K đến đấu trường, R chơi lại: chỉ chủ phòng hoặc chơi offline.

Khám phá bãi biển hoặc B đến cổ môn. Mei tích 5 dấu năng lượng; Hưng Q trong tầm gần để phá giáp. Cả hai đứng gần và giữ E để hồi phục/tích cộng hưởng; đủ 100% tạo Echo Burst trong trận. Né hoặc nhảy khỏi sóng chấn động của Warden.

## Chạy và kiểm tra

Node.js 22+, Blender 4.5.9 LTS. Cài Blender từ blender.org; đặt biến BLENDER_PATH tới executable hoặc thêm blender vào PATH.

```bash
npm ci
npm run assets:prepare
npm run dev
```

Lần chuẩn bị đầu tiên tải nguồn MIT/CC0 và xuất GLB bằng Blender. Không commit FBX, Blender, node_modules, GLB hay texture sinh từ pipeline.

```bash
npm run typecheck
npm run test:run
npm run build
npm run verify:dist
npm run test:e2e
```

Kiểm tra WebRTC thực với hai browser contexts: chạy preview trên 4173 rồi đặt QA_URL=http://127.0.0.1:4173/echoes-of-two/ và chạy node scripts/online-qa.mjs. Phụ thuộc mạng và PeerJS Cloud. Không tương đương thử trên hai máy/mạng khác nhau.

## Deploy

Workflow .github/workflows/deploy-pages.yml trên main chạy npm ci, typecheck, unit tests, chuẩn bị assets được cache, build, verify:dist và Playwright trước khi deploy Pages. Pages source phải là GitHub Actions. Base path /echoes-of-two/.

Xem [tình trạng thực tế](IMPLEMENTATION_STATUS.md), [roadmap Oceanbound](OCEANBOUND_EXPANSION.md), [giới hạn](KNOWN_ISSUES.md), [nguồn tài nguyên](ASSET_ATTRIBUTION.md), [đặc tả co-op gốc](GAME_SPEC.md) và [Master Design Oceanbound](docs/Oceanbound_Game_Design_Master.md).
