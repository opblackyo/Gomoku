import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@gomoku/common';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:3001', {
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

