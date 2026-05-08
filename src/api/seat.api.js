import http from './http';

export const seatApi = {
  hold(payload) {
    return http.post('/seats/hold', payload);
  }
};
