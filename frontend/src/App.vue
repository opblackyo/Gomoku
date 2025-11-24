<template>
  <div id="app">
    <header>
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
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background: #2c3e50;
  color: white;
  padding: 1rem;
  text-align: center;
}

main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}
</style>

