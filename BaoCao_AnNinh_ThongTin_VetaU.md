# 🚂 BÁO CÁO CHI TIẾT AN NINH THÔNG TIN — HỆ THỐNG VETAU

> **Dự án:** Ứng dụng đặt vé tàu Bắc Nam VetaU
> **Chuyên ngành:** An toàn & An ninh Thông tin / Công nghệ Phần mềm
> **Tài liệu:** Báo cáo kỹ thuật chi tiết về kiến trúc bảo mật, giải pháp phòng thủ đa lớp, mã nguồn thực tế và hướng dẫn kiểm thử thực nghiệm.

---

## 📋 Mục lục

1. [Tổng quan hệ thống & Triết lý An toàn Thông tin](#-tổng-quan-hệ-thống--triết-lý-an-toàn-thông-tin)
2. [Ánh xạ mô hình bảo mật với Tam giác CIA](#-ánh-xạ-mô hình-bảo-mật-với-tam-giác-cia)
3. [Kiến trúc Phòng thủ Chiều sâu (Defense-in-Depth) 7 lớp](#-kiến-trúc-phòng-thủ-chiều-sâu-defense-in-depth-7-lớp)
4. [Phân tích Chi tiết 16 Giải pháp Bảo mật & Mã nguồn minh họa](#-phân-tích-chi-tiết-16-giải-pháp-bảo-mật--mã-nguồn-minh-họa)
5. [Bản đồ đối chiếu với OWASP Top 10:2021](#-bản-đồ-đối-chiếu-với-owasp-top-102021)
6. [So sánh chi tiết trước và sau khi nâng cấp hệ thống bảo mật](#-so-sánh-chi-tiết-trước-và-sau-khi-nâng-cấp-hệ-thống-bảo-mật)
7. [Hướng dẫn kiểm thử bảo mật thực tế (Security Testing Guide)](#-hướng-dẫn-kiểm-thử-bảo-mật-thực-tế-security-testing-guide)
8. [Kịch bản thuyết trình bảo vệ đồ án trước Hội đồng (Văn nói)](#-kịch-bản-thuyết-trình-bảo-vệ-đồ-án-trước-hội-đồng-văn-nói)
9. [Đánh giá hạn chế & Định hướng tương lai](#-đánh-giá-hạn-chế--định-hướng-tương-lai)

---

## 1. 🚂 Tổng quan hệ thống & Triết lý An toàn Thông tin

### 1.1. Bối cảnh dự án
Hệ thống đặt vé tàu Bắc Nam trực tuyến **VetaU** được xây dựng trên mô hình Client-Server hiện đại:
*   **Frontend:** React 19 + Vite 8 + Capacitor 8 (cho phép đóng gói ứng dụng di động Android).
*   **Backend:** Node.js + Express 5 + Mongoose 9.
*   **Database:** MongoDB.
*   **Realtime:** Socket.IO 4 để đồng bộ sơ đồ ghế tức thời.

Vì xử lý trực tiếp thông tin cá nhân (PII - Personally Identifiable Information) của hành khách cùng các giao dịch thanh toán tài chính (MoMo, ZaloPay), hệ thống đặt ra các yêu cầu khắt khe về an toàn thông tin:
1.  Bảo vệ thông tin định danh cá nhân của công dân theo Nghị định 13/2023/NĐ-CP.
2.  Chống gian lận đặt vé ảo, chiếm giữ tài nguyên ghế (Seat Hoarding/Jumping).
3.  Chặn đứng các hành vi brute-force, injection hay rò rỉ phiên làm việc.

### 1.2. Triết lý bảo mật cốt lõi

*   **Defense-in-Depth (Phòng thủ chiều sâu):** Không phụ thuộc vào một lớp phòng vệ duy nhất. Hệ thống thiết lập 7 lớp bảo mật liên hoàn từ biên giới (Client/Network) đến lõi (Data/Audit) để khi một lớp bị xuyên thủng, các lớp bên trong vẫn duy trì khả năng tự vệ.
*   **Least Privilege (Quyền tối thiểu):** 
    *   Hạn chế tối đa thông tin trả về qua API. Toàn bộ dữ liệu PII được che thông tin (masking) trước khi phản hồi về client.
    *   Phân quyền kiểm soát chặt chẽ (RBAC) cho người dùng thông thường (`customer`) và quản trị viên (`admin`).
    *   Tài nguyên đơn hàng và vé được xác thực chặt chẽ theo chủ sở hữu (`userId: req.user.id`).
*   **Fail-Fast (Dừng sớm khi có lỗi):** 
    *   Nếu khóa giải mã bí mật trong biến môi trường không đúng định dạng (64 ký tự hex), server sẽ lập tức dừng hoạt động ngay khi khởi động để tránh chạy với khóa yếu hoặc thiếu.
    *   Dữ liệu đầu vào không hợp lệ sẽ bị chặn đứng tại tầng middleware trung gian, trước khi đi vào xử lý logic nghiệp vụ hoặc gọi xuống cơ sở dữ liệu.

---

## 2. 🔺 Ánh xạ mô hình bảo mật với Tam giác CIA

Tam giác bảo mật **CIA (Confidentiality - Integrity - Availability)** là kim chỉ nam cho thiết kế hệ thống của VetaU.

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
     │ • Bcrypt verify    │    │    │ • Auto hold clean  │
     │ • Input validation │    │    │ • Error handling   │
     │ • HMAC payment     │    │    │   (prod mask)      │
     └────────────────────┘    │    └────────────────────┘
                               │
                       CIA TRIAD
```

| Thành phần | Ý nghĩa đối với dự án VetaU | Biện pháp triển khai |
| :--- | :--- | :--- |
| **Confidentiality**<br>*(Tính bảo mật)* | Ngăn chặn việc truy cập thông tin trái phép. Dữ liệu nhạy cảm của hành khách chỉ được hiển thị cho chính họ và các bên có thẩm quyền ở dạng rút gọn. | - Mã hóa dữ liệu tĩnh bằng **AES-256-GCM** (Họ tên, SĐT, CCCD, Email).<br>- Băm mật khẩu người dùng bằng **Bcrypt** (salt round = 10).<br>- **Data Masking** tại biên dịch dữ liệu trả về.<br>- Lọc bỏ hoàn toàn các trường chứa ciphertext (`*Encrypted`) trước khi phản hồi JSON. |
| **Integrity**<br>*(Tính toàn vẹn)* | Đảm bảo dữ liệu không bị thay đổi, giả mạo trong quá trình truyền tải hoặc lưu trữ. | - Sử dụng **Mã xác thực GCM (Auth Tag)** để phát hiện chỉnh sửa dữ liệu mã hóa.<br>- Xác thực chữ ký số **JWT (JSON Web Token)** cho mỗi request.<br>- Xác thực chữ ký số **HMAC-SHA256** từ webhook MoMo/ZaloPay.<br>- **Input Sanitizer** làm sạch mọi ký tự injection hoặc script trước khi vào controller. |
| **Availability**<br>*(Tính sẵn sàng)* | Hệ thống luôn hoạt động ổn định, sẵn sàng phục vụ người dùng hợp lệ và chống chịu được các cuộc tấn công phá hoại. | - Áp dụng **Rate Limiting** ở 3 cấp độ (Global, Auth, Payment) để tránh quá tải.<br>- Cơ chế khóa tài khoản tạm thời **Account Lockout** (5 lần sai khóa 15 phút) ngăn brute-force.<br>- **Background Hold Cleaner** tự động giải phóng ghế sau 10 phút để tránh giữ ghế ảo.<br>- **Error Masking** để ẩn lỗi hệ thống nhạy cảm với người dùng ngoài production. |

---

## 3. 🛡️ Kiến trúc Phòng thủ Chiều sâu (Defense-in-Depth) 7 lớp

Hệ thống bảo vệ dữ liệu và chức năng thông qua mô hình chốt chặn 7 lớp từ ngoài vào trong:

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT (React App)                            │
│                                                                      │
│  Lớp 1: CLIENT-SIDE SECURITY                                        │
│  ┌────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ JWT Token Mgmt │  │ Auto Logout 401  │  │ Local UI Sanitizer   │  │
│  │ (Capacitor     │  │ (token expired → │  │ (Xử lý chuỗi hiển thị│  │
│  │  Preferences)  │  │  clear + reload) │  │  an toàn trên giao   │  │
│  │                │  │                  │  │  diện, chống XSS)    │  │
│  └────────────────┘  └──────────────────┘  └──────────────────────┘  │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ HTTPS (TLS 1.3) / ngrok tunnel
┌──────────────────────────────▼───────────────────────────────────────┐
│  Lớp 2: NETWORK & HTTP HEADERS (Helmet + CORS)                       │
│  X-Content-Type-Options: nosniff │ X-Frame-Options: DENY             │
│  Strict-Transport-Security       │ Content-Security-Policy (CSP)     │
│  CORS Whitelist Validation       │ Referrer-Policy: no-referrer      │
├──────────────────────────────────────────────────────────────────────┤
│  Lớp 3: REQUEST FILTERING                                           │
│  ┌─────────────────┐ ┌──────────────────┐ ┌──────────────────────┐  │
│  │ Payload Limit   │ │ Input Sanitizer  │ │ Rate Limiting        │  │
│  │ (Body <= 10 KB) │ │ (NoSQL + XSS     │ │ - Global: 300/15min  │  │
│  │                 │ │  stripper)       │ │ - Auth: 30/15min     │  │
│  │                 │ │                  │ │ - Payment: 60/15min  │  │
│  └─────────────────┘ └──────────────────┘ └──────────────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│  Lớp 4: INPUT VALIDATION (Middleware)                                │
│  ┌─────────────────┐ ┌──────────────────┐ ┌──────────────────────┐  │
│  │ RFC 5322 Email  │ │ Password Strength│ │ Passenger PII Rules  │  │
│  │ Regex validation│ │ Regex validation │ │ (Phone, CCCD regex)  │  │
│  └─────────────────┘ └──────────────────┘ └──────────────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│  Lớp 5: ACCESS CONTROL & AUTHORIZATION                              │
│  ┌─────────────────┐ ┌──────────────────┐ ┌──────────────────────┐   │
│  │ JWT Verify      │ │ Role-Based Access│ │ Account Lockout      │   │
│  │ (Lifespan 24h)  │ │ Control (RBAC)   │ │ (5 fails -> 15 mins  │   │
│  │                 │ │ admin/customer   │ │  lockout duration)   │   │
│  └─────────────────┘ └──────────────────┘ └──────────────────────┘   │
├──────────────────────────────────────────────────────────────────────┤
│  Lớp 6: CRYPTOGRAPHIC DATA PROTECTION                                │
│  ┌─────────────────┐ ┌──────────────────┐ ┌──────────────────────┐   │
│  │ AES-256-GCM     │ │ Bcrypt (salt=10) │ │ Output Masking       │   │
│  │ (All PII fields │ │ (User password   │ │ (Response Sanitizer  │   │
│  │  in Database)   │ │  and OTP hash)   │ │  strips ciphertext)  │   │
│  └─────────────────┘ └──────────────────┘ └──────────────────────┘   │
├──────────────────────────────────────────────────────────────────────┤
│  Lớp 7: MONITORING & SECURITY AUDIT                                  │
│  ┌─────────────────┐ ┌──────────────────┐ ┌──────────────────────┐   │
│  │ Audit Logging   │ │ Error Masking    │ │ Server Key Validation│   │
│  │ (Fire-and-forget│ │ (Production error│ │ (Boot time checking  │   │
│  │  MongoDB logs)  │ │  masking)        │ │  for crypto key strength)│
│  └─────────────────┘ └──────────────────┘ └──────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 4. 🛠️ Phân tích Chi tiết 16 Giải pháp Bảo mật & Mã nguồn minh họa

Dưới đây là phân tích chi tiết của 16 biện pháp kỹ thuật được lập trình thực tế trong dự án kèm trích lục mã nguồn.

### 4.1. Giải pháp 1: Lọc dữ liệu đầu vào chống NoSQL Injection và Stored XSS
*   **Vị trí file:** [inputSanitizer.middleware.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/middlewares/inputSanitizer.middleware.js)
*   **Tại sao phải làm:** Kẻ tấn công có thể chèn các toán tử truy vấn của MongoDB như `{"$gt": ""}` nhằm vượt qua xác thực đăng nhập hoặc đánh cắp dữ liệu. Đồng thời, chúng có thể chèn các đoạn mã độc `<script>` vào trường Họ tên hành khách nhằm thực hiện tấn công XSS chiếm đoạt session cookie của quản trị viên khi xem vé.
*   **Nguyên lý hoạt động:** Middleware duyệt đệ quy qua toàn bộ dữ liệu đầu vào trong `req.body`, `req.query`, và `req.params`. Nó loại bỏ mọi khóa (key) bắt đầu bằng ký tự `$` (các toán tử đặc trưng của MongoDB) và thực hiện mã hóa HTML (escape) cho các ký tự nguy hiểm (`<`, `>`, `&`, `"`, `'`).
*   **Mã nguồn thực tế:**
```javascript
// server/src/middlewares/inputSanitizer.middleware.js
const MONGO_OPERATORS = new Set([
  '$gt', '$gte', '$lt', '$lte', '$ne', '$nin', '$in',
  '$regex', '$options', '$where', '$exists', '$type',
  '$expr', '$jsonSchema', '$mod', '$text', '$search',
  '$all', '$elemMatch', '$size', '$slice',
  '$set', '$unset', '$inc', '$push', '$pull',
  '$and', '$or', '$not', '$nor'
]);

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function sanitize(obj) {
  if (typeof obj === 'string') {
    return escapeHtml(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }
  if (obj !== null && typeof obj === 'object') {
    const clean = {};
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$')) {
        console.warn(`[InputSanitizer] Blocked MongoDB operator: "${key}"`);
        continue; // Loại bỏ toán tử MongoDB
      }
      clean[key] = sanitize(obj[key]);
    }
    return clean;
  }
  return obj;
}
```

### 4.2. Giải pháp 2: Xác thực biểu thức Regex ở biên dịch đầu vào (Input Validation)
*   **Vị trí file:** [inputValidator.middleware.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/middlewares/inputValidator.middleware.js)
*   **Tại sao phải làm:** Tránh các lỗi xử lý dữ liệu sai định dạng (Logic errors) hoặc lỗi tràn bộ đệm hệ thống. Nó giúp hệ thống phản hồi lỗi sớm (Fail-Fast) trước khi đi vào truy vấn DB.
*   **Nguyên lý hoạt động:** Sử dụng các biểu thức chính quy (Regex) tự định nghĩa tại server để kiểm tra cấu trúc dữ liệu của Email, Mật khẩu, Số điện thoại và CCCD trước khi chuyển request tiếp tục.
*   **Mã nguồn thực tế:**
```javascript
// server/src/middlewares/inputValidator.middleware.js
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#^()_+=-]).{8,}$/;
const PHONE_REGEX = /^(\+84|0)\d{9,10}$/;
const NATIONAL_ID_REGEX = /^\d{9}$|^\d{12}$/; // CMND 9 số hoặc CCCD 12 số

function validateRegister(req, res, next) {
  const { name, email, pass } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
    return res.status(400).json({ success: false, message: 'Ten phai tu 2-50 ky tu' });
  }
  if (!email || !EMAIL_REGEX.test(String(email).trim())) {
    return res.status(400).json({ success: false, message: 'Email khong dung dinh dang' });
  }
  if (!pass || !PASSWORD_REGEX.test(pass)) {
    return res.status(400).json({
      success: false,
      message: 'Mat khau phai co it nhat 8 ky tu, bao gom chu hoa, chu thuong, so va ky tu dac biet'
    });
  }
  next();
}
```

### 4.3. Giải pháp 3: Mã hóa dữ liệu PII tại chỗ bằng thuật toán AES-256-GCM
*   **Vị trí file:** [crypto.service.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/services/crypto.service.js)
*   **Tại sao phải làm:** Đáp ứng các tiêu chuẩn bảo mật dữ liệu cá nhân. Trong trường hợp cơ sở dữ liệu bị rò rỉ (SQLi hoặc trộm file backup), hacker cũng không thể đọc được thông tin cá nhân của khách hàng nếu không có khóa mật mã.
*   **Nguyên lý hoạt động:** Sử dụng chế độ mã hóa **AES-256-GCM** (Mã hóa có xác thực). Mỗi lần mã hóa sẽ sinh ra một Vector khởi tạo (IV) ngẫu nhiên 12 bytes đảm bảo cùng một giá trị plaintext khi mã hóa nhiều lần sẽ ra các ciphertext khác nhau. Sau khi mã hóa, GCM sinh ra thêm một **Auth Tag** giúp phát hiện việc chỉnh sửa trái phép lên ciphertext.
*   **Mã nguồn thực tế:**
```javascript
// server/src/services/crypto.service.js
const crypto = require('crypto');
const { DATA_ENCRYPTION_KEY } = require('../config/env');

// Kiểm tra độ dài khóa giải mã lúc khởi chạy hệ thống
if (!DATA_ENCRYPTION_KEY || !/^[a-fA-F0-9]{64}$/.test(DATA_ENCRYPTION_KEY)) {
  throw new Error('DATA_ENCRYPTION_KEY must be exactly 64 hex characters');
}
const KEY = Buffer.from(DATA_ENCRYPTION_KEY, 'hex');

function encryptText(plainText) {
  const iv = crypto.randomBytes(12); // IV ngẫu nhiên 12 bytes
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plainText), 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag(); // Mã xác thực tính toàn vẹn
  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
    tag: tag.toString('hex')
  };
}
```

### 4.4. Giải pháp 4: Khóa tài khoản tạm thời chống dò mật khẩu (Account Lockout)
*   **Vị trí file:** [auth.controller.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/controllers/auth.controller.js)
*   **Tại sao phải làm:** Ngăn chặn hacker thực hiện dò quét mật khẩu hàng loạt (Brute-force/Dictionary attack) đối với các tài khoản trên hệ thống.
*   **Nguyên lý hoạt động:** Mỗi tài khoản lưu trường `failedLoginAttempts` và `lockUntil` trong Database. Nếu người dùng nhập sai mật khẩu liên tiếp **5 lần**, hệ thống sẽ cập nhật `lockUntil` bằng thời gian hiện tại cộng thêm **15 phút**. Trong thời gian này, mọi nỗ lực đăng nhập sẽ bị từ chối với mã lỗi `423 Locked` mà không cần kiểm tra lại mật khẩu trong DB.
*   **Mã nguồn thực tế:**
```javascript
// server/src/controllers/auth.controller.js (Trích đoạn Login)
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 phút

exports.login = async (req, res, next) => {
  // ... tìm kiếm user ...
  if (user.lockUntil && user.lockUntil > new Date()) {
    const remainingMs = user.lockUntil - new Date();
    const remainingMin = Math.ceil(remainingMs / 60000);
    return res.status(423).json({
      success: false,
      message: `Tai khoan tam khoa do dang nhap sai qua nhieu lan. Thu lai sau ${remainingMin} phut.`
    });
  }

  const ok = await bcrypt.compare(pass, user.password);
  if (!ok) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
    }
    await user.save();
    return res.status(400).json({ success: false, message: 'Email hoac mat khau khong dung' });
  }

  // Login thành công -> Reset counter
  if (user.failedLoginAttempts > 0 || user.lockUntil) {
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();
  }
  // ... ký JWT token ...
};
```

### 4.5. Giải pháp 5: Ghi nhật ký bảo mật Audit Log bất đồng bộ (Security Audit Logging)
*   **Vị trí file:** [audit.middleware.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/middlewares/audit.middleware.js)
*   **Tại sao phải làm:** Lưu giữ dấu vết các hành động nhạy cảm để phục vụ quá trình phân tích điều tra (Forensics) khi xảy ra sự cố bảo mật hoặc rò rỉ thông tin.
*   **Nguyên lý hoạt động:** Cung cấp hàm `logAudit` và middleware ghi nhận thông tin bất đồng bộ theo cơ chế "Fire-and-forget" (lập trình không đồng bộ và không chặn luồng chính). Mọi lỗi phát sinh trong quá trình ghi log (ví dụ lỗi DB) sẽ bị bắt lại và không làm ảnh hưởng đến luồng giao dịch của người dùng. Collection `auditlogs` được cấu hình TTL Index tự động dọn dẹp sau 90 ngày.
*   **Mã nguồn thực tế:**
```javascript
// server/src/middlewares/audit.middleware.js
const AuditLog = require('../models/auditLog.model');

async function logAudit({ userId, action, resource, resourceId, ip, userAgent, details }) {
  try {
    await AuditLog.create({
      userId: userId || null,
      action,
      resource: resource || '',
      resourceId: resourceId || '',
      ip: ip || '',
      userAgent: userAgent || '',
      details: details || ''
    });
  } catch (err) {
    // Không throw lỗi ra ngoài để bảo vệ tính sẵn sàng của nghiệp vụ chính
    console.error('[AuditLog] Failed to write audit log:', err.message);
  }
}
```

### 4.6. Giải pháp 6: Sinh OTP và mã số ngẫu nhiên an toàn mật mã (CSPRNG)
*   **Vị trí file:** [auth.controller.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/controllers/auth.controller.js#L89)
*   **Tại sao phải làm:** Hàm ngẫu nhiên mặc định `Math.random()` hoạt động dựa trên bộ sinh số giả ngẫu nhiên tuần hoàn (PRNG). Hacker thu thập được một lượng chuỗi ngẫu nhiên sinh ra liên tiếp có thể tính toán để đoán trước OTP hoặc mã vé tiếp theo.
*   **Nguyên lý hoạt động:** Sử dụng mô-đun `crypto` của Node.js để gọi hàm `crypto.randomInt()`, sử dụng entropy thu thập từ phần cứng hệ điều hành (CSPRNG - Cryptographically Secure Pseudo-Random Number Generator) để sinh ra chuỗi ngẫu nhiên tuyệt đối không thể dự đoán.
*   **Mã nguồn thực tế:**
```javascript
// Sinh OTP 6 số an toàn mật mã
const generateOtp = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');
```

### 4.7. Giải pháp 7: Quản lý phiên làm việc & cơ chế Tự động Đăng xuất (Client Auto Logout)
*   **Vị trí file:** [http.js](file:///e:/An%20ninh%20TT/vetau-app/src/api/http.js)
*   **Tại sao phải làm:** Tránh việc chiếm dụng token đã hết hạn hoặc token giả mạo trên trình duyệt của người dùng.
*   **Nguyên lý hoạt động:** Token xác thực JWT được lưu an toàn trên thiết bị thông qua `@capacitor/preferences` (tự động mã hóa trên môi trường native mobile). Ở phía frontend, một Axios Interceptor được cấu hình để lắng nghe mọi phản hồi của API. Khi server trả về mã lỗi `401 Unauthorized` (đồng nghĩa JWT đã hết hạn hoặc không hợp lệ), client sẽ lập tức xóa token khỏi bộ nhớ và chuyển hướng người dùng về trang Đăng nhập.
*   **Mã nguồn thực tế:**
```javascript
// src/api/http.js
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Xoá token khỏi Capacitor Preferences
      await Preferences.remove({ key: 'auth_token' });
      // Buộc reload app hoặc điều hướng về màn hình login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 4.8. Giải pháp 8: Giới hạn kích thước payload chống tấn công từ chối dịch vụ (DoS)
*   **Vị trí file:** [app.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/app.js#L87)
*   **Tại sao phải làm:** Hacker có thể gửi các JSON payload khổng lồ (vài chục MB) đến các endpoint để ép CPU và RAM của máy chủ hoạt động quá tải khi cố phân tích dữ liệu (JSON parsing), gây sập hệ thống (Denial of Service).
*   **Nguyên lý hoạt động:** Giới hạn dung lượng tối đa cho request body là **10KB**. Nếu vượt quá giới hạn này, Express sẽ trả ngay mã lỗi `413 Payload Too Large`.
*   **Mã nguồn thực tế:**
```javascript
// server/src/app.js
app.use(express.json({ limit: '10kb' }));
```

### 4.9. Giải pháp 9: Rate Limiting phân tầng chống spam tài nguyên
*   **Vị trí file:** [app.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/app.js#L45)
*   **Tại sao phải làm:** Tránh các cuộc tấn công DDoS quy mô nhỏ hoặc tấn công brute-force vào các tài nguyên tốn CPU (như băm Bcrypt mật khẩu) hay tài nguyên tốn phí (gọi API thanh toán bên thứ ba).
*   **Nguyên lý hoạt động:** Thiết lập giới hạn tần suất request theo IP ở 3 tầng:
    1.  **Global Limiter:** Giới hạn tối đa 300 request / 15 phút cho toàn bộ API.
    2.  **Auth Limiter:** Giới hạn tối đa 30 request / 15 phút đối với endpoint đăng ký/đăng nhập.
    3.  **Payment Limiter:** Giới hạn tối đa 60 request / 15 phút đối với cổng thanh toán để tránh spam tạo giao dịch rác.
*   **Mã nguồn thực tế:**
```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 30, // Tối đa 30 requests
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Qua nhieu yeu cau xac thuc. Vui long thu lai sau.' }
});

app.use('/api/auth', authLimiter, authRoutes);
```

### 4.10. Giải pháp 10: Sử dụng Helmet để gia cố HTTP Security Headers
*   **Vị trí file:** [app.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/app.js#L74)
*   **Tại sao phải làm:** Tránh các lỗi cấu hình bảo mật cơ bản khiến trình duyệt hiểu sai kiểu file (MIME Sniffing), bị nhúng iframe lừa đảo (Clickjacking), hoặc rò rỉ nguồn gốc của request.
*   **Nguyên lý hoạt động:** Helmet tự động thiết lập các tiêu đề HTTP chuẩn bảo mật như:
    *   `X-Content-Type-Options: nosniff` (Yêu cầu trình duyệt tuân thủ chặt chẽ Content-Type).
    *   `X-Frame-Options: DENY` (Chặn các trang web khác nhúng iframe VetaU).
    *   `Strict-Transport-Security` (Buộc giao tiếp qua HTTPS).
    *   Ẩn hoàn toàn header mặc định `X-Powered-By: Express` để hacker không biết cấu trúc máy chủ.
*   **Mã nguồn thực tế:**
```javascript
// server/src/app.js
app.use(helmet());
```

### 4.11. Giải pháp 11: Che giấu thông tin lỗi ở Production (Error Masking)
*   **Vị trí file:** [error.middleware.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/middlewares/error.middleware.js)
*   **Tại sao phải làm:** Việc hiển thị chi tiết lỗi hệ thống (như stack trace hoặc đường dẫn thư mục vật lý) ở môi trường production sẽ cung cấp các thông tin tình báo có giá trị cho hacker để tìm ra sơ hở của hệ thống.
*   **Nguyên lý hoạt động:** Middleware kiểm tra biến môi trường `NODE_ENV`. Nếu là `production`, nó sẽ ẩn toàn bộ thông báo chi tiết và chỉ trả về thông điệp chung: *"Đã xảy ra lỗi. Vui lòng thử lại sau."*. Lỗi chi tiết chỉ được ghi lại ở log server.
*   **Mã nguồn thực tế:**
```javascript
// server/src/middlewares/error.middleware.js
module.exports = (err, req, res, next) => {
  console.error('Server error:', err.message);

  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd
    ? 'Da xay ra loi. Vui long thu lai sau.'
    : (err.message || 'Loi he thong');

  return res.status(err.status || 500).json({
    success: false,
    message
  });
};
```

### 4.12. Giải pháp 12: Lọc dữ liệu đầu ra ngăn rò rỉ (Response Sanitization)
*   **Vị trí file:** [order.controller.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/controllers/order.controller.js)
*   **Tại sao phải làm:** Đảm bảo tuân thủ nguyên tắc Least Privilege, chỉ trả về dữ liệu cần thiết tối thiểu cho giao diện, chặn rò rỉ các chuỗi mã hóa (`iv`, `content`, `tag`) về phía client.
*   **Nguyên lý hoạt động:** Trước khi gửi phản hồi JSON về cho client, đối tượng Order hoặc Ticket sẽ được chuyển qua hàm sanitize để xóa bỏ hoàn toàn các trường nhạy cảm dạng `*Encrypted` và thay bằng bản masked an toàn.
*   **Mã nguồn thực tế:**
```javascript
// Trích logic sanitize trong controller
function sanitizeOrderForCustomer(order) {
  const clean = order.toObject();
  if (clean.passengers) {
    clean.passengers = clean.passengers.map(p => {
      // Loại bỏ hoàn toàn các trường mã hóa gốc khỏi API Response
      delete p.fullNameEncrypted;
      delete p.phoneEncrypted;
      delete p.nationalIdEncrypted;
      delete p.emailEncrypted;
      return p;
    });
  }
  return clean;
}
```

### 4.13. Giải pháp 13: Bảo vệ luồng đăng ký bằng OTP Hash & OTP Rate Limit
*   **Vị trí file:** [auth.controller.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/controllers/auth.controller.js)
*   **Tại sao phải làm:** Tránh việc OTP bị đọc từ Database hoặc bị spam gây tốn tài nguyên và chi phí email.
*   **Nguyên lý hoạt động:** 
    *   Mã OTP được sinh bằng CSPRNG, sau đó băm (hash) bằng **Bcrypt** trước khi lưu vào bảng `pendingregistrations`. Hacker có quyền truy cập DB cũng không thể dịch ngược ra OTP.
    *   Hệ thống quy định cooldown **60 giây** giữa hai lần yêu cầu gửi lại mã và tối đa **5 lần gửi lại/giờ**.
    *   Nếu người dùng nhập sai OTP quá **5 lần**, tài khoản chờ đăng ký đó sẽ bị khóa không cho thử tiếp.

### 4.14. Giải pháp 14: Xác minh chữ ký số thanh toán (HMAC-SHA256)
*   **Vị trí file:** [momo.service.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/services/momo.service.js) & [zalopay.service.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/services/zalopay.service.js)
*   **Tại sao phải làm:** Kẻ tấn công có thể giả mạo gói tin IPN (Instant Payment Notification) từ cổng thanh toán gửi tới webhook của hệ thống để chuyển đổi trạng thái đơn hàng sang "Đã thanh toán" mà không cần chuyển tiền thực tế.
*   **Nguyên lý hoạt động:** Khi nhận gói tin từ cổng thanh toán, hệ thống trích xuất chữ ký số kèm theo, tự tính toán chữ ký số bằng thuật toán **HMAC-SHA256** dựa trên dữ liệu giao dịch nhận được và khóa bí mật `partnerSecretKey`. Đơn hàng chỉ được xác nhận khi hai chữ ký trùng khớp hoàn toàn.

### 4.15. Giải pháp 15: Kiểm tra quyền sở hữu đối với tài nguyên (Data Ownership Verification)
*   **Vị trí file:** [order.controller.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/controllers/order.controller.js) & [ticket.controller.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/controllers/ticket.controller.js)
*   **Tại sao phải làm:** Tránh lỗ hổng **BOLA/IDOR (Broken Object Level Authorization)** khi hacker cố tình đổi ID của đơn hàng hoặc vé trên URL để xem trộm thông tin vé của người khác.
*   **Nguyên lý hoạt động:** Khi truy vấn đơn hàng hoặc vé, hệ thống bắt buộc kiểm tra điều kiện sở hữu `userId: req.user.id` trong câu lệnh truy vấn MongoDB. Người dùng thông thường tuyệt đối không thể đọc hoặc hủy vé của tài khoản khác.

### 4.16. Giải pháp 16: Vô hiệu hóa luồng thanh toán cũ trên production (Legacy Endpoint Deactivation)
*   **Vị trí file:** [payment.controller.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/controllers/payment.controller.js)
*   **Tại sao phải làm:** Các API cũ phục vụ kiểm thử (như xác nhận thanh toán trực tiếp không cần qua ví điện tử) có thể bị hacker khai thác để hoàn tất đơn hàng miễn phí.
*   **Nguyên lý hoạt động:** API thanh toán legacy (`/payments/complete-legacy`) kiểm tra môi trường chạy của hệ thống. Nếu `process.env.NODE_ENV === 'production'`, nó sẽ lập tức trả về mã lỗi `410 Gone` hoặc `404 Not Found` và ghi log cảnh báo xâm nhập.

---

## 5. 🗺️ Bản đồ đối chiếu với OWASP Top 10:2021

Dưới đây là bảng đối chiếu chi tiết 10 danh mục lỗ hổng bảo mật hàng đầu của OWASP với các giải pháp kỹ thuật đã triển khai trên VetaU:

| Phân loại OWASP | Tên lỗ hổng | Biện pháp kỹ thuật tương ứng trên VetaU | Vị trí file trong codebase |
| :--- | :--- | :--- | :--- |
| **A01:2021** | **Broken Access Control**<br>*(Lỗi kiểm soát truy cập)* | - Sử dụng RBAC qua middleware `requireRole('admin')`.<br>- Kiểm tra quyền sở hữu dữ liệu đơn hàng (`userId: req.user.id`).<br>- Response Sanitization ẩn các trường mã hóa. | - [auth.middleware.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/middlewares/auth.middleware.js)<br>- [order.controller.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/controllers/order.controller.js) |
| **A02:2021** | **Cryptographic Failures**<br>*(Lỗi mật mã)* | - Mã hóa dữ liệu tĩnh bằng **AES-256-GCM** kèm IV ngẫu nhiên.<br>- Băm mật khẩu người dùng và OTP bằng **Bcrypt**.<br>- Sinh mã độc nhất và OTP bằng bộ CSPRNG.<br>- Xác thực độ dài khóa giải mã lúc khởi động. | - [crypto.service.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/services/crypto.service.js)<br>- [auth.controller.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/controllers/auth.controller.js) |
| **A03:2021** | **Injection**<br>*(Lỗi chèn mã độc)* | - Bộ lọc đệ quy làm sạch các toán tử `$ne`, `$gt` (NoSQLi).<br>- Escape mã độc `<script>` sang thực thể văn bản an toàn (Stored XSS).<br>- Validate cấu trúc dữ liệu đầu vào thông qua regex. | - [inputSanitizer.middleware.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/middlewares/inputSanitizer.middleware.js)<br>- [inputValidator.middleware.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/middlewares/inputValidator.middleware.js) |
| **A04:2021** | **Insecure Design**<br>*(Thiết kế không an toàn)* | - Triển khai thiết kế **Defense-in-Depth** đa lớp.<br>- Validate định dạng mật khẩu mạnh lúc đăng ký.<br>- Chế độ khóa tài khoản tạm thời ngăn đoán mật khẩu. | - [app.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/app.js)<br>- [auth.controller.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/controllers/auth.controller.js) |
| **A05:2021** | **Security Misconfiguration**<br>*(Sai cấu hình bảo mật)* | - Sử dụng **Helmet** cấu hình HTTP Security Headers.<br>- Thiết lập CORS Whitelist ngăn chặn các nguồn lạ.<br>- Giới hạn kích thước payload `limit: '10kb'` chống DoS.<br>- Kích hoạt CORS Credentials để quản lý session an toàn. | - [app.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/app.js) |
| **A06:2021** | **Vulnerable & Outdated Components**<br>*(Sử dụng thư viện lỗi thời)* | - Cập nhật các thư viện lên phiên bản mới nhất, an toàn ổn định (Express 5.x, Mongoose 9.x, Helmet 8.x). | - [package.json](file:///e:/An%20ninh%20TT/vetau-app/server/package.json) |
| **A07:2021** | **Identification & Auth Failures**<br>*(Lỗi định danh & xác thực)* | - Sử dụng JWT có thời gian sống ngắn (**24 giờ**).<br>- Tự động đăng xuất ở Client (Axios interceptor 401).<br>- Timing-Safe Response (không phân biệt lỗi sai email hay mật khẩu) chống đoán tên tài khoản. | - [auth.controller.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/controllers/auth.controller.js)<br>- [http.js](file:///e:/An%20ninh%20TT/vetau-app/src/api/http.js) |
| **A08:2021** | **Software & Data Integrity Failures**<br>*(Lỗi toàn vẹn phần mềm & dữ liệu)* | - Xác thực toàn vẹn gói tin thanh toán IPN bằng mã hóa **HMAC-SHA256** từ MoMo và ZaloPay. | - [momo.service.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/services/momo.service.js)<br>- [zalopay.service.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/services/zalopay.service.js) |
| **A09:2021** | **Security Logging & Monitoring Failures**<br>*(Lỗi ghi nhật ký & giám sát)* | - Ghi lại vết 7 nhóm hành động nhạy cảm vào DB bất đồng bộ.<br>- Đặt TTL Index tự động dọn dẹp log sau 90 ngày. | - [audit.middleware.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/middlewares/audit.middleware.js)<br>- [auditLog.model.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/models/auditLog.model.js) |
| **A10:2021** | **Server-Side Request Forgery (SSRF)** | - Không cho phép người dùng tùy ý nhập URL để server gửi request bên ngoài. Toàn bộ endpoints của bên thứ ba (Ví điện tử) đều được khai báo tĩnh trong biến môi trường. | - [env.js](file:///e:/An%20ninh%20TT/vetau-app/server/src/config/env.js) |

---

## 6. 📊 So sánh chi tiết trước và sau khi nâng cấp hệ thống bảo mật

| Tiêu chí | Hệ thống ban đầu (Legacy) | Hệ thống hiện tại (Đã nâng cấp) |
| :--- | :---: | :---: |
| **PII được bảo vệ** | Không mã hóa (Lưu dạng text thô) | **Mã hóa AES-256-GCM** (Họ tên, SĐT, CCCD, Email) |
| **Lọc toán tử NoSQL Injection** | Không hỗ trợ (Dễ bị bypass login) | **Có** (Lọc sạch các từ khóa `$ne`, `$gt`,...) |
| **Chống Stored XSS** | Không hỗ trợ | **Có** (Mã hóa thực thể HTML ở đầu vào) |
| **Xác thực định dạng (Email, Phone)** | Kiểm tra sơ sài ở client | **Đồng bộ ở middleware backend bằng Regex** |
| **Độ mạnh mật khẩu yêu cầu** | Không giới hạn độ dài và ký tự | **Tối thiểu 8 ký tự, có chữ hoa, thường, số, đặc biệt** |
| **Phòng chống Brute-Force** | Không có giới hạn lần thử sai | **Lock tài khoản 15 phút sau 5 lần sai liên tiếp** |
| **Hạn dùng của JWT** | 7 ngày (Quá dài, tăng rủi ro rò rỉ) | **Rút ngắn còn 24 giờ** |
| **Xử lý phiên hết hạn trên UI** | Người dùng nhận màn hình lỗi trắng | **Client tự động logout và xóa token** |
| **Sinh OTP & Mã số** | Sử dụng `Math.random()` | **Sử dụng CSPRNG (`crypto.randomInt`)** |
| **Bảo vệ mã OTP đăng ký** | Lưu OTP dạng text thô trong Database | **Mã hóa một chiều bằng Bcrypt** |
| **Rate Limit** | Không có (Dễ bị spam sập server) | **Phân tầng 3 lớp** (Global, Auth, Payment) |
| **Giới hạn kích thước payload** | Không giới hạn | **Giới hạn tối đa 10KB** |
| **Ẩn lỗi nhạy cảm (Error Masking)** | Trả đầy đủ Stack Trace lỗi hệ thống | **Trả thông báo lỗi chung ở Production** |
| **Rò rỉ dữ liệu mã hóa ra ngoài** | Trả nguyên đối tượng chứa key mã hóa | **Response Sanitizer lọc sạch trường mã hóa** |
| **Bảo vệ toàn vẹn thanh toán** | Nhận kết quả thanh toán trực tiếp | **Xác minh chữ ký số HMAC-SHA256** |
| **Chặn Endpoint thử nghiệm** | Bỏ ngỏ trên production | **Chặn API legacy bằng HTTP 410 ở production** |
| **Lưu vết vết bảo mật (Audit)** | Không hỗ trợ | **Ghi log 7 hành động nhạy cảm bất đồng bộ** |
| **Độ phủ OWASP Top 10** | 2 / 10 danh mục | **9 / 10 danh mục** |

---

## 7. 🧪 Hướng dẫn kiểm thử bảo mật thực tế (Security Testing Guide)

Dưới đây là các kịch bản kiểm thử cụ thể phục vụ mục đích chứng minh tính hiệu quả của hệ thống bảo mật VetaU trước Hội đồng.

### 7.1. Kiểm thử chống NoSQL Injection
*   **Mục tiêu:** Chứng minh hệ thống chặn đứng việc bypass mật khẩu bằng toán tử `$ne`.
*   **Thực hiện (PowerShell):**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email": {"$gt": ""}, "pass": "any_password"}'
```
*   **Kết quả mong đợi:** Server trả về mã lỗi `401 Unauthorized` hoặc `400 Bad Request` kèm thông báo đăng nhập thất bại. Cơ chế `inputSanitizer` đã xóa khóa `$gt`, chuyển email thành chuỗi trống `{}`.

### 7.2. Kiểm thử chống Stored XSS
*   **Mục tiêu:** Chứng minh mã nguồn độc hại `<script>` bị vô hiệu hóa khi nhập vào trường thông tin hành khách.
*   **Thực hiện:**
    1. Truy cập giao diện đặt vé. Ở trường **Họ tên hành khách**, nhập chuỗi:
       `Khách Hàng <script>alert('xss_attack')</script>`
    2. Hoàn tất đặt vé và xem đơn hàng.
*   **Kết quả mong đợi:** 
    *   Trong database MongoDB: trường tên lưu trữ dạng thực thể văn bản đã mã hóa: `Khách Hàng &lt;script&gt;alert(&#x27;xss_attack&#x27;)&lt;/script&gt;`.
    *   Trên trình duyệt: Hiển thị văn bản thô đầy đủ, không xuất hiện hộp thoại cảnh báo (alert) chạy trên trình duyệt.

### 7.3. Kiểm thử Kiểm tra cấu trúc mật khẩu mạnh
*   **Mục tiêu:** Chứng minh hệ thống từ chối các mật khẩu yếu.
*   **Thực hiện (PowerShell):**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register/send-otp" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"name": "Nguyen Van A", "email": "test@gmail.com", "pass": "123456", "role": "customer"}'
```
*   **Kết quả mong đợi:** Server phản hồi mã lỗi `400 Bad Request` ngay lập tức kèm thông điệp cảnh báo về yêu cầu độ dài và ký tự của mật khẩu.

### 7.4. Kiểm thử Khóa tài khoản tạm thời (Account Lockout)
*   **Mục tiêu:** Chứng minh tài khoản tự động khóa sau 5 lần đăng nhập sai.
*   **Thực hiện (PowerShell):**
```powershell
for ($i=1; $i -le 6; $i++) {
  try {
    $res = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
      -Method POST `
      -ContentType "application/json" `
      -Body '{"email": "timkiemve@gmail.com", "pass": "sai_mat_khau"}'
    Write-Host "Lần $i: Đăng nhập thành công"
  } catch {
    Write-Host "Lần $i: $_"
  }
}
```
*   **Kết quả mong đợi:** 
    *   Lần 1 đến 5: Server trả về lỗi `400 Bad Request` (Email hoặc mật khẩu không đúng).
    *   Lần 6: Server trả về mã lỗi `423 Locked` kèm thông báo: *"Tai khoan tam khoa do dang nhap sai qua nhieu lan. Thu lai sau 15 phut."*.

### 7.5. Kiểm thử Giới hạn tần suất (Rate Limiting)
*   **Mục tiêu:** Chứng minh server chặn đứng việc gửi yêu cầu quá tần suất.
*   **Thực hiện (PowerShell):**
```powershell
for ($i=1; $i -le 35; $i++) {
  try {
    Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
      -Method POST `
      -ContentType "application/json" `
      -Body '{"email": "spam@gmail.com", "pass": "password"}'
    Write-Host "Request $i: Thanh cong"
  } catch {
    Write-Host "Request $i: $_"
  }
}
```
*   **Kết quả mong đợi:** 
    *   30 request đầu nhận phản hồi lỗi đăng nhập bình thường (`400 Bad Request`).
    *   Từ request 31 trở đi nhận mã lỗi `429 Too Many Requests` kèm thông báo chặn từ Rate Limiter.

### 7.6. Kiểm chứng mã hóa cơ sở dữ liệu (Database Ciphertext Verification)
*   **Mục tiêu:** Chứng minh PII được mã hóa trong MongoDB.
*   **Thực hiện:**
    Mở terminal kết nối MongoDB và kiểm tra bảng đơn hàng:
```bash
mongosh
use vetau_app
db.orders.find().limit(1).pretty()
```
*   **Kết quả mong đợi:** Trường `fullNameEncrypted`, `phoneEncrypted` và `nationalIdEncrypted` hiển thị cấu trúc chứa các chuỗi hexa ngẫu nhiên cho `iv`, `content` và `tag`, hoàn toàn không lộ Họ tên hay SĐT.

### 7.7. Kiểm chứng Audit Log bảo mật
*   **Mục tiêu:** Chứng minh vết giao dịch nhạy cảm được ghi lại.
*   **Thực hiện:**
    Tru vấn lịch sử audit log:
```bash
db.auditlogs.find().sort({timestamp: -1}).limit(5).pretty()
```
*   **Kết quả mong đợi:** Hiện đầy đủ các bản ghi audit log dạng `AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILED`, `AUTH_ACCOUNT_LOCKED` kèm IP, User-Agent tương ứng.

---

## 🎙️ 8. Kịch bản thuyết trình bảo vệ đồ án trước Hội đồng (Văn nói)

*Dưới đây là kịch bản nói chi tiết, phân tích rõ ràng theo mô hình **"Tại sao phải làm? - Hậu quả nếu không làm - Tại sao dùng giải pháp này?"** để hỗ trợ bạn trả lời xuất sắc trước Hội đồng chấm đồ án:*

---

### 🎙️ PHẦN MỞ ĐẦU: Đặt vấn đề và Triết lý Bảo mật

> **Kịch bản nói:**
> *"Kính thưa thầy cô và các bạn, đối với một ứng dụng dịch vụ công cộng như **VetaU** - hệ thống đặt vé tàu Bắc Nam trực tuyến, chúng ta đang trực tiếp xử lý hai loại tài sản vô cùng nhạy cảm: **Thông tin định danh cá nhân (PII)** của hành khách (Họ tên, CCCD, Số điện thoại) và **Giao dịch tài chính** thông qua Ví điện tử.
>
> Nếu một hệ thống như thế này bị xâm nhập, thiệt hại không chỉ dừng lại ở mặt tài chính mà còn là nguy cơ rò rỉ lộ trình di chuyển của hàng triệu công dân trên diện rộng. Do đó, chúng em đã nâng cấp bảo mật VetaU dựa trên triết lý **Defense-in-Depth (Phòng thủ chiều sâu)**: không tin tưởng tuyệt đối vào bất kỳ một lớp phòng vệ đơn lẻ nào, mà thiết lập nhiều chốt chặn liên hoàn từ Client, Network, Application cho tới Database.
>
> Dưới đây là chi tiết các biện pháp kỹ thuật được phân nhóm theo 3 trụ cột cốt lõi cùng lý do khoa học tại sao chúng em bắt buộc phải triển khai chúng:"*

---

### 🛡️ TRỤ CỘT 1: Kiểm soát Dữ liệu Đầu vào (Input Security)

#### 1. Bộ lọc đầu vào chống NoSQL Injection và XSS (`inputSanitizer`)
*   **Tại sao phải làm?**
    Tất cả dữ liệu do người dùng gửi lên qua Form đều là dữ liệu chưa thể tin cậy (Untrusted Input). Hacker có thể cố tình chèn các toán tử truy vấn của MongoDB hoặc các đoạn mã Script chạy trên trình duyệt.
*   **Nếu không làm thì hệ thống sẽ ra sao?**
    *   *Bị tấn công NoSQL Injection:* Kẻ tấn công có thể nhập mật khẩu là `{"$ne": null}` (Không bằng null) để bypass qua trang đăng nhập mà không cần mật khẩu thật, hoặc lợi dụng để trích xuất toàn bộ dữ liệu người dùng từ database.
    *   *Bị tấn công Cross-Site Scripting (XSS):* Kẻ tấn công có thể chèn một thẻ `<script>` độc hại vào trường tên hành khách. Khi nhân viên soát vé hoặc người dùng khác mở vé đó lên xem, mã độc sẽ tự động chạy trên trình duyệt của họ và gửi Session Token về server của hacker.
*   **Tại sao lại dùng giải pháp này?**
    Chúng em tự viết middleware `inputSanitizer.middleware.js` tự động quét qua toàn bộ cấu trúc dữ liệu (`req.body`, `req.query`, `req.params`) và loại bỏ hoàn toàn các ký tự bắt đầu bằng dấu `$` (các toán tử đặc trưng của MongoDB) cũng như mã hóa (escape) các thẻ HTML nguy hiểm thành thực thể văn bản an toàn (ví dụ: chuyển `<` thành `&lt;`).

#### 2. Rào chắn Validate dữ liệu đầu vào (`inputValidator`)
*   **Tại sao phải làm?**
    Đảm bảo dữ liệu gửi lên backend phải khớp định dạng nghiệp vụ và giới hạn kích thước trước khi thực hiện bất cứ câu lệnh truy vấn nào.
*   **Nếu không làm thì hệ thống sẽ ra sao?**
    Hệ thống sẽ gặp lỗi logic hoặc crash server nếu dữ liệu sai định dạng (ví dụ: số điện thoại chứa ký tự chữ, hoặc CCCD có độ dài quá lớn gây tràn bộ nhớ đệm Buffer Overflow). Hacker cũng có thể spam đăng ký tài khoản với email ảo hoặc mật khẩu siêu ngắn chỉ có 1 ký tự, làm giảm độ bảo mật của toàn hệ thống.
*   **Tại sao lại dùng giải pháp này?**
    Chúng em sử dụng biểu thức chính quy (Regex) tại server để ép buộc: Email phải đúng định dạng chuẩn RFC, mật khẩu bắt buộc phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt, đồng thời CCCD phải đủ 12 chữ số. Nếu dữ liệu không thỏa mãn, middleware sẽ lập tức ngắt request và trả về lỗi `400 Bad Request` ngay tại cửa ngõ, giảm tải cho database.

#### 3. Sinh số ngẫu nhiên an toàn mật mã (CSPRNG bằng `crypto.randomInt`)
*   **Tại sao phải làm?**
    Hệ thống cần sinh ra các chuỗi ngẫu nhiên bảo mật cao cho OTP (Xác thực đăng ký) và Mã số vé tàu để đảm bảo tính độc nhất và không thể đoán trước.
*   **Nếu không làm thì hệ thống sẽ ra sao?**
    Hàm mặc định của JavaScript là `Math.random()` chỉ là một bộ sinh số giả ngẫu nhiên thông thường (PRNG). Thuật toán của nó dựa trên một trạng thái ban đầu (seed) và có tính tuần hoàn nhất định. Kẻ tấn công thu thập khoảng 10-20 mã vé sinh ra liên tiếp có thể dịch ngược lại thuật toán, tính toán chính xác mã OTP hoặc mã vé tiếp theo sẽ được tạo ra là gì để cướp quyền sở hữu vé hoặc tài khoản.
*   **Tại sao lại dùng giải pháp này?**
    Chúng em sử dụng mô-đun `crypto` tích hợp sẵn trong Node.js để gọi hàm `crypto.randomInt()`. Đây là bộ sinh số ngẫu nhiên an toàn mật mã (**CSPRNG**), nó sử dụng entropy (độ hỗn loạn) từ chính phần cứng của hệ điều hành nên đảm bảo tính ngẫu nhiên tuyệt đối và không thể bị đảo ngược bằng toán học.

---

### 🔒 TRỤ CỘT 2: Bảo vệ Dữ liệu Nhạy cảm (PII) & Quản lý Phiên

#### 1. Mã hóa cơ sở dữ liệu với thuật toán AES-256-GCM
*   **Tại sao phải làm?**
    Bảo vệ dữ liệu cá nhân nhạy cảm của hành khách bao gồm Họ tên và Số CCCD/Hộ chiếu lưu trữ trong DB.
*   **Nếu không làm thì hệ thống sẽ ra sao?**
    Nếu kẻ tấn công khai thác được database (thông qua SQL/NoSQL Injection hoặc bằng cách đánh cắp file backup database `.bson` từ cloud), họ sẽ đọc được toàn bộ danh sách khách hàng và số CCCD ở dạng văn bản thuần (plain text). Điều này vi phạm nghiêm trọng Luật An ninh mạng và Nghị định bảo vệ dữ liệu cá nhân (NĐ 13).
*   **Tại sao lại dùng giải pháp này?**
    Chúng em chọn **AES-256-GCM** (Advanced Encryption Standard - Galois/Counter Mode). Khác với các chế độ cũ như AES-CBC, chế độ GCM là thuật toán **Authenticated Encryption (Mã hóa có xác thực)**. Nó không chỉ che giấu dữ liệu (Confidentiality) mà còn tạo ra một mã xác thực (Auth Tag). Khi giải mã, nếu dữ liệu bị thay đổi dù chỉ 1 bit, hệ thống sẽ phát hiện ra ngay lập tức và từ chối giải mã (Integrity). Khóa mã hóa được lưu riêng biệt trong biến môi trường `.env` chứ không nằm chung trong database.

#### 2. Khóa tài khoản tạm thời (Account Lockout) và Giới hạn tần suất (Rate Limiting)
*   **Tại sao phải làm?**
    Ngăn chặn kẻ tấn công dò tìm mật khẩu của tài khoản người dùng hoặc tài khoản quản trị viên.
*   **Nếu không làm thì hệ thống sẽ ra sao?**
    Hacker có thể chạy các công cụ Brute Force (thử mật khẩu tự động với tốc độ hàng ngàn lần một giây từ danh sách mật khẩu phổ biến) liên tục cho đến khi đăng nhập thành công. Không những thế, việc gửi hàng triệu request liên tiếp vào endpoint Login sẽ gây quá tải tài nguyên hệ thống, dẫn đến hiện tượng từ chối dịch vụ (DoS).
*   **Tại sao lại dùng giải pháp này?**
    Chúng em đã cấu hình:
    *   **Rate Limiter:** Giới hạn mỗi IP chỉ được gửi tối đa 30 requests/15 phút lên các API nhạy cảm như Đăng nhập/Đăng ký.
    *   **Account Lockout:** Trong schema của Mongoose, chúng em thêm thuộc tính `failedLoginAttempts`. Nếu một tài khoản nhập sai mật khẩu liên tục 5 lần, hệ thống sẽ khóa tài khoản này trong vòng 15 phút bằng cách thiết lập mốc thời gian `lockUntil`, chặn đứng mọi nỗ lực dò mật khẩu.

#### 3. Siết chặt phiên làm việc (JWT Lifespan & Auto-Logout)
*   **Tại sao phải làm?**
    Kiểm soát chặt chẽ thời gian sống của các token truy cập.
*   **Nếu không làm thì hệ thống sẽ ra sao?**
    Nếu thiết lập token JWT có hạn dùng quá dài (ví dụ: vài tuần hoặc không hết hạn), nếu người dùng vô tình đăng nhập trên máy tính công cộng mà quên logout, hoặc token bị rò rỉ qua log mạng, hacker sở hữu token đó có thể giả mạo nạn nhân truy cập vào hệ thống vĩnh viễn mà chúng ta không có cách nào thu hồi token đó được (vì JWT là stateless).
*   **Tại sao lại dùng giải pháp này?**
    Chúng em rút ngắn thời gian hết hạn của JWT xuống còn **24 giờ**. Đồng thời, ở phía Frontend, chúng em viết interceptor bắt sự kiện lỗi HTTP `401 Unauthorized` từ API; ngay khi phát hiện token hết hạn, client lập tức xóa token khỏi `Capacitor Preferences` và tự động điều hướng người dùng về trang Đăng nhập (`auto-logout`), ngăn ngừa phiên làm việc bị bỏ quên.

---

### 👁️ TRỤ CỘT 3: Giám sát Hệ thống và Cấu hình Máy chủ

#### 1. Thiết lập Nhật ký Bảo mật (Audit Logging)
*   **Tại sao phải làm?**
    Hệ thống cần ghi chép lại mọi hành động nhạy cảm để phục vụ công tác điều tra khi có sự cố.
*   **Nếu không làm thì hệ thống sẽ ra sao?**
    Khi có sự cố xảy ra (ví dụ: một lượng vé tàu lớn bị hủy một cách bất thường, hoặc tiền vé bị thất thoát), nếu không có log bảo mật, quản trị viên sẽ hoàn toàn "mù thông tin". Chúng ta không thể biết ai đã thực hiện thao tác đó, thao tác bằng thiết bị gì, từ địa chỉ IP nào, dẫn đến việc không thể khắc phục hậu quả hoặc quy trách nhiệm.
*   **Tại sao lại dùng giải pháp này?**
    Chúng em xây dựng schema `auditLog` lưu trữ chi tiết: *Ai làm (userId), Làm cái gì (action), Vào lúc nào (timestamp), Địa chỉ IP, Thiết bị truy cập (User Agent), và Kết quả ra sao (success/failure)*. Hệ thống ghi log theo dạng bất đồng bộ (fire-and-forget) để không làm chậm trải nghiệm của người dùng, đồng thời cấu hình cơ chế tự động dọn dẹp log cũ sau 90 ngày (MongoDB TTL Index) nhằm tiết kiệm tài nguyên lưu trữ.

#### 2. Gia cố HTTP Header bằng Helmet và Cookie Security
*   **Tại sao phải làm?**
    Che giấu cấu trúc công nghệ bên dưới và bảo vệ cookie chứa session của người dùng trên môi trường trình duyệt.
*   **Nếu không làm thì hệ thống sẽ ra sao?**
    Mặc định, server Express sẽ gửi header `X-Powered-By: Express`. Hacker nhìn thấy header này sẽ biết ngay server chạy Node.js và tìm cách khai thác các lỗ hổng zero-day tương ứng.
    Nếu không cấu hình các cờ (flags) cho cookie, các đoạn mã script độc hại chạy trên trình duyệt có thể dùng lệnh `document.cookie` để lấy trích xuất chuỗi session token và gửi về cho hacker.
*   **Tại sao lại dùng giải pháp này?**
    Chúng em cài đặt thư viện **Helmet** để cấu hình tự động các HTTP Headers chuẩn bảo mật: ẩn header `X-Powered-By`, bật chính sách `Frameguard` chống Clickjacking (không cho trang web khác nhúng iframe VetaU). Đối với Session Cookie (nếu có dùng), chúng em thiết lập các cờ bảo mật cao nhất:
    *   `httpOnly: true` (Ngăn Javascript truy cập vào cookie, chống XSS đánh cắp session).
    *   `secure: true` (Chỉ truyền cookie qua kênh HTTPS đã mã hóa).
    *   `sameSite: 'strict'` (Chống tấn công giả mạo yêu cầu chéo trang - CSRF).

---

### 🏆 PHẦN KẾT LUẬN: Đánh giá Tổng thể

> **Kịch bản nói:**
> *"Tóm lại, bằng cách kết hợp đồng bộ cả 3 trụ cột bảo mật nêu trên, đồ án **VetaU** đã giải quyết triệt để các rủi ro an ninh thông tin thường gặp, nâng cấp mức độ bao phủ các lỗ hổng bảo mật theo chuẩn **OWASP Top 10** từ **2/10 lên 9/10 danh mục**. Hệ thống giờ đây không chỉ vận hành trơn tru về mặt nghiệp vụ mà còn sở hữu một lá chắn bảo mật kiên cố, sẵn sàng bảo vệ an toàn cho dữ liệu của mọi hành khách. Em xin chân thành cảm ơn thầy cô đã lắng nghe."*

---

## 9. 🔮 Đánh giá hạn chế & Định hướng tương lai

Dù đã triển khai lớp phòng vệ vững chắc, VetaU vẫn ghi nhận một số điểm hạn chế và đề xuất các giải pháp nâng cấp trong tương lai:

| # | Hạn chế hiện tại | Hướng khắc phục đề xuất |
|---|---|---|
| **1** | Chưa enforce HTTPS ở tầng ứng dụng (chạy trên local/ngrok) | Tích hợp chứng chỉ SSL/TLS miễn phí qua Let's Encrypt kết hợp cấu hình Web Server chuyên dụng như **Nginx** hoặc **Caddy** làm Reverse Proxy. |
| **2** | Chưa có xác thực hai yếu tố (2FA) cho tài khoản quản lý | Triển khai mã xác thực hai lớp dựa trên thời gian **TOTP** (Time-based One-Time Password) tích hợp với Google Authenticator hoặc Microsoft Authenticator cho các tài khoản có vai trò `admin`. |
| **3** | Khả năng chống Spam OTP đăng ký qua email ở mức cơ bản | Tích hợp dịch vụ CAPTCHA bên thứ ba (như **reCAPTCHA v3** hoặc **hCaptcha**) tại các Form Đăng ký/Đăng nhập để phân biệt người dùng và bot tự động. |
| **4** | Chưa có cơ chế xoay vòng phiên làm việc nâng cao (Refresh Token Rotation) | Chuyển đổi luồng xác thực sang mô hình **Access Token ngắn hạn (15 phút)** và **Refresh Token (7 ngày)** được lưu trong Cookie HttpOnly để đảm bảo phiên làm việc có thể thu hồi bất cứ lúc nào từ phía Server. |
| **5** | Chưa mã hóa đường truyền tới Database | Bật tùy chọn TLS/SSL cho chuỗi kết nối MongoDB (`ssl=true` hoặc `tls=true`) và chỉ định chứng chỉ số đáng tin cậy nhằm chống tấn công nghe lén (Man-in-the-Middle) trong mạng nội bộ. |

---
<p align="center">
  <b>🚂 VetaU — Đặt vé tàu Bắc Nam an toàn, tiện lợi</b><br>
  <sub>Đồ án Nghiên cứu môn học An ninh Thông tin</sub>
</p>
