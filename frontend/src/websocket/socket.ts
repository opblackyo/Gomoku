import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@gomoku/common';

// 生產環境使用環境變數，開發環境自動偵測
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.DEV 
    ? `http://${window.location.hostname}:3001`
    : window.location.origin);

console.log('🔌 WebSocket URL:', SOCKET_URL);
console.log('🌍 Environment:', import.meta.env.MODE);

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling'], // 支援降級到 polling
});

// 連線成功
socket.on('connect', () => {
  console.log('✅ WebSocket connected:', socket.id);
  console.log('   Transport:', socket.io.engine.transport.name);
});

// 錯誤處理
socket.on('connect_error', (error) => {
  console.error('❌ WebSocket connection error:', error.message);
  console.log('🔄 Will retry connection...');
});

socket.on('connect_timeout', () => {
  console.error('⏰ WebSocket connection timeout');
});

socket.on('disconnect', (reason) => {
  console.log('🔌 WebSocket disconnected:', reason);
  if (reason === 'io server disconnect') {
    // 伺服器主動斷線，需要手動重連
    socket.connect();
  }
});

socket.on('reconnect', (attemptNumber) => {
  console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('🔄 WebSocket reconnection attempt', attemptNumber);
});

socket.on('reconnect_error', (error) => {
  console.error('❌ WebSocket reconnection error:', error.message);
});

socket.on('reconnect_failed', () => {
  console.error('❌ WebSocket reconnection failed');
  alert('無法連接到伺服器，請檢查網路連線或重新整理頁面');
});

socket.on('error', (data) => {
  console.error('❌ Server error:', data.message);
  alert(`錯誤: ${data.message}`);
});

