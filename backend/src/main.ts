import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: 'http://localhost:5173', // Your React app URL
    credentials: true,
  });
  
  await app.listen(3001);
  console.log('NestJS backend running on port 3001');
}
bootstrap();
