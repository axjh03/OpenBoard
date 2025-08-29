import { Module } from '@nestjs/common';
import { ChessController } from './chess.controller';
import { ChessService } from './chess.service';

@Module({
  controllers: [ChessController],
  providers: [ChessService],
  exports: [ChessService],
})
export class ChessModule {}
