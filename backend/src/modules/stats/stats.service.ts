import { Injectable } from '@nestjs/common';
import type { Player, PlayerStats } from '@gomoku/common';

@Injectable()
export class StatsService {
  // 使用 Map 存儲玩家統計數據（以玩家名稱為鍵）
  private playerStats: Map<string, PlayerStats> = new Map();

  /**
   * 獲取玩家統計數據
   */
  getPlayerStats(playerName: string): PlayerStats {
    if (!this.playerStats.has(playerName)) {
      // 如果玩家沒有統計數據，創建新的
      this.playerStats.set(playerName, {
        wins: 0,
        losses: 0,
        draws: 0,
      });
    }
    return this.playerStats.get(playerName)!;
  }

  /**
   * 初始化玩家統計數據（如果不存在）
   */
  initializePlayerStats(player: Player): Player {
    const stats = this.getPlayerStats(player.name);
    return {
      ...player,
      stats,
    };
  }

  /**
   * 記錄勝利
   */
  recordWin(playerName: string): void {
    const stats = this.getPlayerStats(playerName);
    stats.wins++;
    this.playerStats.set(playerName, stats);
  }

  /**
   * 記錄失敗
   */
  recordLoss(playerName: string): void {
    const stats = this.getPlayerStats(playerName);
    stats.losses++;
    this.playerStats.set(playerName, stats);
  }

  /**
   * 記錄平局
   */
  recordDraw(playerName: string): void {
    const stats = this.getPlayerStats(playerName);
    stats.draws++;
    this.playerStats.set(playerName, stats);
  }

  /**
   * 更新遊戲結果統計
   */
  updateGameResult(winnerName: string, loserName: string): void {
    this.recordWin(winnerName);
    this.recordLoss(loserName);
  }

  /**
   * 重置玩家統計數據（用於測試）
   */
  resetPlayerStats(playerName: string): void {
    this.playerStats.delete(playerName);
  }

  /**
   * 獲取所有玩家統計數據（用於調試）
   */
  getAllStats(): Map<string, PlayerStats> {
    return new Map(this.playerStats);
  }
}

