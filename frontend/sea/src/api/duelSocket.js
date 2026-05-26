import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

let _socket = null;

export function getDuelSocket(token) {
  if (_socket?.connected) return _socket;

  // Si existe pero desconectado, reconectar
  if (_socket) {
    _socket.auth = { token };
    _socket.connect();
    return _socket;
  }

  _socket = io(SOCKET_URL, {
    auth: { token },
    path: "/socket.io",
  });

  return _socket;
}

export function disconnectDuelSocket() {
  _socket?.disconnect();
  _socket = null;
}