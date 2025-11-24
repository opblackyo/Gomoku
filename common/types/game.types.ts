/**
 * Game 相關類型定義
 */

import { PlayerColor } from './player.types';

export interface Move {
  x: number;
  y: number;
  playerId: string;
}

export type BoardCell = 0 | 1 | 2; // 0: empty, 1: black, 2: white

export type Board = BoardCell[][];

export interface GameResult {
  winner?: string;
  winnerColor?: PlayerColor;
  reason: 'five-in-row' | 'surrender' | 'disconnect';
}

