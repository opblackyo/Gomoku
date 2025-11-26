/**
 * Room 相關類型定義
 */

import { Player, PlayerColor } from './player.types';
import { Board, Move } from './game.types';

export type RoomStatus = 'waiting' | 'playing' | 'ended';

export interface Room {
  id: string;
  players: Player[];
  board: Board;
  currentTurn: PlayerColor;
  status: RoomStatus;
  winner?: string;
  rematchRequests?: string[]; // 請求再來一局的玩家 ID 列表
  moveHistory?: Move[]; // 棋步歷史，用於悔棋
  undoRequest?: string; // 請求悔棋的玩家 ID
}

