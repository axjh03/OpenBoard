import * as dotenv from 'dotenv';

// Load environment variables BEFORE any other imports
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: 'http://localhost:5173', // Your React app URL
    credentials: true,
  });
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`NestJS backend running on port ${port}`);
}
bootstrap();
