import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { Player } from '@gomoku/common';

@Injectable()
export class MatchmakingService {
  private queue: Player[] = [];

  async addToQueue(socketId: string, playerName: string): Promise<{ player1: Player; player2: Player } | null> {
    const player: Player = {
      id: uuidv4(),
      name: playerName,
      socketId,
    };

    this.queue.push(player);

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

