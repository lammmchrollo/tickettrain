# 🚂 Vé Tàu Bắc Nam — VetaU

> **VetaU** là ứng dụng đặt vé tàu Bắc Nam trực tuyến chạy trên nền tảng di động (Android) và Web, được thiết kế theo mô hình Client-Server hiện đại.

---

## 🚀 Công nghệ sử dụng

- **Frontend:** React 19, Vite 8, Capacitor 8 (hỗ trợ build Android native app), TailwindCSS, Axios.
- **Backend:** Node.js, Express 5, Socket.IO 4 (đồng bộ sơ đồ ghế thời gian thực).
- **Database:** MongoDB (quản lý qua Mongoose ODM).

---

## ✨ Tính năng chính

- **Tìm kiếm chuyến tàu:** Tra cứu theo ga đi, ga đến, ngày khởi hành.
- **Sơ đồ ghế thời gian thực:** Xem trạng thái ghế trống, đang giữ hoặc đã bán qua WebSocket.
- **Giữ ghế tạm thời:** Giữ ghế trong 10 phút, tự động giải phóng qua background cleaner nếu hết hạn.
- **Thanh toán trực tuyến:** Tích hợp thanh toán mô phỏng (Mock Payment) và ví điện tử MoMo/ZaloPay.
- **Vé điện tử:** Tự động phát hành vé với mã vé duy nhất sau khi thanh toán thành công.
- **Quản trị hệ thống (Admin):** Tạo, cập nhật và duyệt chuyến tàu; quản lý các đơn vị vận tải.

---

## 🛠 Hướng dẫn cài đặt và chạy thử

### 1. Clone dự án
```bash
git clone <your-repository-url>
cd vetau-app
```

### 2. Cấu hình Frontend
Cài đặt các thư viện cần thiết:
```bash
npm install
```

### 3. Cấu hình Backend
Di chuyển vào thư mục server và cài đặt dependencies:
```bash
cd server
npm install
```

### 4. Cấu hình biến môi trường
Tạo file `server/.env` dựa trên `server/.env.example` và cấu hình các khóa cần thiết (như `MONGO_URI`, `JWT_SECRET`, và `DATA_ENCRYPTION_KEY`).

> *Lưu ý:* `DATA_ENCRYPTION_KEY` phải là một chuỗi 64 ký tự hex (32 bytes).

### 5. Khởi chạy dự án (Local)
Mở hai cửa sổ terminal song song:

- **Terminal 1 (Backend):**
  ```bash
  cd server
  npm run dev
  ```

- **Terminal 2 (Frontend):**
  ```bash
  npm run dev
  ```

---

## 📱 Build ứng dụng Android (Capacitor)
```bash
# Build mã nguồn web thành static files
npm run build

# Đồng bộ vào dự án Android
npx cap sync android

# Mở dự án trong Android Studio để build APK/Run
npx cap open android
```

---

*Dự án được phát triển nhằm mục đích nghiên cứu học tập.*
