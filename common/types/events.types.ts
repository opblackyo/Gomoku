/**
 * WebSocket 事件類型定義
 */

import { Move, GameResult } from './game.types';
import { Room } from './room.types';

// Client → Server Events
export interface ClientToServerEvents {
  'matchmaking.join': (data: { playerName: string }) => void;
  'matchmaking.cancel': () => void;
  'game.move': (data: Move) => void;
  'game.surrender': () => void;
  'game.restart': () => void;
  'game.undo.request': () => void; // 請求悔棋
  'game.undo.respond': (data: { accept: boolean }) => void; // 回應悔棋請求
  'room.join': (data: { roomId: string }) => void;
  'room.leave': () => void;
}

// Server → Client Events
export interface ServerToClientEvents {
  'matchmaking.matched': (data: { roomId: string }) => void;
  'room.state': (data: Room) => void;
  'room.update': (data: Room) => void;
  'game.update': (data: { move: Move; board: Room['board']; currentTurn: Room['currentTurn'] }) => void;
  'game.result': (data: GameResult) => void;
  'game.undo.requested': (data: { requesterId: string; requesterName: string }) => void; // 收到悔棋請求
  'game.undo.done': (data: { board: Room['board']; currentTurn: Room['currentTurn'] }) => void; // 悔棋完成
  'game.undo.rejected': () => void; // 悔棋被拒絕
  'error': (data: { message: string }) => void;
}

