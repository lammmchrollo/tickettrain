require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || 'YOUR_SECRET_KEY';

// 1. Kết nối MongoDB Atlas
// Thay giá trị MONGO_URI trong file .env bằng link bạn lấy từ Atlas
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ LỖI: Bạn chưa cấu hình MONGO_URI trong file .env');
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('-----------------------------------------');
    console.log('✅ KẾT NỐI MONGODB ATLAS THÀNH CÔNG!');
    console.log('-----------------------------------------');
  })
  .catch(err => {
    console.log('-----------------------------------------');
    console.log('❌ LỖI KẾT NỐI MONGODB:');
    console.log('Lý do:', err.message);
    if (err.message.includes('IP not whitelisted')) {
      console.log('👉 HÃY KIỂM TRA: Bạn chưa thêm IP vào Network Access trên MongoDB Atlas');
    }
    console.log('-----------------------------------------');
  });

app.use(cors());
app.use(bodyParser.json());

// Thêm Log để kiểm tra kết nối từ App
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] 📨 Có yêu cầu gọi đến: ${req.method} ${req.url}`);
  next();
});

// 2. Định nghĩa Schema Người dùng
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// 3. API Đăng ký
app.post('/register', async (req, res) => {
  const { name, email, pass } = req.body;
  console.log(`[${new Date().toLocaleTimeString()}] 📝 Đang đăng ký cho: ${email}`);

  try {
    if (!name || !email || !pass) {
       return res.status(400).json({ success: false, message: 'Thiếu thông tin đăng ký' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
    }

    const hashedPassword = await bcrypt.hash(pass, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    console.log(`✅ Đăng ký thành công cho: ${email}`);
    const token = jwt.sign({ id: newUser._id, email }, SECRET_KEY, { expiresIn: '7d' });
    res.json({ success: true, token, user: { name, email } });
  } catch (error) {
    console.error('❌ Lỗi Register:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống server: ' + error.message });
  }
});

// 4. API Đăng nhập
app.post('/login', async (req, res) => {
  const { email, pass } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Mật khẩu không chính xác' });

    const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, { expiresIn: '7d' });
    res.json({ success: true, token, user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi đăng nhập' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server đang chạy tại:
   - Local: http://localhost:${PORT}
   - Mạng:  http://0.0.0.0:${PORT}`);
});
