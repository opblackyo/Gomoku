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
  const undoRequest = ref<{ requesterId: string; requesterName: string } | null>(null);
  const waitingForUndoResponse = ref(false);
  const moveCount = ref(0); // 追蹤棋步數量

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
    undoRequest.value = null;
    waitingForUndoResponse.value = false;
  };

  // 悔棋功能
  const requestUndo = () => {
    if (!room.value || room.value.status !== 'playing') return;
    if (waitingForUndoResponse.value) return;
    waitingForUndoResponse.value = true;
    socket.emit('game.undo.request');
  };

  const respondToUndo = (accept: boolean) => {
    socket.emit('game.undo.respond', { accept });
    undoRequest.value = null;
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
    // 如果遊戲重新開始，清除遊戲結果和棋步數
    if (data.status === 'playing') {
      gameResult.value = null;
      moveCount.value = 0;
    }
  });

  socket.on('game.update', (data) => {
    if (room.value) {
      room.value.board = data.board;
      room.value.currentTurn = data.currentTurn;
      // 記錄最後一手
      lastMove.value = { x: data.move.x, y: data.move.y };
      // 增加棋步數
      moveCount.value++;
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

    // 清除預覽和悔棋狀態
    pendingMove.value = null;
    undoRequest.value = null;
    waitingForUndoResponse.value = false;
  });

  // 悔棋相關事件
  socket.on('game.undo.requested', (data) => {
    undoRequest.value = data;
  });

  socket.on('game.undo.done', (data) => {
    if (room.value) {
      room.value.board = data.board;
      room.value.currentTurn = data.currentTurn;
      // 減少棋步數
      if (moveCount.value > 0) {
        moveCount.value--;
      }
      // 清除最後一手標記（悔棋後不顯示）
      lastMove.value = null;
    }
    undoRequest.value = null;
    waitingForUndoResponse.value = false;
    pendingMove.value = null;
  });

  socket.on('game.undo.rejected', () => {
    waitingForUndoResponse.value = false;
  });

  return {
    roomId,
    room,
    currentPlayer,
    isMatchmaking,
    pendingMove,
    lastMove,
    gameResult,
    undoRequest,
    waitingForUndoResponse,
    moveCount,
    joinMatchmaking,
    cancelMatchmaking,
    setPendingMove,
    confirmMove,
    makeMove,
    surrender,
    restartGame,
    leaveRoom,
    requestUndo,
    respondToUndo,
  };
});

