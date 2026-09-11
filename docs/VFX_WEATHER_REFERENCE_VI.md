# Tham khảo gameplay, chuyển động, VFX và âm thanh

Tài liệu này ghi lại nguyên tắc tham khảo, không sao chép mã nguồn, model, âm thanh hay bố cục độc quyền của game khác.

## Nguồn và điều rút ra

- [Raft chính thức](https://www.raft-game.com/): vòng lặp rõ nhất là bắt đầu với một mảnh bè và móc thô sơ, thu vật trôi để sinh tồn rồi mở rộng căn cứ. Oceanbound dùng nguyên tắc tiến triển này nhưng có chiến dịch ba đảo, hai nhân vật và hệ chìa khóa riêng.
- [Sea of Thieves — Release Notes 3.8.0](https://www.seaofthieves.com/release-notes/3.8.0): thời gian, mây và thời tiết được coi là một hệ thống liên kết; ghi chú cũng nhấn mạnh loại bỏ hiện tượng giật/hitch. Oceanbound vì vậy nội suy cường độ bão/ánh sáng/sương mù thay vì đổi cảnh đột ngột và tự hạ độ phân giải khi FPS thấp.
- [Unity Root Motion](https://docs.unity.cn/Manual/RootMotion.html): tốc độ dịch chuyển cần khớp nhịp gait và loop pose. Oceanbound điều chỉnh speed ratio của clip đi/chạy theo vận tốc thực, làm mượt transform và chỉ teleport khi sai lệch mạng quá lớn.
- [Kenney Survival Kit](https://kenney.nl/assets/survival-kit): tham khảo cách dùng silhouette rõ, ít polygon nhưng vẫn đọc được công dụng của công cụ/vật liệu. Model Oceanbound là hình học procedural nguyên bản; không nhúng asset Kenney trong bản build này.
- [Pixabay Content License](https://pixabay.com/service/license-summary/): đã khảo sát làm nguồn âm thanh dự phòng. Bản hiện tại không tải file Pixabay; sóng, gió, mưa, sét, chim và âm sự kiện được tổng hợp bằng WebAudio để giảm tải và tránh phụ thuộc mạng/bản quyền.

## Quy tắc áp dụng

1. Ưu tiên silhouette và vật liệu dễ nhận biết hơn số lượng particle.
2. Bão tác động đồng thời lên màu trời, sương mù, sóng, bè, mưa, sét, âm lượng và bộ lọc gió.
3. Âm thanh sự kiện phải ngắn, có mức âm an toàn và được giải phóng node sau khi phát.
4. Người chơi luôn nhìn thấy phản hồi của thao tác: tay/móc khi thu gom, vòng tia khi chế tạo, trạng thái ba giai đoạn của cây và tiến độ công thức.
5. Tất cả hệ thống nặng đều có đường giảm tải: hardware scaling thích nghi, số particle hữu hạn, chim/model low-poly và reduced-motion.
