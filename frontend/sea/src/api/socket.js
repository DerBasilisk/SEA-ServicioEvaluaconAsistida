// src/api/socket.js
import { io } from "socket.io-client";
import useAuthStore from "../store/authStore";

let _socket = null;

export function getSocket() {
  const token = useAuthStore.getState().token;
  if (!_socket || _socket.disconnected) {
    _socket = io(
      import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000",
      { auth: { token }, path: "/socket.io" }
    );
  }
  return _socket;
}

export function disconnectSocket() {
  _socket?.disconnect();
  _socket = null;
}