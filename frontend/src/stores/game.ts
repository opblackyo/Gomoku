import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Room, Player, Move, GameResult } from '@gomoku/common';
import { socket } from '../websocket/socket';

export const useGameStore = defineStore('game', () => {
  // State
  const roomId = ref<string | null>(null);
  const room = ref<Room | null>(null);
  const currentPlayer = ref<Player | null>(null);
  const isMatchmaking = ref(false);
  const pendingMove = ref<{ x: number; y: number } | null>(null);
  const lastMove = ref<{ x: number; y: number } | null>(null);
  const gameResult = ref<GameResult | null>(null);

  // Actions
  const joinMatchmaking = async (playerName: string) => {
    isMatchmaking.value = true;
    currentPlayer.value = { id: '', name: playerName, socketId: socket.id || '' };
    socket.emit('matchmaking.join', { playerName });
  };

  const cancelMatchmaking = () => {
    isMatchmaking.value = false;
    socket.emit('matchmaking.cancel');
  };

  const setPendingMove = (x: number, y: number) => {
    pendingMove.value = { x, y };
  };

  const confirmMove = () => {
    if (!currentPlayer.value || !pendingMove.value) return;
    const move: Move = {
      x: pendingMove.value.x,
      y: pendingMove.value.y,
      playerId: currentPlayer.value.id
    };
    socket.emit('game.move', move);
    // 清除預覽，等待伺服器確認
    pendingMove.value = null;
  };

  const makeMove = (x: number, y: number) => {
    if (!currentPlayer.value) return;
    const move: Move = { x, y, playerId: currentPlayer.value.id };
    socket.emit('game.move', move);
  };

  const surrender = () => {
    socket.emit('game.surrender');
  };

  const restartGame = () => {
    socket.emit('game.restart');
  };

  const leaveRoom = () => {
    socket.emit('room.leave');
    roomId.value = null;
    room.value = null;
    pendingMove.value = null;
    lastMove.value = null;
    gameResult.value = null;
  };

  // WebSocket event listeners
  socket.on('matchmaking.matched', (data) => {
    isMatchmaking.value = false;
    roomId.value = data.roomId;
  });

  socket.on('room.state', (data) => {
    room.value = data;
    // 更新當前玩家 ID
    if (currentPlayer.value) {
      const player = data.players.find(p => p.socketId === socket.id);
      if (player) {
        currentPlayer.value.id = player.id;
      }
    }
  });

  socket.on('room.update', (data) => {
    room.value = data;
    // 清除遊戲狀態
    pendingMove.value = null;
    lastMove.value = null;
    // 如果遊戲重新開始，清除遊戲結果
    if (data.status === 'playing') {
      gameResult.value = null;
    }
  });

  socket.on('game.update', (data) => {
    if (room.value) {
      room.value.board = data.board;
      room.value.currentTurn = data.currentTurn;
      // 記錄最後一手
      lastMove.value = { x: data.move.x, y: data.move.y };
      // 清除預覽
      pendingMove.value = null;
    }
  });

  socket.on('game.result', (data: GameResult) => {
    if (room.value) {
      room.value.status = 'ended';
      room.value.winner = data.winner;
    }

    // 設置遊戲結果以顯示彈跳視窗
    gameResult.value = data;

    // 清除預覽
    pendingMove.value = null;
  });

  return {
    roomId,
    room,
    currentPlayer,
    isMatchmaking,
    pendingMove,
    lastMove,
    gameResult,
    joinMatchmaking,
    cancelMatchmaking,
    setPendingMove,
    confirmMove,
    makeMove,
    surrender,
    restartGame,
    leaveRoom,
  };
});

