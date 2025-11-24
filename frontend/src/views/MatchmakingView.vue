<template>
  <div class="matchmaking">
    <div class="card">
      <h2>開始遊戲</h2>
      <div v-if="!gameStore.isMatchmaking" class="form">
        <input
          v-model="playerName"
          type="text"
          placeholder="輸入你的名字"
          @keyup.enter="startMatchmaking"
        />
        <button @click="startMatchmaking" :disabled="!playerName.trim()">
          尋找對手
        </button>
      </div>
      <div v-else class="matching">
        <div class="spinner"></div>
        <p>正在尋找對手...</p>
        <button @click="gameStore.cancelMatchmaking()">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useGameStore } from '../stores/game';

const gameStore = useGameStore();
const playerName = ref('');

const startMatchmaking = () => {
  if (playerName.value.trim()) {
    gameStore.joinMatchmaking(playerName.value.trim());
  }
};
</script>

<style scoped>
.matchmaking {
  width: 100%;
  max-width: 400px;
}

.card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-bottom: 1.5rem;
  text-align: center;
  color: #2c3e50;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

button {
  background: #42b983;
  color: white;
}

.matching {
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #42b983;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 1rem auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.matching p {
  margin: 1rem 0;
  color: #666;
}

.matching button {
  background: #e74c3c;
}
</style>

