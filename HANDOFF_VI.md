# Bàn giao Hưng & Mei.100: Oceanbound

## Chơi ngay

- GitHub Pages: https://hung12022000.github.io/echoes-of-two/
- Repository: https://github.com/hung12022000/echoes-of-two

## Nội dung bản này

- Bắt đầu trên bè nhỏ giữa biển, móc vật trôi, mở rộng bè và chế tạo theo chuỗi.
- 74 vật phẩm, 31 công thức, kho chung và cảnh báo sinh tồn.
- Máy lọc nước, bếp nướng, máy hứng mưa, buồm, động cơ bè, tháp canh và các phần nhà.
- 5 cây nhỏ + 10 cây lớn, có nước, thời gian lớn và lượt thu hoạch riêng.
- Ba đảo, ba chìa khóa, quái vật/boss, thử thách bè tăng dần và cảnh kết máy bay về Hạ Long.
- Biển động, ngày–đêm, mưa, gió, giông sét, bão và tuyết dị thường.
- Góc nhìn thứ nhất mặc định; nhấn V để chuyển góc nhìn thứ ba.
- Hưng và Mei.100 mặc bộ đồ san hô đồng bộ có chữ `Hưng&Mei`; Mei có hình mặt trời nhỏ ở tay trái.
- Phòng WebRTC hai người, chat, ready gate, đồng bộ world state và tự kết nối lại.

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

WASD di chuyển, Shift chạy, Space nhảy, F móc/nhặt, C chế tạo, I kho đồ, G nông trại, N xây dựng, B đặt, M hải đồ, V đổi góc nhìn, J/chuột trái đánh, Q kỹ năng, giữ E phối hợp/hồi sinh, Esc tạm dừng.

## Lưu ý production

TURN chưa có credential mặc định. Hai người vẫn có thể kết nối trực tiếp qua PeerJS/STUN trong phần lớn mạng thông thường; mạng NAT nghiêm ngặt cần cấu hình ba biến `VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL` trong GitHub Actions.

Đây là vertical slice trình duyệt đã chơi được, không phải sản phẩm Unreal Engine/AAA hoàn chỉnh. Chi tiết khoảng cách còn lại được ghi trong `KNOWN_ISSUES.md` và `IMPLEMENTATION_STATUS.md`.
