import http from './http';

export const authApi = {
  sendRegisterOtp(payload) {
    return http.post('/auth/register/send-otp', payload);
  },
  verifyRegisterOtp(payload) {
    return http.post('/auth/register/verify-otp', payload);
  },
  resendRegisterOtp(payload) {
    return http.post('/auth/register/resend-otp', payload);
  },
  login(payload) {
    return http.post('/auth/login', payload);
  }
};
