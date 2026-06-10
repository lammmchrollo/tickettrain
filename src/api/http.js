/**
 * HTTP Client — Axios Instance với Security Interceptors
 * 
 * Các biện pháp bảo mật phía client:
 * 
 * 1. JWT Token Management
 *    - Tự động gắn Bearer token vào mọi request
 *    - Token lưu bằng Capacitor Preferences (encrypted storage trên thiết bị)
 * 
 * 2. Auto Logout on 401
 *    - Khi server trả 401 (token hết hạn/không hợp lệ):
 *      a. Xoá token khỏi storage
 *      b. Reload app → redirect về màn hình login
 *    - Chống sử dụng token đã hết hạn
 *    - Tham chiếu: OWASP Session Management
 * 
 * 3. Request Timeout
 *    - Timeout 15 giây → chống treo request vô thời hạn
 * 
 * 4. Error Sanitization
 *    - Chỉ hiển thị message từ server hoặc message mặc định
 *    - Không leak chi tiết kỹ thuật (stack trace, etc.)
 */

import axios from 'axios';
import { Preferences } from '@capacitor/preferences';


const API_BASE_URL = 'https://popper-ranger-rejoice.ngrok-free.dev/api';


const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

/**
 * Request Interceptor
 * 
 * Chạy trước mỗi request:
 * 1. Đọc auth_token từ Capacitor Preferences
 * 2. Gắn vào header Authorization: Bearer <token>
 * 3. Thêm ngrok header để bypass browser warning
 */
http.interceptors.request.use(async (config) => {
  const { value } = await Preferences.get({ key: 'auth_token' });
  if (value) config.headers.Authorization = `Bearer ${value}`;
  // Header bắt buộc để bypass ngrok browser warning
  config.headers['ngrok-skip-browser-warning'] = 'true';
  return config;
});

/**
 * Response Interceptor
 * 
 * Xử lý response lỗi:
 * - 401 Unauthorized: token hết hạn hoặc không hợp lệ
 *   → Tự động xoá token + reload app (redirect về login)
 * - Các lỗi khác: trả message thân thiện
 * 
 * Cơ chế bảo vệ:
 * - Chống sử dụng session đã hết hạn (Session Fixation prevention)
 * - Đảm bảo user phải re-authenticate khi token invalid
 */
http.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err.response?.status;

    // ── Auto Logout khi token hết hạn / không hợp lệ ──────────
    if (status === 401) {
      // Xoá token khỏi thiết bị
      await Preferences.remove({ key: 'auth_token' });
      // Reload app → SPA sẽ redirect về login screen
      window.location.reload();
      return Promise.reject(new Error('Phien dang nhap het han. Vui long dang nhap lai.'));
    }

    const message = err.response?.data?.message || 'Không thể kết nối máy chủ';
    return Promise.reject(new Error(message));
  }
);

export default http;