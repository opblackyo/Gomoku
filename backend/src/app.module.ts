import { Module } from '@nestjs/common';
import { GameGateway } from './modules/gateway/game.gateway';
import { MatchmakingService } from './modules/matchmaking/matchmaking.service';
import { RoomService } from './modules/room/room.service';
import { GameService } from './modules/game/game.service';
import { StatsService } from './modules/stats/stats.service';
import { HealthController } from './health.controller';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [HealthController],
  providers: [
    GameGateway,
    MatchmakingService,
    RoomService,
    GameService,
    StatsService,
  ],
})
export class AppModule {}

