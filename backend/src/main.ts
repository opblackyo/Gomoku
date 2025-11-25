import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS - 允许局域网访问
  app.enableCors({
    origin: true, // 允许所有来源（开发环境）
    credentials: true,
  });

  await app.listen(3001, '0.0.0.0'); // 监听所有网络接口
  console.log('Backend server is running on http://0.0.0.0:3001');
}

bootstrap();

