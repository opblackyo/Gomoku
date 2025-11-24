import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { Room, Player, Board } from '@gomoku/common';

@Injectable()
export class RoomService {
  private rooms: Map<string, Room> = new Map();

  createRoom(players: Player[]): Room {
    const board: Board = Array(15).fill(null).map(() => Array(15).fill(0));
    
    const room: Room = {
      id: uuidv4(),
      players,
      board,
      currentTurn: 'black',
      status: 'playing',
    };

    this.rooms.set(room.id, room);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomBySocketId(socketId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.some(player => player.socketId === socketId)) {
        return room;
      }
    }
    return undefined;
  }

  updateRoom(room: Room): void {
    this.rooms.set(room.id, room);
  }

  deleteRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
}

