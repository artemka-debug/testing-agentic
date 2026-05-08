import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function applyHttpGlobals(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
}

export function setupSwaggerIfDev(app: INestApplication): void {
  const config = app.get(ConfigService);
  const nodeEnv = config.get<string>('nodeEnv', 'development');
  if (nodeEnv === 'production') {
    return;
  }

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Testing Agentic API')
      .setDescription(
        'Bootstrap HTTP surface. Swagger UI is disabled when NODE_ENV=production.',
      )
      .setVersion('0.1.0')
      .build(),
  );
  SwaggerModule.setup('api', app, document);
}
