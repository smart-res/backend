import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.VITE_APP_URL,
    credentials: true,
  });

  app.use(cookieParser());

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
