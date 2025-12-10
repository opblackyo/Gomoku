const io = require('socket.io-client');

// 設定要測試的後端 URL
const BACKEND_URL = process.env.BACKEND_URL || 'https://gomoku-backend.onrender.com';

console.log('🧪 WebSocket 連線測試');
console.log('📡 目標伺服器:', BACKEND_URL);
console.log('⏱️  開始時間:', new Date().toISOString());
console.log('---');

let connectStartTime = Date.now();

const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 3,
  timeout: 20000,
});

// 連線成功
socket.on('connect', () => {
  const connectTime = Date.now() - connectStartTime;
  console.log('✅ WebSocket 連線成功!');
  console.log('   Socket ID:', socket.id);
  console.log('   連線耗時:', connectTime + 'ms');
  console.log('   傳輸方式:', socket.io.engine.transport.name);
  console.log('---');

  // 測試加入匹配
  console.log('🎮 測試加入匹配佇列...');
  socket.emit('matchmaking.join', { playerName: 'TestPlayer_' + Date.now() });
});

// 加入匹配成功
socket.on('matchmaking.joined', (data) => {
  console.log('✅ 加入匹配佇列成功!');
  console.log('   佇列數據:', JSON.stringify(data, null, 2));
  console.log('---');
  console.log('🎉 所有測試通過!');
  
  // 測試完成，斷線
  socket.disconnect();
  process.exit(0);
});

// 連線錯誤
socket.on('connect_error', (error) => {
  console.error('❌ 連線錯誤:', error.message);
  console.error('   錯誤詳情:', error);
  process.exit(1);
});

// 連線超時
socket.on('connect_timeout', () => {
  console.error('❌ 連線超時 (20秒)');
  process.exit(1);
});

// 伺服器錯誤
socket.on('error', (data) => {
  console.error('❌ 伺服器錯誤:', data.message || data);
});

// 斷線
socket.on('disconnect', (reason) => {
  console.log('🔌 連線已中斷:', reason);
});

// 30 秒後強制結束
setTimeout(() => {
  if (socket.connected) {
    console.log('⏰ 測試時間到，斷開連線');
    socket.disconnect();
  } else {
    console.error('❌ 測試失敗：無法在 30 秒內完成連線');
  }
  process.exit(socket.connected ? 0 : 1);
}, 30000);
