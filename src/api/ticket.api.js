import http from './http';

export const ticketApi = {
  myTickets() {
    return http.get('/tickets/my');
  },
  detail(ticketCode) {
    return http.get(`/tickets/${ticketCode}`);
  },
  cancel(ticketCode) {
    return http.post(`/tickets/${ticketCode}/cancel`);
  }
};
