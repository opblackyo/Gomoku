<template>
  <div class="game-view">
    <!-- 頂部玩家資訊 -->
    <div class="top-bar">
      <button class="menu-btn" @click="toggleMenu">☰</button>
      <div class="players-info">
        <div class="player-card" :class="{ active: room?.currentTurn === 'black' }">
          <div class="avatar">
            <span class="piece black"></span>
          </div>
          <div class="player-details">
            <div class="player-name">{{ room?.players[0]?.name || 'Player 1' }}</div>
            <div class="player-stats">{{ getPlayerStats(0) }}</div>
          </div>
        </div>
        <div class="player-card" :class="{ active: room?.currentTurn === 'white' }">
          <div class="avatar">
            <span class="piece white"></span>
          </div>
          <div class="player-details">
            <div class="player-name">{{ room?.players[1]?.name || 'Player 2' }}</div>
            <div class="player-stats">{{ getPlayerStats(1) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 棋盤 -->
    <BoardComponent />

    <!-- 底部操作區 -->
    <div class="bottom-bar" v-if="showConfirmButton || canRequestUndo">
      <button
        v-if="canRequestUndo"
        class="undo-btn"
        @click="handleRequestUndo"
        :disabled="waitingForUndoResponse"
      >
        {{ waitingForUndoResponse ? '等待回應...' : '悔棋' }}
      </button>
      <button v-if="showConfirmButton" class="confirm-btn" @click="confirmMove">
        著手
      </button>
    </div>

    <!-- 悔棋請求對話框 -->
    <div class="undo-dialog" v-if="undoRequest">
      <div class="undo-dialog-overlay" @click="handleRejectUndo"></div>
      <div class="undo-dialog-content">
        <h3>悔棋請求</h3>
        <p>{{ undoRequest.requesterName }} 請求悔棋</p>
        <div class="undo-dialog-buttons">
          <button class="accept-btn" @click="handleAcceptUndo">同意</button>
          <button class="reject-btn" @click="handleRejectUndo">拒絕</button>
        </div>
      </div>
    </div>

    <!-- 側邊選單 -->
    <div class="side-menu" :class="{ open: menuOpen }">
      <div class="menu-overlay" @click="toggleMenu"></div>
      <div class="menu-content">
        <div class="menu-header">
          <h3>選單</h3>
          <button class="close-btn" @click="toggleMenu">✕</button>
        </div>
        <div class="menu-items">
          <button
            v-if="room?.status === 'ended'"
            @click="handleRestart"
            :disabled="hasRequestedRematch"
            class="rematch-btn"
          >
            {{ rematchButtonText }}
          </button>
          <button @click="handleSurrender" :disabled="room?.status !== 'playing'">
            投降
          </button>
          <button @click="handleLeaveRoom">
            離開房間
          </button>
          <div class="status-info">
            <p v-if="room?.status === 'waiting'">等待玩家加入...</p>
            <p v-else-if="room?.status === 'playing'">
              {{ isMyTurn ? '輪到你了！' : '對手思考中...' }}
            </p>
            <p v-else-if="room?.status === 'ended'">
              遊戲結束
              <span v-if="room.rematchRequests && room.rematchRequests.length > 0">
                <br>{{ room.rematchRequests.length }}/2 玩家同意再來一局
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 遊戲結果彈跳視窗 -->
    <GameResultModal
      :show="showResultModal"
      :result="gameResult"
      @rematch="handleRestart"
      @leave="handleLeaveRoom"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGameStore } from '../stores/game';
import BoardComponent from '../components/BoardComponent.vue';
import GameResultModal from '../components/GameResultModal.vue';

const gameStore = useGameStore();
const room = computed(() => gameStore.room);
const menuOpen = ref(false);
const showConfirmButton = computed(() => gameStore.pendingMove !== null);
const showResultModal = computed(() => gameStore.gameResult !== null);
const gameResult = computed(() => gameStore.gameResult);
const undoRequest = computed(() => gameStore.undoRequest);
const waitingForUndoResponse = computed(() => gameStore.waitingForUndoResponse);
const moveCount = computed(() => gameStore.moveCount);

// 檢查是否可以請求悔棋（遊戲中且有棋步歷史）
const canRequestUndo = computed(() => {
  if (!room.value || room.value.status !== 'playing') return false;
  return moveCount.value > 0;
});

const isMyTurn = computed(() => {
  if (!room.value || !gameStore.currentPlayer) return false;
  const playerIndex = room.value.players.findIndex(p => p.id === gameStore.currentPlayer?.id);
  const currentColor = playerIndex === 0 ? 'black' : 'white';
  return room.value.currentTurn === currentColor;
});

const hasRequestedRematch = computed(() => {
  if (!room.value || !gameStore.currentPlayer) return false;
  return room.value.rematchRequests?.includes(gameStore.currentPlayer.id) || false;
});

const rematchButtonText = computed(() => {
  if (hasRequestedRematch.value) {
    return '等待對手確認...';
  }
  return '再來一局';
});

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};

const confirmMove = () => {
  gameStore.confirmMove();
};

const handleRestart = () => {
  gameStore.restartGame();
  toggleMenu();
};

const handleSurrender = () => {
  if (confirm('確定要投降嗎？')) {
    gameStore.surrender();
    toggleMenu();
  }
};

const handleLeaveRoom = () => {
  if (confirm('確定要離開房間嗎？')) {
    gameStore.leaveRoom();
    toggleMenu();
  }
};

