import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ChessService } from './chess.service';

export class InitializeGameDto {
  vsAI: boolean;
  playerSide: string;
  aiDifficulty: number;
}

export class MakeMoveDto {
  pieceId: string;
  targetSquare: string;
}

export class PromotePawnDto {
  pieceId: string;
  promotionType: string;
}

@Controller('chess')
export class ChessController {
  constructor(private readonly chessService: ChessService) {}

  @Post('initialize')
  @HttpCode(HttpStatus.CREATED)
  async initializeGame(@Body() initializeGameDto: InitializeGameDto) {
    return this.chessService.initializeGame(
      initializeGameDto.vsAI,
      initializeGameDto.playerSide,
      initializeGameDto.aiDifficulty
    );
  }

  @Get('board')
  async getBoardState() {
    return this.chessService.getBoardState();
  }

  @Post('move')
  @HttpCode(HttpStatus.OK)
  async makeMove(@Body() makeMoveDto: MakeMoveDto) {
    return this.chessService.makeMove(makeMoveDto.pieceId, makeMoveDto.targetSquare);
  }

  @Get('moves/:pieceId')
  async getValidMoves(@Param('pieceId') pieceId: string) {
    return this.chessService.getValidMoves(pieceId);
  }

  @Get('ai-move')
  async getAIMove() {
    return this.chessService.getAIMove();
  }

  @Get('status')
  async getGameStatus() {
    return this.chessService.getGameStatus();
  }

  @Post('promote')
  @HttpCode(HttpStatus.OK)
  async promotePawn(@Body() promotePawnDto: PromotePawnDto) {
    return this.chessService.promotePawn(promotePawnDto.pieceId, promotePawnDto.promotionType);
  }
}
