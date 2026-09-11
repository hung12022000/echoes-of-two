# Ma trận yêu cầu và QA — Oceanbound

Cập nhật: 11/09/2026. Tài liệu này đối chiếu các yêu cầu xuyên suốt của dự án với bản browser vertical slice hiện tại. `PASS` nghĩa là luồng có thể chơi và đã có bài kiểm tra; `PARTIAL` nghĩa là đã có nền tảng nhưng chưa đạt quy mô game AAA hoàn chỉnh; `ROADMAP` nghĩa là chưa nên quảng bá như tính năng đã hoàn thành.

## Release gate

| Nhóm | Trạng thái | Bằng chứng / giới hạn |
| --- | --- | --- |
| Khởi động, tải scene, retry khi asset lỗi | PASS | Playwright E2E kiểm tra tải game và retry. |
| Hai người vào cùng mã phòng | PASS | QA WebRTC hai browser: mở data channel, chat, craft, di chuyển, boss, phòng đầy, mất kết nối và tự nối lại. Chưa chứng nhận hai mạng vật lý/NAT khó. |
| Lưu và chơi tiếp theo phòng | PASS | Save cục bộ theo mã phòng; host tiếp tục solo và chờ khách vào lại. Đây chưa phải cloud database. |
| Gameplay sinh tồn cốt lõi | PASS | Nhặt vật trôi, móc kéo, nhu cầu sống, kho, crafting, farm, xây, bản đồ và ba đảo đều có vòng lặp chơi được. |
| Ổn định logic và build | PASS | TypeScript, unit, production build, kiểm tra dist và Playwright E2E là release gate bắt buộc. |
| Đồ họa “giống Unreal/AAA” | PARTIAL | Shader biển/thời tiết, VFX, PBR, nhân vật 3D và bối cảnh Việt Nam đã nâng cấp; browser vertical slice không tương đương Unreal cinematic. |
| Hiệu năng máy thật | PARTIAL | Có adaptive resolution/preset. Headless SwiftShader không được dùng làm chứng nhận FPS GPU máy người chơi. |

## Đối chiếu yêu cầu trải nghiệm

