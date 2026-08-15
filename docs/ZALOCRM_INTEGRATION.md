# TÀI LIỆU TÍCH HỢP ZALOCRM VỚI HERMES AGENT
# File: docs/ZALOCRM_INTEGRATION.md

## 1. TỔNG QUAN VỀ ZALOCRM
ZaloCRM (ZCRM v3.4 - mã nguồn mở AGPL-3.0) là giải pháp quản lý tài khoản Zalo cá nhân qua giao diện web, hỗ trợ đăng nhập QR, duy trì session, tự động kết nối lại (reconnect), nhận tin nhắn qua socket và cung cấp hệ thống Webhook + Public REST API cho các hệ thống bên ngoài.

Trong dự án này, **ZaloCRM đóng vai trò là Zalo Gateway / Messaging Infrastructure**. **Hermes Agent (Nous Research)** đóng vai trò là **Bộ não AI duy nhất** xử lý tin nhắn và quyết định phản hồi.

---

## 2. CHI TIẾT KỸ THUẬT & ENDPOINTS THỰC TẾ

### 2.1. Xác thực REST API (Public API)
ZaloCRM cung cấp bộ Public REST API tại tiền tố `/api/public/`, xác thực bằng header `X-API-Key`:
```http
X-API-Key: <ZALOCRM_API_KEY>
Content-Type: application/json
```
*(Key được tạo trong ZaloCRM tại `Cài đặt` ➔ `API & Webhook` hoặc cấu hình qua biến môi trường).*

---

### 2.2. Endpoint Gửi Tin Nhắn Zalo
- **Method & Path**: `POST /api/public/messages/send`
- **Headers**:
  - `X-API-Key`: `<ZALOCRM_API_KEY>`
  - `Content-Type`: `application/json`
- **Request Body**:
  ```json
  {
    "zaloAccountId": "zalo-account-uuid-or-id",
    "threadId": "recipient-zalo-uid-or-group-id",
    "content": "Nội dung phản hồi từ Hermes Agent",
    "threadType": "user"
  }
  ```
  - `threadType`: `"user"` (cho chat cá nhân 1-1) hoặc `"group"` (cho chat nhóm).
- **Response**:
  - Thành công: `200 OK` ➔ `{ "success": true }`
  - Lỗi: `400` (thiếu trường), `404` (nick không tìm thấy), `422` (nick chưa kết nối / không active).

---

### 2.3. Cấu hình & Định dạng Webhook từ ZaloCRM
ZaloCRM gửi event HTTP POST tới webhook URL đã cấu hình (ví dụ: `http://backend:8000/webhooks/zalocrm`):
- **Headers gửi kèm**:
  - `Content-Type`: `application/json`
  - `X-Webhook-Event`: `"message.received"` (hoặc `"zalo.connected"`, `"zalo.disconnected"`)
  - `X-Webhook-Signature`: Mã băm HMAC-SHA256 của toàn bộ payload JSON tính theo `webhook_secret`.
- **Payload Webhook khi nhận tin nhắn (`message.received`)**:
  ```json
  {
    "event": "message.received",
    "timestamp": "2026-08-14T15:04:05.123Z",
    "data": {
      "messageId": "msg_01J...",
      "conversationId": "conv_01J...",
      "senderUid": "392817491827491",
      "content": "Xin chào, bạn có thể giúp tôi không?",
      "contentType": "text",
      "sentAt": "2026-08-14T15:04:05.000Z"
    }
  }
  ```

---

### 2.4. Endpoint Kiểm Tra Trạng Thái Kết Nối (Health & Status)
- `GET /health` ➔ `{ "status": "ok", "db": "connected", "timestamp": "..." }`
- `GET /api/public/conversations` (với `X-API-Key`) ➔ Kiểm tra tính hợp lệ của API Key và lấy danh sách hội thoại gần nhất.

---

## 3. FLOW TÍCH HỢP END-TO-END VỚI HERMES AGENT

```
1. Khách nhắn tin Zalo cá nhân
       ↓
2. ZaloCRM nhận tin qua Zalo Web Protocol (QR Login)
       ↓
3. ZaloCRM phát Webhook POST /webhooks/zalocrm tới Backend Integration
       ↓
4. Backend verify chữ ký HMAC, chuẩn hóa thành NormalizedMessage
       ↓
5. Backend định danh User (OWNER vs USER) & ánh xạ Hermes Session
       ↓
6. Backend gọi Hermes AIAgent Runtime (Nous Research)
       ↓
7. Hermes Agent tự phân tích, gọi Memory / Tools / Skills / LLM
       ↓
8. Hermes Agent trả về Final Text Response
       ↓
9. Backend gọi POST /api/public/messages/send của ZaloCRM
       ↓
10. ZaloCRM gửi tin nhắn phản hồi tới Zalo của khách
```
