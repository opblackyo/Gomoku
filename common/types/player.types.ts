/**
 * Player 相關類型定義
 */

export interface PlayerStats {
  wins: number;
  losses: number;
  draws: number;
}

export interface Player {
  id: string;
  name: string;
  socketId: string;
  stats?: PlayerStats; // 可選的統計數據
}

export type PlayerColor = 'black' | 'white';

