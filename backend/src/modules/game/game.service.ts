import { Injectable } from '@nestjs/common';
import type { Room, Move, GameResult, PlayerColor, BoardCell } from '@gomoku/common';

@Injectable()
export class GameService {
  makeMove(room: Room, move: Move): Room {
    const { x, y, playerId } = move;

    // 驗證玩家
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      throw new Error('Player not found');
    }

    // 驗證回合
    const playerColor: PlayerColor = playerIndex === 0 ? 'black' : 'white';
    if (room.currentTurn !== playerColor) {
      throw new Error('Not your turn');
    }

    // 驗證位置
    if (x < 0 || x >= 15 || y < 0 || y >= 15) {
      throw new Error('Invalid position');
    }

    if (room.board[y][x] !== 0) {
      throw new Error('Position already occupied');
    }

    // 落子
    const pieceValue: BoardCell = playerColor === 'black' ? 1 : 2;
    room.board[y][x] = pieceValue;

    // 切換回合
    room.currentTurn = playerColor === 'black' ? 'white' : 'black';

    return room;
  }

  checkGameEnd(room: Room, lastMove: Move): GameResult | null {
    const { x, y } = lastMove;
    const piece = room.board[y][x];

    if (this.checkWin(room.board, x, y, piece)) {
      const playerIndex = piece === 1 ? 0 : 1;
      const winner = room.players[playerIndex];
      const winnerColor: PlayerColor = piece === 1 ? 'black' : 'white';

      return {
        winner: winner.id,
        winnerColor,
        reason: 'five-in-row',
      };
    }

    return null;
  }

  handleSurrender(room: Room, socketId: string): GameResult {
    const playerIndex = room.players.findIndex(p => p.socketId === socketId);
    const winnerIndex = playerIndex === 0 ? 1 : 0;
    const winner = room.players[winnerIndex];
    const winnerColor: PlayerColor = winnerIndex === 0 ? 'black' : 'white';

    return {
      winner: winner.id,
      winnerColor,
      reason: 'surrender',
    };
  }

  handleDisconnect(room: Room, socketId: string): GameResult | null {
    if (room.status !== 'playing') {
      return null;
    }

    const playerIndex = room.players.findIndex(p => p.socketId === socketId);
    if (playerIndex === -1) {
      return null;
    }

    const winnerIndex = playerIndex === 0 ? 1 : 0;
    const winner = room.players[winnerIndex];
    const winnerColor: PlayerColor = winnerIndex === 0 ? 'black' : 'white';

    return {
      winner: winner.id,
      winnerColor,
      reason: 'disconnect',
    };
  }

  private checkWin(board: BoardCell[][], x: number, y: number, piece: BoardCell): boolean {
    if (piece === 0) return false;

    // 檢查四個方向：水平、垂直、左斜、右斜
    const directions = [
      [1, 0],   // 水平
      [0, 1],   // 垂直
      [1, 1],   // 右斜
      [1, -1],  // 左斜
    ];

    for (const [dx, dy] of directions) {
      let count = 1; // 包含當前棋子

      // 正方向
      count += this.countPieces(board, x, y, dx, dy, piece);
      // 反方向
      count += this.countPieces(board, x, y, -dx, -dy, piece);

      if (count >= 5) {
        return true;
      }
    }

    return false;
  }

  private countPieces(
    board: BoardCell[][],
    x: number,
    y: number,
    dx: number,
    dy: number,
    piece: BoardCell,
  ): number {
    let count = 0;
    let nx = x + dx;
    let ny = y + dy;

    while (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && board[ny][nx] === piece) {
      count++;
      nx += dx;
      ny += dy;
    }

    return count;
  }
}

