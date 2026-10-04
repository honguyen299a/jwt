# 🚀 JWT Authentication Demo - Node.js Express & MySQL

Dự án thực hành xây dựng hệ thống **xác thực JWT (JSON Web Token)** với Node.js Express, hỗ trợ mã hoá mật khẩu Client (Base64 / MD5), lưu trữ Token vào CSDL MySQL, giao diện **Swagger UI** tương tác trực tiếp và cài đặt **Middleware xác thực Token** cho API "Hello World".

---

## 🛠️ Cấu Trúc Dự Án

```text
jwt-demo/
├── src/
│   ├── index.js                     # Server Express & Khai báo Endpoints + Swagger UI
│   ├── db.js                        # Kết nối MySQL & Fallback In-Memory DB khi cần
│   ├── middleware/
│   │   └── authMiddleware.js        # Middleware xác thực JWT Token
│   └── utils/
│       └── cryptoUtils.js           # Xử lý & kiểm tra mật khẩu mã hoá Base64 / MD5
├── schema.sql                       # File SQL tạo bảng User theo Phụ lục
├── jwt_demo_postman_collection.json # Collection mẫu dùng cho Postman
├── .env                             # Cấu hình biến môi trường (PORT, JWT_SECRET, DB)
└── package.json                     # Quản lý thư viện phụ thuộc (express, jsonwebtoken, mysql2...)
```

---

## 📋 Cấu Trúc Bảng CSDL (Phụ Lục)

Bảng **`User`** được định nghĩa theo chuẩn yêu cầu bài tập:

| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| **`IdUser`** | `INT` (PRIMARY KEY) | Mã người dùng (Tự tăng) |
| **`UserName`** | `VARCHAR(255)` | Tên đăng nhập (hoặc email) |
| **`Password`** | `VARCHAR(255)` | Mật khẩu (lưu dạng mã hóa Base64 / MD5) |
| **`Token`** | `VARCHAR(255)` | Lưu JWT Token được cấp gần nhất |

---

## ⚡ Hướng Dẫn Chạy Dự Án

### 1. Cài đặt các thư viện phụ thuộc
Mở Terminal tại thư mục `jwt-demo` và chạy:
```bash
npm install
```

### 2. Cấu hình CSDL (Tùy chọn)
- Nếu dùng **MySQL**: Nhập file `schema.sql` vào MySQL Server của bạn (hoặc phpMyAdmin) và cập nhật thông tin trong file `.env`:
  ```env
  PORT=3000
  JWT_SECRET=super_secret_jwt_key_2026_antigravity
  DB_HOST=localhost
  DB_USER=root
  DB_PASS=
  DB_NAME=jwt_demo_db
  ```
- **Lưu ý**: Dự án có cơ chế **Fallback In-Memory Database** tự động. Nếu MySQL chưa được cài đặt hoặc chưa khởi chạy, ứng dụng vẫn chạy mượt 100% để bạn test ngay lập tức!

### 3. Khởi chạy Server
```bash
# Chạy ở chế độ chính (Production/Standard)
npm start

# Hoặc chạy ở chế độ Development (Auto restart khi sửa code)
npm run dev
```

Khi chạy thành công, Terminal sẽ hiển thị:
```text
==================================================
🚀 Server JWT Demo đang chạy tại: http://localhost:3000
📑 Swagger Documentation (Swagger UI): http://localhost:3000/api-docs
🔑 Login API: POST http://localhost:3000/
🛡️  Auth API:  POST http://localhost:3000/auth
🌐 Hello API: GET  http://localhost:3000/hello
==================================================
```

---

## 🧪 Hướng Dẫn Kiểm Tra API (Testing)

### Tài khoản mẫu có sẵn trong hệ thống:
1. **Username**: `admin` | **Mật khẩu gốc**: `123456`
   - Mật khẩu Base64 client gửi: `MTIzNDU2`
2. **Username**: `user1` | **Mật khẩu gốc**: `123456`
   - Mật khẩu MD5 client gửi: `e10adc3949ba59abbe56e057f20f883e`

---

### Cách 1: Test trực tiếp trên giao diện Swagger UI
1. Mở trình duyệt truy cập: `http://localhost:3000/api-docs`
2. Chọn `POST /` (Login API), nhấn **Try it out**, nhập JSON:
   ```json
   {
     "userName": "admin",
     "password": "MTIzNDU2"
   }
   ```
   Nhấn **Execute** để nhận `token`.
3. Copy đoạn `token` thu được.
4. Nhấn nút **Authorize** ở góc trên Swagger UI, dán token vào và bấm Authorize.
5. Thử gọi `GET /hello` hoặc `POST /auth` ngay trên Swagger UI để kiểm tra kết quả!

---

### Cách 2: Test bằng Postman
1. Mở Postman -> chọn **Import** -> Chọn file `jwt_demo_postman_collection.json` có sẵn trong thư mục dự án.
2. Thực hiện lần lượt các Request trong Collection:
   - **Request 1: Đăng nhập Base64** (`POST http://localhost:3000/`) -> Postman sẽ tự động lưu token thu được vào biến `{{jwt_token}}`.
   - **Request 2: API Xác thực Token** (`POST http://localhost:3000/auth`).
   - **Request 3: API Protected Hello World** (`GET http://localhost:3000/hello`).

---

### Cách 3: Test nhanh bằng cURL / PowerShell

#### 1. Đăng nhập để sinh JWT Token:
```bash
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d "{\"userName\":\"admin\",\"password\":\"MTIzNDU2\"}"
```

#### 2. Xác thực cấu trúc Token (localhost:3000/auth):
```bash
curl -X POST http://localhost:3000/auth \
  -H "Authorization: Bearer <NHẬP_TOKEN_TẠI_ĐÂY>"
```

#### 3. Gọi API in "Hello World" (Có Middleware xác thực):
```bash
curl -X GET http://localhost:3000/hello \
  -H "Authorization: Bearer <NHẬP_TOKEN_TẠI_ĐÂY>"
```
*(Nếu không gửi Header Authorization, server sẽ trả về lỗi `401 Unauthorized`)*
