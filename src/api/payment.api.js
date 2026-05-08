import http from './http';

export const paymentApi = {
  create(payload) {
    return http.post('/payments/create', payload);
  },
  confirmMock(payload) {
    return http.post('/payments/mock-confirm', payload);
  },
  completeLegacy(payload) {
    return http.post('/payments/complete-legacy', payload);
  }
};
