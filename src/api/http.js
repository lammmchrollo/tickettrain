import axios from 'axios';
import { Preferences } from '@capacitor/preferences';

// ─── Đổi URL ở đây khi ngrok thay đổi ───────────────────────────
const API_BASE_URL = 'https://popper-ranger-rejoice.ngrok-free.dev/api';
// ─────────────────────────────────────────────────────────────────

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

http.interceptors.request.use(async (config) => {
  const { value } = await Preferences.get({ key: 'auth_token' });
  if (value) config.headers.Authorization = `Bearer ${value}`;
  // Header bắt buộc để bypass ngrok browser warning
  config.headers['ngrok-skip-browser-warning'] = 'true';
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || 'Không thể kết nối máy chủ';
    return Promise.reject(new Error(message));
  }
);

export default http;