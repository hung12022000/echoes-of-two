# Bàn giao Hưng & Mei.100: Oceanbound

## Chơi ngay

- GitHub Pages: https://hung12022000.github.io/echoes-of-two/
- Repository: https://github.com/hung12022000/echoes-of-two

## Nội dung bản này

- Bắt đầu trên bè nhỏ giữa biển, móc vật trôi, mở rộng bè và chế tạo theo chuỗi.
- Nhân vật không thể đi xuống nước: trên biển chỉ đi trên bè/module sàn còn nguyên; khi tới đảo chỉ đi trên vùng đất nổi.
- 77 vật phẩm, 34 công thức 5–10 giây, kho chung, hướng dẫn quan hệ nguyên liệu và cảnh báo sinh tồn.
- Hotbar công cụ 1–6; tay góc nhìn thứ nhất cầm/diễn hoạt móc, búa, giáo, xẻng và xô tưới. Cá mập báo trước rồi cắn mất module bè nếu không dùng giáo phản công.
- Máy lọc nước, bếp nướng, máy hứng mưa, buồm, động cơ bè, tháp canh và các phần nhà.
- 5 cây nhỏ + 10 cây lớn, ba giai đoạn × 30 giây, chỉ lớn khi được tưới và cho hoa/quả dùng trong chế tạo.
- Ba đảo, ba chìa khóa, quái vật/boss, thử thách bè tăng dần và cảnh kết máy bay về Hạ Long.
- Biển động, ngày–đêm, mưa, gió, giông sét, bão và tuyết dị thường.
- Góc nhìn thứ nhất mặc định; nhấn V để chuyển góc nhìn thứ ba.
- Hưng và Mei.100 mặc bộ đồ san hô đồng bộ có chữ `Hưng&Mei`; Mei có hình mặt trời nhỏ ở tay trái.
- Phòng WebRTC hai người, chat, ready gate, ô lưu riêng theo mã, chủ phòng chơi tiếp một mình, đồng bộ world state và tự kết nối lại.
- Tay và móc hiển thị ở góc nhìn thứ nhất, kéo chuột quay chậm 360°, WASD/phím mũi tên/nút mũi tên đều di chuyển được.
- Bè có ván lệch, phao gỗ và dây buộc; vật trôi có silhouette riêng; chim hải âu bay/đậu và âm thanh tổng hợp thay đổi theo thời tiết/sự kiện.

## Chạy bản đóng gói

Máy cần Node.js 22+. Tại thư mục này:

```powershell
npm ci
npm run dev
```

Bản đã build nằm trong thư mục `dist`. Có thể kiểm tra bằng:

```powershell
npm run preview
```

## Điều khiển nhanh

WASD di chuyển, Shift chạy, Space nhảy, 1–6 đổi công cụ, F dùng món đang cầm, C chế tạo, I kho đồ, G nông trại, N xây dựng, B đặt bằng búa, M hải đồ, V đổi góc nhìn, J/chuột trái đánh, Q kỹ năng, giữ E phối hợp/hồi sinh, Esc tạm dừng.

## Lưu ý production

TURN chưa có credential mặc định. Hai người vẫn có thể kết nối trực tiếp qua PeerJS/STUN trong phần lớn mạng thông thường; mạng NAT nghiêm ngặt cần cấu hình ba biến `VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL` trong GitHub Actions.

Đây là vertical slice trình duyệt đã chơi được, không phải sản phẩm Unreal Engine/AAA hoàn chỉnh. Chi tiết khoảng cách còn lại được ghi trong `KNOWN_ISSUES.md` và `IMPLEMENTATION_STATUS.md`.
