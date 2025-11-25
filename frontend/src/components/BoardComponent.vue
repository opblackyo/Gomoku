<template>
  <div class="board-container">
    <div class="board-wrapper">
      <!-- 頂部座標 (A-O) -->
      <div class="coordinates top">
        <div class="corner"></div>
        <div v-for="x in 15" :key="x" class="coord-label">
          {{ String.fromCharCode(64 + x) }}
        </div>
      </div>

      <div class="board-with-coords">
        <!-- 左側座標 (1-15) -->
        <div class="coordinates left">
          <div v-for="y in 15" :key="y" class="coord-label">
            {{ y }}
          </div>
        </div>

        <!-- 棋盤 -->
        <div class="board">
          <div
            v-for="(row, y) in board"
            :key="y"
            class="row"
          >
            <div
              v-for="(cell, x) in row"
              :key="x"
              class="cell"
              @click="handleCellClick(x, y)"
              :class="{
                clickable: canPlacePiece(x, y),
                'star-point': isStarPoint(x, y)
              }"
            >
              <!-- 實際棋子 -->
              <div v-if="cell !== 0" class="piece" :class="{ black: cell === 1, white: cell === 2 }"></div>

              <!-- 預覽棋子 -->
              <div
                v-else-if="isPendingMove(x, y)"
                class="piece preview"
                :class="{ black: currentPlayerColor === 'black', white: currentPlayerColor === 'white' }"
              >
                <div class="preview-indicator"></div>
              </div>

              <!-- 最後一手標記 -->
              <div v-if="isLastMove(x, y)" class="last-move-marker"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部座標 (A-O) -->
      <div class="coordinates bottom">
        <div class="corner"></div>
        <div v-for="x in 15" :key="x" class="coord-label">
          {{ String.fromCharCode(64 + x) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../stores/game';
import type { Board } from '@gomoku/common';

const gameStore = useGameStore();

const board = computed<Board>(() => {
  return gameStore.room?.board || Array(15).fill(null).map(() => Array(15).fill(0));
});

const currentPlayerColor = computed(() => {
  const room = gameStore.room;
  if (!room || !gameStore.currentPlayer) return null;
  const playerIndex = room.players.findIndex(p => p.id === gameStore.currentPlayer?.id);
  return playerIndex === 0 ? 'black' : 'white';
});

const canPlacePiece = (x: number, y: number): boolean => {
  const room = gameStore.room;
  if (!room || room.status !== 'playing') return false;
  if (board.value[y][x] !== 0) return false;

  // 檢查是否輪到當前玩家
  const playerIndex = room.players.findIndex(p => p.id === gameStore.currentPlayer?.id);
  const currentColor = playerIndex === 0 ? 'black' : 'white';
  return room.currentTurn === currentColor;
};

const isPendingMove = (x: number, y: number): boolean => {
  const pending = gameStore.pendingMove;
  return pending !== null && pending.x === x && pending.y === y;
};

const isLastMove = (x: number, y: number): boolean => {
  const lastMove = gameStore.lastMove;
  return lastMove !== null && lastMove.x === x && lastMove.y === y;
};

const isStarPoint = (x: number, y: number): boolean => {
  // 五子棋標準星位：天元和四個角的星位
  const starPoints = [
    [3, 3], [3, 11], [7, 7], [11, 3], [11, 11]
  ];
  return starPoints.some(([sx, sy]) => sx === x && sy === y);
};

const handleCellClick = (x: number, y: number) => {
  if (canPlacePiece(x, y)) {
    // 設置預覽位置，等待確認
    gameStore.setPendingMove(x, y);
  }
};
</script>

<style scoped>
.board-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 0.5rem;
}

.board-wrapper {
  display: flex;
  flex-direction: column;
  background: #daa520;
  border-radius: 8px;
  padding: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.coordinates {
  display: flex;
  color: #2c3e50;
  font-weight: bold;
  font-size: 0.75rem;
}

.coordinates.top,
.coordinates.bottom {
  justify-content: center;
}

.coordinates.left {
  flex-direction: column;
  margin-right: 0.25rem;
}

.coord-label {
  width: var(--cell-size, 28px);
  height: var(--cell-size, 28px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.corner {
  width: var(--cell-size, 28px);
  height: var(--cell-size, 28px);
}

.board-with-coords {
  display: flex;
}

.board {
  display: inline-block;
  background: #daa520;
  border: 2px solid #8b6914;
  border-radius: 4px;
}

.row {
  display: flex;
}

.cell {
  width: var(--cell-size, 28px);
  height: var(--cell-size, 28px);
  border: 0.5px solid #8b6914;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #daa520;
}

.cell.star-point::before {
  content: '';
  position: absolute;
  width: 6px;
  height: 6px;
  background: #8b6914;
  border-radius: 50%;
  z-index: 1;
}

.cell.clickable {
  cursor: pointer;
}

.cell.clickable:active {
  background: rgba(255, 255, 255, 0.3);
}

.piece {
  width: calc(var(--cell-size, 28px) * 0.85);
  height: calc(var(--cell-size, 28px) * 0.85);
  border-radius: 50%;
  border: 2px solid #333;
  position: relative;
  z-index: 2;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.piece.black {
  background: radial-gradient(circle at 30% 30%, #333, #000);
}

.piece.white {
  background: radial-gradient(circle at 30% 30%, #fff, #ddd);
}

.piece.preview {
  opacity: 0.6;
  animation: pulse 1s infinite;
}

.preview-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: #4CAF50;
  border-radius: 50%;
  animation: blink 1s infinite;
}

.last-move-marker {
  position: absolute;
  width: 8px;
  height: 8px;
  background: red;
  border-radius: 50%;
  z-index: 3;
  box-shadow: 0 0 4px rgba(255, 0, 0, 0.8);
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.8; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* 響應式設計 */
@media (max-width: 480px) {
  .board-container {
    padding: 0.25rem;
  }

  .board-wrapper {
    --cell-size: 22px;
  }

  .coord-label {
    font-size: 0.65rem;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .board-wrapper {
    --cell-size: 26px;
  }
}

@media (min-width: 769px) and (max-width: 1200px) {
  .board-wrapper {
    --cell-size: 36px;
  }

  .coord-label {
    font-size: 0.9rem;
  }
}

@media (min-width: 1201px) {
  .board-wrapper {
    --cell-size: 42px;
  }

  .coord-label {
    font-size: 1rem;
  }
}
</style>

