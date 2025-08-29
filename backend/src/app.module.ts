import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChessModule } from './chess/chess.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://axjh03:3050@cluster0.qvpwj.mongodb.net/Chess?retryWrites=true&w=majority&appName=Cluster0'),
    AuthModule,
    ChessModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
