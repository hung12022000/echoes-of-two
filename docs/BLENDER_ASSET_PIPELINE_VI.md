# Quy trình Blender / Blendkit cho Oceanbound

Cập nhật: 11/09/2026. Đây là tiêu chuẩn cho vòng art production tiếp theo; bản web hiện tại không tự nhận là photoreal hoặc Unreal/AAA.

## Quy tắc giấy phép

- Chỉ nhập asset khi đã lưu: URL/asset ID, tác giả, ngày tải, loại giấy phép và bản chụp điều khoản tại ngày tải.
- Ưu tiên CC0. Asset Royalty Free chỉ được nhúng như một phần của game, không được phân phối lại như model/asset pack độc lập.
- Không đưa asset tải thử, asset tài khoản cá nhân hoặc asset thiếu hồ sơ giấy phép vào repository/public build.
- Mỗi asset ngoài phải được bổ sung vào `public/credits.html` và manifest nguồn trước khi merge.

Nguồn chính thức: [Blendkit licenses](https://www.blendkit.com/docs/licenses/), [Blender glTF 2.0 exporter](https://docs.blender.org/manual/en/dev/addons/scene_gltf2.html).

## Chuẩn hand/tool hero asset

1. Một skeleton tay chung cho Hưng/Mei với cổ tay, ngón cái và ba đốt cho mỗi ngón; skin tối đa bốn influence/vertex để tương thích glTF/web.
2. Pose riêng cho hook, hammer, spear, shovel và watering can; grip point và contact point nằm trong metadata của model.
3. Animation tối thiểu: equip, idle/breath, use, impact/recoil và unequip. Hook có cast/pull; hammer có wind-up/strike; spear có thrust/recover; shovel có dig/lift; xô có tilt/pour.
4. PBR metal/rough: base color, metallic, roughness, tangent-space normal và baked AO; texture hero tối đa 2K, prop thường 1K; không dùng shader Cycles không xuất được sang glTF.
5. LOD0/LOD1/LOD2, pivot thống nhất, scale mét, collider đơn giản tách riêng; nén texture/model chỉ sau visual comparison.

## Chuẩn bè, item, cá mập và boss

- Bè: ván có biến thiên silhouette/roughness, dây buộc thật sự ôm mối nối, mép ướt/contact foam, module có điểm snap và vùng hư hại.
- Item: mỗi vật có silhouette đọc được từ 3–8 m, vật liệu đúng loại, pickup/craft/build state và icon render cùng một ánh sáng studio.
- Cá mập: thân hydrodynamic, vây và đuôi có chuỗi chuyển động, mang/mắt/miệng/răng rõ ở pha cắn; wake/spray không che telegraph.
- Boss: shape language riêng cho từng đảo, hit zone rõ, telegraph màu/nhịp nhất quán và LOD không làm mất dấu hiệu gameplay.

## Gate trước khi thay asset procedural

- Kiểm chứng giấy phép và credits.
- So sánh ảnh trước/sau ở Low/Medium/High và 1280×720/1440×900.
- `npm run typecheck`, unit, build, `verify:dist`, Playwright E2E và online two-context đều qua.
- Không merge nếu asset mới làm lỗi animation clip, tăng tải đầu quá mức hoặc giảm khả năng đọc UI/telegraph.
