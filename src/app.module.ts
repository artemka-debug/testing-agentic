import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module';
import { HttpApiModule } from './http/http-api.module';
import { XyizleModule } from 'xyizle';

@Module({
  imports: [AppConfigModule, XyizleModule.forRootFromConfig(), HttpApiModule],
})
export class AppModule {}
