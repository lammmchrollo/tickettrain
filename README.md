# 🚂 Vé Tàu Bắc Nam (VetaU)

> Ứng dụng đặt vé tàu Bắc Nam gồm **Frontend** (React + Vite + Capacitor) và **Backend** (Node.js + Express + MongoDB).
> Hỗ trợ hai vai trò người dùng: **Admin** (quản lý chủ chuyến, tạo/duyệt/huỷ chuyến tàu) và **Khách mua vé** (tìm kiếm, đặt ghế, thanh toán).

---

## 📋 Mục lục

- [Tính năng chính](#-tính-năng-chính)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt và chạy](#-cài-đặt-và-chạy)
- [Chạy trên Android](#-chạy-trên-android-capacitor)
- [Tài khoản và vai trò](#-tài-khoản-và-vai-trò)
- [API Endpoints](#-api-endpoints)
- [Biến môi trường](#-biến-môi-trường)
- [Báo cáo An ninh Thông tin](#-báo-cáo-an-ninh-thông-tin)

---

## ✨ Tính năng chính

| Nhóm | Tính năng |
|------|-----------|
| **Xác thực** | Đăng ký / đăng nhập với OTP email, lưu token trên thiết bị (Capacitor Preferences) |
| **Phân quyền** | Chọn vai trò khi đăng ký (admin / khách), middleware `requireRole` bảo vệ route admin |
| **Tìm kiếm** | Tìm chuyến tàu theo ga đi – ga đến – ngày, xem sơ đồ ghế realtime |
| **Đặt vé** | Giữ ghế tạm (hold), nhập thông tin hành khách, thanh toán (MoMo / ZaloPay / demo) |
| **Quản lý vé** | Xem đơn hàng, vé điện tử, huỷ vé |
| **Admin** | Quản lý chủ chuyến (owner), tạo / duyệt / huỷ chuyến tàu, xem danh sách đặt vé |
| **Realtime** | Cập nhật trạng thái ghế qua Socket.IO |
| **Bảo mật** | Mã hoá dữ liệu PII (AES-256-GCM), rate limit, helmet, CORS, error masking |

---

## 🛠 Công nghệ sử dụng

### Frontend

| Thư viện | Phiên bản | Vai trò |
|----------|-----------|---------|
| React | 19.x | UI framework |
| Vite | 8.x | Build tool |
| Capacitor | 8.x | Native Android wrapper |
| Axios | 1.x | HTTP client |
| Lucide React | 1.x | Icon library |
| Socket.IO Client | 4.x | Realtime (optional) |

### Backend

| Thư viện | Phiên bản | Vai trò |
|----------|-----------|---------|
| Express | 5.x | Web framework |
| Mongoose | 9.x | MongoDB ODM |
| JWT | 9.x | Xác thực token |
| bcryptjs | 3.x | Băm mật khẩu |
| Helmet | 8.x | HTTP security headers |
| express-rate-limit | 7.x | Giới hạn request |
| Nodemailer | 6.x | Gửi email OTP |
| Socket.IO | 4.x | Realtime server |

### Database

- **MongoDB** (local hoặc MongoDB Atlas)

---

## 📁 Cấu trúc thư mục

```
vetau-app/
├── src/                          # Frontend React
│   ├── App.jsx                   # Component chính (routing, logic)
│   ├── App.css                   # Stylesheet chính
│   ├── main.jsx                  # Entry point
│   ├── socketClient.js           # Socket.IO client setup
│   ├── api/                      # API service layer
│   ├── assets/                   # Tài nguyên tĩnh
│   └── components/               # React components
│       └── TrainSeatsRealtime.jsx # Sơ đồ ghế realtime
│
├── server/                       # Backend API
│   ├── index.js                  # Server bootstrap
│   ├── src/
│   │   ├── app.js                # Express app (middleware, routes)
│   │   ├── server.js             # HTTP + Socket.IO listener
│   │   ├── socket.js             # Socket.IO event handlers
│   │   ├── holdCleaner.js        # Tự động giải phóng ghế hết hạn hold
│   │   ├── config/               # Cấu hình (env, DB)
│   │   ├── controllers/          # Xử lý logic API
│   │   │   ├── auth.controller.js
│   │   │   ├── train.controller.js
│   │   │   ├── seat.controller.js
│   │   │   ├── order.controller.js
│   │   │   ├── payment.controller.js
│   │   │   ├── ticket.controller.js
│   │   │   └── owner.controller.js
│   │   ├── models/               # Mongoose schema
│   │   │   ├── user.model.js
│   │   │   ├── train.model.js
│   │   │   ├── carriage.model.js
│   │   │   ├── seat.model.js
│   │   │   ├── seatHold.model.js
│   │   │   ├── order.model.js
│   │   │   ├── payment.model.js
│   │   │   ├── ticket.model.js
│   │   │   ├── station.model.js
│   │   │   ├── owner.model.js
│   │   │   ├── promotion.model.js
│   │   │   └── pendingRegistration.model.js
│   │   ├── routes/               # Express routes
│   │   ├── middlewares/          # Auth & error middleware
│   │   ├── services/            # Business logic
│   │   │   ├── crypto.service.js    # Mã hoá AES-256-GCM
│   │   │   ├── email.service.js     # Gửi email
│   │   │   ├── momo.service.js      # Tích hợp MoMo
│   │   │   ├── zalopay.service.js   # Tích hợp ZaloPay
│   │   │   ├── payment.service.js   # Logic thanh toán
│   │   │   ├── pricing.service.js   # Tính giá vé
│   │   │   └── ticket.service.js    # Tạo vé điện tử
│   │   ├── seeds/               # Dữ liệu mẫu
│   │   └── utils/               # Tiện ích chung
│   └── .env.example             # Mẫu biến môi trường
│
├── android/                      # Dự án Android (Capacitor)
├── capacitor.config.json         # Cấu hình Capacitor
├── vite.config.js                # Cấu hình Vite
├── package.json                  # Dependencies frontend
└── README.md
```

---

## 💻 Yêu cầu hệ thống

| Yêu cầu | Phiên bản |
|----------|-----------|
| Node.js | 18+ (khuyến nghị 20+) |
| MongoDB | 6+ (local hoặc Atlas) |
| npm | 9+ |
| Android Studio | Mới nhất (nếu build Android) |

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

> ⚠️ **Quan trọng:** `DATA_ENCRYPTION_KEY` bắt buộc đúng 64 ký tự hex (32 bytes). Nếu sai định dạng, server sẽ **dừng ngay khi khởi động**.

Tạo key nhanh:

```bash
# Linux / macOS
openssl rand -hex 32

# Windows (PowerShell)
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
```

### 5. Seed dữ liệu mẫu (tuỳ chọn)

```bash
cd server
npm run seed
```

### 6. Chạy ứng dụng

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

---

## 📱 Chạy trên Android (Capacitor)

```bash
# Build frontend
npm run build

# Sync vào Android project
npx cap sync android

# Mở Android Studio
npx cap open android
```

Trong Android Studio, bấm **Run** để cài APK lên emulator hoặc thiết bị thật.

### Lưu ý về API Base URL

| Môi trường | API URL |
|------------|---------|
| Emulator Android | `http://10.0.2.2:5000` (mặc định) |
| Thiết bị thật | IP máy tính trong cùng mạng LAN |

Nếu chạy trên thiết bị thật, cập nhật `COMPUTER_IP` trong `src/App.jsx` và đổi `API_BASE_URL` sang IP máy tính.

---

## 👤 Tài khoản và vai trò

| Vai trò | Quyền hạn |
|---------|-----------|
| **Khách hàng** | Tìm chuyến, đặt vé, xem đơn hàng, xem vé điện tử |
| **Admin** | Tất cả quyền khách hàng + quản lý chủ chuyến, tạo/duyệt/huỷ chuyến tàu |

- Vai trò được chọn khi đăng ký và lưu trong database.
- Route admin được bảo vệ bởi middleware `requireRole('admin')`.
- Không thể đổi role chỉ bằng UI.

---

## 🔌 API Endpoints

| Nhóm | Prefix | Rate Limit | Mô tả |
|------|--------|------------|--------|
| Health | `GET /api/health` | Chung | Kiểm tra server hoạt động |
| Auth | `/api/auth` | 30 req/15 phút | Đăng ký, đăng nhập, OTP |
| Trains | `/api/trains` | Chung | CRUD chuyến tàu |
| Seats | `/api/seats` | Chung | Sơ đồ ghế, hold ghế |
| Orders | `/api/orders` | Chung | Đơn hàng người dùng |
| Payments | `/api/payments` | 60 req/15 phút | Tạo & xác nhận thanh toán |
| Tickets | `/api/tickets` | Chung | Vé điện tử |
| Owners | `/api/owners` | Chung | Quản lý chủ chuyến (admin) |

> **Rate limit chung:** 300 request / 15 phút cho toàn bộ API.

---

## 🔧 Biến môi trường

File `server/.env`:

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `PORT` | ✅ | Port backend (mặc định: `5000`) |
| `NODE_ENV` | ❌ | `development` hoặc `production` |
| `MONGO_URI` | ✅ | Connection string MongoDB |
| `JWT_SECRET` | ✅ | Secret key cho JWT |
| `DATA_ENCRYPTION_KEY` | ✅ | 64 ký tự hex — dùng cho AES-256-GCM |
| `APP_ORIGIN` | ✅ | Allowed origins cho CORS (phân cách bằng dấu `,`) |
| `MOMO_PARTNER_CODE` | ❌ | Partner code MoMo |
| `MOMO_ACCESS_KEY` | ❌ | Access key MoMo |
| `MOMO_SECRET_KEY` | ❌ | Secret key MoMo |
| `MOMO_ENDPOINT` | ❌ | MoMo API endpoint |
| `MOMO_RETURN_URL` | ❌ | URL MoMo redirect sau thanh toán |
| `MOMO_NOTIFY_URL` | ❌ | URL MoMo gọi webhook |
| `CLIENT_RETURN_URL` | ❌ | Deep link trả về app (mặc định: `vetau://payment-result`) |
| `PAYMENT_DEMO` | ❌ | `true` = chế độ demo thanh toán (không gọi gateway thật) |

---

## Scripts nhanh

### Frontend

```bash
npm run dev       # Chạy dev server (Vite)
npm run build     # Build production
npm run lint      # Kiểm tra code style
npm run preview   # Preview bản build
```

### Backend

```bash
cd server
npm run dev       # Chạy backend server
npm run seed      # Seed dữ liệu mẫu
```

---

## 🔐 Báo cáo An ninh Thông tin

### Mục tiêu

- Xây dựng ứng dụng đặt vé tàu có phân quyền rõ ràng (admin, khách hàng).
- Đảm bảo tính bảo mật cho xác thực, token và dữ liệu nhạy cảm.
- Giảm rủi ro truy cập trái phép và tấn công API.

### Mô hình bảo mật đã áp dụng

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (React App)                     │
│  • JWT token lưu trên thiết bị (Capacitor Preferences)      │
│  • Không lưu plain text dữ liệu nhạy cảm                   │
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
│  • Mật khẩu: bcryptjs (không lưu plain text)                │
│  • Dữ liệu PII: AES-256-GCM (phone, CCCD)                 │
│  • Response: chỉ trả dữ liệu đã mask, không trả encrypted │
│  • Error: ẩn chi tiết lỗi nội bộ ở production              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                       MONGODB                                │
│  • Lưu encrypted fields (phoneEncrypted, nationalIdEncrypted)│
│  • Lưu masked fields để hiển thị (phoneMasked, nationalId…) │
└─────────────────────────────────────────────────────────────┘
```

### Các nâng cấp bảo mật dữ liệu cá nhân và mua vé (P0)

#### 1. Fail-fast khoá mã hoá dữ liệu nhạy cảm

- **Vị trí:** `server/src/services/crypto.service.js`
- **Hoạt động:**
  - Hệ thống kiểm tra `DATA_ENCRYPTION_KEY` có đúng 64 ký tự hex hay không.
  - Nếu sai định dạng → server **throw error** và không cho chạy.
  - Nếu hợp lệ → key được nạp vào AES-256-GCM để mã hoá / kiểm tra toàn vẹn.
- **Tác dụng:** Loại bỏ nguy cơ chạy với key fallback yếu. Đảm bảo phone/CCCD luôn được mã hoá bằng key mạnh.

#### 2. Mã hoá thông tin hành khách trong luồng thanh toán legacy

- **Vị trí:** `server/src/controllers/payment.controller.js` (hàm `completeLegacyPayment`)
- **Hoạt động:**
  - Kiểm tra đầu vào passengers bắt buộc có dữ liệu.
  - Mã hoá phone và CCCD/CMND bằng `encryptText` trước khi lưu order.
  - Lưu thêm trường mask (`phoneMasked`, `nationalIdMasked`) để hiển thị an toàn.
  - Ticket snapshot chỉ lưu dữ liệu mask, không lưu plain text nhạy cảm.
- **Tác dụng:** Giảm rò rỉ dữ liệu PII khi truy vấn vé/đơn hàng. Đồng bộ chuẩn bảo mật giữa luồng cũ và luồng mới.

#### 3. Chặn luồng legacy trong production

- **Vị trí:** `server/src/controllers/payment.controller.js` (hàm `completeLegacyPayment`)
- **Hoạt động:**
  - Nếu `NODE_ENV=production` → API trả **410** và thông báo luồng legacy đã ngừng.
  - Mục đích: tránh tiếp tục sử dụng đường xử lý cũ trong môi trường thật.
- **Tác dụng:** Giảm bề mặt tấn công từ endpoint cũ. Tránh tình trạng luồng cũ bỏ qua các bước bảo mật mới.

#### 4. Lọc dữ liệu trả về cho API đơn hàng

- **Vị trí:** `server/src/controllers/order.controller.js` (hàm `getMyOrders`)
- **Hoạt động:**
  - Thay vì trả toàn bộ document Order, API map qua hàm `sanitizeOrderForCustomer`.
  - Chỉ trả các trường cần hiển thị: thông tin vé/chuyến, giá, trạng thái, thông tin hành khách đã mask.
  - **Không trả** các trường `phoneEncrypted`, `nationalIdEncrypted` cho client.
- **Tác dụng:** Hạn chế lộ dữ liệu nhạy cảm qua API response. Giảm rủi ro khi log client/traffic bị thu thập.

#### 5. Rate limit riêng cho auth và payment

- **Vị trí:** `server/src/app.js`
- **Hoạt động:**
  - `authLimiter` áp cho `/api/auth` — 30 req / 15 phút (chống brute force OTP/login).
  - `paymentLimiter` áp cho `/api/payments` — 60 req / 15 phút (giảm spam tạo/xác nhận thanh toán).
  - Vẫn giữ limiter tổng toàn app: 300 req / 15 phút.
- **Tác dụng:** Giảm khả năng tấn công dò mật khẩu, spam OTP, spam thanh toán. Giữ ổn định dịch vụ trước lưu lượng xấu.

#### 6. Ẩn thông tin lỗi nội bộ ở production

- **Vị trí:** `server/src/middlewares/error.middleware.js`
- **Hoạt động:**
  - Ở production: trả message chung, không expose `err.message` chi tiết.
  - Ở development: vẫn hiện message để debug nhanh.
- **Tác dụng:** Tránh lộ thông tin hệ thống, cấu trúc nội bộ, stack hint cho attacker.

### Luồng dữ liệu nhạy cảm sau nâng cấp

```
Người dùng nhập thông tin hành khách (họ tên, phone, CCCD)
        │
        ▼
Backend mã hoá phone/CCCD trước khi ghi vào Order
        │
        ▼
Hệ thống lưu đồng thời bản mask để hiển thị trên app và ticket
        │
        ▼
API danh sách đơn hàng/vé chỉ trả dữ liệu mask cần thiết
        │
        ▼
Rate limit và error hardening bảo vệ các endpoint nhạy cảm
```

### Kịch bản rủi ro và cách giảm thiểu

| Kịch bản | Biện pháp |
|----------|-----------|
| Truy cập admin từ tài khoản khách | Bị chặn bởi `requireRole('admin')` |
| Giả mạo token | JWT xác thực bằng secret và hết hạn |
| Tấn công brute force | Rate limit trên auth endpoint (30 req/15 phút) |
| Rò rỉ dữ liệu PII qua API | Response chỉ trả dữ liệu đã mask |
| Key mã hoá yếu / thiếu | Server dừng ngay nếu key không hợp lệ |
| Spam thanh toán | Rate limit riêng trên payment endpoint |
| Lộ thông tin lỗi hệ thống | Error masking ở production |

### Kiểm thử

- [x] Đăng ký / đăng nhập với 2 vai trò
- [x] Truy cập route admin bằng tài khoản thường → bị từ chối
- [x] Tự động lưu / restore token trên app
- [x] Server dừng khi `DATA_ENCRYPTION_KEY` sai định dạng
- [x] API đơn hàng không trả dữ liệu encrypted
- [x] Rate limit chặn request vượt ngưỡng

### Hạn chế và hướng phát triển

- Chưa có cơ chế cấp role admin an toàn (cần invite code / seed admin).
- Cần thêm log audit và cảnh báo bất thường.
- Chưa có HTTPS enforcement (cần cấu hình reverse proxy cho production).
- Có thể thêm 2FA cho tài khoản admin.

---

## 📝 Ghi chú

- Nếu giao diện chưa cập nhật sau khi build Android, thử xoá app trên emulator/thiết bị và cài lại.
- Nếu thay đổi API, nhớ sync lại Capacitor: `npx cap sync android`.
- Health check: `GET /api/health` → `{ success: true, message: "Server OK" }`.