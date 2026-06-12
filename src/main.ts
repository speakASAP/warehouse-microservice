import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { LoggerService } from './logger/logger.service';

/**
 * Bootstrap the Warehouse Microservice
 * Tracks stock across all warehouses with real-time RabbitMQ events
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const logger = app.get(LoggerService);

  const adminIndexPath = join(process.cwd(), 'public', 'admin', 'index.html');
  const sendAdminIndex = (_request, response) => {
    response.type('html').send(readFileSync(adminIndexPath, 'utf8'));
  };
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/admin', sendAdminIndex);
  httpAdapter.get('/admin/', sendAdminIndex);
  httpAdapter.get('/admin/index.html', sendAdminIndex);
  app.useStaticAssets(join(process.cwd(), 'public'));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const corsOrigins = process.env.CORS_ORIGIN?.split(',') || ['*'];
  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3201;
  await app.listen(port);

  logger.log(`Warehouse Microservice is running on port ${port}`, 'Bootstrap');
  logger.log(`Environment: ${process.env.NODE_ENV}`, 'Bootstrap');
  logger.log(`RabbitMQ: ${process.env.RABBITMQ_URL}`, 'Bootstrap');
}

bootstrap();
