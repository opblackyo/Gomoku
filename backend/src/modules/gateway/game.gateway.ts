import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, Move } from '@gomoku/common';
import { MatchmakingService } from '../matchmaking/matchmaking.service';
import { RoomService } from '../room/room.service';
import { GameService } from '../game/game.service';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(
    private matchmakingService: MatchmakingService,
    private roomService: RoomService,
    private gameService: GameService,
  ) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // 處理玩家斷線
    const room = this.roomService.getRoomBySocketId(client.id);
    if (room) {
      const result = this.gameService.handleDisconnect(room, client.id);
      if (result) {
        this.server.to(room.id).emit('game.result', result);
        this.roomService.deleteRoom(room.id);
      }
    }
    
    // 從配對隊列中移除
    this.matchmakingService.removeFromQueue(client.id);
  }

  @SubscribeMessage('matchmaking.join')
  async handleMatchmakingJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { playerName: string },
  ) {
    try {
      const result = await this.matchmakingService.addToQueue(client.id, data.playerName);

      if (result) {
        const { player1, player2 } = result;
        const room = this.roomService.createRoom([player1, player2]);

        // 通知兩位玩家配對成功
        this.server.to(player1.socketId).emit('matchmaking.matched', { roomId: room.id });
        this.server.to(player2.socketId).emit('matchmaking.matched', { roomId: room.id });

        // 讓玩家加入房間
        const socket1 = this.server.sockets.sockets.get(player1.socketId);
        const socket2 = this.server.sockets.sockets.get(player2.socketId);

        if (socket1 && socket2) {
          await socket1.join(room.id);
          await socket2.join(room.id);

          // 發送房間狀態
          this.server.to(room.id).emit('room.state', room);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      client.emit('error', { message });
    }
  }

  @SubscribeMessage('matchmaking.cancel')
  handleMatchmakingCancel(@ConnectedSocket() client: Socket) {
    this.matchmakingService.removeFromQueue(client.id);
  }

  @SubscribeMessage('game.move')
  handleGameMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() move: Move,
  ) {
    try {
      const room = this.roomService.getRoomBySocketId(client.id);
      if (!room) {
        throw new Error('Room not found');
      }

      const updatedRoom = this.gameService.makeMove(room, move);
      this.roomService.updateRoom(updatedRoom);

      // 發送遊戲更新
      this.server.to(room.id).emit('game.update', {
        move,
        board: updatedRoom.board,
        currentTurn: updatedRoom.currentTurn,
      });

      // 檢查遊戲是否結束
      const result = this.gameService.checkGameEnd(updatedRoom, move);
      if (result) {
        this.server.to(room.id).emit('game.result', result);
        updatedRoom.status = 'ended';
        updatedRoom.winner = result.winner;
        this.roomService.updateRoom(updatedRoom);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      client.emit('error', { message });
    }
  }

  @SubscribeMessage('game.surrender')
  handleGameSurrender(@ConnectedSocket() client: Socket) {
    try {
      const room = this.roomService.getRoomBySocketId(client.id);
      if (!room) {
        throw new Error('Room not found');
      }

      const result = this.gameService.handleSurrender(room, client.id);
      this.server.to(room.id).emit('game.result', result);

      room.status = 'ended';
      room.winner = result.winner;
      this.roomService.updateRoom(room);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      client.emit('error', { message });
    }
  }

  @SubscribeMessage('room.leave')
  handleRoomLeave(@ConnectedSocket() client: Socket) {
    const room = this.roomService.getRoomBySocketId(client.id);
    if (room) {
      client.leave(room.id);
    }
  }
}

