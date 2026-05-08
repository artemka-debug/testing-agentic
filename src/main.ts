import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  // SEC-003: do not expose interactive API docs in production by default
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('API')
      .setDescription(
        'HTTP API. Swagger UI is enabled when NODE_ENV is not production.',
      )
      .setVersion('1.0')
      .addTag('health')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(`HTTP server listening on port ${String(port)}`);
}

void bootstrap().catch((err: unknown) => {
  const logger = new Logger('Bootstrap');
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const message = err instanceof Error ? err.message : String(err);
  logger.error(
    `Application failed to start (postgres driver=typeorm+pg host=${host ?? 'unset'} port=${port ?? 'unset'}): ${message}`,
    err instanceof Error ? err.stack : undefined,
  );
  process.exit(1);
});
