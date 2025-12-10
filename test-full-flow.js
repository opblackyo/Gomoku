const io = require('socket.io-client');

const BACKEND_URL = process.env.BACKEND_URL || 'https://gomoku-backend.onrender.com';

console.log('🎮 完整遊戲流程測試');
console.log('📡 伺服器:', BACKEND_URL);
console.log('⏱️  開始時間:', new Date().toISOString());
console.log('═══════════════════════════════════════\n');

async function testFullFlow() {
  return new Promise((resolve, reject) => {
    let player1, player2;
    let roomId = null;
    let testSteps = [];

    // 建立 Player 1
    player1 = io(BACKEND_URL, { transports: ['websocket', 'polling'] });

    // Player 1 事件處理
    player1.on('connect', () => {
      console.log('✅ [Player 1] 連線成功 -', player1.id);
      testSteps.push('Player 1 連線');
      
      // Player 1 加入匹配
      console.log('🎯 [Player 1] 加入匹配佇列...');
      player1.emit('matchmaking.join', { playerName: 'Alice' });
    });

    player1.on('matchmaking.joined', (data) => {
      console.log('✅ [Player 1] 已加入匹配佇列');
      testSteps.push('Player 1 加入匹配');
      
      // 延遲 2 秒後建立 Player 2
      setTimeout(() => {
        console.log('\n───────────────────────────────────────\n');
        player2 = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
        
        player2.on('connect', () => {
          console.log('✅ [Player 2] 連線成功 -', player2.id);
          testSteps.push('Player 2 連線');
          
          console.log('🎯 [Player 2] 加入匹配佇列...');
          player2.emit('matchmaking.join', { playerName: 'Bob' });
        });

        player2.on('matchmaking.joined', () => {
          console.log('✅ [Player 2] 已加入匹配佇列');
          testSteps.push('Player 2 加入匹配');
        });

        player2.on('game.matched', (data) => {
          console.log('\n═══════════════════════════════════════');
          console.log('🎉 [Player 2] 配對成功!');
          console.log('   房間 ID:', data.roomId);
          console.log('   對手:', data.opponent.playerName);
          testSteps.push('Player 2 配對成功');
        });

        player2.on('game.started', (data) => {
          console.log('✅ [Player 2] 遊戲開始');
          console.log('   Player 2 執子:', data.yourStone === 1 ? '⚫ 黑棋' : '⚪ 白棋');
          testSteps.push('遊戲開始');
        });

        player2.on('game.moved', (data) => {
          console.log(`📍 [Player 2 收到] ${data.currentPlayer === 1 ? '⚫' : '⚪'} 落子於 [${data.position}]`);
        });

        player2.on('connect_error', (error) => {
          console.error('❌ [Player 2] 連線錯誤:', error.message);
        });

        player2.on('error', (data) => {
          console.error('❌ [Player 2] 錯誤:', data.message);
        });
      }, 2000);
    });

    player1.on('game.matched', (data) => {
      console.log('\n═══════════════════════════════════════');
      console.log('🎉 [Player 1] 配對成功!');
      console.log('   房間 ID:', data.roomId);
      console.log('   對手:', data.opponent.playerName);
      roomId = data.roomId;
      testSteps.push('Player 1 配對成功');
    });

    player1.on('game.started', (data) => {
      console.log('✅ [Player 1] 遊戲開始');
      console.log('   Player 1 執子:', data.yourStone === 1 ? '⚫ 黑棋' : '⚪ 白棋');
      console.log('   當前回合:', data.currentPlayer === 1 ? '⚫ 黑棋' : '⚪ 白棋');
      console.log('═══════════════════════════════════════\n');
      
      // Player 1 下第一步（如果是黑棋）
      if (data.yourStone === 1) {
        setTimeout(() => {
          console.log('🎮 [Player 1] 下棋 - 位置 [7, 7]');
          player1.emit('game.move', {
            roomId: roomId,
            position: [7, 7],
          });
        }, 1000);
      }
    });

    player1.on('game.moved', (data) => {
      console.log(`📍 [Player 1 收到] ${data.currentPlayer === 1 ? '⚫' : '⚪'} 落子於 [${data.position}]`);
      testSteps.push(`落子 [${data.position}]`);
      
      // Player 1 繼續下棋（模擬對弈）
      if (data.currentPlayer === 1 && testSteps.length < 10) {
        setTimeout(() => {
          const moves = [[7, 8], [8, 7], [8, 8], [9, 7], [9, 8]];
          const moveIndex = Math.floor(testSteps.length / 2);
          if (moveIndex < moves.length) {
            console.log(`🎮 [Player 1] 下棋 - 位置 [${moves[moveIndex]}]`);
            player1.emit('game.move', {
              roomId: roomId,
              position: moves[moveIndex],
            });
          }
        }, 1500);
      }
    });

    player1.on('game.result', (data) => {
      console.log('\n═══════════════════════════════════════');
      console.log('🏁 遊戲結束!');
      console.log('   勝利者:', data.winner || '平局');
      console.log('   原因:', data.reason);
      testSteps.push('遊戲結束');
    });

    player1.on('connect_error', (error) => {
      console.error('❌ [Player 1] 連線錯誤:', error.message);
      reject(error);
    });

    player1.on('error', (data) => {
      console.error('❌ [Player 1] 錯誤:', data.message);
    });

    // 15 秒後結束測試
    setTimeout(() => {
      console.log('\n═══════════════════════════════════════');
      console.log('📊 測試總結');
      console.log('───────────────────────────────────────');
      console.log('完成步驟數:', testSteps.length);
      testSteps.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
      console.log('═══════════════════════════════════════');
      
      if (testSteps.length >= 5) {
        console.log('\n✅ 測試成功! 核心功能運作正常');
        resolve();
      } else {
        console.log('\n⚠️  測試未完整執行，請檢查伺服器狀態');
        reject(new Error('Test incomplete'));
      }
      
      if (player1) player1.disconnect();
      if (player2) player2.disconnect();
      process.exit(0);
    }, 15000);
  });
}

// 執行測試
testFullFlow().catch((error) => {
  console.error('\n❌ 測試失敗:', error.message);
  process.exit(1);
});