| Yêu cầu | Trạng thái | Hiện trạng |
| --- | --- | --- |
| Giữ Hưng và Mei, áo san hô ghi `Hưng&Mei`, Mei có hình xăm mặt trời tay trái | PASS | Hai avatar Rocketbox đã được recolor và gắn nhận diện; không phải bản quét khuôn mặt thật. |
| Góc nhìn thứ nhất và chuyển góc nhìn | PASS | Chuyển camera, tay + móc ở góc nhìn thứ nhất, quay chuột 360° với độ nhạy thấp hơn. |
| Bàn phím và bốn nút mũi tên | PASS | WASD/phím mũi tên và movement pad trên màn hình. Touch action đầy đủ vẫn PARTIAL. |
| Bè nhỏ ban đầu, lênh đênh trên biển, mở rộng dần | PASS logic / PARTIAL art | Save mới có bè trống nhỏ; raft/player/camera/công trình dùng chung buoyancy frame và mở rộng theo lưới. Chưa phải mô phỏng thủy động lực học. |
| Không bước xuống nước; chỉ đi trên bè/module bè và đất đảo | PASS | Walkable-surface constraint chặn biển, cho phép module `foundation` còn sống và đất đảo trên mực nước; có unit test biên/trượt cạnh và E2E biên bè. |
| Item trôi, móc quăng/kéo, nhặt và lưu kho | PASS | Có resource drift, hook input/VFX/SFX, inventory và save. |
| Cầm móc, búa, giáo, xẻng, xô tưới và chuyển động riêng | PASS logic / PARTIAL art | Phím 1–6 đổi món; F kích hoạt hook pull, hammer strike, spear thrust, shovel scoop và watering tilt. Rig tay/công cụ là procedural, chưa phải mocap/IK/Blender hero asset. |
| Cá mập định kỳ cắn phá bè, giáo xua đuổi | PASS logic / PARTIAL art | Có cảnh báo 12 giây, tiếp cận/cắn/đẩy lùi, phá module và mất item theo module; unit test bao phủ state, save và network. Model/animation cá mập vẫn thuộc vertical slice. |
| Nhiều vật phẩm liên kết và hướng dẫn công thức | PASS | 77 vật phẩm, 34 công thức; UI chỉ rõ nguyên liệu và công thức sử dụng từng món. |
| Craft 5–10 giây và VFX/SFX | PASS | Craft job có thời gian, progress, pulse, sparks và âm thanh; tiến độ sống qua reload. |
| 5 cây nhỏ + 10 cây lớn; seed → vừa → trưởng thành, 30 giây/giai đoạn, cần nước | PASS | 15 crop độc lập, sản phẩm hoa/quả quay lại chuỗi chế tạo. |
| Máy nướng, lọc nước, kho và kiến trúc | PASS | Có recipe/build placement và collision cơ bản. Rotate/remove/repair/support simulation là PARTIAL. |
| Biển, ngày đêm, mưa, tuyết, bão, sấm chớp | PASS | Weather controller, shader sóng, rain/snow/spray/lightning và audio theo ngữ cảnh. Không phải mô phỏng chất lỏng vật lý. |
| Chim hải âu bay/đậu để tạo sức sống | PASS | Bảy chim procedural, gồm hành vi bay và đậu trên bè. |
| Ba đảo, chìa khóa, quái vật, trở về bè và kết thúc máy bay về Hạ Long | PASS | Campaign loop giản lược đã chơi được; nội dung đảo sâu, NPC/faction và cinematic AAA là PARTIAL. |
| Hòn Trống Mái trong view Hạ Long | PASS | Landmark procedural xuất hiện trong cảnh Việt Nam. |
| Cả hai chết mất đồ; một người sống dùng item cứu hộ | PASS | Down/revive và team wipe penalty nằm trong survival state; độ sâu animation cứu hộ còn PARTIAL. |
| Minimap/marker và ô kỹ năng trên đảo | PASS logic / PARTIAL art | Hải đồ có tuyến đường, fog-of-war, biome/waypoint; HUD đảo mở ba cấp kỹ năng. Bản đồ chưa phải level art thương mại. |
| Âm thanh biển, thời tiết, craft, farm, build, combat và chim | PASS | WebAudio procedural theo scene/event, giới hạn source và cleanup. |
| Vật phẩm 3D chi tiết | PARTIAL | 19 mẫu world-model chi tiết và 5 công cụ góc nhìn thứ nhất có pose riêng; 77/77 mẫu world model riêng biệt là roadmap. |
| Chuyển động người thật, tương tác đôi và facial acting | PARTIAL | Blend sáu motion/nhân vật + pose thủ tục; chưa có motion matching, foot/hand IK, facial rig hay contact animation AAA. |
| Câu cá, lặn sâu, power grid, phương tiện, phe phái, raid, tsunami và Leviathan đầy đủ | ROADMAP | Không nằm trong phạm vi release vertical slice này. |
| Dedicated server, tài khoản, cloud save và host migration | ROADMAP | Hiện dùng WebRTC host-authoritative + save cục bộ theo phòng. |

## Checklist QA thủ công trước publish

1. Tạo phòng ở cửa sổ host, khách nhập đúng mã và kiểm tra cả hai thấy nhau.
2. Chat, nhặt item, bắt đầu craft, xây một cấu trúc, đặt marker và xác nhận khách nhận snapshot mới.
3. Thoát khách, chờ host phát hiện mất kết nối, vào lại cùng mã và xác nhận trạng thái chiến đấu/craft được phục hồi.
4. Mở camera thứ nhất/thứ ba; quay liên tục qua 360°, di chuyển bằng cả phím và bốn nút UI.
5. Trồng, tưới, quan sát ba giai đoạn; reload trang và xác nhận tiến độ/save không mất.
6. Chạy qua tường/máy đã xây, biên đảo và boss để tìm xuyên vật thể.
7. Chạy đủ ba đảo, team wipe/revive và ending; nghe kiểm tra âm thanh theo từng ngữ cảnh.
8. Kiểm tra desktop 1440×900, mobile portrait và preset đồ họa thấp/cao.

## Các rủi ro không được che giấu khi giới thiệu nhà đầu tư

- Đây là vertical slice trình diễn định hướng sản phẩm, chưa phải game thương mại hoàn chỉnh.
- TURN riêng chưa được cấu hình mặc định; WebRTC có thể thất bại trên NAT/firewall hạn chế.
- Chưa có backend chống gian lận, tài khoản, cloud save, matchmaking hay vận hành live-service.
- Chưa có bộ animation/asset photoreal bespoke đủ để tuyên bố chất lượng Unreal Engine AAA.
