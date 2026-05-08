import http from './http';

export const authApi = {
  register(payload) {
    return http.post('/auth/register', payload);
  },
  login(payload) {
    return http.post('/auth/login', payload);
  }
};
