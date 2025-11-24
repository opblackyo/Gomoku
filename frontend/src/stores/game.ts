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

  const makeMove = (x: number, y: number) => {
    if (!currentPlayer.value) return;
    const move: Move = { x, y, playerId: currentPlayer.value.id };
    socket.emit('game.move', move);
  };

  const surrender = () => {
    socket.emit('game.surrender');
  };

  const leaveRoom = () => {
    socket.emit('room.leave');
    roomId.value = null;
    room.value = null;
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

  socket.on('game.update', (data) => {
    if (room.value) {
      room.value.board = data.board;
      room.value.currentTurn = data.currentTurn;
    }
  });

  socket.on('game.result', (data: GameResult) => {
    if (room.value) {
      room.value.status = 'ended';
      room.value.winner = data.winner;
    }
    const message = data.winner 
      ? `遊戲結束！${data.winnerColor === 'black' ? '黑棋' : '白棋'}獲勝 (${data.reason})`
      : '遊戲結束';
    alert(message);
  });

  return {
    roomId,
    room,
    currentPlayer,
    isMatchmaking,
    joinMatchmaking,
    cancelMatchmaking,
    makeMove,
    surrender,
    leaveRoom,
  };
});

