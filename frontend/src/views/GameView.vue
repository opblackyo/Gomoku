<template>
  <div class="game-view">
    <div class="game-info">
      <div class="players">
        <div class="player" :class="{ active: room?.currentTurn === 'black' }">
          <span class="piece black"></span>
          <span>{{ room?.players[0]?.name || '等待中...' }}</span>
        </div>
        <div class="player" :class="{ active: room?.currentTurn === 'white' }">
          <span class="piece white"></span>
          <span>{{ room?.players[1]?.name || '等待中...' }}</span>
        </div>
      </div>
      <div class="status">
        <p v-if="room?.status === 'waiting'">等待玩家加入...</p>
        <p v-else-if="room?.status === 'playing'">
          {{ isMyTurn ? '輪到你了！' : '對手思考中...' }}
        </p>
        <p v-else-if="room?.status === 'ended'">遊戲結束</p>
      </div>
      <div class="actions">
        <button @click="gameStore.surrender()" :disabled="room?.status !== 'playing'">
          投降
        </button>
        <button @click="gameStore.leaveRoom()">離開房間</button>
      </div>
    </div>
    <BoardComponent />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../stores/game';
import BoardComponent from '../components/BoardComponent.vue';

const gameStore = useGameStore();
const room = computed(() => gameStore.room);

const isMyTurn = computed(() => {
  if (!room.value || !gameStore.currentPlayer) return false;
  const playerIndex = room.value.players.findIndex(p => p.id === gameStore.currentPlayer?.id);
  const currentColor = playerIndex === 0 ? 'black' : 'white';
  return room.value.currentTurn === currentColor;
});
</script>

<style scoped>
.game-view {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.game-info {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 250px;
}

.players {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.player {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background 0.3s;
}

.player.active {
  background: #e8f5e9;
  font-weight: bold;
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

.status {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
  text-align: center;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.actions button:first-child {
  background: #e74c3c;
  color: white;
}

.actions button:last-child {
  background: #95a5a6;
  color: white;
}
</style>

