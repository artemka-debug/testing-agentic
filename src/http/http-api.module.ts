import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { WidgetsModule } from './widgets/widgets.module';

@Module({
  imports: [HealthModule, WidgetsModule],
})
export class HttpApiModule {}
