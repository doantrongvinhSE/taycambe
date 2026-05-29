# Thiết kế hook thanh toán Sepay

## Mục tiêu

Tự động ghi nhận thanh toán chuyển khoản ngân hàng khi Sepay gửi webhook về backend. Khi giao dịch khớp đơn hàng, hệ thống cập nhật đơn sang `paymentStatus = PAID` và `orderStatus = PROCESSING`.

## Phạm vi

- Thêm mã thanh toán ngắn cho đơn `BANK_TRANSFER`.
- Thêm endpoint webhook `POST /hooks/sepay-payments`.
- Parse mã thanh toán từ nội dung giao dịch Sepay.
- Kiểm tra đơn, trạng thái và số tiền trước khi cập nhật.
- Lưu thông tin giao dịch vào `bankTransferInfo` và gửi Telegram khi cập nhật thành công.

Không xử lý xác thực webhook vì yêu cầu hiện tại là endpoint không cần xác thực.

## Mã thanh toán

- Field mới: `orderCode` trên model `Order`.
- Chỉ sinh cho đơn có `paymentMethod = BANK_TRANSFER`.
- Format: `DH` + 6 ký tự in hoa hoặc số, ví dụ `DH8F3K2A`.
- `orderCode` cần unique để webhook map đúng đơn.
- Response tạo đơn trả kèm `orderCode` để frontend hiển thị nội dung chuyển khoản cho khách.

## Kiến trúc

- Giữ route đơn hàng hiện tại ở `/api/orders`.
- Thêm route hook riêng: `POST /hooks/sepay-payments`.
- Tạo controller riêng cho Sepay để tránh làm lớn thêm `orderController.js`.
- Có helper/service nhỏ để:
  - sinh `orderCode`,
  - parse mã `DH[A-Z0-9]{6}` từ nội dung giao dịch,
  - chuẩn hóa field nội dung và số tiền từ body Sepay.

## Luồng xử lý

1. Khách tạo đơn bằng phương thức `BANK_TRANSFER`.
2. Backend sinh `orderCode` dạng `DH...`, lưu cùng đơn và trả về response.
3. Khách chuyển khoản với nội dung chứa mã `DH...`.
4. Sepay gọi `POST /hooks/sepay-payments`.
5. Backend đọc nội dung giao dịch từ body và tìm mã theo regex `DH[A-Z0-9]{6}`.
6. Backend đọc số tiền giao dịch từ body.
7. Backend tìm đơn theo `orderCode`.
8. Chỉ cập nhật khi tất cả điều kiện đúng:
   - đơn tồn tại,
   - `paymentMethod = BANK_TRANSFER`,
   - `paymentStatus = PENDING`,
   - số tiền giao dịch bằng `totalAmount`.
9. Khi khớp, backend cập nhật:
   - `paymentStatus = PAID`,
   - `orderStatus = PROCESSING`,
   - `bankTransferInfo.transferAmount`,
   - `bankTransferInfo.transferDate`,
   - `bankTransferInfo.transferNote`.
10. Gửi Telegram thông báo cập nhật thanh toán.
11. Trả JSON cho Sepay.

## Xử lý response và lỗi

- Không tìm thấy mã `DH...`: trả HTTP 200 với `success: false` và lý do.
- Không tìm thấy đơn: trả HTTP 200 với `success: false` và lý do.
- Sai phương thức thanh toán, sai trạng thái hoặc sai số tiền: trả HTTP 200 với `success: false`, không cập nhật đơn.
- Giao dịch hợp lệ: trả HTTP 200 với `success: true` và thông tin đơn đã cập nhật.
- Lỗi server ngoài dự kiến: trả HTTP 500.

Cách trả 200 cho các case không khớp giúp tránh việc Sepay retry liên tục những giao dịch không thuộc đơn hàng hợp lệ.

## Kiểm thử

- Tạo đơn `BANK_TRANSFER` sinh `orderCode` đúng format.
- Tạo đơn `COD` không cần mã thanh toán.
- Hook có mã đúng và số tiền đúng cập nhật đơn sang `PAID/PROCESSING`.
- Hook sai số tiền không cập nhật đơn.
- Hook không có mã `DH...` không cập nhật đơn.
- Hook gọi lại khi đơn đã `PAID` không cập nhật lại.
