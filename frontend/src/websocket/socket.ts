import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@gomoku/common';

// 使用环境变量或当前主机地址，支持局域网访问
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `http://${window.location.hostname}:3001`;

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// 錯誤處理
socket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error);
});

socket.on('error', (data) => {
  console.error('Server error:', data.message);
  alert(`錯誤: ${data.message}`);
});

