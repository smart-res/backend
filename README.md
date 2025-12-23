# Smart Restaurant Admin - Backend

Backend API cho hệ thống quản lý nhà hàng thông minh, xây dựng với NestJS và MongoDB.

## 🚀 Công nghệ sử dụng

- **NestJS 11.0.1** - Node.js framework
- **MongoDB** - Database (với Mongoose)
- **JWT** - Authentication & Token signing
- **bcrypt** - Password hashing
- **QRCode** - Tạo mã QR
- **PDFKit** - Tạo file PDF
- **Archiver** - Tạo file ZIP

## 📋 Yêu cầu cài đặt

- Node.js >= 18.x
- MongoDB >= 6.x (đang chạy trên localhost:27017)
- npm hoặc yarn

## ⚙️ Cài đặt

### 1. Clone project hoặc vào thư mục backend:

```bash
cd web-smart-restaurant-admin-be
```

### 2. Cài đặt dependencies:

```bash
npm install
```

### 3. Tạo file `.env` trong thư mục gốc:

```env
# Database
MONGO_URI=mongodb://localhost:27017/smart-restaurant

# JWT Secrets
JWT_ACCESS_SECRET=your-access-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_SECRET=your-jwt-secret-for-qr-tokens

# Token Expiration
ACCESS_TOKEN_EXPIRE=15m
REFRESH_TOKEN_EXPIRE=7d

# Server
PORT=3000

# Frontend URL (for CORS)
VITE_APP_URL=http://localhost:5173
```

### 4. Khởi động MongoDB:

Đảm bảo MongoDB đang chạy trên máy:

```bash
# Windows: MongoDB thường tự khởi động
# hoặc dùng MongoDB Compass để start

# Linux/Mac:
mongod
```

## 🏃 Chạy ứng dụng

### Development mode (watch mode):

```bash
npm run start:dev
```

### Production mode:

```bash
npm run build
npm run start:prod
```

Server sẽ chạy tại: `http://localhost:3000`

## 📡 API Endpoints

### Authentication

- `POST /api/admin/auth/register` - Đăng ký admin mới
- `POST /api/admin/auth/login` - Đăng nhập
- `POST /api/admin/auth/refresh` - Refresh token
- `POST /api/admin/auth/logout` - Đăng xuất

### Table Management

- `GET /api/admin/tables` - Lấy danh sách bàn
- `POST /api/admin/tables` - Tạo bàn mới
- `GET /api/admin/tables/:id` - Chi tiết bàn
- `PUT /api/admin/tables/:id` - Cập nhật thông tin bàn
- `PATCH /api/admin/tables/:id/status` - Đổi trạng thái bàn

### QR Code Operations

- `POST /api/admin/tables/:id/qr/generate` - Tạo QR code cho bàn
- `GET /api/admin/tables/:id/qr/download?format=png|pdf` - Tải QR code
- `GET /api/admin/tables/qr/download-all` - Tải tất cả QR (ZIP)
- `POST /api/admin/tables/qr/regenerate-all` - Tạo lại tất cả QR code

## 🗂️ Cấu trúc thư mục

```
src/
├── admins/           # Module quản lý admin
│   ├── admin.schema.ts
│   ├── admin.module.ts
│   └── admins.service.ts
├── auth/             # Module xác thực
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   └── dto/
├── tables/           # Module quản lý bàn
│   ├── table.controller.ts
│   ├── table.schema.ts
│   ├── tables.service.ts
│   ├── table.module.ts
│   └── dto/
├── app.module.ts     # Root module
└── main.ts           # Entry point
```

## 🔐 Tạo Admin đầu tiên

Sau khi khởi động server, tạo admin bằng API:

```bash
curl -X POST http://localhost:3000/api/admin/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

Hoặc dùng Postman/Thunder Client với body:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

## 📝 Ghi chú

- **JWT Tokens**: Access token có hạn 15 phút, refresh token 7 ngày
- **QR Code**: Mã QR có chứa JWT token với thời hạn 30 ngày
- **CORS**: Đã bật CORS cho frontend (localhost:5173)
- **Cookie**: Refresh token được lưu trong httpOnly cookie

## 🐛 Troubleshooting

### Lỗi kết nối MongoDB:

```
MongooseError: connect ECONNREFUSED
```

**Giải pháp**: Kiểm tra MongoDB đã chạy chưa, kiểm tra `MONGO_URI` trong `.env`

### Lỗi PowerShell execution policy:

```
PSSecurityException: Running scripts is disabled
```

**Giải pháp**:

```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port 3000 đã được sử dụng:

**Giải pháp**: Đổi `PORT` trong file `.env` hoặc kill process đang dùng port 3000
