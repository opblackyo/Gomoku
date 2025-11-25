<template>
  <div v-if="show" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="result-icon">
        <div v-if="isWinner" class="trophy">🏆</div>
        <div v-else class="sad">😢</div>
      </div>
      
      <h2 class="result-title">
        {{ isWinner ? '恭喜獲勝！' : '很遺憾，您輸了' }}
      </h2>
      
      <div class="result-details">
        <p v-if="result?.winnerColor">
          <span class="piece-icon" :class="result.winnerColor"></span>
          {{ result.winnerColor === 'black' ? '黑子' : '白子' }} 獲勝
        </p>
        <p class="reason">{{ getReasonText(result?.reason) }}</p>
      </div>

      <div class="modal-actions">
        <button 
          class="btn btn-primary" 
          @click="handleRematch"
          :disabled="hasRequestedRematch"
        >
          {{ rematchButtonText }}
        </button>
        <button class="btn btn-secondary" @click="handleLeave">
          離開房間
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GameResult } from '@gomoku/common';
import { useGameStore } from '../stores/game';

interface Props {
  show: boolean;
  result: GameResult | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  rematch: [];
  leave: [];
}>();

const gameStore = useGameStore();

const isWinner = computed(() => {
  if (!props.result || !gameStore.currentPlayer) return false;
  return props.result.winner === gameStore.currentPlayer.id;
});

const hasRequestedRematch = computed(() => {
  if (!gameStore.room || !gameStore.currentPlayer) return false;
  return gameStore.room.rematchRequests?.includes(gameStore.currentPlayer.id) || false;
});

const rematchButtonText = computed(() => {
  if (hasRequestedRematch.value) {
    return '等待對手確認...';
  }
  return '再來一局';
});

const getReasonText = (reason?: string): string => {
  switch (reason) {
    case 'five-in-row':
      return '五子連珠';
    case 'surrender':
      return '對手投降';
    case 'disconnect':
      return '對手斷線';
    default:
      return '';
  }
};

const closeModal = () => {
  // 不允許點擊背景關閉
};

const handleRematch = () => {
  emit('rematch');
};

const handleLeave = () => {
  emit('leave');
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 40px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
  text-align: center;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.result-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.result-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.result-details {
  margin-bottom: 30px;
  font-size: 18px;
  color: #666;
}

.result-details p {
  margin: 10px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.piece-icon {
  display: inline-block;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #333;
}

.piece-icon.black {
  background: radial-gradient(circle at 30% 30%, #333, #000);
}

.piece-icon.white {
  background: radial-gradient(circle at 30% 30%, #fff, #ddd);
}

.reason {
  font-weight: 600;
  color: #4CAF50;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.btn-secondary {
  background: #f44336;
  color: white;
}

.btn-secondary:hover {
  background: #da190b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
}
</style>
