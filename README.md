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
│       │   └── error.middleware.js    # Global error handler (prod masking)
│       │
│       ├── seeds/
│       │   └── seed.js               # Tạo dữ liệu mẫu (ga, tàu, toa, ghế, promotion)
│       │
│       └── utils/
│           ├── generateCode.js       # Tạo mã đơn hàng / vé
│           └── mask.js               # Tạo bản mask cho SĐT / CCCD
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
| **User** | `users` | Tài khoản người dùng | `name`, `email`, `password` (bcrypt), `role` (admin/customer), `isEmailVerified` |
| **Station** | `stations` | Ga tàu | `code` (HN, DAD, HCM...), `name`, `city` |
| **Owner** | `owners` | Đơn vị vận tải | `name`, `contactName`, `phone`, `email`, `type` (company/individual) |
| **Train** | `trains` | Chuyến tàu | `trainCode`, `trainType`, `status` (draft/published/cancelled), `ownerId`, `fromStationCode`, `toStationCode`, giờ đi/đến |
| **Carriage** | `carriages` | Toa tàu | `trainId`, `carriageCode`, `carriageType`, `seatCount`, `basePrice` |
| **Seat** | `seats` | Ghế | `trainId`, `carriageId`, `seatNumber`, `classType` (seat/berth6/berth4), `basePrice`, `status` (available/held/sold) |
| **SeatHold** | `seatholds` | Giữ ghế tạm | `userId`, `trainId`, `seatIds[]`, `expiresAt`, `status` (active/expired/converted) |
| **Order** | `orders` | Đơn hàng | `orderCode`, `userId`, `trainId`, `selectedSeats[]`, `passengers[]` (encrypted), `pricing`, `paymentStatus`, `orderStatus` |
| **Payment** | `payments` | Thanh toán | `orderId`, `method` (momo/zalopay/mock), `amount`, `transactionId`, `status` |
| **Ticket** | `tickets` | Vé điện tử | `ticketCode`, `orderId`, `trainSnapshot`, `seatSnapshot`, `passengerSnapshot` (masked), `ticketStatus` |
| **Promotion** | `promotions` | Mã giảm giá | `code`, `type` (percent/fixed), `value`, `minOrderValue`, `maxDiscount`, `startAt`, `endAt`, `isActive` |
| **PendingRegistration** | `pendingregistrations` | Đăng ký chờ xác minh OTP | `email`, `name`, `password` (bcrypt), `otp`, TTL auto-expire |

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

### Mục tiêu bảo mật

- Xây dựng ứng dụng đặt vé tàu có **phân quyền rõ ràng** (admin / khách hàng)
- Đảm bảo **tính bảo mật** cho xác thực, token và dữ liệu nhạy cảm
- **Giảm rủi ro** truy cập trái phép và tấn công API
- **Tuân thủ nguyên tắc** mã hoá dữ liệu cá nhân (PII)

### Mô hình bảo mật tổng thể

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (React App)                     │
│  • JWT token lưu trên thiết bị (Capacitor Preferences)      │
│  • Không lưu plain text dữ liệu nhạy cảm                   │
│  • Axios interceptor tự động gắn Bearer token               │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / HTTP
┌──────────────────────────▼──────────────────────────────────┐
│                    EXPRESS MIDDLEWARE STACK                   │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌───────────────┐ ┌───────────┐ │
│  │  Helmet   │ │   CORS   │ │  Rate Limit   │ │   Auth    │ │
│  │ (headers) │ │ (origin) │ │ (auth/payment)│ │ (JWT+role)│ │
│  └──────────┘ └──────────┘ └───────────────┘ └───────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                     BUSINESS LOGIC                           │
│  • Mật khẩu: bcryptjs (hash + salt, không lưu plain text)  │
│  • Dữ liệu PII: AES-256-GCM (phone, CCCD)                 │
│  • Response: chỉ trả dữ liệu đã mask, không trả encrypted │
│  • Error: ẩn chi tiết lỗi nội bộ ở production              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                       MONGODB                                │
│  • Lưu encrypted fields (phoneEncrypted, nationalIdEncrypted)│
│  • Lưu masked fields để hiển thị (phoneMasked, nationalId…) │
│  • Mật khẩu lưu dưới dạng bcrypt hash                       │
└─────────────────────────────────────────────────────────────┘
```

### Chi tiết các biện pháp bảo mật

#### 1. 🔑 Fail-fast khoá mã hoá dữ liệu nhạy cảm

| Mục | Nội dung |
|-----|---------|
| **Vị trí** | `server/src/services/crypto.service.js` |
| **Hoạt động** | Kiểm tra `DATA_ENCRYPTION_KEY` phải đúng 64 ký tự hex (`/^[a-fA-F0-9]{64}$/`). Nếu sai → `throw Error` → server dừng ngay |
| **Tác dụng** | Loại bỏ nguy cơ chạy với key fallback yếu. Đảm bảo phone/CCCD luôn được mã hoá bằng key mạnh |

#### 2. 🔒 Mã hoá AES-256-GCM cho dữ liệu PII

| Mục | Nội dung |
|-----|---------|
| **Dữ liệu mã hoá** | Số điện thoại (`phone`) và CCCD/CMND (`nationalId`) |
| **Thuật toán** | AES-256-GCM (authenticated encryption) |
| **Lưu trữ** | Mỗi trường lưu: `{ iv, content, tag }` (hex) |
| **Hiển thị** | Kèm bản mask: `phoneMasked = "****5678"`, `nationalIdMasked = "****1234"` |
| **Phạm vi** | Áp dụng trong `Order.passengers[]` và `Ticket.passengerSnapshot` |

#### 3. 🚫 Chặn luồng legacy trong production

| Mục | Nội dung |
|-----|---------|
| **Vị trí** | `server/src/controllers/payment.controller.js` → `completeLegacyPayment` |
| **Hoạt động** | Nếu `NODE_ENV=production` → trả HTTP **410 Gone** |
| **Tác dụng** | Giảm bề mặt tấn công từ endpoint cũ |

#### 4. 🧹 Lọc dữ liệu trả về (Response Sanitization)

| Mục | Nội dung |
|-----|---------|
| **Vị trí** | `server/src/controllers/order.controller.js` → `getMyOrders` |
| **Hoạt động** | Map qua `sanitizeOrderForCustomer()` — chỉ trả trường cần thiết, **không trả** `phoneEncrypted`, `nationalIdEncrypted` |
| **Tác dụng** | Hạn chế lộ dữ liệu nhạy cảm qua API response |

#### 5. ⏱ Rate Limiting phân tầng

| Scope | Giới hạn | Mục đích |
|-------|---------|---------|
| Toàn app | 300 req / 15 phút | Chống DDoS cơ bản |
| `/api/auth` | 30 req / 15 phút | Chống brute force OTP / login |
| `/api/payments` | 60 req / 15 phút | Chống spam thanh toán |

#### 6. 🛡 HTTP Security Headers (Helmet)

Helmet tự động thiết lập các headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`
- Và nhiều header khác

