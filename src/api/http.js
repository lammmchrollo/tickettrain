import axios from 'axios';
import { Preferences } from '@capacitor/preferences';

const API_BASE_URL = 'http://localhost:5000/api';

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

http.interceptors.request.use(async (config) => {
  const { value } = await Preferences.get({ key: 'auth_token' });
  if (value) config.headers.Authorization = `Bearer ${value}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || 'Khong the ket noi may chu';
    return Promise.reject(new Error(message));
  }
);

export default http;
