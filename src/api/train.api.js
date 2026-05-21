import http from './http';

export const trainApi = {
  search(params) {
    return http.get('/trains/search', { params });
  },
  getSeats(trainId) {
    return http.get(`/trains/${trainId}/seats`);
  }
  ,
  create(payload) {
    return http.post('/trains', payload);
  },
  update(id, payload) {
    return http.put(`/trains/${id}`, payload);
  },
  listByOwner(ownerId) {
    return http.get(`/trains/owner/${ownerId}`);
  },
  publish(id) {
    return http.patch(`/trains/${id}/publish`);
  },
  cancel(id) {
    return http.patch(`/trains/${id}/cancel`);
  }
};
