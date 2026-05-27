import { io as createClient } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_WS || (window.location.origin);

let socket;

export function initSocket({ url = SOCKET_URL, token = null } = {}) {
  if (socket && socket.io && socket.io.uri === url) return socket;

  socket = createClient(url, {
    autoConnect: false,
    withCredentials: true,
    auth: token ? { token } : undefined
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket connect_error', err.message);
  });

  return socket;
}

export function connectSocket() {
  if (!socket) initSocket();
  if (!socket.connected) socket.connect();
}

export function disconnectSocket() {
  if (socket && socket.connected) socket.disconnect();
}

export function setAuthToken(token) {
  if (!socket) initSocket({});
  socket.auth = token ? { token } : {};
}

export function joinTrain(trainId) {
  if (!socket) initSocket();
  if (!socket.connected) socket.connect();
  socket.emit('joinTrain', trainId);
}

export function leaveTrain(trainId) {
  if (!socket || !socket.connected) return;
  socket.emit('leaveTrain', trainId);
}

export function onSeatHold(cb) {
  if (!socket) initSocket();
  socket.on('seat:hold', cb);
}

export function onSeatReserved(cb) {
  if (!socket) initSocket();
  socket.on('seat:reserved', cb);
}

export function onSeatRelease(cb) {
  if (!socket) initSocket();
  socket.on('seat:release', cb);
}

export default function getSocket() {
  if (!socket) initSocket();
  return socket;
}
