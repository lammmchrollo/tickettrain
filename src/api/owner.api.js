import http from './http';

export const ownerApi = {
  list(params) {
    return http.get('/owners', { params });
  },
  create(payload) {
    return http.post('/owners', payload);
  },
  get(id) {
    return http.get(`/owners/${id}`);
  },
  update(id, payload) {
    return http.put(`/owners/${id}`, payload);
  }
};
