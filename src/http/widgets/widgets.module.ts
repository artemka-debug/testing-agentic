import { Module } from '@nestjs/common';
import { DataModule } from '../../data/data.module';
import { WidgetsController } from './widgets.controller';

@Module({
  imports: [DataModule],
  controllers: [WidgetsController],
})
export class WidgetsModule {}
