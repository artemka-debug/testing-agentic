import { Module } from '@nestjs/common';
import { WidgetsRepository } from './widgets.repository';

@Module({
  providers: [WidgetsRepository],
  exports: [WidgetsRepository],
})
export class DataModule {}
