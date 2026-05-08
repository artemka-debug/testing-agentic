import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseLoggingService } from './database-logging.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService, DatabaseLoggingService],
  exports: [PrismaService],
})
export class DatabaseModule {}
