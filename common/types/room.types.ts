/**
 * Room 相關類型定義
 */

import { Player, PlayerColor } from './player.types';
import { Board } from './game.types';

export type RoomStatus = 'waiting' | 'playing' | 'ended';

export interface Room {
  id: string;
  players: Player[];
  board: Board;
  currentTurn: PlayerColor;
  status: RoomStatus;
  winner?: string;
}

