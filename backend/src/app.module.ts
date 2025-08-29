import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChessModule } from './chess/chess.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority&appName=${process.env.MONGODB_APP_NAME}`
    ),
    AuthModule,
    ChessModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
