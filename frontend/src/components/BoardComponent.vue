<template>
  <div class="board-container">
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
          :class="{ clickable: canPlacePiece(x, y) }"
        >
          <div v-if="cell !== 0" class="piece" :class="{ black: cell === 1, white: cell === 2 }"></div>
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

const canPlacePiece = (x: number, y: number): boolean => {
  const room = gameStore.room;
  if (!room || room.status !== 'playing') return false;
  if (board.value[y][x] !== 0) return false;
  
  // 檢查是否輪到當前玩家
  const playerIndex = room.players.findIndex(p => p.id === gameStore.currentPlayer?.id);
  const currentColor = playerIndex === 0 ? 'black' : 'white';
  return room.currentTurn === currentColor;
};

const handleCellClick = (x: number, y: number) => {
  if (canPlacePiece(x, y)) {
    gameStore.makeMove(x, y);
  }
};
</script>

<style scoped>
.board-container {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.board {
  display: inline-block;
  background: #daa520;
  padding: 1rem;
  border-radius: 4px;
}

.row {
  display: flex;
}

.cell {
  width: 30px;
  height: 30px;
  border: 1px solid #8b6914;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell.clickable {
  cursor: pointer;
}

.cell.clickable:hover {
  background: rgba(255, 255, 255, 0.3);
}

.piece {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #333;
}

.piece.black {
  background: #000;
}

.piece.white {
  background: #fff;
}
</style>

