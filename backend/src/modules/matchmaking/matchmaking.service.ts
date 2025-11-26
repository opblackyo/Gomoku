import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { Player } from '@gomoku/common';
import { StatsService } from '../stats/stats.service';

@Injectable()
export class MatchmakingService {
  private queue: Player[] = [];

  constructor(private statsService: StatsService) {}

  async addToQueue(socketId: string, playerName: string): Promise<{ player1: Player; player2: Player } | null> {
    const player: Player = {
      id: uuidv4(),
      name: playerName,
      socketId,
    };

    // 初始化玩家統計數據
    const playerWithStats = this.statsService.initializePlayerStats(player);

    this.queue.push(playerWithStats);

    // 如果隊列中有兩個或以上玩家，進行配對
    if (this.queue.length >= 2) {
      const player1 = this.queue.shift();
      const player2 = this.queue.shift();
      return { player1, player2 };
    }

    return null;
  }

  removeFromQueue(socketId: string): void {
    this.queue = this.queue.filter(player => player.socketId !== socketId);
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

