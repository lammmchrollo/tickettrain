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
DATA_ENCRYPTION_KEY=your_data_encryption_key
APP_ORIGIN=http://localhost:5173,http://localhost,capacitor://localhost
```

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