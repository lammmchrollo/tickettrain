# Ve tau Bac Nam (VetaU)

Ung dung dat ve tau Bac Nam gom frontend (React + Vite + Capacitor) va backend (Node.js + Express + MongoDB). Ho tro hai vai tro nguoi dung: admin va khach mua ve. Admin co quyen quan ly chu chuyen va tao chuyen tau; nguoi dung thuong chi dat ve.

## Tinh nang chinh

- Dang ky, dang nhap, luu token tren thiet bi
- Chon vai tro khi dang ky/dang nhap (admin, nguoi mua ve)
- Tim kiem chuyen tau, dat ghe, quan ly ve
- Admin: quan ly chu chuyen, tao/duyet/huy chuyen tau
- Giao dien di dong, ho tro Capacitor Android

## Cong nghe

- Frontend: React 19, Vite, Capacitor, Axios
- Backend: Node.js, Express, Mongoose, JWT
- Database: MongoDB

## Cau truc thu muc

- src/: frontend app
- server/: backend API
- android/: du an Android tu Capacitor

## Yeu cau

- Node.js 18+ (khuyen nghi)
- MongoDB (local hoac cloud)
- Android Studio (neu build Android)

## Cai dat va chay local

### 1) Cai dat frontend

```bash
npm install
```

Chay frontend dev:

```bash
npm run dev
```

### 2) Cai dat backend

```bash
cd server
npm install
```

Tao file .env trong server/:

```bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/vetau
JWT_SECRET=your_jwt_secret
DATA_ENCRYPTION_KEY=64_hex_chars_key
APP_ORIGIN=http://localhost:5173,http://localhost,capacitor://localhost
```

Luu y quan trong:

- DATA_ENCRYPTION_KEY bat buoc dung dinh dang 64 ky tu hex (32 bytes) de ma hoa du lieu nhay cam.
- Neu key thieu hoac sai dinh dang, backend se dung ngay khi khoi dong de tranh ma hoa yeu.

Chay backend:

```bash
npm run dev
```

Neu muon seed du lieu mau:

```bash
npm run seed
```

## Chay Android (Capacitor)

Tu thu muc goc:

```bash
npm run build
npx cap sync android
npx cap open android
```

Trong Android Studio, bam Run/Rebuild de cai APK.

### Luu y ve API Base URL

App mac dinh goi API qua IP emulator: 10.0.2.2.
Neu chay tren thiet bi that, cap nhat IP may tinh trong src/App.jsx (COMPUTER_IP) va doi API_BASE_URL sang COMPUTER_IP.

## Tai khoan va vai tro

- Khi dang ky/dang nhap se chon vai tro.
- He thong se kiem tra vai tro trong DB, khong the doi role chi bang UI.
- API admin duoc bao ve boi middleware requireRole('admin').

## Scripts nhanh

Frontend:

```bash
npm run dev
npm run build
npm run lint
```

Backend:

```bash
cd server
npm run dev
npm run seed
```

## Bao cao mon An ninh thong tin (tom tat)

### Muc tieu

- Xay dung ung dung dat ve tau co phan quyen ro rang (admin, khach hang)
- Dam bao tinh bao mat cho xac thuc, token va du lieu nhay cam
- Giam rui ro truy cap trai phep va tan cong API

### Mo hinh bao mat da ap dung

- Xac thuc: JWT, luu token tren thiet bi (Capacitor Preferences)
- Phan quyen: middleware requireRole('admin') bao ve route quan ly
- Mat khau: bam bcryptjs, khong luu plain text
- CORS va header bao mat (helmet, rate limit)

### Cap nhat bao mat du lieu ca nhan va mua ve (P0)

Noi dung duoi day la cac nang cap da duoc them de bao ve thong tin hanh khach va giao dich mua ve.

1) Fail-fast khoa ma hoa du lieu nhay cam

- Vi tri: server/src/services/crypto.service.js
- Hoat dong:
	- He thong kiem tra DATA_ENCRYPTION_KEY co dung 64 ky tu hex hay khong.
	- Neu sai dinh dang, server throw error va khong cho chay.
	- Neu hop le, key duoc nap vao AES-256-GCM de ma hoa/kiem tra toan ven.
- Tac dung bao mat:
	- Loai bo nguy co chay voi key fallback yeu.
	- Dam bao phone/CCCD cua hanh khach luon duoc ma hoa bang key manh.

