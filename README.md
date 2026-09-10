# Hưng & Mei.100: Echoes of Two

[Chơi trên GitHub Pages](https://hung12022000.github.io/echoes-of-two/)

Bản chơi thử 3D: bờ biển lấy cảm hứng từ Việt Nam, Hòn Trống Mái, hai nhân vật có rig và hoạt ảnh, phối hợp cộng hưởng và một trận boss ba giai đoạn. Đây là vertical slice, không phải game AAA hoàn chỉnh hay bản sao It Takes Two.

## Chơi cùng nhau

1. Người thứ nhất chọn **Tạo phòng hai người**, gửi link mời hoặc mã 6 ký tự.
2. Người thứ hai mở link, chọn **Vào phòng**. Cả hai bấm **Tôi đã sẵn sàng**.
3. Chủ phòng bấm **Bắt đầu cùng nhau**. Hưng là chủ phòng, Mei.100 là khách.
4. Giữ tab chủ phòng mở. Chat trong game để trao đổi. Khi mất kết nối, trận đấu dừng; khách có thể kết nối lại.

WebRTC dùng PeerJS Cloud cho báo hiệu, không cần tài khoản hoặc Supabase. Mạng chặn WebRTC hoặc NAT nghiêm ngặt có thể không kết nối được vì chưa có TURN riêng. Chỉ gửi mã cho người tin cậy; kết nối trực tiếp có thể trao đổi địa chỉ mạng.

**Bắt đầu hành trình** là chế độ luyện tập với AI, không phải phòng online.

## Điều khiển

WASD di chuyển · Shift chạy · Space nhảy · X né · J/chuột trái đánh · Q kỹ năng · giữ E phối hợp/hồi sinh · chuột phải kéo xoay camera/đỡ · V xem nhân vật · Esc tạm dừng. Tab đổi vai chỉ trong luyện tập. B đến đấu trường, R chơi lại: chỉ chủ phòng hoặc chơi offline.

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

Xem [tình trạng thực tế](IMPLEMENTATION_STATUS.md), [giới hạn](KNOWN_ISSUES.md), [nguồn tài nguyên](ASSET_ATTRIBUTION.md) và [đặc tả gốc](GAME_SPEC.md).
