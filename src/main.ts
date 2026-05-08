import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { applyHttpGlobals, setupSwaggerIfDev } from './bootstrap-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  applyHttpGlobals(app);
  setupSwaggerIfDev(app);

  const config = app.get(ConfigService);
  const port = config.get<number>('port', 3000);
  await app.listen(port);
}

void bootstrap();