2) Ma hoa thong tin hanh khach trong luong thanh toan legacy

- Vi tri: server/src/controllers/payment.controller.js (ham completeLegacyPayment)
- Hoat dong:
	- Kiem tra dau vao passengers bat buoc co du lieu.
	- Ma hoa phone va CCCD/CMND bang encryptText truoc khi luu order.
	- Luu them truong mask (phoneMasked, nationalIdMasked) de hien thi an toan.
	- Ticket snapshot chi luu du lieu mask, khong luu plain text nhay cam.
- Tac dung bao mat:
	- Giam ro ri du lieu PII khi truy van ve/don hang.
	- Dong bo chuan bao mat giua luong cu va luong moi.

3) Chan luong legacy trong production

- Vi tri: server/src/controllers/payment.controller.js (ham completeLegacyPayment)
- Hoat dong:
	- Neu NODE_ENV=production, API tra 410 va thong bao luong legacy da ngung.
	- Muc dich la tranh tiep tuc su dung duong xu ly cu trong moi truong that.
- Tac dung bao mat:
	- Giam be mat tan cong tu endpoint cu.
	- Tranh tinh trang luong cu bo qua cac buoc bao mat moi.

4) Loc du lieu tra ve cho API don hang

- Vi tri: server/src/controllers/order.controller.js (ham getMyOrders)
- Hoat dong:
	- Thay vi tra toan bo document Order, API map qua ham sanitizeOrderForCustomer.
	- Chi tra cac truong can hien thi: thong tin ve/chuyen, gia, trang thai, thong tin hanh khach da mask.
	- Khong tra cac truong phoneEncrypted, nationalIdEncrypted cho client.
- Tac dung bao mat:
	- Han che lo du lieu nhay cam qua API response.
	- Giam rui ro khi log client/traffic bi thu thap.

5) Rate limit rieng cho auth va payment

- Vi tri: server/src/app.js
- Hoat dong:
	- authLimiter ap cho /api/auth (gioi han chat hon de chong brute force OTP/login).
	- paymentLimiter ap cho /api/payments (giam spam tao/xac nhan thanh toan).
	- Van giu limiter tong toan app de chong abuse chung.
- Tac dung bao mat:
	- Giam kha nang tan cong do mat khau, spam OTP, spam thanh toan.
	- Giu on dinh dich vu truoc luu luong xau.

6) An thong tin loi noi bo o production

- Vi tri: server/src/middlewares/error.middleware.js
- Hoat dong:
	- O production: tra message chung, khong expose err.message chi tiet.
	- O development: van hien message de debug nhanh.
- Tac dung bao mat:
	- Tranh lo thong tin he thong, cau truc noi bo, stack hint cho attacker.

### Luong du lieu nhay cam sau nang cap

1. Nguoi dung nhap thong tin hanh khach (ho ten, phone, CCCD).
2. Backend ma hoa phone/CCCD truoc khi ghi vao Order.
3. He thong luu dong thoi ban mask de hien thi tren app va ticket.
4. API danh sach don hang/ve chi tra du lieu mask can thiet.
5. Rate limit va error hardening bao ve cac endpoint nhay cam (auth/payment).

### Kiem tra nhanh sau khi cau hinh

```bash
# Vi du tao key 64 hex (Linux/macOS)
openssl rand -hex 32

# Chay backend
cd server
npm run dev
```

Neu DATA_ENCRYPTION_KEY sai, server se bao loi ngay luc startup.

### Kich ban rui ro va cach giam thieu

- Truy cap admin tu tai khoan khach: bi chan boi requireRole
- Gia mao token: JWT xac thuc bang secret va het han
- Tan cong brute force: rate limit tren backend

### Kiem thu

- Kiem thu dang ky/dang nhap voi 2 vai tro
- Kiem thu truy cap route admin bang tai khoan thuong
- Kiem thu tu dong luu/restore token tren app

### Han che va huong phat trien

- Chua co co che cap role admin an toan (can invite code/seed admin)
- Can them log audit va canh bao bat thuong

## Ghi chu

- Neu giao dien chua cap nhat sau khi build Android, thu xoa app tren emulator/thiet bi va cai lai.
- Neu thay doi API, nho sync lai Capacitor.