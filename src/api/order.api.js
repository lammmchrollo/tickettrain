import http from './http';

export const orderApi = {
  quote(payload) {
    return http.post('/orders/quote', payload);
  },
  create(payload) {
    return http.post('/orders', payload);
  },
  myOrders() {
    return http.get('/orders/my');
  }
};
