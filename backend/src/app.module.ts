import { Module } from '@nestjs/common';
import { GameGateway } from './modules/gateway/game.gateway';
import { MatchmakingService } from './modules/matchmaking/matchmaking.service';
import { RoomService } from './modules/room/room.service';
import { GameService } from './modules/game/game.service';

@Module({
  imports: [],
  providers: [
    GameGateway,
    MatchmakingService,
    RoomService,
    GameService,
  ],
})
export class AppModule {}

