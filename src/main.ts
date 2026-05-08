import { Logger, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import { envSchema, listenEnvSchema } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health', method: RequestMethod.ALL }],
  });

  const nodeEnv =
    envSchema.pick({ NODE_ENV: true }).parse({
      NODE_ENV: configService.get<string>('NODE_ENV'),
    }).NODE_ENV ?? 'development';
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('API')
      .setDescription(
        'HTTP API. Swagger UI at /api/docs. Routes under `/api/v1` except `/health`.',
      )
      .setVersion('1.0')
      .addTag('health')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(document));
  }

  const port = listenEnvSchema.parse({
    PORT: configService.get<string | number>('PORT'),
  }).PORT;
  await app.listen(port);
  new Logger('Bootstrap').log(`HTTP server listening on port ${String(port)}`);
}

void bootstrap().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  new Logger('Bootstrap').error(
    message,
    err instanceof Error ? err.stack : undefined,
  );
  process.exit(1);
});
