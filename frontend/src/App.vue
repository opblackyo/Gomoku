<template>
  <div id="app">
    <header v-if="!gameStore.roomId">
      <h1>五子棋 Gomoku</h1>
    </header>
    <main>
      <MatchmakingView v-if="!gameStore.roomId" />
      <GameView v-else />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useGameStore } from './stores/game';
import { socket } from './websocket/socket';
import MatchmakingView from './views/MatchmakingView.vue';
import GameView from './views/GameView.vue';

const gameStore = useGameStore();

onMounted(() => {
  socket.connect();
});

onUnmounted(() => {
  socket.disconnect();
});
</script>

<style scoped>
#app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

header {
  background: #2c3e50;
  color: white;
  padding: 1rem;
  text-align: center;
  flex-shrink: 0;
}

main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

/* 桌面版樣式 */
@media (min-width: 768px) {
  main {
    padding: 2rem;
  }
}
</style>

