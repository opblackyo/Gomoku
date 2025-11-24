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
  'room.join': (data: { roomId: string }) => void;
  'room.leave': () => void;
}

// Server → Client Events
export interface ServerToClientEvents {
  'matchmaking.matched': (data: { roomId: string }) => void;
  'room.state': (data: Room) => void;
  'game.update': (data: { move: Move; board: Room['board']; currentTurn: Room['currentTurn'] }) => void;
  'game.result': (data: GameResult) => void;
  'error': (data: { message: string }) => void;
}