#### 7. 🎭 Error Masking ở Production

| Môi trường | Hành vi |
|-----------|--------|
| `development` | Trả `err.message` đầy đủ để debug |
| `production` | Trả message chung: *"Đã xảy ra lỗi. Vui lòng thử lại sau."* |

### Luồng dữ liệu nhạy cảm

```
Người dùng nhập thông tin hành khách (họ tên, phone, CCCD)
        │
        ▼
Backend nhận dữ liệu qua HTTPS
        │
        ▼
encryptText(phone) → { iv, content, tag }  ← AES-256-GCM
encryptText(cccd)  → { iv, content, tag }
maskPhone(phone)   → "****5678"
maskId(cccd)       → "****1234"
        │
        ▼
Lưu vào Order: phoneEncrypted + phoneMasked
                nationalIdEncrypted + nationalIdMasked
        │
        ▼
Ticket: chỉ lưu passengerSnapshot với dữ liệu mask
        │
        ▼
API response (GET /orders/my): chỉ trả dữ liệu mask
```

### Ma trận rủi ro và biện pháp

| # | Kịch bản tấn công | Mức rủi ro | Biện pháp | Trạng thái |
|---|-------------------|:----------:|-----------|:----------:|
| 1 | Truy cập admin từ tài khoản khách | 🔴 Cao | `requireRole('admin')` middleware | ✅ |
| 2 | Giả mạo / sửa JWT token | 🔴 Cao | JWT verify bằng `JWT_SECRET` + expiration | ✅ |
| 3 | Brute force OTP / login | 🟡 TB | Rate limit 30 req/15 phút trên `/api/auth` | ✅ |
| 4 | Rò rỉ dữ liệu PII qua API | 🔴 Cao | Response sanitization + encrypted storage | ✅ |
| 5 | Key mã hoá yếu / thiếu | 🔴 Cao | Fail-fast kiểm tra 64 hex chars | ✅ |
| 6 | Spam thanh toán | 🟡 TB | Rate limit 60 req/15 phút trên `/api/payments` | ✅ |
| 7 | Lộ thông tin lỗi hệ thống | 🟡 TB | Error masking ở production | ✅ |
| 8 | CSRF / Cross-origin attack | 🟡 TB | CORS whitelist + Helmet headers | ✅ |
| 9 | Sử dụng luồng legacy cũ | 🟡 TB | HTTP 410 Gone ở production | ✅ |

### Kiểm thử bảo mật đã thực hiện

- [x] Đăng ký / đăng nhập với 2 vai trò (admin, customer)
- [x] Truy cập route admin bằng tài khoản thường → HTTP 403
- [x] Tự động lưu / restore token trên thiết bị (Capacitor Preferences)
- [x] Server dừng khi `DATA_ENCRYPTION_KEY` sai định dạng
- [x] API đơn hàng không trả dữ liệu `phoneEncrypted` / `nationalIdEncrypted`
- [x] Rate limit chặn request vượt ngưỡng (kiểm tra header `RateLimit-*`)
- [x] Error response ở production không chứa stack trace / internal message
- [x] CORS reject origin không nằm trong whitelist

### Hạn chế và hướng phát triển

| # | Hạn chế hiện tại | Hướng giải quyết |
|---|------------------|-----------------|
| 1 | Chưa có cơ chế cấp role admin an toàn | Thêm invite code hoặc seed admin từ CLI |
| 2 | Chưa có audit log | Thêm logging middleware ghi lại các thao tác nhạy cảm |
| 3 | Chưa enforce HTTPS | Cấu hình reverse proxy (Nginx/Caddy) với SSL certificate |
| 4 | Chưa có 2FA cho admin | Thêm TOTP (Google Authenticator) cho tài khoản admin |
| 5 | JWT không có refresh token | Thêm refresh token rotation để tăng bảo mật |
| 6 | Chưa có CAPTCHA | Thêm reCAPTCHA/hCaptcha cho form đăng ký / login |

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

<p align="center">
  <b>🚂 VetaU — Đặt vé tàu Bắc Nam an toàn, tiện lợi</b><br>
  <sub>Built with ❤️ using React + Express + MongoDB</sub>
</p>