const getPlayerStats = (playerIndex: number): string => {
  if (!room.value || !room.value.players[playerIndex]) {
    return '0勝 0敗 0無';
  }
  const stats = room.value.players[playerIndex].stats;
  if (!stats) {
    return '0勝 0敗 0無';
  }
  return `${stats.wins}勝 ${stats.losses}敗 ${stats.draws}無`;
};

// 悔棋功能
const handleRequestUndo = () => {
  gameStore.requestUndo();
};

const handleAcceptUndo = () => {
  gameStore.respondToUndo(true);
};

const handleRejectUndo = () => {
  gameStore.respondToUndo(false);
};
</script>

<style scoped>
.game-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: -webkit-fill-available;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: #2c3e50;
  position: relative;
}

/* 頂部玩家資訊 */
.top-bar {
  background: linear-gradient(180deg, #8b6914 0%, #a0791a 100%);
  padding: 0.5rem;
  padding-top: calc(0.5rem + env(safe-area-inset-top));
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 10;
  flex-shrink: 0;
}

.menu-btn {
  background: rgba(0, 0, 0, 0.3);
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  font-size: 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
}

.players-info {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  overflow: hidden;
}

.player-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.5rem 0.4rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.3s;
  min-width: 0;
  overflow: hidden;
}

.player-card.active {
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.piece {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #333;
}

.piece.black {
  background: #000;
}

.piece.white {
  background: #fff;
}

.player-details {
  flex: 1;
  min-width: 0;
  color: white;
}

.player-name {
  font-weight: bold;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.player-stats {
  font-size: 0.7rem;
  opacity: 0.8;
  white-space: nowrap;
  line-height: 1.2;
}

/* 底部操作區 */
.bottom-bar {
  background: linear-gradient(0deg, #8b6914 0%, #a0791a 100%);
  padding: 0.75rem;
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
  display: flex;
  justify-content: center;
  gap: 1rem;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.3);
  z-index: 10;
  flex-shrink: 0;
}

.confirm-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  min-width: 120px;
  min-height: 48px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
}

.confirm-btn:active {
  transform: scale(0.95);
  background: #45a049;
}

.undo-btn {
  background: #ff9800;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  min-width: 100px;
  min-height: 48px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
}

.undo-btn:active:not(:disabled) {
  transform: scale(0.95);
  background: #f57c00;
}

.undo-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 悔棋對話框 */
.undo-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.undo-dialog-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
}

.undo-dialog-content {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  min-width: 280px;
  max-width: 90%;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.undo-dialog-content h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.undo-dialog-content p {
  margin: 0 0 1.5rem 0;
  color: #555;
  font-size: 1rem;
}

.undo-dialog-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.undo-dialog-buttons button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  min-width: 100px;
  min-height: 44px;
  transition: all 0.2s;
}

.accept-btn {
  background: #4CAF50;
  color: white;
}

.accept-btn:active {
  background: #45a049;
  transform: scale(0.95);
}

.reject-btn {
  background: #f44336;
  color: white;
}

.reject-btn:active {
  background: #d32f2f;
  transform: scale(0.95);
}

/* 側邊選單 */
.side-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.side-menu.open {
  pointer-events: auto;
}

.menu-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0);
  transition: background 0.3s;
}

.side-menu.open .menu-overlay {
  background: rgba(0, 0, 0, 0.5);
}

.menu-content {
  position: absolute;
  top: 0;
  right: 0;
  width: 80%;
  max-width: 300px;
  height: 100%;
  background: white;
  transform: translateX(100%);
  transition: transform 0.3s;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.3);
}

.side-menu.open .menu-content {
  transform: translateX(0);
}

.menu-header {
  background: #2c3e50;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.menu-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  min-width: 44px;
  min-height: 44px;
}

.menu-items {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.menu-items button {
  padding: 1rem;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: #3498db;
  color: white;
  min-height: 48px;
  transition: all 0.2s;
}

.menu-items button.rematch-btn {
  background: #4CAF50;
}

.menu-items button.rematch-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  opacity: 0.6;
}

.menu-items button:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  opacity: 0.6;
}

.menu-items button:active:not(:disabled) {
  transform: scale(0.95);
}

.status-info {
  margin-top: 1rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
  text-align: center;
}

.status-info p {
  margin: 0;
  color: #2c3e50;
}

/* 桌面版樣式 */
@media (min-width: 768px) {
  .game-view {
    /* 保持 column 佈局，確保 top-bar, board, bottom-bar 垂直排列 */
    flex-direction: column;
    padding: 0;
  }

  .top-bar {
    /* 保持在頂部 */
    position: relative;
  }

  .bottom-bar {
    /* 保持在底部 */
    position: relative;
  }

  /* 棋盤容器在桌面版本中增加 padding */
  .board-container {
    padding: 1rem;
  }
}

/* 針對小高度螢幕的優化（如 15吋筆電 768px 高度） */
@media (max-height: 800px) and (min-width: 768px) {
  .top-bar {
    padding: 0.4rem;
    padding-top: calc(0.4rem + env(safe-area-inset-top));
  }

  .player-card {
    padding: 0.4rem 0.3rem;
  }

  .avatar {
    width: 32px;
    height: 32px;
  }

  .player-name {
    font-size: 0.85rem;
  }

  .player-stats {
    font-size: 0.7rem;
  }

  .bottom-bar {
    padding: 0.5rem;
    padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
  }

  .confirm-btn {
    padding: 0.6rem 1.5rem;
    font-size: 1rem;
    min-height: 40px;
  }

  .board-container {
    padding: 0.5rem;
  }
}
</style>

